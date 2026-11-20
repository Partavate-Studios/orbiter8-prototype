// Six alternative takes on the intro's "lights on" moment (docs/mockups/intro/02c-lights-on).
// node docs/mockups/intro-alternatives/build.mjs [id-prefix]   (Node 24). README.md explains them.
// The parts (Minerva's face, the city, the ads, the hand, the chrome) come from ../intro/art.mjs, so each
// alternative differs in its approach, not its drawing.

import fs from 'node:fs'
import { frame } from '../intro/art.mjs'

const dir = new URL('./', import.meta.url)
const ids = ['a-diorama', 'b-tower', 'c-first-person', 'd-floor-plan', 'e-comic', 'f-menu-first']
const only = process.argv[2]
for (const id of ids) {
  if (only && !id.startsWith(only)) continue
  const file = new URL(`./scene-${id}.mjs`, dir)
  if (!fs.existsSync(file)) continue
  const { title, draw } = await import(file)
  fs.writeFileSync(new URL(`${id}.svg`, dir), frame(1440, 900, draw(1440, 900), `Orbiter 8 intro, alternative: ${title}`))
  console.log(id)
}
