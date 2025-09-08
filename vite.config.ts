import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/BoomBeasts/' : '/',
  server: {
    port: 8080,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Use Vite's built-in hash for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
}));
