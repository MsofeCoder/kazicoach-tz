import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

// Rendered shell and every precached asset must be retrievable; no hosted services.
const { preview } = await import("vite");
const server = await preview({
  preview: { host: "127.0.0.1", port: 0, strictPort: false },
});
try {
  const address = server.httpServer.address();
  const base = `http://127.0.0.1:${address.port}`;
  const response = await fetch(base);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /id="root"/);
  const sw = await (await fetch(`${base}/sw.js`)).text();
  const assets = JSON.parse(
    sw.split("\n")[0].replace("self.__KC_ASSETS = ", "").replace(/;$/, ""),
  );
  assert.ok(assets.some((path) => path.includes("docx")));
  assert.ok(assets.some((path) => path.includes("pdf.worker")));
  for (const asset of assets) {
    const downloaded=await fetch(`${base}/${asset}`);
    assert.equal(downloaded.status,200,asset);
    await downloaded.arrayBuffer();
  }
  for (const file of readdirSync("dist/assets").filter((name) =>
    name.endsWith(".js"),
  )) {
    assert.ok(
      !/sb_secret_[A-Za-z0-9_-]{20,}|"role":"service_role"/.test(
        readFileSync(`dist/assets/${file}`, "utf8"),
      ),
      "Bundle contains a privileged key value",
    );
    assert.ok(!/sprintf-js|sprintf\.parse|ArgumentParser|argparse/.test(readFileSync(`dist/assets/${file}`,'utf8')),'Unneeded vulnerable CLI dependency entered a browser bundle');
  }
  console.log(
    `Smoke passed: app shell and ${assets.length} offline assets; no privileged key markers.`,
  );
} finally {
  server.httpServer.closeAllConnections();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
