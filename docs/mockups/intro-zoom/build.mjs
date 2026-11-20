// Six panels of one isometric world at different zooms, from the feedback on the intro alternatives
// (docs/mockups/intro-alternatives). node docs/mockups/intro-zoom/build.mjs [id-prefix]  (Node 24)

import fs from 'node:fs'
import { frame } from '../intro/art.mjs'
import { PANELS } from './panels.mjs'

const only = process.argv[2]
for (const p of PANELS) {
  if (only && !p.id.startsWith(only)) continue
  fs.writeFileSync(new URL(`${p.id}.svg`, import.meta.url), frame(1440, 900, p.draw(1440, 900), `Orbiter 8 intro, zoom: ${p.title}`))
  console.log(p.id)
}
