import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json' with { type: 'json' }

export default defineConfig({
  plugins: [crx({ manifest })],
  // CRXJS uses a fixed HMR port in dev — pin it for reproducibility.
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
  build: {
    // Extensions are small; disable minification for readable debugging in dist/.
    minify: false,
    sourcemap: true,
    target: 'esnext',
  },
})
