import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3002,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
}); 