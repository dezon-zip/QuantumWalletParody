import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    // GitHub Pages can only serve a branch from / or /docs
    outDir: 'docs',
    // three alone is ~600 kB; no point warning about it on every build
    chunkSizeWarningLimit: 800,
  },
});
