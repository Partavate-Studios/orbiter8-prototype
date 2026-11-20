// Builds the intro mockup's screens: node docs/mockups/intro/build.mjs
// Each moment is drawn twice, desktop (1440 × 900) and phone (390 × 844), from the shared art in art.mjs,
// into this folder as <nn>-<name>-desktop.svg and -phone.svg. README.md explains them.

import fs from 'node:fs'
import { SCREENS } from './screens.mjs'
import { frame } from './art.mjs'

const dir = new URL('./', import.meta.url)
const SIZES = { desktop: [1440, 900], phone: [390, 844] }
const only = process.argv[2]
for (const screen of SCREENS) {
  if (only && !screen.id.startsWith(only)) continue
  for (const [size, [W, H]] of Object.entries(SIZES)) {
    const body = screen[size](W, H)
    fs.writeFileSync(
      new URL(`${screen.id}-${size}.svg`, dir),
      frame(W, H, body, `Orbiter 8 intro mockup: ${screen.title} (${size})`)
    )
  }
  console.log(screen.id)
}
