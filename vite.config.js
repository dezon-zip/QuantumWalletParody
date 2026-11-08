import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    // three alone is ~600 kB; no point warning about it on every build
    chunkSizeWarningLimit: 800,
  },
});
