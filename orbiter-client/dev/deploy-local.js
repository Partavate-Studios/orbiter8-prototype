// Deploy the Orbiter 8 contracts to the local chain, mirroring migrations/1..15.
// Uses the precompiled artifacts in src/contract-artifacts, so no Solidity compiler is needed.
// Writes dev/local-deployment.json, which dev builds read for chain 1337.
import fs from 'node:fs'
import Web3 from 'web3'

const RPC = process.env.RPC || 'http://127.0.0.1:8545'
const artifactDir = new URL('../src/contract-artifacts/', import.meta.url)
const outFile = new URL('./local-deployment.json', import.meta.url)

const web3 = new Web3(RPC)
const load = name => JSON.parse(fs.readFileSync(new URL(name + '.json', artifactDir), 'utf8'))
const deployed = {}

// Truffle placeholders are "__LibraryName___…" padded to 40 characters.
function link (bytecode) {
  return bytecode.replace(/__([A-Za-z0-9_$]+?)_+/g, (match, name) => {
    if (match.length !== 40) return match
    if (!deployed[name]) throw new Error('missing library ' + name)
    return deployed[name].slice(2).toLowerCase()
  })
}

const [owner] = await web3.eth.getAccounts()
// web3 1.x mutates the options object it is given, so build a fresh one per call.
const opts = () => ({ from: owner, gas: 30000000 })

async function deploy (name) {
  const artifact = load(name)
  const contract = await new web3.eth.Contract(artifact.abi).deploy({ data: link(artifact.bytecode) }).send(opts())
  deployed[name] = contract.options.address
  return contract
}
const at = name => new web3.eth.Contract(load(name).abi, deployed[name])

await deploy('AvatarLibrary')
await deploy('AvatarControls')
for (const lib of ['ShipLibrary', 'PlanetLibrary', 'MoonLibrary', 'PresetLibrary', 'StarSystemLibrary']) await deploy(lib)
await deploy('Orbiter8')
const game = at('Orbiter8')

for (const [token, setter] of [['ShipTokens', 'setShipTokenizer'], ['PlanetTokens', 'setPlanetTokenizer'], ['Credits', 'setCreditTokenizer']]) {
  const tokenContract = await deploy(token)
  await tokenContract.methods.transferOwnership(deployed.Orbiter8).send(opts())
  await game.methods[setter](deployed[token]).send(opts())
}
await game.methods.setAvatarControls(deployed.AvatarControls).send(opts())
await at('AvatarControls').methods.createAvatar('The Federation').send(opts())
await game.methods.genesis().send(opts())
await game.methods.makeSolarSystem().send(opts())

const systems = await game.methods.getSystemCount().call({ from: owner })
fs.writeFileSync(outFile, JSON.stringify({ chainId: Number(await web3.eth.getChainId()), contracts: deployed }, null, 2) + '\n')
console.log(`Deployed Orbiter 8 locally: ${Object.keys(deployed).length} contracts, ${systems} star systems.`)
