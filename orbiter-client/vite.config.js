import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Relative asset paths, so the build can be served from any subdirectory (e.g. /demo3).
  base: './',
  plugins: [vue()],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      // Prebuilt browser bundles; the Node entry points would need polyfills under Vite.
      { find: /^web3$/, replacement: 'web3/dist/web3.min.js' },
      { find: /^@truffle\/contract$/, replacement: fileURLToPath(new URL('./src/libs/truffle-contract.js', import.meta.url)) }
    ],
    // Components are imported without their .vue suffix (e.g. './hud/hud.svg').
    extensions: ['.mjs', '.js', '.json', '.vue']
  },
  server: {
    port: 8080
  }
})
