import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

export default defineConfig({
  base: './', // relative base so the app works on GitHub Pages subpaths
  plugins: [react()],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    sourcemap: true,
    target: 'es2020',
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        // localStorage needs a real origin; opaque origins disable it.
        url: 'http://localhost/',
      },
    },
    setupFiles: './src/test/setup.ts',
    css: false,
  },
});
