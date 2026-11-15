import { fileURLToPath, URL } from 'node:url'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { testnetFaucet } from './dev/testnet-faucet.js'

/**
 * The version shown on the title: 3 (demo 3 contracts) . 2 (this client) . build, from package.json.
 * Every `npm run build` bumps the build number first (the prebuild script), so each full build has its
 * own version; `build:local` doesn't. Dev servers add the commit, e.g. 3.2.4-dev+e1e7f61.
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
  plugins: [vue(), testnetFaucet()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion(command))
  },
  resolve: {
    alias: {
      // The game's SDK, shared by every client (../sdk, its own package: chain access, state, actions, rules)
      '@orbiter8/sdk': fileURLToPath(new URL('../sdk/src', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    // The SDK has no node_modules of its own: its imports (ethers) resolve to this client's copy.
    dedupe: ['ethers'],
    // Components are imported without their .vue suffix (e.g. './hud/hud.svg').
    extensions: ['.mjs', '.js', '.json', '.vue']
  },
  server: {
    port: 8080,
    // Serve the SDK from beside this client (../sdk), as well as this folder.
    fs: { allow: ['..'] },
    // In development the chain and drand are reached through the game's own origin: a Polkadot Desktop
    // Product may only talk to its own localhost port ("Direct network access is blocked" otherwise),
    // so the dev wallet's RPC and drand's relays go through here (dev-wallet.js, sdk/drand.js). The same
    // for Polkadot Hub TestNet's RPC, and /__faucet tops up the dev wallet's testnet keys (dev/testnet-faucet.js).
    proxy: {
      '/__chain': {
        target: process.env.VITE_LOCAL_RPC || 'http://127.0.0.1:8545',
        changeOrigin: true,
        rewrite: () => '/'
      },
      '/__paseo': {
        target: 'https://eth-rpc-testnet.polkadot.io',
        changeOrigin: true,
        rewrite: () => '/'
      },
      '/__drand': {
        target: 'https://api.drand.sh',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/__drand/, '')
      }
    }
  },
  test: {
    environment: 'happy-dom',
    // This client's tests and the SDK's (../sdk has no runner of its own yet)
    include: ['src/**/*.test.js', '../sdk/src/**/*.test.js']
  }
}))
