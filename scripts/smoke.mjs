/**
 * Deploy-verification smoke test for the production build.
 *
 * Boots `vite preview` against dist/, then verifies that the app shell and the
 * offline-critical assets actually serve. Run after `npm run build`:
 *   npm run build && npm run smoke
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');
const port = process.env.SMOKE_PORT || '4173';
const base = `http://127.0.0.1:${port}`;

if (!existsSync(path.join(dist, 'index.html'))) {
  console.error('✗ dist/index.html not found — run `npm run build` first.');
  process.exit(1);
}

const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', port, '--strictPort'], {
  cwd: root,
  stdio: 'ignore',
});

const waitForServer = async (timeoutMs = 20_000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${base}/`);
      if (response.ok) return true;
    } catch {
      // Server not ready yet.
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  return false;
};

const checks = [
  { url: '/', expect: status => status === 200, label: 'app shell serves' },
  { url: '/manifest.webmanifest', expect: status => status === 200, label: 'web manifest serves' },
  { url: '/sw.js', expect: status => status === 200, label: 'service worker serves' },
  { url: '/robots.txt', expect: status => status === 200, label: 'robots.txt serves' },
];

let failed = false;
try {
  if (!(await waitForServer())) {
    console.error('✗ vite preview did not become ready in time.');
    failed = true;
  } else {
    const shell = await fetch(`${base}/`);
    const html = await shell.text();
    if (!html.includes('KaziCoach TZ')) {
      console.error('✗ App shell does not contain the expected brand markup.');
      failed = true;
    } else {
      console.log('✓ App shell contains the expected brand markup.');
    }
    // Every asset referenced by the shell must resolve (broken-chunk guard).
    // With base './' Vite emits relative paths (./assets/...), so resolve them.
    const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
      .map(match => match[1])
      .filter(value => value.endsWith('.js') || value.endsWith('.css') || value.includes('/assets/'));
    for (const asset of assets) {
      const resolved = new URL(asset, `${base}/`).href;
      const response = await fetch(resolved);
      if (!response.ok) {
        console.error(`✗ Referenced asset failed: ${asset} → ${response.status}`);
        failed = true;
      }
    }
    console.log(`✓ ${assets.length} hashed asset(s) referenced by the shell all resolve.`);
    for (const check of checks) {
      const response = await fetch(`${base}${check.url}`);
      if (check.expect(response.status)) {
        console.log(`✓ ${check.label} (${check.url})`);
      } else {
        console.error(`✗ ${check.label} (${check.url}) → ${response.status}`);
        failed = true;
      }
    }
  }
} finally {
  child.kill();
}

if (failed) {
  console.error('✗ Smoke test FAILED.');
  process.exit(1);
}
console.log('✓ Smoke test passed.');