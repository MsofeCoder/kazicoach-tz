import { afterEach, describe, expect, it, vi } from "vitest";
import { premiumAccess } from "./access";
import { onRequestPost } from "../api/generate";
const env = {
  LOCAL_ACCOUNTS_ENABLED: "true",
  SUPABASE_URL: "http://127.0.0.1:57421",
  SUPABASE_PUBLISHABLE_KEY: "local-public-test",
};
const request = () =>
  new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { authorization: "Bearer aaa.bbb.ccc" },
  });
describe("trusted cloud coaching boundary", () => {
  afterEach(()=>vi.unstubAllGlobals());
  it.each(['null','[]','{bad'])('rejects malformed payload %s after a trusted access check',async body=>{
    const provider=vi.fn<typeof fetch>().mockResolvedValue(new Response('true'));vi.stubGlobal('fetch',provider);
    const result=await onRequestPost({request:new Request('http://localhost/api/generate',{method:'POST',headers:{authorization:'Bearer aaa.bbb.ccc'},body}),env:{...env,GEMINI_API_KEY:'test-key'}});
    expect(result.status).toBe(400);expect(provider).toHaveBeenCalledTimes(1);
  });
  it('rejects oversized actual bytes even when content-length is missing',async()=>{
    const provider=vi.fn<typeof fetch>().mockResolvedValue(new Response('true'));vi.stubGlobal('fetch',provider);
    const result=await onRequestPost({request:new Request('http://localhost/api/generate',{method:'POST',headers:{authorization:'Bearer aaa.bbb.ccc'},body:'x'.repeat(120001)}),env:{...env,GEMINI_API_KEY:'test-key'}});
    expect(result.status).toBe(413);expect(provider).toHaveBeenCalledTimes(1);
  });
  it("denies missing auth without querying access or contacting AI", async () => {
    const send = vi.fn();
    expect(
      (await premiumAccess(new Request("http://localhost"), env, send))?.status,
    ).toBe(401);
    expect(send).not.toHaveBeenCalled();
  });
  it("keeps hosted or disabled integrations closed", async () => {
    const send = vi.fn();
    expect(
      (
        await premiumAccess(
          request(),
          { ...env, SUPABASE_URL: "https://production.supabase.co" },
          send,
        )
      )?.status,
    ).toBe(503);
    expect(send).not.toHaveBeenCalled();
  });
  it.each([
    [401, { code: "PGRST301" }, 401],
    [403, { code: "42501" }, 403],
    [400, { code: "P0001" }, 429],
  ])(
    "maps upstream status %s without sensitive errors",
    async (status, body, expected) => {
      const send = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(JSON.stringify(body), { status }));
      expect((await premiumAccess(request(), env, send))?.status).toBe(
        expected,
      );
    },
  );
  it("accepts only a trusted positive response and forwards the user bearer, never a privileged key", async () => {
    const send = vi.fn<typeof fetch>().mockResolvedValue(new Response("true"));
    expect(await premiumAccess(request(), env, send)).toBeNull();
    expect(send.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: "Bearer aaa.bbb.ccc",
      apikey: "local-public-test",
    });
    send.mockResolvedValue(new Response("false"));
    expect((await premiumAccess(request(), env, send))?.status).toBe(403);
  });
  it("fails closed on a service outage", async () => {
    expect(
      (
        await premiumAccess(
          request(),
          env,
          vi.fn().mockRejectedValue(new Error("sensitive details")),
        )
      )?.status,
    ).toBe(503);
  });
  it("never calls AI when local account integration is disabled", async () => {
    const result = await onRequestPost({
      request: request(),
      env: { GEMINI_API_KEY: "fake" },
    });
    expect(result.status).toBe(503);
    expect(result.headers.get("Cache-Control")).toBe("no-store");
  });
});
