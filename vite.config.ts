import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
