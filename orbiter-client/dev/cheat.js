// Dev server only: the cheat button (Koda, 2026-11-18: "a cheat button that gives me a huge amount of game
// credits"). The game's Settings menu shows it in dev builds; it asks here, and the deployment's admin
// pays the pilot with `Credits.cheat` (admin only, logged on chain).
//   POST /__cheat  {"address": "0x…", "network": "local" | "testnet"}  →  {"hash": "0x…", "amount": n}
// On the local chain the admin is the chain's account 0 (it deployed the game); on Polkadot Hub TestNet
// it's the spike key outside the repo (dev/testnet-faucet.js). Keys are read here, never sent to the
// browser. A static build (GitHub Pages) has no dev server, so no cheat.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/** What one press pays. */
export const CHEAT_AMOUNT = 10_000_000

const TESTNET_RPC = 'https://eth-rpc-testnet.polkadot.io/'
const ABI = ['function cheat(address to, uint256 amount)']

/** The testnet's Credits address, from the SDK's network list (the one place it's written down). */
function testnetCredits() {
  const source = fs.readFileSync(new URL('../../sdk/src/chain/networks.js', import.meta.url), 'utf8')
  const block = source.slice(source.indexOf('420420417'))
  return block.match(/credits:\s*'(0x[0-9a-fA-F]{40})'/)?.[1] ?? null
}

function testnetKey() {
  const file = process.env.ORBITER_TESTNET_KEY || path.join(os.homedir(), '.config/orbiter8/paseo-spike.json')
  if (!fs.existsSync(file)) return null
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  const key = json.data ?? json
  return (Array.isArray(key) ? key[0] : key).private_key
}

export function cheat() {
  let queue = Promise.resolve() // one at a time, so nonces don't clash
  return {
    name: 'orbiter-cheat',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__cheat', (req, res) => {
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
              const { address, network } = JSON.parse(body || '{}')
              const { JsonRpcProvider, Wallet, Contract, isAddress } = await import('ethers')
              if (!isAddress(address)) return reply(400, { error: 'not an address' })
              let signer
              let credits
              if (network === 'testnet') {
                const key = testnetKey()
                if (!key) return reply(503, { error: 'no testnet admin key (ORBITER_TESTNET_KEY)' })
                signer = new Wallet(key, new JsonRpcProvider(TESTNET_RPC, 420420417, { staticNetwork: true }))
                credits = testnetCredits()
              } else {
                const file = new URL(`./local-deployment${process.env.VITE_LOCAL_FILE ?? ''}.json`, import.meta.url)
                const deployment = JSON.parse(fs.readFileSync(file, 'utf8'))
                const provider = new JsonRpcProvider(process.env.VITE_LOCAL_RPC || deployment.rpc)
                signer = await provider.getSigner(0)
                credits = deployment.contracts.credits
              }
              if (!credits) return reply(503, { error: 'no Credits address for ' + (network ?? 'local') })
              const tx = await new Contract(credits, ABI, signer).cheat(address, CHEAT_AMOUNT)
              await tx.wait()
              console.log(`[cheat] ${address} +${CHEAT_AMOUNT} credits on ${network ?? 'local'} (${tx.hash})`)
              reply(200, { hash: tx.hash, amount: CHEAT_AMOUNT })
            } catch (error) {
              console.error('[cheat]', error.shortMessage ?? error.message)
              reply(500, { error: error.shortMessage ?? error.message })
            }
          })
        })
      })
    }
  }
}
