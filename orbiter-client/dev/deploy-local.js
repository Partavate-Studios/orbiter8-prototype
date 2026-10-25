// Deploy the Orbiter 8 contracts to the local chain, mirroring migrations/1..15.
// Uses the precompiled artifacts in src/contract-artifacts, so no Solidity compiler is needed.
// Writes dev/local-deployment.json, which dev builds read for chain 1337.
import fs from 'node:fs'
import { JsonRpcProvider, ContractFactory } from 'ethers'

const RPC = process.env.RPC || 'http://127.0.0.1:8545'
const artifactDir = new URL('../src/contract-artifacts/', import.meta.url)
const outFile = new URL('./local-deployment.json', import.meta.url)

const provider = new JsonRpcProvider(RPC)
const owner = await provider.getSigner(0)
const load = (name) => JSON.parse(fs.readFileSync(new URL(name + '.json', artifactDir), 'utf8'))
const deployed = {}
const instances = {}

// Truffle placeholders are "__LibraryName___…" padded to 40 characters.
function link(bytecode) {
  return bytecode.replace(/__([A-Za-z0-9_$]+?)_+/g, (match, name) => {
    if (match.length !== 40) return match
    if (!deployed[name]) throw new Error('missing library ' + name)
    return deployed[name].slice(2).toLowerCase()
  })
}

async function deploy(name) {
  const artifact = load(name)
  const contract = await new ContractFactory(artifact.abi, link(artifact.bytecode), owner).deploy()
  await contract.waitForDeployment()
  deployed[name] = await contract.getAddress()
  instances[name] = contract
  return contract
}

const send = async (tx) => (await tx).wait()

await deploy('AvatarLibrary')
await deploy('AvatarControls')
for (const lib of ['ShipLibrary', 'PlanetLibrary', 'MoonLibrary', 'PresetLibrary', 'StarSystemLibrary'])
  await deploy(lib)
const game = await deploy('Orbiter8')

for (const [token, setter] of [
  ['ShipTokens', 'setShipTokenizer'],
  ['PlanetTokens', 'setPlanetTokenizer'],
  ['Credits', 'setCreditTokenizer']
]) {
  const tokenContract = await deploy(token)
  await send(tokenContract.transferOwnership(deployed.Orbiter8))
  await send(game[setter](deployed[token]))
}
await send(game.setAvatarControls(deployed.AvatarControls))
await send(instances.AvatarControls.createAvatar('The Federation'))
await send(game.genesis())
await send(game.makeSolarSystem())

const systems = await game.getSystemCount()
const { chainId } = await provider.getNetwork()
fs.writeFileSync(outFile, JSON.stringify({ chainId: Number(chainId), contracts: deployed }, null, 2) + '\n')
console.log(`Deployed Orbiter 8 locally: ${Object.keys(deployed).length} contracts, ${systems} star systems.`)
