// Dev server only: tops up the dev wallet's testnet keys (src/dev/dev-wallet.js) with PAS from a funded
// key kept outside the repo, so a new pilot on Polkadot Hub TestNet can play right away.
//   POST /__faucet  {"address": "0x…"}  →  {"hash": "0x…"} once the transfer is in a block, or {"skipped": true}
// The key file is a `cast wallet new --json` file: ORBITER_TESTNET_KEY, or ~/.config/orbiter8/paseo-spike.json.
// It's read here, in Node, and never sent to the browser. Never commit keys.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const RPC = 'https://eth-rpc-testnet.polkadot.io/'
/** A key holding less than this gets topped up to TOP_UP (PAS). */
const LOW = 5n * 10n ** 18n
const TOP_UP = 25n * 10n ** 18n

function keyFile() {
  const file = process.env.ORBITER_TESTNET_KEY || path.join(os.homedir(), '.config/orbiter8/paseo-spike.json')
  return fs.existsSync(file) ? file : null
}

export function testnetFaucet() {
  let wallet = null
  let queue = Promise.resolve() // one transfer at a time, so nonces don't clash
  return {
    name: 'orbiter-testnet-faucet',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__faucet', (req, res) => {
        const reply = (status, body) => {
          res.statusCode = status
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(body))
        }
        if (req.method !== 'POST') return reply(405, { error: 'POST only' })
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', () => {
          queue = queue.then(async () => {
            try {
              const { address } = JSON.parse(body || '{}')
              const { JsonRpcProvider, Wallet, isAddress } = await import('ethers')
              if (!isAddress(address)) return reply(400, { error: 'not an address' })
              const file = keyFile()
              if (!file) return reply(503, { error: 'no testnet key: set ORBITER_TESTNET_KEY to a funded key file' })
              if (!wallet) {
                let key = JSON.parse(fs.readFileSync(file, 'utf8')).data ?? JSON.parse(fs.readFileSync(file, 'utf8'))
                key = (Array.isArray(key) ? key[0] : key).private_key
                wallet = new Wallet(key, new JsonRpcProvider(RPC, 420420417, { staticNetwork: true }))
              }
              const balance = await wallet.provider.getBalance(address)
              if (balance >= LOW) return reply(200, { skipped: true })
              const tx = await wallet.sendTransaction({ to: address, value: TOP_UP - balance })
              await tx.wait()
              console.log(`[faucet] ${address} topped up to 25 PAS (${tx.hash})`)
              reply(200, { hash: tx.hash })
            } catch (error) {
              console.error('[faucet]', error.shortMessage ?? error.message)
              reply(500, { error: error.shortMessage ?? error.message })
            }
          })
        })
      })
    }
  }
}
