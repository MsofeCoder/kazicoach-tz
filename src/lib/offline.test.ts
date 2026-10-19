import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

function worker() {
  const callbacks = new Map<string, (event: unknown) => void>();
  const saved = new Map<string, Response>();
  const cache = {
    addAll: vi.fn(async (urls: string[]) => {
      for (const url of urls) saved.set(url, new Response("PUBLIC SHELL"));
    }),
    put: vi.fn(async (request: Request, response: Response) => {
      saved.set(request.url, response);
    }),
  };
  const caches = {
    open: async () => cache,
    keys: async () => [
      "other-app",
      "kazicoach-shell-old",
      "kazicoach-shell-test",
    ],
    delete: vi.fn(async () => true),
    match: async (request: Request | string) =>
      saved.get(typeof request === "string" ? request : request.url),
  };
  const self = {
    __KC_VERSION: "test",
    __KC_ASSETS: ["index.html", "assets/app.js"],
    location: {
      href: "http://localhost/kazicoach-tz/sw.js",
      origin: "http://localhost",
    },
    clients: { claim: async () => {} },
    skipWaiting: async () => {},
    addEventListener: (name: string, fn: (event: unknown) => void) =>
      callbacks.set(name, fn),
  };
  const network = vi.fn<typeof fetch>().mockRejectedValue(new Error("offline"));
  runInNewContext(readFileSync("public/sw.js", "utf8"), {
    self,
    caches,
    fetch: network,
    URL,
    Response,
  });
  return { callbacks, cache, caches, network, saved };
}
describe("offline shell privacy boundaries", () => {
  it("precaches the complete public manifest and never deletes other applications’ caches", async () => {
    const w = worker();
    let work = Promise.resolve();
    w.callbacks.get("install")!({
      waitUntil: (promise: Promise<void>) => {
        work = promise;
      },
    });
    await work;
    expect(w.cache.addAll).toHaveBeenCalledWith([
      "http://localhost/kazicoach-tz/index.html",
      "http://localhost/kazicoach-tz/assets/app.js",
    ]);
    w.callbacks.get("activate")!({
      waitUntil: (promise: Promise<void>) => {
        work = promise;
      },
    });
    await work;
    expect(w.caches.delete).toHaveBeenCalledExactlyOnceWith(
      "kazicoach-shell-old",
    );
  });
  it.each([
    ["http://localhost/kazicoach-tz/api/private", "cors", {}],
    [
      "http://localhost/kazicoach-tz/assets/app.js",
      "cors",
      { authorization: "Bearer private" },
    ],
    ["http://localhost/kazicoach-tz/api/profile", "navigate", {}],
    ["http://remote.example/auth/v1/user", "cors", {}],
  ])("does not intercept private/API/remote URL %s", (url, mode, headers) => {
    const w = worker(),
      respondWith = vi.fn();
    w.callbacks.get("fetch")!({
      request: {
        url,
        method: "GET",
        mode,
        headers: new Headers(headers),
        cache: "default",
      },
      respondWith,
    });
    expect(respondWith).not.toHaveBeenCalled();
  });
  it("returns the offline shell only for a shell navigation, never for a failed script", async () => {
    const w = worker();
    let installed = Promise.resolve();
    w.callbacks.get("install")!({
      waitUntil: (p: Promise<void>) => {
        installed = p;
      },
    });
    await installed;
    let result: Promise<Response> = Promise.resolve(new Response("unexpected"));
    w.callbacks.get("fetch")!({
      request: {
        url: "http://localhost/kazicoach-tz/",
        method: "GET",
        mode: "navigate",
        headers: new Headers(),
        cache: "default",
      },
      respondWith: (p: Promise<Response>) => {
        result = p;
      },
    });
    expect(await (await result).text()).toBe("PUBLIC SHELL");
    expect(w.cache.put).not.toHaveBeenCalled();
    w.saved.delete('http://localhost/kazicoach-tz/assets/app.js');
    w.callbacks.get('fetch')!({request:{url:'http://localhost/kazicoach-tz/assets/app.js',method:'GET',mode:'cors',headers:new Headers(),cache:'default'},respondWith:(p:Promise<Response>)=>{result=p;}});
    expect((await result).type).toBe('error');
  });
});
