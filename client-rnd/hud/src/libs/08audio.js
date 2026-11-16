import Cookies from 'js-cookie'
import { reactive } from 'vue'

/** Volume settings are steps: 0 (off) to LEVELS (full). */
export const LEVELS = 3

/**
 * Minerva's voice lines (public/audio/voice), by what they announce. Loaded on first use.
 * Some lines in the original set wait for features that don't exist yet: red alert (attacks),
 * black holes, pulsars, wormholes and portals.
 */
export const VOICE_LINES = {
  greetings: 'greetings-i-am-minerva',
  registered: 'registration-complete',
  launched: 'welcome-to-the-frontier',
  welcomeBack: 'welcome-back',
  jumpStarting: 'fusion-engines-primed-initiating-interstellar-jump',
  jumpComplete: 'interstellar-jump-complete',
  transmission: 'incoming-transmission',
  upgraded: 'upgrade-complete',
  failed: 'priority-alert',
  reconnected: 'all-systems-nominal',
  console: 'minerva-console-online'
}
/** A line isn't repeated sooner than this (ms), so a burst of chat or failures speaks once. */
const VOICE_REPEAT_MS = 30000

/** A saved volume (a fraction, as a string from the cookie) as the nearest step; `fallback` if unset. */
function savedLevel(cookie, fallback) {
  const volume = Number(Cookies.get(cookie))
  if (Cookies.get(cookie) === undefined || !Number.isFinite(volume)) return fallback
  return Math.max(0, Math.min(LEVELS, Math.round(volume * LEVELS)))
}

export default class Sound {
  constructor() {
    this.currentMusic = ''
    // Reactive, so settings controls redraw when a level changes.
    this.levels = reactive({
      music: savedLevel('musicVolume', 1),
      effects: savedLevel('effectsVolume', 1),
      voice: savedLevel('voiceVolume', 2)
    })

    this.music = []

    this.music['map'] = new Audio('./audio/music/starmap/UnderwaterWorld.mp3')
    this.music['map'].loop = true

    this.music['jump'] = new Audio('./audio/music/jumping/BeyondTheSkies.mp3')
    this.music['jump'].loop = true

    this.music['title'] = new Audio('./audio/music/title/WhereNoManHasGoneBefore.mp3')
    this.music['title'].loop = true

    this.effects = []
    this.effects['click'] = new Audio('./audio/effects/beep.mp3')

    this.voices = {}
    this.voiceSpoken = {}
    this.speaking = null
  }

  get musicVolume() {
    return this.levels.music / LEVELS
  }

  get effectsVolume() {
    return this.levels.effects / LEVELS
  }

  get voiceVolume() {
    return this.levels.voice / LEVELS
  }

  /** @param {number} level  0 (off) to LEVELS */
  setMusicLevel(level) {
    this.levels.music = Math.max(0, Math.min(LEVELS, Math.round(level)))
    Cookies.set('musicVolume', this.musicVolume, { expires: 30 })

    if (this.levels.music == 0) {
      this.silenceMusic()
    } else {
      this.resumeMusic()
    }
  }

  /** @param {number} level  0 (off) to LEVELS */
  setEffectsLevel(level) {
    this.levels.effects = Math.max(0, Math.min(LEVELS, Math.round(level)))
    Cookies.set('effectsVolume', this.effectsVolume, { expires: 30 })
  }

  /** @param {number} level  0 (off) to LEVELS */
  setVoiceLevel(level) {
    this.levels.voice = Math.max(0, Math.min(LEVELS, Math.round(level)))
    Cookies.set('voiceVolume', this.voiceVolume, { expires: 30 })
    if (this.levels.voice == 0) this.speaking?.pause()
  }

  /**
   * Minerva says one of VOICE_LINES. A new line cuts off the one she's saying; the same line isn't
   * repeated within VOICE_REPEAT_MS. Lines the browser blocks (before the first click) are skipped.
   * @param {keyof typeof VOICE_LINES} line
   */
  speak(line) {
    if (this.voiceVolume === 0 || !VOICE_LINES[line]) return
    const now = Date.now()
    if (now - (this.voiceSpoken[line] ?? -Infinity) < VOICE_REPEAT_MS) return
    this.voiceSpoken[line] = now
    this.voices[line] ??= new Audio(`./audio/voice/${VOICE_LINES[line]}.mp3`)
    const voice = this.voices[line]
    if (this.speaking && this.speaking !== voice) this.speaking.pause()
    this.speaking = voice
    voice.currentTime = 0
    voice.volume = this.voiceVolume
    voice.play()?.catch?.(() => {})
  }

  playMusic(song) {
    if (this.currentMusic != '') {
      this.music[this.currentMusic].pause()
    }

    if (this.musicVolume > 0) {
      this.music[song].currentTime = 0
      this.music[song].volume = this.musicVolume
      this.startPlaying(this.music[song])
    }

    this.currentMusic = song
  }

  stopMusic() {
    if (this.currentMusic != '') {
      this.music[this.currentMusic].pause()
      this.music[this.currentMusic].currentTime = 0
      this.currentMusic = ''
    }
  }

  silenceMusic() {
    if (this.currentMusic != '') {
      this.music[this.currentMusic].pause()
    }
  }

  resumeMusic() {
    if (this.currentMusic != '') {
      this.music[this.currentMusic].volume = this.musicVolume
      this.startPlaying(this.music[this.currentMusic])
    }
  }

  /** Plays, noting when the browser blocks it: audio may only start after the player's first click or key. */
  startPlaying(audio) {
    this.blocked = false
    audio.play()?.catch?.((error) => {
      if (error.name === 'NotAllowedError') this.blocked = true
    })
  }

  /** Call from a click or key press: starts music the browser blocked earlier. */
  unlock() {
    if (this.blocked && this.musicVolume > 0) this.resumeMusic()
  }

  playEffect(effect) {
    if (this.effectsVolume > 0) {
      this.effects[effect].volume = this.effectsVolume
      this.effects[effect].play()
    }
  }

  /**
   * A long-range scan charted new stars: a soft rising chime, made on the spot (Web Audio), like a
   * radio telescope's tone settling. (Minerva's "LIDAR scan complete" didn't fit: nobody finds
   * stars with lidar.)
   */
  playChime() {
    if (this.effectsVolume === 0 || typeof AudioContext === 'undefined') return
    try {
      this.chimeContext ??= new AudioContext()
      const ctx = this.chimeContext
      const now = ctx.currentTime
      const out = ctx.createGain()
      out.gain.value = 0.18 * this.effectsVolume
      out.connect(ctx.destination)
      // two notes a fifth apart, each gliding up a little and fading
      for (const [start, from, to] of [
        [0, 523.25, 587.33],
        [0.18, 783.99, 880]
      ]) {
        const tone = ctx.createOscillator()
        const level = ctx.createGain()
        tone.type = 'sine'
        tone.frequency.setValueAtTime(from, now + start)
        tone.frequency.exponentialRampToValueAtTime(to, now + start + 0.5)
        level.gain.setValueAtTime(0.0001, now + start)
        level.gain.exponentialRampToValueAtTime(1, now + start + 0.04)
        level.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.9)
        tone.connect(level).connect(out)
        tone.start(now + start)
        tone.stop(now + start + 1)
      }
    } catch {
      // no audio here: fine
    }
  }
}

/** The game's one sound player: components reach it as `this.o8audio`, stores import it. */
let shared = null
export function gameAudio() {
  return (shared ??= new Sound())
}
