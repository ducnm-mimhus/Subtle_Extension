import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest.config'

export default defineConfig({
  plugins: [crx({ manifest })],

  resolve: {
    alias: {
      src: '/src',
    },
  },

  build: {
    // Offscreen document bundles model weights via transformers.js —
    // chunks can be large. Don't warn on every build.
    chunkSizeWarningLimit: 10_000,
    rollupOptions: {
      input: {
        offscreen: 'src/offscreen/offscreen.html',
      },
    },
  },
})
