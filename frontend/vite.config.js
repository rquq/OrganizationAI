import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  server: {
    host: '127.0.0.1', port: 5173, strictPort: true,
    fs: { allow: ['.', '../docs', '../policy-forge-baseline'].map(path => fileURLToPath(new URL(path, import.meta.url))) },
  },
  test: { environment: 'jsdom', include: ['src/**/*.test.js'] },
});
