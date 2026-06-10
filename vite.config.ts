/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const proxyPaths = ['/authentication', '/account', '/transaction', '/ingestion'];

export default defineConfig(({ mode }) => {
  // Pull in .env / .env.development / .env.development.local so the proxy
  // target is configurable without editing this file.
  const env = loadEnv(mode, process.cwd(), '');
  const gateway = env.VITE_GATEWAY_URL || 'http://localhost:8080';

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    server: {
      port: 5173,
      proxy: Object.fromEntries(
        proxyPaths.map((p) => [
          p,
          {
            target: gateway,
            changeOrigin: true,
            secure: false,
          },
        ]),
      ),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  };
});
