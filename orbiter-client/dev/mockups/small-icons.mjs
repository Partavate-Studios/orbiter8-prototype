// The small-icon set proposed in docs/ui-plan.md: line icons on a 24-unit grid around 0,0, one line
// weight, round ends, no fills. Drawn as a sheet by icons.mjs and used by together.mjs's mockups.
/** name → [label, path]. Grouped by where they're used. */
export const ICON_GROUPS = {
  'What\'s here (the list\'s filters)': {
    all: ['All', 'M-8 -7H-4M0 -7H8M-6 -7V5M-6 -1H-2M2 -1H8M-6 5H-2M2 5H8'],
    planet: ['Planets', 'M-7 0A7 7 0 1 0 7 0A7 7 0 1 0 -7 0M-6.2 -3Q0 -0.6 6.2 -3M-6.2 3.2Q0 5.6 6.2 3.2'],
    station: ['Stations', 'M0 -8.5L7.4 -4.2V4.2L0 8.5L-7.4 4.2V-4.2ZM-3 -3L3 3M3 -3L-3 3'],
    moon: ['Moons', 'M3 -7.5A7.5 7.5 0 1 0 3 7.5A6 6 0 1 1 3 -7.5Z'],
    asteroid: ['Asteroids', 'M-5 -6.5L1 -8L7 -4L8 2L3 7.5L-4 8L-8 3L-7.5 -2ZM-2.5 -1.5V-1.3M2.5 2.5V2.7'],
    ship: ['Ships', 'M0 -9Q3 -9 3 -5V6H-3V-5Q-3 -9 0 -9M-3 1H-6M3 1H6M-8.5 -2.5V6H-6V-2.5ZM6 -2.5V6H8.5V-2.5Z'],
    yours: ['Yours', 'M0 -8L2.3 -2.6L8 -2.4L3.6 1.4L5 7L0 3.8L-5 7L-3.6 1.4L-8 -2.4L-2.3 -2.6Z']
  },
  'What you can do (action wells)': {
    trade: ['Trade', 'M-8 -3H7M3 -7L7 -3L3 1M8 4H-7M-3 0L-7 4L-3 8'],
    yards: ['Yards', 'M-9 -7H-6M-9 -7V7M-9 7H-6M9 -7H6M9 -7V7M9 7H6M0 -6.5Q2.6 -6.5 2.6 -3.5V5.5H-2.6V-3.5Q-2.6 -6.5 0 -6.5'],
    armory: ['Armory', 'M0 -8.5L7 -5.5V1Q7 6 0 9Q-7 6 -7 1V-5.5ZM-3 -1L0 2L3 -1'],
    colony: ['Colony', 'M-8 6A8 8 0 0 1 8 6M-9.5 6H9.5M0 -2V6M-4.5 0.8V6M4.5 0.8V6'],
    claim: ['Claim', 'M-5 9V-8M-5 -8H7L3.5 -4L7 0H-5'],
    attack: ['Attack', 'M0 -9.5V-4.5M0 4.5V9.5M-9.5 0H-4.5M4.5 0H9.5M-5 0A5 5 0 1 0 5 0A5 5 0 1 0 -5 0'],
    siege: ['Siege', 'M-8 -8L5 5M8 -8L-5 5M-8.5 3.5L-3.5 8.5M8.5 3.5L3.5 8.5'],
    recruit: ['Recruit', 'M-6 -4A2.6 2.6 0 1 0 -0.8 -4A2.6 2.6 0 1 0 -6 -4M-8.5 8V6A5 5 0 0 1 1.5 6V8M3 -3A2.2 2.2 0 1 0 7.4 -3A2.2 2.2 0 1 0 3 -3M4.6 2.4A4.2 4.2 0 0 1 9 6.4V8'],
    jump: ['Jump', 'M-8.5 6.5A1.8 1.8 0 1 0 -4.9 6.5A1.8 1.8 0 1 0 -8.5 6.5M-3.5 3.5L6.5 -6.5M1.5 -7.5H7.5V-1.5'],
    traverse: ['Black hole', 'M0 0.2A1.8 1.8 0 0 1 1.8 2A3.8 3.8 0 0 1 -2 3.8A5.8 5.8 0 0 1 -5.8 -2A7.8 7.8 0 0 1 2 -7.8A9 9 0 0 1 8.6 -2'],
    mine: ['Mine', 'M-7 8L3.5 -2.5M-2.5 -8.5Q5.5 -8 8.5 1.5'],
    stop: ['Stop', 'M-5.5 -5.5H5.5V5.5H-5.5Z'],
    market: ['Market', 'M-8 -8H0.5L8.5 0L0.5 8L-8 -0.5ZM-4.4 -4.4V-4.2'],
    nameStar: ['Name star', 'M0 -8.5L1.9 -1.9L8.5 0L1.9 1.9L0 8.5L-1.9 1.9L-8.5 0L-1.9 -1.9Z'],
    rename: ['Rename', 'M-8 8L-7 4L4 -7L7 -4L-4 7ZM1.5 -4.5L4.5 -1.5'],
    details: ['Details', 'M-8 -3V-8H-3M3 -8H8V-3M8 3V8H3M-3 8H-8V3M-3 -1H3M-3 3H1'],
    go: ['Go', 'M-7 0H6M2 -4.5L6.5 0L2 4.5']
  },
  'What\'s going on (the activity window)': {
    scan: ['Scan', 'M-8.5 5A8.5 8.5 0 0 1 8.5 5M-4.5 5A4.5 4.5 0 0 1 4.5 5M0 5L5.5 -3.5M-9.5 5H9.5'],
    build: ['Build', 'M-8.5 8H8.5M-6 8V-2H6V8M-7.5 -2L0 -8.5L7.5 -2M0 0.5V5.5M-2.5 3H2.5'],
    order: ['Factory order', 'M-8.5 8V-0.5L-3.5 3V-0.5L1.5 3V-7H8.5V8Z'],
    repair: ['Repair', 'M-3 -8.5H3V-3H8.5V3H3V8.5H-3V3H-8.5V-3H-3Z'],
    drones: ['Drones', 'M-7.5 -1.5L-4.5 -7.5L-1.5 -1.5ZM1.5 3.5L4.5 -2.5L7.5 3.5ZM-6.5 8.5L-3.5 2.5L-0.5 8.5Z'],
    session: ['Session', 'M-8.8 0A3.4 3.4 0 1 0 -2 0A3.4 3.4 0 1 0 -8.8 0M-2 0H9M6 0V3.6M9 0V2.6'],
    wallet: ['Your signature', 'M-8 -5.5H6.5V6.5H-8ZM6.5 -1.5H9V2.5H6.5M-8 -5.5L3.5 -8.5V-5.5M3.6 0.5V0.7']
  },
  'What\'s built (statuses, not buttons)': {
    citadel: ['Citadel', 'M-7.5 8V-6H-4.5V-3H-1.5V-6H1.5V-3H4.5V-6H7.5V8ZM-2 8V3.5A2 2 0 0 1 2 3.5V8'],
    colonyBuilt: ['Colony', 'M-8 6A8 8 0 0 1 8 6M-9.5 6H9.5M0 -2V6M-4.5 0.8V6M4.5 0.8V6'],
    stationBuilt: ['Station', 'M0 -8.5L7.4 -4.2V4.2L0 8.5L-7.4 4.2V-4.2ZM-3 -3L3 3M3 -3L-3 3'],
    port: ['Port', 'M-7.5 -3.5L0 -7.5L7.5 -3.5V4L0 8L-7.5 4ZM-7.5 -3.5L0 0.5L7.5 -3.5M0 0.5V8'],
    yardsBuilt: ['Yards', 'M-9 -7H-6M-9 -7V7M-9 7H-6M9 -7H6M9 -7V7M9 7H6M0 -6.5Q2.6 -6.5 2.6 -3.5V5.5H-2.6V-3.5Q-2.6 -6.5 0 -6.5'],
    armoryBuilt: ['Armory', 'M0 -8.5L7 -5.5V1Q7 6 0 9Q-7 6 -7 1V-5.5ZM-3 -1L0 2L3 -1'],
    autofactory: ['Autofactory', 'M-8.5 8V-0.5L-3.5 3V-0.5L1.5 3V-7H8.5V8Z'],
    platform: ['Platform', 'M-9 1.5H9M-5.5 1.5V7M5.5 1.5V7M-3 1.5V-4H3V1.5M0 -4V-8'],
    asteroidMine: ['Asteroid mine', 'M-5.5 -8H5.5L0 8.5ZM-3.8 -3H3.8M-2.2 2H2.2'],
    moonGuns: ['Moon guns', 'M-8 7A8 8 0 0 1 8 7ZM-2 -0.5L3.5 -8M1 1.5L6.5 -6']
  },
  'The HUD': {
    you: ['You', 'M0 -9A3.5 3.5 0 1 0 0 -2A3.5 3.5 0 1 0 0 -9M-7 9V5.5A5.5 5.5 0 0 1 -1.5 0H1.5A5.5 5.5 0 0 1 7 5.5V9'],
    fleet: ['Your ships', 'M-4.5 -9Q-2 -9 -2 -6V1H-7V-6Q-7 -9 -4.5 -9M4.5 -1Q7 -1 7 2V9H2V2Q2 -1 4.5 -1'],
    help: ['Help', 'M-4 -4.5A4 4 0 1 1 0 -0.5V2.5M0 6.5V6.8'],
    ranks: ['Ranks', 'M-5 -8.5H5V-3A5 5 0 0 1 -5 -3ZM-5 -6.5H-8.5V-4.5A3.2 3.2 0 0 0 -5 -1.3M5 -6.5H8.5V-4.5A3.2 3.2 0 0 1 5 -1.3M0 2V6M-4 8.5H4'],
    chat: ['Chat', 'M-8 -7H8V3.5H-1L-5.5 8V3.5H-8Z'],
    settings: ['Settings', 'M0 -3.2A3.2 3.2 0 1 0 0 3.2A3.2 3.2 0 1 0 0 -3.2M0 -9V-6M0 6V9M-9 0H-6M6 0H9M-6.4 -6.4L-4.3 -4.3M4.3 4.3L6.4 6.4M-6.4 6.4L-4.3 4.3M4.3 -4.3L6.4 -6.4'],
    more: ['More', 'M-7 0H-6.8M0 0H0.2M7 0H7.2'],
    copy: ['Copy', 'M-6.5 -3H3.5V8.5H-6.5ZM-2.5 -3V-7.5H7.5V4.5H3.5'],
    close: ['Close', 'M-6 -6L6 6M6 -6L-6 6'],
    back: ['Back', 'M7 0H-6M-2 -4.5L-6.5 0L-2 4.5']
  }
}

