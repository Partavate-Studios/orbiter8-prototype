// `npm run local4`: Demo 4's local setup (docs/demo4-plan.md, milestone 1). Starts Foundry's local
// chain, deploys the new contracts (contracts-v4), and runs the dev server with the dev wallet.
// Everything resets when you stop it (Ctrl+C). Needs Foundry (forge, anvil) on PATH or in ~/.foundry/bin.
// CHAIN_PORT and UI_PORT run a second copy beside the first (e.g. CHAIN_PORT=8546 UI_PORT=8092): it
// writes its own deployment file, dev/local-deployment-v4-<CHAIN_PORT>.json.
import { spawn, spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const CHAIN_PORT = process.env.CHAIN_PORT ?? '8545'
const UI_PORT = process.env.UI_PORT ?? '8080'
const RPC = `http://127.0.0.1:${CHAIN_PORT}`
const SUFFIX = CHAIN_PORT === '8545' ? '' : `-${CHAIN_PORT}`
const CONTRACTS = new URL('../../contracts-v4/', import.meta.url).pathname
const FOUNDRY = join(homedir(), '.foundry', 'bin')
const env = { ...process.env, PATH: `${FOUNDRY}:${process.env.PATH}` }
const children = []

async function rpc(method, params = []) {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  })
  return (await res.json()).result
}
async function chainIsUp() {
  try {
    return Boolean(await rpc('eth_chainId'))
  } catch {
    return false
  }
}
function stopAll() {
  for (const child of children) child.kill()
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopAll()
    process.exit(0)
  })
}

if (await chainIsUp()) {
  console.error(`Something is already listening on ${RPC}. Stop it first (this script starts its own chain).`)
  process.exit(1)
}

// Blocks every second, so time moves on for drand rounds and timers even when nobody plays.
const chain = spawn('anvil', ['--port', CHAIN_PORT, '--block-time', '1', '--silent'], { env, stdio: 'ignore' })
children.push(chain)
for (let i = 0; i < 60 && !(await chainIsUp()); i++) await new Promise((resolve) => setTimeout(resolve, 250))
if (!(await chainIsUp())) {
  console.error('Local chain did not start.')
  stopAll()
  process.exit(1)
}

// Deploy from anvil's first (unlocked) account; no private key needed.
mkdirSync(join(CONTRACTS, 'deployments'), { recursive: true })
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
const addresses = JSON.parse(readFileSync(join(CONTRACTS, 'deployments', `${chainId}.json`), 'utf8'))
writeFileSync(
  new URL(`./local-deployment-v4${SUFFIX}.json`, import.meta.url),
  JSON.stringify({ chainId, rpc: RPC, contracts: addresses }, null, 2) + '\n'
)

console.log(`\nOpen http://localhost:${UI_PORT}/ (add ?account=2, ?account=3 … to play as other pilots).\n`)
spawn('npx', ['vite', '--port', UI_PORT, '--strictPort'], {
  stdio: 'inherit',
  env: { ...env, VITE_DEV_WALLET: '1', VITE_DEMO4: '1', VITE_LOCAL_RPC: RPC, VITE_LOCAL4_FILE: SUFFIX }
}).on('exit', () => {
  stopAll()
  process.exit(0)
})
