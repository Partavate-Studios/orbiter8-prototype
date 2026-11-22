// What each of a selection's actions does (the options come from card-menu.js): opening menus, asking
// with the dialog, then the stores' moves. The words are the main client's.
import { isUnnamed } from '@orbiter8/sdk/system-gen'
import { marketTokenUrl, networkFor } from '@orbiter8/sdk/chain/networks'
import { useChainStore } from '@/stores/chain'
import { useGameStateStore } from '@/stores/gamestate'
import { useUIStore } from '@/stores/ui'
import { useDialogStore } from '@/stores/dialog'
import { usePlayerStore } from '@/stores/player'
import { useStarMapStore } from '@/stores/starmap'
import { STAR_KEY } from '@orbiter8/sdk/system'
import { PILOT_NAME_MIN_LENGTH } from '@/libs/onboarding'
import { cardMenu } from '@/components/star-map/hud/card-ui/menus/card-menu'

const credits = (n) => n.toLocaleString('en-US')

/**
 * Every action has its own place in the selection's menu (Koda, round 2: "each button has a place"):
 * a slot per row, by the kind of thing selected. Actions that never show together share a slot (a
 * planet is claimed, yours, or attacked). Going to a planet's station, its moons or a station's planet
 * isn't a slot: those are the big icons at the top of the menu, so nothing is offered twice.
 */
export const SLOTS = {
  planet: [['claim', 'colony', 'attack'], ['siege'], ['recruit'], ['market'], ['rename', 'owner']],
  station: [['trade'], ['shipyards'], ['armory'], ['rename', 'owner']],
  // (another pilot's ship has one thing to do: see its pilot)
  ship: [['jump', 'owner'], ['loadout'], ['session'], ['market'], ['rename']],
  star: [['jump'], ['traverse'], ['nameStar']],
  moon: [['rename', 'owner']],
  asteroid: [['claim', 'asteroid', 'attack'], ['siege'], ['rename', 'owner']],
  section: [['mine', 'stopMining']]
}
/** The commands the menu's top icons carry instead. */
const ICON_COMMANDS = new Set(['visitStation', 'visitPlanet', 'visitMoon'])

/**
 * The selection's actions in their slots: one entry per slot, the action or null when it has none now.
 * Empty slots at the end are left off (the ones before stay, so nothing below them moves).
 * @param {{ type: string }} object
 * @param {{ command: string }[]} actions  actionsFor(object)
 */
export function slotted(object, actions) {
  const slots = SLOTS[object?.type] ?? []
  const filled = slots.map((commands) => actions.find((option) => commands.includes(option.command)) ?? null)
  // Anything card-menu.js offers that has no slot yet still shows, after the slots.
  const placed = new Set(slots.flat())
  const extra = actions.filter((option) => !placed.has(option.command) && !ICON_COMMANDS.has(option.command))
  const out = [...filled, ...extra]
  while (out.length && out[out.length - 1] === null) out.pop()
  return out
}

/**
 * How each action looks on the card (docs/ui-guide.md section 11): its small icon (libs/small-icons.js)
 * and its one word.
 */
export const ACTION_LOOK = {
  trade: { icon: 'trade', word: 'Trade' },
  shipyards: { icon: 'yards', word: 'Yards' },
  armory: { icon: 'armory', word: 'Armory' },
  colony: { icon: 'colony', word: 'Colony' },
  asteroid: { icon: 'platform', word: 'Works' },
  claim: { icon: 'claim', word: 'Claim' },
  attack: { icon: 'attack', word: 'Attack' },
  siege: { icon: 'siege', word: 'Siege' },
  recruit: { icon: 'recruit', word: 'Recruit' },
  jump: { icon: 'jump', word: 'Jump' },
  traverse: { icon: 'traverse', word: 'Enter' },
  nameStar: { icon: 'nameStar', word: 'Name' },
  market: { icon: 'market', word: 'Market' },
  rename: { icon: 'rename', word: 'Rename' },
  loadout: { icon: 'ship', word: 'Loadout' },
  session: { icon: 'session', word: 'Session' },
  mine: { icon: 'mine', word: 'Mine' },
  stopMining: { icon: 'stop', word: 'Stop' },
  owner: { icon: 'you', word: 'Owner' }
}
/** The actions that can be a card's main one (its pill); the first of them in slot order is. */
const MAIN_COMMANDS = new Set(['trade', 'jump', 'colony', 'claim', 'attack', 'asteroid', 'mine', 'stopMining', 'recruit', 'owner'])
/** Why an action can't be used now, in a word or two. */
const WHY_NOT = { claim: "Can't afford", attack: 'Not armed', mine: 'All taken' }

/**
 * The card's action row: the main action (a pill) and the rest (wells), each with its icon, its word,
 * its number key (its slot, so a key always means the same action) and a short note: a price, or why
 * it can't be used now.
 * @param {{ type: string }} object
 * @param {{ command: string, text: string, enabled: boolean }[]} actions  actionsFor(object)
 * @returns {{ main: object | null, wells: object[] }}
 */
export function cardButtons(object, actions) {
  const buttons = slotted(object, actions)
    .map((option, index) => {
      if (!option) return null
      const look = ACTION_LOOK[option.command] ?? { icon: 'details', word: option.text.split(' ')[0] }
      const price = option.command === 'claim' ? option.text.match(/\((.+)\)/)?.[1] : undefined
      const note = option.enabled ? (option.command === 'session' && /^End/.test(option.text) ? 'On' : price) : (WHY_NOT[option.command] ?? 'Not now')
      // ("Pilot: Ada" on a ship, "Owner: Ada" on a planet: the word before the name)
      const word = option.command === 'owner' ? option.text.split(':')[0] : look.word
      return { option, key: index + 1, ...look, word, note, needsYou: !option.enabled && option.command === 'claim' }
    })
    .filter(Boolean)
  const main = buttons.find((button) => MAIN_COMMANDS.has(button.option.command)) ?? null
  return { main, wells: buttons.filter((button) => button !== main) }
}

/** The star's first-claim window (Claims.FIRST_CLAIM), in seconds. */
const FIRST_CLAIM_S = 10 * 60

/**
 * What a claim at the star in view costs the pilot now (Claims.claimFeeOf): free for the star's
 * discoverer in its first-claim window (Koda, 2026-11-18), the claim fee otherwise.
 */
export function claimFeeHere() {
  const player = usePlayerStore()
  const rules = player.rules
  if (!rules) return 0
  const star = useStarMapStore().systemObjects?.[STAR_KEY]
  const discoverer = star && String(star.owner).toLowerCase() === String(player.account).toLowerCase()
  const inWindow = star && Date.now() / 1000 < Number(star.birth) + FIRST_CLAIM_S
  return discoverer && inWindow ? (rules.discoveryFee ?? 0) : rules.claimFee
}

/** The actions for a selected object, for the pilot as they are now. */
export function actionsFor(object) {
  if (!object) return []
  const d = usePlayerStore()
  const pilot = {
    credits: d.credits,
    claimFee: claimFeeHere(),
    armed: d.armed,
    retreated: Boolean(d.condition?.retreated),
    sessionLive: d.sessionLive,
    siegeAt: (id) => d.siegeAt(id),
    account: d.account
  }
  return cardMenu(object, { marketName: networkFor(useChainStore().chainId)?.nftMarket?.name, pilot })
}

/**
 * Carries out one action.
 * @param {{ command: string, value?: number }} option
 * @param {import('@orbiter8/sdk/system').GameObject} object  the selection
 * @param {{ showMoons: () => void }} panel
 */
export async function runAction(option, object, { showMoons }) {
  const ui = useUIStore()
  const player = usePlayerStore()
  const game = useGameStateStore()
  const { ask, tell } = useDialogStore()
  switch (option.command) {
    case 'trade':
      return ui.openMenu('trade')
    case 'shipyards':
      return ui.openMenu('shipyard')
    case 'asteroid':
      return ui.openMenu('asteroid')
    case 'mine': {
      const slots = object.slots ?? []
      const free = [0, 1, 2, 3, 4, 5].find((i) => !slots[i] || slots[i].full)
      if (free === undefined) return tell('Mining', 'All six slots here are taken. Try another empty section.')
      return player.startMining(object.objectId, free)
    }
    case 'stopMining':
      return player.stopMining()
    case 'owner':
      return ui.openProfile(object.owner)
    case 'colony':
    case 'armory':
    case 'loadout':
    case 'siege':
      return ui.openMenu(option.command)
    case 'jump':
      return ui.zoomOutToNeighbors()
    case 'traverse':
      return game.traverseBlackHole()
    case 'visitStation':
      return ui.selectSprite(object.stationKey)
    case 'visitPlanet':
      return ui.selectSprite(object.orbiting)
    case 'visitMoon':
      return showMoons()
    case 'market': {
      const chain = useChainStore()
      const contract = object.type === 'ship' ? chain.shipTokenAddress : chain.planetTokenAddress
      const url = marketTokenUrl(chain.chainId, contract, object.id)
      if (url) window.open(url, '_blank', 'noopener')
      return
    }
    case 'claim': {
      const fee = claimFeeHere()
      const price = fee === 0 ? 'free, as its star\'s discoverer' : `for ${credits(fee)} credits`
      const asteroid = object.type === 'asteroid'
      const name = await ask({
        title: 'Claim ' + object.name,
        message: asteroid
          ? `Make ${object.name} your own ${price}, and give it a name. Then land people to build a Platform, and mining drones to work it.`
          : `Make ${object.name} your own ${price}, and give it a name. Then bring colonists and supplies to found a Citadel.`,
        // An unnamed body's stand-in name isn't offered as its name: the owner gives the first one.
        input: { label: asteroid ? "Your asteroid's name" : "Your planet's name", kind: 'name', value: isUnnamed(object.name) ? '' : object.name },
        confirm: asteroid ? 'Claim Asteroid' : 'Claim Planet'
      })
      if (name) game.claimPlanet({ planetId: option.value, name: name === object.name ? '' : name })
      return
    }
    case 'recruit': {
      const price = player.rules.colonistPrice
      const max = Math.min(Math.floor(player.credits / price), player.freeBays * 100)
      if (max < 1) {
        return tell('Recruiting Colonists', `Colonists cost ${price} credits each, 100 to a free hold. You need credits and free holds.`)
      }
      const count = await ask({
        title: "Earth's Hiring Hall",
        message: `Colonists sign on for ${price} credits each and travel 100 to a hold.`,
        input: { label: 'How many colonists', kind: 'number', min: 1, max, value: String(Math.min(100, max)) },
        confirm: 'Recruit'
      })
      if (count) player.recruit(count)
      return
    }
    case 'session': {
      if (player.sessionLive) return player.endSession()
      const go = await ask({
        title: 'Start a Session',
        message:
          'Approve once. For the next 4 hours your moves go through a key kept in this browser, with no popups. It carries a little gas money; what is left comes back when you end the session.',
        confirm: 'Start Session'
      })
      if (go) player.startSession()
      return
    }
    case 'attack': {
      const go = await ask({
        title: 'Lay Siege to ' + object.name,
        message:
          'A siege is public, fought in rounds every 30 minutes while your ship stays here. Wear the planet down, then file a claim: it completes a day later unless the defenses come back.',
        confirm: 'Attack'
      })
      if (go) player.attack(option.value, object.name)
      return
    }
    case 'nameStar': {
      const fee = player.rules.starNameFee // Claims.nameStar
      const owns = object.namingOwns && object.keeper !== player.account
      const name = await ask({
        title: (object.named ? 'Rename ' : 'Name ') + object.name,
        message: `Filing a star's name with Minerva costs ${credits(fee)} credits.` + (owns ? ' Holding its planets, you become the star’s owner.' : ''),
        input: { label: 'Star name', value: object.named ? object.name : '', kind: 'name' },
        confirm: object.named ? 'Rename' : 'Name Star'
      })
      if (name && name !== object.name) game.renameAsset({ objectId: object.objectId, name, type: 'star' })
      return
    }
    case 'rename': {
      const { type, objectId } = object
      // A ship's new name costs (B16).
      const fee = type === 'ship' ? player.shipNameFee : 0
      const name = await ask({
        title: 'Rename ' + object.name,
        message: fee ? `A new name for your ship costs ${credits(fee)} credits.` : undefined,
        input: {
          label: 'New ' + type + ' name',
          value: isUnnamed(object.name) ? '' : object.name,
          kind: 'name',
          minLength: type === 'ship' ? PILOT_NAME_MIN_LENGTH : 1
        },
        confirm: 'Rename'
      })
      // Moons and stations are named through their planet.
      const parentId = type === 'moon' || type === 'station' ? object.planet : undefined
      if (name && name !== object.name) game.renameAsset({ objectId, parentId, name, type })
      return
    }
  }
}
