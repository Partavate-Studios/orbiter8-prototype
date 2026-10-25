// `npm run local`: start a fresh local chain, deploy the contracts, and run the dev server with the dev wallet.
// Everything resets when you stop it (Ctrl+C).
import { spawn } from 'node:child_process'

const RPC = 'http://127.0.0.1:8545'
const children = []

function run(command, args, env = {}) {
  const child = spawn(command, args, { stdio: 'inherit', env: { ...process.env, ...env } })
  children.push(child)
  return child
}

async function chainIsUp() {
  try {
    const res = await fetch(RPC, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] })
    })
    return res.ok
  } catch {
    return false
  }
}

function stopAll() {
  for (const child of children) child.kill()
}
process.on('SIGINT', () => {
  stopAll()
  process.exit(0)
})
process.on('SIGTERM', () => {
  stopAll()
  process.exit(0)
})

if (await chainIsUp()) {
  console.error(`Something is already listening on ${RPC}. Stop it first (this script starts its own chain).`)
  process.exit(1)
}

const chain = spawn('npx', ['hardhat', '--config', 'dev/hardhat.config.cjs', 'node', '--port', '8545'], {
  stdio: 'ignore'
})
children.push(chain)
for (let i = 0; i < 60 && !(await chainIsUp()); i++) await new Promise((resolve) => setTimeout(resolve, 500))
if (!(await chainIsUp())) {
  console.error('Local chain did not start.')
  stopAll()
  process.exit(1)
}

const deploy = run('node', ['dev/deploy-local.js'])
const deployed = await new Promise((resolve) => deploy.on('exit', (code) => resolve(code === 0)))
if (!deployed) {
  stopAll()
  process.exit(1)
}

console.log('\nOpen the game, then use ?account=2, ?account=3 … to play as other pilots.\n')
run('npx', ['vite'], { VITE_DEV_WALLET: '1' }).on('exit', () => {
  stopAll()
  process.exit(0)
})
