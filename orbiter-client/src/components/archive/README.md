# Archived components

Retired from the game on 2026-11-19, when the intro (`components/intro/`) replaced the title's sign-up
wizard and its Story scene. Kept for their art, to reuse later; nothing imports them, so they're not in the
build. They still compile against the current code (their imports are `@/` aliases or each other).

| File                           | What it was                                                                                                                                     | Maybe later                                                                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `wizard-register.vue`          | The wizard's call-sign and ship steps: Minerva's welcome, the name form, the registration's progress                                            | The progress wording and slow-network hint are reused in the intro                                                                         |
| `pilot-card.vue`               | The pilot license, "Minerva Galactic Network, Pilot Registry", filled in as you typed a call sign                                               | A pilot's profile, or the license in Minerva's records                                                                                     |
| `launch-pad.vue`               | The new Orbiter 8 on its pad, engines warming while the ship registered                                                                         | A shipyard or a new ship joining a fleet                                                                                                   |
| `story-scene.vue` and `story/` | The title's Story: eight animated panels (Sol, Mars, Jupiter, the port, Minerva, the Orbiters, the jump, the land rush) told over the backstory | **Minerva's library:** when you look up history there, these panels can illustrate it (to do in `docs/demo4-plan.md`, "Minerva's library") |

The art the panels borrow stays where it is: `components/assets/fleet-ship.svg.vue` (the title scene uses
it too) and `components/assets/story-planet.svg.vue` (now used only by these panels).
