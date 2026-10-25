import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Relative asset paths, so the build can be served from any subdirectory (e.g. /demo3).
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    // Components are imported without their .vue suffix (e.g. './hud/hud.svg').
    extensions: ['.mjs', '.js', '.json', '.vue']
  },
  server: {
    port: 8080
  }
})
