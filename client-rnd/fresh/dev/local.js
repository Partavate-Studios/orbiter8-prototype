// `npm run local`: a fresh local chain (anvil), the game's contracts deployed on it, and this client's
// dev server. Everything resets when it stops. Modeled on orbiter-client/dev/local.js, with this
// client's own ports (chain 8548, page 8094) so it can run beside the others.
import { spawn, spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const CHAIN_PORT = process.env.CHAIN_PORT ?? '8548'
const UI_PORT = process.env.UI_PORT ?? '8094'
const RPC = `http://127.0.0.1:${CHAIN_PORT}`
const CONTRACTS = fileURLToPath(new URL('../../../contracts/', import.meta.url))
const env = { SCAN_DELAY: '4', ...process.env, PATH: `${join(homedir(), '.foundry', 'bin')}:${process.env.PATH}` }
const children = []

async function rpc(method, params = []) {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  })
  return (await res.json()).result
}
const chainIsUp = () => rpc('eth_chainId').then(Boolean, () => false)
const stopAll = () => children.forEach((child) => child.kill())
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopAll()
    process.exit(0)
  })
}

if (await chainIsUp()) {
  console.error(`Something is already listening on ${RPC}. Stop it first, or set CHAIN_PORT.`)
  process.exit(1)
}
// A block every second, so drand rounds and timers move on while nobody plays.
children.push(spawn('anvil', ['--port', CHAIN_PORT, '--block-time', '1', '--silent'], { env, stdio: 'ignore' }))
for (let i = 0; i < 60 && !(await chainIsUp()); i++) await new Promise((r) => setTimeout(r, 250))
if (!(await chainIsUp())) {
  console.error('The local chain did not start.')
  stopAll()
  process.exit(1)
}

const [deployer] = await rpc('eth_accounts')
const deploy = spawnSync(
  'forge',
  ['script', 'script/Deploy.s.sol', '--rpc-url', RPC, '--broadcast', '--unlocked', '--sender', deployer],
  { cwd: CONTRACTS, env, stdio: ['ignore', 'inherit', 'inherit'] }
)
if (deploy.status !== 0) {
  stopAll()
  process.exit(1)
}
const chainId = Number(await rpc('eth_chainId'))
const contracts = JSON.parse(readFileSync(join(CONTRACTS, 'deployments', `${chainId}.json`), 'utf8'))
writeFileSync(
  new URL('./local-deployment.json', import.meta.url),
  JSON.stringify({ chainId, rpc: RPC, contracts }, null, 2) + '\n'
)

console.log(`\nOrbiter 8 (fresh client): http://localhost:${UI_PORT}/   ?account=2, 3 … for other pilots\n`)
const ui = spawn('npx', ['vite', '--port', UI_PORT, '--strictPort'], {
  stdio: 'inherit',
  env: { ...env, VITE_LOCAL_RPC: RPC }
})
children.push(ui)
ui.on('exit', () => {
  stopAll()
  process.exit(0)
})
