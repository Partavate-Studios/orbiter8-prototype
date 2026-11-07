// `npm run abi4`: copies the Demo 4 contracts' ABIs from Foundry's build (contracts-v4/out) into the
// client (src/sdk/v4/abi), so the client builds without Foundry. Run after changing a contract's interface.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const OUT = new URL('../../contracts-v4/out/', import.meta.url)
const DEST = new URL('../src/sdk/v4/abi/', import.meta.url)
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
