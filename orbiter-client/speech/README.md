# Speech

Minerva's spoken lines as text, one file per line. Koda turns each into an MP3 with Piper. The MP3 then
goes in `public/audio/voice/` under the same name (`intro-welcome.txt` becomes `intro-welcome.mp3`), and
the game plays it by key from `VOICE_LINES` in `src/libs/08audio.js`.

The text is written to be heard: numbers and times are spelled out, there are no symbols, and the
punctuation sets the pauses. Her voice is blunt and dry (`docs/backstory.md`, "Minerva").
The full list of lines, including the older recorded ones, is in `docs/voice-lines.md`.

| File | When it plays |
|---|---|
| `intro-welcome.txt` | Entering the dark unit, before the ID scan (the first sign-in) |
| `intro-signed-in.txt` | The name has gone through and the lights come on |
