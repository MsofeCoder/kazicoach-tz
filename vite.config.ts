import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "offline-public-shell",
      closeBundle() {
        const assets = [
          "index.html",
          "manifest.webmanifest",
          ...readdirSync("dist/assets")
            .filter((name) => !name.endsWith(".map"))
            .map((name) => `assets/${name}`),
        ];
        const source = readFileSync("public/sw.js", "utf8");
        const version = createHash("sha256")
          .update(
            JSON.stringify(assets) +
              readFileSync("dist/index.html", "utf8") +
              source,
          )
          .digest("hex")
          .slice(0, 12);
        writeFileSync(
          "dist/sw.js",
          `self.__KC_ASSETS = ${JSON.stringify(assets)};\nself.__KC_VERSION = '${version}';\n${source}`,
        );
      },
    },
  ],
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name(moduleId) {
                return moduleId.includes("@supabase") ? "supabase" : null;
              },
            },
          ],
        },
      },
    },
    sourcemap: true,
    target: "es2020",
  },
});
