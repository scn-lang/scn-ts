import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  optimizeDeps: {
    exclude: ['scn-ts', 'repograph', 'web-tree-sitter']
  },
  resolve: {
    alias: {
      'scn-ts': path.resolve(__dirname, '../dist/browser.js'),
      // When scn-ts imports 'repograph', we need to give it the browser version.
      'repograph': path.resolve(__dirname, '../node_modules/repograph/dist/browser.js')
    }
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.platform': '"browser"',
    'process.version': '"v18.0.0"'
  },
  server: {
    fs: {
      // Allow serving files from one level up (the project root)
      allow: ['..']
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  },
  worker: {
    plugins: () => []
  },
  assetsInclude: ['**/*.wasm'],
  publicDir: 'public'
})