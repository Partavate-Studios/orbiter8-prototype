// Why a move was refused, in the player's words. A sent move fails in the wallet's gas estimate,
// where ethers has no ABI and reports "execution reverted (unknown custom error)"; the contracts'
// errors are decoded here against the game's ABIs instead (sdk/contracts.js sent()).

/** Each error by name: plain words, from its arguments where they help. */
const WORDS = {
  // Pilots
  AlreadyRegistered: () => 'This wallet already has a pilot.',
  NotRegistered: () => 'Register a call sign first.',
  BadName: () => "That name isn't allowed: letters, digits, spaces, hyphens, underscores and dots, with no double spaces.",
  CallsignTaken: ([callsign]) => `${callsign} is taken.`,
  NoRoom: ([free]) => (Number(free) === 0 ? 'No free holds.' : `Only ${free} free ${plural(free, 'hold')}.`),
  NotEnoughCargo: ([, have]) => `Only ${have} aboard.`,
  NotEnoughColonists: ([have]) => `Only ${have} colonists aboard.`,
  TooManyBays: ([max]) => `A ship holds at most ${max} holds.`,
  BadRange: () => 'That jump is out of range.',
  BadSession: () => 'The session has ended. Start a new one from your ship.',
  SendFailed: () => "The gas money couldn't be sent.",
  BadLoadout: () => "That doesn't fit the ship's mounts or holds.",
  // Galaxy
  NotAStar: () => "There's no star there.",
  OutOfRange: ([, , range]) => `Out of range: your engines reach ${range} ${plural(range, 'step')}.`,
  NotScannable: () => "That star isn't waiting for a scan.",
  NotABlackHole: () => "You're not at a black hole.",
  BadRoundSignature: () => "The scan's randomness didn't check out. Try again in a moment.",
  // Market
  NoSuchPort: () => "There's no port there.",
  NotAtPort: () => 'Your ship has to be at that port.',
  NotTraded: () => "The port doesn't trade that.",
  PortFull: ([, room]) => `The port will only take ${room} more.`,
  PriceLimit: () => 'The price moved. Try again.',
  NoYard: () => "There's no shipyard there.",
  MaxRange: () => 'The engines are at full range already.',
  BadGood: () => "There's no such good.",
  // Planets and the Autofactory
  NoSuchPlanet: () => "There's no such planet.",
  FederationPlanet: () => "That's a Federation planet: it can't be claimed or attacked.",
  AlreadyClaimed: () => 'Someone claimed it first.',
  FirstClaimWindow: () => 'Its discoverer has first claim for a few minutes.',
  NotYours: () => "That planet isn't yours.",
  NotThere: () => 'Your ship has to be at that star.',
  NotAtSol: () => 'Colonists are recruited at Sol.',
  Busy: () => "One building at a time: wait for the current one to finish.",
  CannotBuild: () => "That can't be built here yet.",
  NeedsPeople: ([needed]) => `Needs ${Number(needed).toLocaleString('en-US')} people.`,
  NotEnoughStock: ([, have]) => `Only ${have} in storage.`,
  StorageFull: ([, room]) => `Storage has room for ${room} more.`,
  NoSuchMoon: () => "There's no such moon.",
  CannotNameStar: () => "You can't name this star.",
  NoAutofactory: () => 'The planet has no Autofactory.',
  QueueFull: () => 'The Autofactory already has five orders.',
  NoSuchPart: () => "There's no such part.",
  NotEnoughParts: ([, have]) => `Only ${have} in the factory's store.`,
  // Battle and the Armory
  CannotAttack: () => "Your ship can't attack now: it needs working weapons, repairs, or to finish its current siege.",
  AlreadyBesieged: () => "That planet is already under siege.",
  NoSiege: () => "There's no siege there.",
  NotWornDown: () => "The planet isn't worn down yet.",
  NotYet: () => "Not yet: the claim's waiting period is still running.",
  TooManyAllies: () => 'The defense is full.',
  Behind: () => 'Record the rounds first.',
  PlanetOnly: () => 'That part goes on planets only.',
  TooMany: () => "There's no room for more of those.",
  WeaponsOnly: () => 'Moons take weapons only: railguns, missile racks and point defense.',
  InBattle: () => "The loadout can't change during a siege.",
  NoArmory: () => "There's no armory there.",
  NotEnough: () => 'Not enough credits.',
  // Tokens
  ShipsAreBound: () => "Ships can't change hands.",
  DeedsAreBound: () => "Planets can't change hands.",
  // OpenZeppelin
  ERC20InsufficientBalance: ([, have, needed]) =>
    `Not enough credits: ${Number(needed).toLocaleString('en-US')} needed, ${Number(have).toLocaleString('en-US')} held.`
}

const plural = (n, word) => (Number(n) === 1 ? word : word + 's')

/** The revert data an error carries, if any (ethers puts it in several places). */
export function revertData(error) {
  const data = error?.data ?? error?.info?.error?.data ?? error?.error?.data
  return typeof data === 'string' && data.startsWith('0x') && data.length >= 10 ? data : null
}

/**
 * The contract error behind a refused move: its name and plain words, or null if the error isn't a
 * decodable revert.
 * @param {unknown} error  what ethers threw
 * @param {import('ethers').Interface[]} interfaces  the game's contracts' ABIs
 * @returns {{ name: string, words: string } | null}
 */
export function parseRevert(error, interfaces) {
  const data = revertData(error)
  if (!data) return null
  for (const abi of interfaces) {
    let parsed
    try {
      parsed = abi.parseError(data)
    } catch {
      parsed = null
    }
    if (!parsed) continue
    const words = WORDS[parsed.name]
    if (words) return { name: parsed.name, words: words(parsed.args) }
    const args = parsed.args.map((a) => (typeof a === 'bigint' ? a.toString() : String(a))).join(', ')
    return { name: parsed.name, words: args ? `${parsed.name} (${args})` : parsed.name }
  }
  return null
}

/** Plain words for a refused move, or null if the error isn't a decodable revert. */
export function describeRevert(error, interfaces) {
  return parseRevert(error, interfaces)?.words ?? null
}
