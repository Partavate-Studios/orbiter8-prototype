import { fileURLToPath, URL } from 'node:url'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * The version shown on the title: 3 (demo 3 contracts) . 2 (this client) . build, from package.json
 * (`npm version patch` before each release build). Dev servers add the commit, e.g. 3.2.0-dev+e1e7f61.
 */
function appVersion(command) {
  const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
  if (command !== 'serve') return version
  try {
    return version + '-dev+' + execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return version + '-dev'
  }
}

export default defineConfig(({ command }) => ({
  // Relative asset paths, so the build can be served from any subdirectory (e.g. /demo3).
  base: './',
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion(command))
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    // Components are imported without their .vue suffix (e.g. './hud/hud.svg').
    extensions: ['.mjs', '.js', '.json', '.vue']
  },
  server: {
    port: 8080
  },
  test: {
    environment: 'happy-dom'
  }
}))
