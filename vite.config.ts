import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {canonicalHttpsOrigin,hostedEndpoint,publishableKey,securityHeaders} from './src/lib/deployment.ts';

export default defineConfig(({command})=>{
  const hosted=command==='build' && process.env.KAZICOACH_RELEASE_ACCOUNTS==='true';
  const appOrigin=canonicalHttpsOrigin(process.env.KAZICOACH_RELEASE_APP_ORIGIN);
  const endpoint=hostedEndpoint(process.env.KAZICOACH_RELEASE_SUPABASE_URL);
  const key=process.env.KAZICOACH_RELEASE_PUBLISHABLE_KEY;
  if(hosted && (!appOrigin || !endpoint || !publishableKey(key))) throw new Error('Hosted build requires exact HTTPS app origin, Supabase project URL and publishable key. No local defaults are permitted.');
  return ({
  // Release artifacts never inherit the developer's ignored .env.local account settings.
  define: command==='build'?{
    'import.meta.env.VITE_LOCAL_ACCOUNTS':JSON.stringify('false'),
    'import.meta.env.VITE_SUPABASE_URL':JSON.stringify(''),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':JSON.stringify(''),
    'import.meta.env.VITE_ACCOUNT_MODE':JSON.stringify(hosted?'hosted':'private'),
    'import.meta.env.VITE_APP_ORIGIN':JSON.stringify(hosted?appOrigin:''),
    ...(hosted?{'import.meta.env.VITE_SUPABASE_URL':JSON.stringify(endpoint),'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':JSON.stringify(key)}:{}),
  }:undefined,
  base: "./",
  plugins: [
    react(),
    {
      name: "offline-public-shell",
      apply: "build" as const,
      closeBundle() {
        const headers=Object.entries(securityHeaders(hosted?endpoint:null)).map(([name,value])=>`  ${name}: ${value}`).join('\n');
        writeFileSync('dist/_headers',`/*\n${headers}\n/index.html\n  Cache-Control: no-cache\n/sw.js\n  Cache-Control: no-cache\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n`);
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
    host: "127.0.0.1",
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    strictPort: true,
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
    sourcemap: false,
    target: "es2020",
  },
});});
