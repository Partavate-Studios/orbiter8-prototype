// `npm run abi`: copies the contracts' ABIs from Foundry's build (contracts/out) into the
// client (src/sdk/abi), so the client builds without Foundry. Run after changing a contract's interface.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const OUT = new URL('../../contracts/out/', import.meta.url)
const DEST = new URL('../src/sdk/abi/', import.meta.url)
const CONTRACTS = {
  Galaxy: 'Galaxy.sol/Galaxy.json',
  Pilots: 'Pilots.sol/Pilots.json',
  Market: 'Market.sol/Market.json',
  Credits: 'Credits.sol/Credits.json',
  Planets: 'Planets.sol/Planets.json',
  Factory: 'Factory.sol/Factory.json',
  Battle: 'Battle.sol/Battle.json',
  Armory: 'Armory.sol/Armory.json'
}

mkdirSync(DEST, { recursive: true })
for (const [name, path] of Object.entries(CONTRACTS)) {
  const { abi } = JSON.parse(readFileSync(new URL(path, OUT), 'utf8'))
  writeFileSync(new URL(`${name}.json`, DEST), JSON.stringify(abi, null, 2) + '\n')
  console.log(`${name}: ${abi.length} entries`)
}
