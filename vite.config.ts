import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base: the same build runs at a site root or inside itch.io's player.
  base: './',
  // No asset inlined as a data: URI, so a strict CSP needs no data: source.
  build: { target: 'es2022', sourcemap: true, assetsInlineLimit: 0 },
});
