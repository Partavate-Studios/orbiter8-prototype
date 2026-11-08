// The surface art of each planet class, as the star map's planet sprite draws it (sprites/planet.svg.vue),
// for drawings outside the map: the story's panels, and the tech tree pictures. Each is SVG markup for
// a planet of radius 10 at the origin, meant to be clipped to the disc (clip-path "just-the-planet").
// Classes the sprite draws plain (Oceanic, Desert, Swamp) have surfaces invented in the same style,
// first drawn for docs/tech-trees.

const EARTH_LIKE = `<g stroke-width="0.5" stroke="#ffffff11" fill="#ffffff22">
<rect x="-2" y="-8" width="12" height="2" rx="1" ry="1"/><rect x="0" y="-6" width="14" height="2" rx="1" ry="1"/>
<rect x="-2" y="-5" width="7" height="2" rx="1" ry="1"/><rect x="-9" y="-7" width="6" height="2" rx="1" ry="1"/>
<rect x="-10" y="-4" width="10" height="2" rx="1" ry="1"/><rect x="-1" y="-2" width="12" height="2" rx="1" ry="1"/>
<rect x="-12" y="1" width="12" height="2" rx="1" ry="1"/><rect x="-10" y="3" width="14" height="2" rx="1" ry="1"/>
<rect x="-4" y="4" width="14" height="2" rx="1" ry="1"/><rect x="0" y="6" width="6" height="2" rx="1" ry="1"/>
<rect x="-6" y="8" width="4" height="2" rx="1" ry="1"/><rect x="-10" y="9" width="12" height="2" rx="1" ry="1"/></g>`

const CRATERED = `<g stroke-width="0.5" stroke="#00000011" fill="#340f6122">
<circle cx="-5" cy="-5" r="1"/><circle cx="-4" cy="8" r="0.75"/><circle cx="-8" cy="-5" r="1.5"/><circle cx="3" cy="-7" r="0.5"/>
<circle cx="-7" cy="-6" r="1"/><circle cx="-3" cy="3" r="1.5"/><circle cx="-5" cy="-5" r="0.75"/><circle cx="2" cy="-1" r="0.5"/>
<circle cx="2" cy="6" r="1"/><circle cx="5" cy="8" r="0.75"/><circle cx="9" cy="-2" r="1.5"/><circle cx="-1" cy="-7" r="0.5"/>
<circle cx="6" cy="-6" r="1"/><circle cx="4" cy="3" r="1.5"/><circle cx="5" cy="-5" r="0.75"/><circle cx="-2" cy="-1" r="0.5"/></g>`

const WAVES = `<g stroke="#ffffff22" stroke-width="0.6" fill="none">
<path d="M-10 -4q2.5 -2 5 0t5 0t5 0t5 0"/><path d="M-11 1q2.5 -2 5 0t5 0t5 0t5 0"/><path d="M-10 6q2.5 -2 5 0t5 0t5 0t5 0"/></g>`

const DUNES = `<g stroke="#ffffff1a" stroke-width="0.5" fill="#ffffff14">
<path d="M-11 -2q6 -5 12 0t12 0v3q-6 -4 -12 0t-12 0z"/><path d="M-9 4q5 -4 10 0t10 0v2.5q-5 -3.5 -10 0t-10 0z"/>
<path d="M-6 -7q4 -3 8 0t8 0v2q-4 -3 -8 0t-8 0z"/></g>`

const THIN_ATMOSPHERE = `<g stroke-width="0" fill="#ffffff22">
<rect x="-2" y="-8" width="12" height="1" rx="1" ry="1"/><rect x="-9" y="-7" width="6" height="1" rx="1" ry="1"/>
<rect x="-10" y="-4" width="10" height="1" rx="1" ry="1"/><rect x="-10" y="3" width="14" height="1" rx="1" ry="1"/>
<rect x="0" y="6" width="6" height="1" rx="1" ry="1"/><rect x="-6" y="8" width="4" height="1" rx="1" ry="1"/></g>`

const BANDS = `<rect x="-10" y="-9" width="17" height="4" rx="2" ry="2"/><rect x="4" y="-7" width="10" height="4" rx="2" ry="2"/>
<rect x="-9" y="-6" width="12" height="4" rx="2" ry="2"/><rect x="-2" y="-5" width="12" height="4" rx="2" ry="2"/>
<rect x="-10" y="-3" width="6" height="4" rx="2" ry="2"/><rect x="-1" y="-2" width="12" height="4" rx="2" ry="2"/>
<rect x="-10" y="0" width="18" height="4" rx="2" ry="2"/><rect x="-6" y="1" width="18" height="4" rx="2" ry="2"/>
<rect x="-12" y="3" width="12" height="4" rx="2" ry="2"/><rect x="0" y="5" width="12" height="4" rx="2" ry="2"/>
<rect x="-6" y="6" width="10" height="4" rx="2" ry="2"/><rect x="-10" y="8" width="12" height="4" rx="2" ry="2"/>`

const FERROUS = `<g stroke="#c3b3da44" stroke-width="0.15" fill="#340f6122">
<circle cx="-2.5" cy="2" r="1.5"/><circle cx="2" cy="-2.5" r="0.75"/><circle cx="3" cy="2" r="1"/><circle cx="-2.5" cy="-3.5" r="0.5"/>
<circle cx="-6" cy="-2" r="1"/><circle cx="6" cy="-1" r="1"/><circle cx="-2" cy="-6" r="0.75"/><circle cx="-0.5" cy="6" r="0.5"/>
<circle cx="7" cy="3" r="3"/><circle cx="10" cy="-4" r="1"/><circle cx="-5" cy="-6" r="2"/><circle cx="-5" cy="6" r="1"/></g>`

const SWAMP = `<g stroke="none" fill="#2b0c5033">
<ellipse cx="-4" cy="-3" rx="4" ry="2.5"/><ellipse cx="4" cy="2" rx="5" ry="2"/><ellipse cx="-3" cy="6" rx="3" ry="1.6"/><ellipse cx="5" cy="-6" rx="2.5" ry="1.4"/></g>`

/** Surface markup by planet class (sdk/game/planet-types.js): Terrestrial, Rocky, Oceanic, Desert, Ice, Volcanic, Gaseous, Ferrous, Lava, Swamp. */
export const PLANET_SURFACES = [
  EARTH_LIKE,
  CRATERED,
  WAVES,
  DUNES,
  THIN_ATMOSPHERE,
  `<g stroke-width="0.5" stroke="#ffffff11" fill="#00000022">${BANDS}</g>`,
  `<g stroke-width="0.5" stroke="#5c1aae22" fill="#ffffff22">${BANDS}</g>`,
  FERROUS,
  `<g stroke="none" fill="#ffffff44"><circle cx="0" cy="0" r="9"/></g>`,
  SWAMP
]
