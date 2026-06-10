import { defineConfig } from 'vite'

// Standalone interactive demo — a plain Vite app (no CRXJS).
// Dev:   npm run demo        (serves demo/ at http://localhost:5174)
// Build: npm run demo:build  (outputs static files to demo-dist/)
export default defineConfig({
  root: 'demo',
  base: './',
  server: {
    port: 5174,
    open: true,
  },
  build: {
    outDir: '../demo-dist',
    emptyOutDir: true,
    target: 'esnext',
  },
})
