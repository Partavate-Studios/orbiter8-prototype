import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const CHAIN = process.env.VITE_LOCAL_RPC ?? 'http://127.0.0.1:8548'

// The SDK is used in place through an alias (never copied); ethers resolves from this package.
// Both proxies exist so the page only ever talks to its own origin, which is all Polkadot Desktop's
// sandbox allows a Product: /__chain is the local chain, /__drand is drand's relay.
export default defineConfig({
  resolve: {
    alias: { '@orbiter8/sdk': fileURLToPath(new URL('../../sdk/src', import.meta.url)) },
    dedupe: ['ethers']
  },
  oxc: { jsx: { runtime: 'automatic', importSource: 'preact' } },
  // the dependency scan reads JSX too: tell it the runtime is Preact's, not React's
  optimizeDeps: { rolldownOptions: { transform: { jsx: { runtime: 'automatic', importSource: 'preact' } } } },
  server: {
    port: 8094,
    strictPort: true,
    fs: { allow: ['../..'] },
    proxy: {
      '/__chain': { target: CHAIN, changeOrigin: true, rewrite: () => '/' },
      '/__drand': { target: 'https://api.drand.sh', changeOrigin: true, rewrite: (p) => p.replace(/^\/__drand/, '') }
    }
  },
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
  test: { environment: 'node', include: ['src/**/*.test.js'] }
})
