// Your corporation's database, in Minerva's console (docs/briefs/corp-database.md): the pages' words as data.
// Shared text once; each corporation's lines keyed by X, Y, Z as CORP_LOOKS is. All copy is [draft], for
// Koda's review. Paragraphs are { lead, text } (lead in bold); a spec line mixes strings and { redact: n }
// (a bar about n characters long, read out as "classified"). The hull keys are SHIP_DESIGNS' (old network
// names): never shown.
//
// Switching sponsor switches the database: its name, its voice, its ship page. The History page is meant to be
// reused by Minerva's library later.

export const DATABASE_PAGES = [
  { key: 'orbiter8', title: 'Orbiter 8' },
  { key: 'how', title: 'How it works' },
  { key: 'ship', title: 'Our ship' },
  { key: 'history', title: 'History' }
]

/** What changes with the corporation. */
export const CORP_DATABASE = {
  X: {
    name: 'Records',
    motto: 'Access logged. Use is subject to the terms of your sponsorship.',
    opening: 'The Orbiter 8 is the industry benchmark. Every program, including ours, is measured against it.',
    closing: 'Pilots are contractors. Terms, earnings and storage of the body are set out in your agreement.',
    ship: {
      hull: 'polygon',
      name: 'Meridian',
      status: 'in development',
      focus: 'we’re improving cargo per jump: more tons carried for every charge, at a lower cost per ton.',
      spec: [
        'Drive: ',
        { redact: 8 },
        '. Range: ',
        { redact: 4 },
        '. Crew: ',
        { redact: 10 },
        '. Yard: ',
        { redact: 12 },
        '.'
      ],
      stamp: 'REDACTED',
      note: 'Patent pending. Disclosure is a breach of your sponsorship agreement, clause 9(a).'
    }
  },
  Y: {
    name: 'The Archive',
    motto: 'Welcome. Everything here is shared within the family.',
    opening: 'The Orbiter 8 is a sound ship. We build them with care, as we would for our own.',
    closing: 'Our pilots are family. Your body will be kept as we keep our own, until you come home.',
    ship: {
      hull: 'boba',
      name: 'Heirloom',
      status: 'in the family’s hands',
      focus: 'we’re improving endurance: heavier armor, faster repair, and a ship that brings its pilot home.',
      spec: [
        'Hull: ',
        { redact: 8 },
        '. Shields: ',
        { redact: 6 },
        '. Yard: ',
        { redact: 11 },
        '. First flight: ',
        { redact: 4 },
        '.'
      ],
      stamp: 'RESTRICTED',
      note: 'Shared within the family when the family is ready.'
    }
  },
  Z: {
    name: 'the wiki',
    motto: 'it’s mostly up to date. mostly.',
    opening: 'The Orbiter 8. The gold standard. We say that with love, and with a stopwatch running.',
    closing: 'honestly the mind upload is the coolest part. you’ll see.',
    ship: {
      hull: 'moonbeam',
      name: 'Longshot',
      status: 'very soon',
      focus: 'we’re improving range: a bigger bank, farther stars, fewer stops.',
      spec: [
        'Bank: ',
        { redact: 8 },
        '. Range: ',
        { redact: 2 },
        ' stars (!!). Tested: ',
        { redact: 4 },
        '. Exploded: ',
        { redact: 1 },
        '.'
      ],
      stamp: 'under NDA',
      note: 'sorry. ask again next quarter.'
    }
  }
}

export const ORBITER8 = {
  intro: [
    {
      lead: 'Orbiter 8.',
      text: 'Interstellar survey, freight and claim vessel. Open standard: no patent; any yard may build it. Every pilot program in Sol starts here.'
    },
    {
      text: 'First flown as a next-generation prototype, with the strongest hull, the most powerful engines and the most advanced Minerva console of its day. It made history in 2140: to a foreign star and back in under 36 hours, the first return trip ever made.'
    }
  ],
  // The numbers are the game's: Pilots.sol starts a ship at range 1 with 5 bays, 250 in all; four drones built in.
  specs: [
    ['Drive', 'Stellar capacitor bank; one jump per charge'],
    ['Range', 'One star (the bank grows with upgrades)'],
    ['Internal space', '5 bays, expandable to 250 (cargo or drone bays)'],
    ['Drones', '4 built in: mining or repair'],
    ['Hardpoints', 'Railguns, missile racks, point defense, armor, shields: fitted at any Yards'],
    ['Pilot', 'One. See “How it works”']
  ],
  /** Fitted to show off what it can carry (sdk ship-art's loadout). */
  showcase: {
    bays: 250,
    rangeLost: 0,
    baysLost: 0,
    loadout: { shields: 1, armor: 2, railguns: 3, missiles: 2, pointDefense: 4, drones: 4, repairBots: 2 }
  }
}

export const HOW_IT_WORKS = [
  {
    art: 'drive',
    lead: 'The drive.',
    text: 'A star pours out more energy in a second than humanity has ever used. The Orbiter 8 drops into a close orbit, closer than any ship before it dared, and its capacitor bank drinks in the star’s light and wind. Then it spends the whole charge in one shot: a jump faster than light, to a neighboring star.'
  },
  {
    text: 'It arrives empty. To jump again it must charge again, and the only place to charge is around a star. So the Orbiter 8 travels star to star, never into the dark between them. A bigger bank reaches farther stars. Every jump still ends at a sun.'
  },
  {
    art: 'scan',
    lead: 'The scan.',
    text: 'While the bank charges, the long-range scanner sweeps the neighborhood. Every star it charts is a star the next jump can reach.'
  },
  {
    art: 'pilot',
    lead: 'The pilot.',
    text: 'The jump has to be steered through the charge and the arrival, and adjusted thousands of times a second against a star nobody has measured. An AMI alone can’t do it. A human working beside an AMI is far too slow.',
    strong: 'A human mind uploaded into the ship, flying with Minerva’s help, is fast enough.',
    after: 'That is the one part of the Orbiter 8 no yard can build.'
  },
  {
    text: 'The prototype’s first return took the full attention of Minerva’s network for 36 hours. That can’t be done for every ship. Every Orbiter 8 needs a consciousness aboard, or it stays in its berth.'
  },
  {
    text: 'The pilot’s mind lives on Minerva’s network, copied across all of it, so there’s no single place where it can be lost. The body waits in cold storage. A mind can fly one ship at a time.'
  }
]

export const HISTORY = [
  {
    art: 'colony',
    lead: '2030s: the first colonies.',
    text: 'The first colony on Mars had it rough. Gravity and radiation crumbled their bones and wasted their muscles. The first generation suffered; the second and third adapted faster than anyone predicted.'
  },
  {
    art: 'water',
    lead: 'The expansion.',
    text: 'The Moon, the moons of Jupiter, Venus, the larger asteroids. Genetic engineering gave us bodies made for space: we cured radiation’s cancers, breathed thinner air, and kept every drop of water. Water became the most precious thing we had. Not for lack of ice: turning ice into water takes work, and work takes fuel.'
  },
  {
    art: 'trade',
    lead: 'The Great Regrettion.',
    text: 'The first surge faded into decades of trade wars. Progress slowed, then stalled, and left a regret nobody could quite name. The governments didn’t survive it. By the time the expansion was done, none was left running anything. Nothing collapsed: the corporations already ran the water, the air, the power, the courts and the schools. People wanted a government, so the corporations became one. Today you are a citizen of a corporation, or of nothing.'
  },
  {
    art: 'minerva',
    lead: 'Minerva.',
    text: 'Older than the corporations’ rule is the Minerva Galactic Network. Nobody built her the way you build a product; she grew out of open, decentralized systems and became the one place every corporation agreed on the rules. Ledger, registry and court. She keeps the books for everyone and belongs to no one. In time she came to run Sol itself.'
  },
  {
    art: 'belt',
    lead: 'The 2090s: the Orbiters.',
    text: 'A new line of gravity-assist ships, the Orbiters, slung from planet to planet and opened the outer worlds. They took us to the edge of the solar system. That was as far as we could go, and we wondered whether we’d ever leave our sun.'
  },
  {
    lead: 'The Orbiter 6.',
    text: 'A customized Orbiter 6 dove into a charging orbit around the sun, jumped, and was never heard from again. It is still out there somewhere.'
  },
  {
    art: 'orbiter8',
    lead: '2140: the Orbiter 8.',
    text: 'The Orbiter 8 charged at the sun, jumped to a foreign star, recharged there, and came back in under 36 hours: the first return trip in history. Now the corporations are building them by the hundred, and every one needs a pilot.'
  }
]

/** A corporation's database, by its key (X, Y, Z). */
export function corpDatabase(key) {
  return CORP_DATABASE[key] ?? CORP_DATABASE.X
}
