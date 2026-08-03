import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies /api/* to the local curation proxy (server/proxy.js) so the
// Anthropic key never reaches the browser. If the proxy isn't running, the app
// falls back to the offline mock curator automatically.
export default defineConfig({
  base: '/custom-lists/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
