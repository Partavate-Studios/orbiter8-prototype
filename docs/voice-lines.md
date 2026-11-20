# Minerva's voice lines

The phrases to record as sound files. Today's files were made with Amazon Polly. Its license terms are
unclear, so they're being regenerated with Piper (Koda, 2026-11-20).

Most valuable first. Lines are short and fixed: anything with a name or number (a ship name, a debt)
stays on screen, not in the recording. The file name is the line, lowercased and hyphenated, as today.
The game plays `public/audio/voice/<file>.mp3`, looked up by key in `VOICE_LINES`
(`orbiter-client/src/libs/08audio.js`).

Her voice is blunt and dry: literal, direct, deadpan (`docs/backstory.md`, "Minerva"). The existing
lines are older and more "starship computer". Rewording them to fit her is the later voice pass.

## What we have (12 files)

| # | Line | File | Key | When it plays |
|---|---|---|---|---|
| 1 | Priority alert. | `priority-alert` | `failed` | A move failed (not when you declined it) |
| 2 | Fusion engines primed. Initiating interstellar jump. | `fusion-engines-primed-initiating-interstellar-jump` | `jumpStarting` | A jump starts |
| 3 | Interstellar jump complete. | `interstellar-jump-complete` | `jumpComplete` | A jump lands |
| 4 | Welcome back. | `welcome-back` | `welcomeBack` | A returning pilot enters from the title |
| 5 | Incoming transmission. | `incoming-transmission` | `transmission` | New chat messages |
| 6 | Upgrade complete. | `upgrade-complete` | `upgraded` | A shipyard upgrade or part fitted |
| 7 | Minerva console online. | `minerva-console-online` | `console` | Her console opens |
| 8 | All systems nominal. | `all-systems-nominal` | `reconnected` | The chain connection is back |
| 9 | Greetings. I am Minerva. | `greetings-i-am-minerva` | `greetings` | **Not played since the intro replaced the wizard.** Fits the intro's first terminal |
| 10 | Registration complete. | `registration-complete` | `registered` | **Not played since the intro.** Fits the name going through (the first transaction) |
| 11 | Welcome to the frontier. | `welcome-to-the-frontier` | `launched` | **Not played since the intro.** Fits waking in the ship |
| 12 | LIDAR scan complete. | `lidar-scan-complete` | none | **Never wired.** Fits a scan finishing (about 30 s after a first visit) |

## Recorded with Piper (prudence voice)

| Line | File | Key | When it plays |
|---|---|---|---|
| Welcome home… and sign in. | `intro-welcome` | `introWelcome` | The dark unit, before the ID scan |
| You're signed in… Statistically, you'll need it. | `intro-signed-in` | `introSignedIn` | The lights come on after the name goes through |

The text of each is in `orbiter-client/speech/`.

## Obvious additions (drafts)

The wording is a placeholder, in her voice. Rows 13–20 go with moves already in the game; rows 21–27 are
for the intro.

| # | Line | Suggested file | When it would play |
|---|---|---|---|
| 13 | Scanning. | `scanning` | A scan starts (pairs with 12) |
| 14 | Waiting for your signature. | `waiting-for-your-signature` | The wallet is waiting on the player |
| 15 | Done. | `done` | A move went through, where nothing more specific fits |
| 16 | Siege alert. | `siege-alert` | A siege starts on something you own |
| 17 | Not enough credits. | `not-enough-credits` | A purchase is refused for money |
| 18 | Claim registered. | `claim-registered` | A planet or asteroid claimed |
| 19 | New star charted. | `new-star-charted` | A scan finds stars nobody has seen |
| 20 | Docked. | `docked` | Arriving at a port or station |
| 21 | Scan your ID card. | `scan-your-id-card` | Intro, the dark room |
| 22 | What's your name? | `whats-your-name` | Intro, after the card reads |
| 23 | Power's on. So are the bills. | `powers-on-so-are-the-bills` | Intro, the lights come on |
| 24 | Pick a corporation. | `pick-a-corporation` | Intro, the terminal's first boot |
| 25 | Name your ship. | `name-your-ship` | Intro, after accepting the job |
| 26 | An escort will arrive shortly. | `an-escort-will-arrive-shortly` | Intro, while the second transaction goes through |
| 27 | You're awake. | `youre-awake` | Intro, waking in the ship |

## Not voice

The effects (`public/audio/effects/beep.mp3`, `click.wav`) and the three music tracks
(`public/audio/music/`) aren't on this list. Where they came from isn't recorded here; their licenses
are worth checking in the same pass.
