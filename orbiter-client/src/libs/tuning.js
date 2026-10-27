// TEMPORARY (Koda, 2026-10-27): two 5-step sliders for trying Enterprise Circuit's look in this client.
// Step 2 is the game as it is; 4 matches Enterprise Circuit; 3 is halfway; 1 and 5 are a half step
// beyond each end. Steps are geometric (factor^t), so each step looks like the same amount of change.
//
// "Matching Enterprise Circuit" means matching its proportions, not its raw units: its whole system is
// about 2.9x larger, so sizes are compared against the system's extent (planets, the star) or against
// the orbit around the parent (moons, stations, ships). Speeds are compared as angular speeds.
import { reactive } from 'vue'
import { ORBIT_SPEED_SCALE, planetOrbitRadius } from '@/sdk/game/orbits'
import { spriteScale } from '@/libs/sprite-types'

const STORAGE_KEY = 'o8.tuning'
/** Slider step → exponent on the Enterprise Circuit factor. */
const EXPONENT = { 1: -0.5, 2: 0, 3: 0.5, 4: 1, 5: 1.5 }

// Enterprise Circuit's layout (client/src/stores/composables/sprites.ts) and art scales.
const EC = {
  planetOrbit: (position) => 500 + 480 * position,
  planetRadius: (size) => 10 * (size / 16 + 0.5),
  starRadius: (size) => 13 * (size + 0.5),
  moonRadius: (size) => 4 * (size / 12 + 0.5),
  moonOrbit: (position, planetSize) => 65 + 30 * position + 1.5 * planetSize,
  stationRadius: (size) => 290 * (size / 1000 + 0.02),
  stationOrbit: (planetSize) => 40 + 1.5 * planetSize,
  shipLength: 9.2,
  shipOrbit: (planetSize) => (planetSize == null ? 240 : 12 + 1.5 * planetSize),
  // Angular speed (radians per game millisecond): its "period" values times 1e-7.
  planetSpeed: (velocity, position) => (velocity / (position + 1) + 5) * 1e-7,
  moonSpeed: (velocity, position) => ((velocity * 4) / (position + 1) + 100) * 1e-7,
  stationSpeed: (planetSize) => ((50 - planetSize) * 10 + 150) * 1e-7,
  shipSpeed: 1000 * 1e-7
}
// This client's art at sprite scale 1 (sprites/*.svg.vue): disc radius, or a ship's length.
const OURS = { planet: 10, star: 130, moon: 2, station: 7.25, ship: 11.5 }
// How much bigger Enterprise Circuit's system is: its outermost orbit (Pluto, position 8) over ours.
const SYSTEM_RATIO = planetOrbitRadius(8) / EC.planetOrbit(8)

function saved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}
const start = saved()

export const tuning = reactive({
  size: EXPONENT[start.size] !== undefined ? start.size : 2,
  speed: EXPONENT[start.speed] !== undefined ? start.speed : 2
})

// The speed's history, so a change keeps every orbit where it is: each object's "tuned time" runs at
// its factor during each stretch. Before any change (or after a reload) it starts from 0 with the
// current step, which for step 2 is exactly the game's own clock.
const speedHistory = [{ from: 0, step: tuning.speed }]

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ size: tuning.size, speed: tuning.speed }))
  } catch {
    // not saved; fine for a temporary tool
  }
}

export function setSizeStep(step) {
  tuning.size = step
  persist()
}

export function setSpeedStep(step, gameTime) {
  if (step === tuning.speed) return
  speedHistory.push({ from: gameTime, step })
  tuning.speed = step
  persist()
}

/** The size of the object it orbits, if that's a planet (null for the star). */
function parentPlanetSize(object, objects) {
  const parent = objects?.[object.orbiting]
  return parent?.type === 'planet' ? Number(parent.size) : null
}

/** Enterprise Circuit's size over ours, in matching proportions (1 = the same). */
function sizeRatio(object, objects) {
  const scale = spriteScale(object.type === 'ship' ? 10 : Number(object.size))
  switch (object.type) {
    case 'planet':
      return (SYSTEM_RATIO * EC.planetRadius(Number(object.size))) / (OURS.planet * scale)
    case 'star':
      return (SYSTEM_RATIO * EC.starRadius(Number(object.size))) / (OURS.star * scale)
    case 'moon': {
      const planetSize = parentPlanetSize(object, objects) ?? 0
      const ec = EC.moonRadius(Number(object.size)) / EC.moonOrbit(Number(object.orbitalPosition), planetSize)
      return ec / ((OURS.moon * scale) / object.orbit.radius)
    }
    case 'station': {
      const planetSize = parentPlanetSize(object, objects) ?? 0
      const ec = EC.stationRadius(Number(object.size)) / EC.stationOrbit(planetSize)
      return ec / ((OURS.station * scale) / object.orbit.radius)
    }
    case 'ship': {
      const ec = EC.shipLength / EC.shipOrbit(parentPlanetSize(object, objects))
      return ec / ((OURS.ship * scale) / object.orbit.radius)
    }
  }
  return 1
}

/** Enterprise Circuit's angular speed over ours (1 = the same). */
function speedRatio(object, objects) {
  const ours = object.orbit.speed * ORBIT_SPEED_SCALE
  if (!(ours > 0)) return 1
  let ec = ours
  switch (object.type) {
    case 'planet':
      ec = EC.planetSpeed(object.orbit.speed, Number(object.orbitalPosition))
      break
    case 'moon':
      // Ours is the contract's speed times the distance; Enterprise Circuit's uses the contract's speed.
      ec = EC.moonSpeed(object.orbit.speed / object.orbit.radius, Number(object.orbitalPosition))
      break
    case 'station':
      ec = EC.stationSpeed(parentPlanetSize(object, objects) ?? 0)
      break
    case 'ship':
      ec = EC.shipSpeed
      break
  }
  return ec / ours
}

/** How much bigger to draw this object at the current size step. */
export function sizeFactor(object, objects) {
  const exponent = EXPONENT[tuning.size]
  return exponent === 0 ? 1 : sizeRatio(object, objects) ** exponent
}

/**
 * The game time to put this object's orbit at, so it moves at the current speed step and never jumps
 * when the step changes. With the slider at 2 it's the game time itself.
 */
export function tunedTime(object, objects, gameTime) {
  if (speedHistory.length === 1 && EXPONENT[speedHistory[0].step] === 0) return gameTime
  const ratio = speedRatio(object, objects)
  let time = 0
  for (let i = 0; i < speedHistory.length; i++) {
    const { from, step } = speedHistory[i]
    const until = i + 1 < speedHistory.length ? speedHistory[i + 1].from : gameTime
    time += (Math.min(until, gameTime) - from) * ratio ** EXPONENT[step]
  }
  return time
}
