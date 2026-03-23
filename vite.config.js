import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    'process.env.MAGIC_HOUR_POLL_INTERVAL': '"5"',
    '__SYSTEM_MAGIC_HOUR_API_KEY__': JSON.stringify(process.env.MAGIC_HOUR_API_KEY || '')
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/magichour-api': {
        target: 'https://api.magichour.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/magichour-api/, '')
      }
    }
  }
});