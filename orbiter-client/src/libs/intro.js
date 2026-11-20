// The intro: a new pilot's last night on Earth (docs/backstory.md, "Joining the game"; the approved mockup
// in docs/mockups/intro/). Where it starts from the player's state, the corporation the player subscribes
// to before the job is accepted, and its words. Every line here is a draft in the right voice: the copy is
// on Koda's list.

/**
 * Where the intro picks up, from the chain alone, so a reload lands in the right place:
 * - 'dark': no name filed: the power is off, only the ID scanner is lit;
 * - 'filing': the name was sent and is waiting to be mined;
 * - 'lit': the name is on file, the lights are on, the room is yours to explore;
 * - 'escort': the job was accepted and the ship is waiting to be mined;
 * - 'done': the pilot has a ship (the intro is over).
 * @param {{ haveAvatar: boolean, haveShip: boolean, pending: 'callsign' | 'ship' | null }} input
 */
export function introStart({ haveAvatar, haveShip, pending }) {
  if (haveShip) return 'done'
  if (pending === 'ship') return 'escort'
  if (haveAvatar) return 'lit'
  if (pending === 'callsign') return 'filing'
  return 'dark'
}

// ---------------------------------------------------------------- the corporation subscribed to
// Subscribing happens on the housing computer's first boot; the chain records it only when the job is
// accepted (Pilots.acceptJob). Until then it lives here, per network and account, so it survives a reload.
const subscriptionKey = (chainId, account) => `o8.intro.subscription.${chainId}.${String(account).toLowerCase()}`

/** The corporation id (1-based) the player subscribed to, or null. */
export function loadSubscription(chainId, account, storage = globalThis.localStorage) {
  try {
    const value = Number(storage?.getItem(subscriptionKey(chainId, account)))
    return value >= 1 ? value : null
  } catch {
    return null
  }
}
export function saveSubscription(chainId, account, corporation, storage = globalThis.localStorage) {
  try {
    storage?.setItem(subscriptionKey(chainId, account), String(corporation))
  } catch {
    // Private windows can refuse storage: the subscription then lasts only this visit.
  }
}

// ---------------------------------------------------------------- the three corporations' looks and voices
// The chain names them (Corp X, Y and Z for now, renameable); their character is decided (backstory.md,
// Society): 1 the shareholder corporation, 2 the family conglomerate, 3 the space-born upstart. Colors are
// muted identity hues for their ads and the console's band: never yellow or pink.
const SERIF = "Georgia, 'Times New Roman', serif"
const MONO = "'Ubuntu Mono', ui-monospace, monospace"
export const CORP_LOOKS = [
  {
    key: 'X',
    kind: 'Shareholder corporation · Old Earth',
    character: 'Contracts, lawyers, quarterly results. Your rights, in writing.',
    feels: '“Your rights are protected by contract.”',
    color: '#8395c4',
    band: '#181c2c',
    font: SERIF,
    greeting: 'Account summary. Terms and conditions apply.',
    curfew:
      'Curfew, 22:00–05:00. Violent incidents in Block 7 exceed contract thresholds, and security response after hours is not guaranteed. Leaving voids your coverage under clause 14(c).',
    ad: ['Read the contract.', 'Then sign it.', 'Your rights, in writing.']
  },
  {
    key: 'Y',
    kind: 'Family conglomerate · Old Earth',
    character: 'Plans in generations. Loyalty for life. The group first.',
    feels: '“You’re taken care of, as long as you belong.”',
    color: '#86b09f',
    band: '#141d1a',
    font: null,
    greeting: 'Welcome home. We look after our own.',
    curfew:
      'Please stay inside until 05:00. There has been violence in the block tonight, and our guards can’t reach Block 7 in time. We worry when you don’t.',
    ad: ['We plan', 'in centuries.', 'Belong, and be looked after.']
  },
  {
    key: 'Z',
    kind: 'Space-born upstart · The colonies',
    character: 'New money, new science, moving fast. Sometimes too fast.',
    feels: '“Get out there. We’ll figure out the rest.”',
    color: '#7fb5c2',
    accent: '#c49a78',
    band: '#121d21',
    font: MONO,
    greeting: 'hey. let’s get your numbers up.',
    curfew:
      'Stay in till 05:00. Block 7 gets rough after dark, and security out here is thin. Hang tight: we’ll get you off-world soon.',
    ad: ['Born out there.', 'Built fast.', 'Tomorrow ships today.']
  }
]
/** A corporation's look and name (id 1-based; names from the chain, or Corp X/Y/Z). */
export function corporation(id, names = []) {
  const look = CORP_LOOKS[(id - 1) % CORP_LOOKS.length] ?? CORP_LOOKS[0]
  return { id, ...look, name: names[id - 1] ?? `Corp ${look.key}` }
}

// ---------------------------------------------------------------- the night's facts and words (drafts)
export const UNIT = '7-2216'
export const BLOCK = 'Block 7'
export const CURFEW_WHY = 'violence high, security response limited'
export const TICKER = `MINERVA PUBLIC NOTICE · Curfew 22:00–05:00 · ${BLOCK}: ${CURFEW_WHY} · Pilot program hiring`
export const BALANCE = -45
export const CYCLE = [
  ['Stipend, through Minerva', '+600'],
  ['Unit fee', '−420'],
  ['Grid', '−95'],
  ['Nutrition', '−130']
]
/** The health score at the start of the night; each hit of the vape costs a point. */
export const HEALTH = 17
export const VAPE_HITS_BEFORE = 3

export const MAIL = [
  {
    from: 'Grid Utility',
    subject: 'Final notice: 3 cycles unpaid',
    tag: 'Overdue',
    body: [
      'Unit 7-2216: three cycles unpaid. Service continues at reduced priority. Brownouts in Block 7 are scheduled, not personal.'
    ]
  },
  {
    from: 'Block 7 Housing',
    subject: 'Unit fee overdue: 2 cycles',
    tag: 'Overdue',
    body: [
      'Your unit fee is two cycles overdue. Affordable housing is a privilege of continued payment. Please pay through Minerva.'
    ]
  },
  {
    from: 'Harlan & Voss Logistics',
    subject: 'Re: Application 44817',
    tag: 'Rejection',
    body: [
      'Dear Applicant 7-2216,',
      'After careful review against 9,412 applicants, we have selected candidates whose qualifications more closely match the position.',
      'Your rights under this decision are set out in Annex C. You may appeal within 3 days, at your own cost.'
    ]
  },
  {
    from: 'Talent Intake',
    subject: 'Your application was not reviewed',
    tag: 'Rejection',
    body: [
      'Your application was not reviewed. Applications from non-citizens are reviewed when capacity allows. Capacity does not allow.'
    ]
  },
  {
    from: 'NutriLoan',
    subject: 'You’re pre-approved! 0% for 3 days',
    tag: '',
    body: [
      'Hungry? NutriLoan advances up to 200¢ of nutrition against your next stipend. 0% for 3 days, then the rate applies.'
    ]
  },
  {
    from: 'Block 7 Security',
    subject: 'Incident report: 3 assaults, 0 arrests',
    tag: '',
    body: ['Incidents tonight: 3 assaults, 1 fire, 0 arrests. Response times are limited after curfew. Stay inside.']
  },
  {
    from: 'OxyPlus',
    subject: 'Your air could be better',
    tag: '',
    body: ['Block 7’s air quality: poor. OxyPlus filters: better. Ask about our citizen discount.']
  }
]

export const OTHER_JOBS = ['Warehouse picker', 'Debt collector', 'Clinical trial', 'Security, night', 'Courier']
/** The pilot job's terms, plainly (backstory.md: it says what happens, and sells it as a new life). */
export function jobTerms(corpName) {
  return [
    ['Your body', 'is frozen and kept in cold storage, to be bought back one day.'],
    ['Your mind', 'is uploaded to Minerva. You fly a ship; she flies with you.'],
    ['Your name', 'out there is a call sign: the one on file.'],
    ['The work', 'Space shipping: trade, explore, claim the worlds you find.'],
    ['The terms', 'Keep most of what you earn. The program advances a hold of goods, and your debt comes with you.'],
    ['And', `citizenship of ${corpName}, from the day you’re processed.`]
  ]
}

/** What Minerva says, by moment. */
export const SAY = {
  scan: 'Scan your ID card.',
  opening:
    'Unit 7-2216. Corporate affordable housing. It stays dark until it has a registered occupant. Scan your ID card at the reader by the door, then tell me your name. After that, choose a corporate sponsor at the terminal: the rest of the unit opens when you do. Curfew is on. You’re not going anywhere tonight.',
  locked: 'Locked until the unit has a corporate sponsor. Choose one at the terminal on the desk.',
  askName: 'Card read. No name on file for this card. What’s your name?',
  filing: 'Filing your name.',
  lightsOn: 'Power’s on. So are the bills. The rest of the unit opens when you choose a corporate sponsor at the terminal on the desk.',
  firstBoot: 'This unit runs through a corporate sponsor. Pick one, and the balcony and the door open. You can switch later; on Earth it’s free.',
  switching: 'Switching is free while you’re on Earth. Out there it costs, and what you own moves with you.',
  account: 'You owe 45. The stipend comes in 6 days. The bills come first.',
  health: (score) => `Your health score is ${score}. Your insurer would worry. You don’t have an insurer.`,
  mail: 'Two bills are overdue. One company said no, politely. Another didn’t read it.',
  jobs: 'One opening you qualify for. Read all of it before you sign.',
  shipName: 'Name your ship. It’s registered with me before pickup.',
  escort: 'Application filed. An escort will arrive shortly to take you to processing.',
  vape: (hits, score) =>
    `Vape. That’s ${ordinal(hits)} today. At this rate your score reaches zero in ${Math.max(1, Math.round(score / Math.max(1, hits)))} days. I’m only counting.`,
  wake: (ship, debt) =>
    `You’re awake. This is your ship, the ${ship}, in orbit over Earth. Your body is in storage. Your mind is here, with me. You owe the pilot program ${debt} credits. The hold carries the program’s advance. Sell it at the I.S.S., clear the debt, then go find a star nobody has. That’s the job.`
}
function ordinal(n) {
  return ['none', 'one', 'two', 'three', 'the fourth', 'the fifth', 'the sixth', 'the seventh'][n] ?? `number ${n}`
}
