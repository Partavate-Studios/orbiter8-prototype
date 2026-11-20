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
  console: 'minerva-console-online',
  // the intro (speech/ has the text each was made from)
  introWelcome: 'intro-welcome',
  introSignedIn: 'intro-signed-in'
}
/**
 * The apartment's radio (the intro; Minerva's console, Music): three tracks Koda supplied
 * (docs/briefs/music.md). It's a channel of its own beside the game's music, at its own volume: the
 * Settings music level doesn't touch it. The tracks play in turn, like a station.
 */
export const RADIO_TRACKS = [
  {
    key: 'murmurings',
    title: 'Sweaty Electronic Murmurings',
    composer: 'Schmidt',
    file: 'SweatyElectronicMurmurings.mp3'
  },
  { key: 'funkytunz', title: 'Funkytunz', composer: 'Guerrier', file: 'Funkytunz.mp3' },
  { key: 'carrier', title: 'Carrier of Life', composer: 'Bennie', file: 'CarrierOfLife.mp3' }
]
/** Where the radio's volume is kept between visits (it's always off when you enter: Koda, 2026-11-20). */
const RADIO_KEY = 'o8.radio'
/** Music that plays once, then hands back to another (the new-star track, then the map's). */
const THEN = { discovery: 'map' }

function loadRadio() {
  try {
    const saved = JSON.parse(globalThis.localStorage?.getItem(RADIO_KEY) ?? 'null')
    const volume = Number.isFinite(saved?.volume) ? Math.max(0, Math.min(1, saved.volume)) : 0.5
    return { track: 'off', volume }
  } catch {
    return { track: 'off', volume: 0.5 }
  }
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

    // Reflections in the Wind, for a first visit to a star while its scan is pending (playgame.vue):
    // played once, then the map's music comes back
    this.music['discovery'] = new Audio('./audio/music/discovery/ReflectionsInTheWind.mp3')
    this.music['discovery'].preload = 'none'
    for (const [song, next] of Object.entries(THEN))
      this.music[song].addEventListener('ended', () => {
        if (this.currentMusic === song) this.playMusic(next)
      })

    // The radio: which track (or 'off'), its volume, and whether it's on now (it plays only in the
    // apartment, with the power on). Reactive, for the console's Music page.
    this.radio = reactive({ ...loadRadio(), playing: false, muffled: false })
    this.radioAudio = {}

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
    if (this.radioBlocked && this.radio.playing)
      this.radioElement()
        ?.play()
        ?.catch?.(() => {})
  }

  // ---- the apartment's radio: its own channel and volume

  /** The playing track's element (made on first use: the tracks are large), or null when off. */
  radioElement(key = this.radio.track) {
    const track = RADIO_TRACKS.find((t) => t.key === key)
    if (!track) return null
    if (!this.radioAudio[key]) {
      const audio = new Audio(`./audio/music/apartment/${track.file}`)
      // the tracks play in turn
      audio.addEventListener('ended', () => {
        if (this.radio.track !== key || !this.radio.playing) return
        const next = RADIO_TRACKS[(RADIO_TRACKS.indexOf(track) + 1) % RADIO_TRACKS.length]
        this.radio.track = next.key
        this.saveRadio()
        this.startRadioTrack()
      })
      this.radioAudio[key] = audio
    }
    return this.radioAudio[key]
  }
  saveRadio() {
    try {
      globalThis.localStorage?.setItem(RADIO_KEY, JSON.stringify({ volume: this.radio.volume }))
    } catch {
      // private windows may refuse storage: the level lasts this visit
    }
  }
  radioLevel() {
    return this.radio.volume * (this.radio.muffled ? 0.45 : 1)
  }
  startRadioTrack() {
    clearInterval(this.radioFade)
    for (const [key, audio] of Object.entries(this.radioAudio)) if (key !== this.radio.track) audio.pause()
    const audio = this.radioElement()
    if (!audio) return
    audio.volume = this.radioLevel()
    this.radioBlocked = false
    audio.play()?.catch?.((error) => {
      if (error.name === 'NotAllowedError') this.radioBlocked = true
    })
  }
  /** You're in the apartment with the power on: the radio can play (it starts off; the console tunes it). */
  startRadio() {
    this.radio.playing = true
    this.radio.muffled = false
    this.startRadioTrack()
  }
  /** Tunes to a track from its start, or 'off'. */
  tuneRadio(key) {
    if (key !== 'off' && !RADIO_TRACKS.some((t) => t.key === key)) return
    const element = this.radioElement(key)
    if (element) element.currentTime = 0
    this.radio.track = key
    this.saveRadio()
    if (key === 'off') Object.values(this.radioAudio).forEach((audio) => audio.pause())
    else if (this.radio.playing) this.startRadioTrack()
  }
  /** @param {number} volume  0 to 1; remembered */
  setRadioVolume(volume) {
    this.radio.volume = Math.max(0, Math.min(1, Math.round(volume * 100) / 100))
    this.saveRadio()
    const audio = this.radioElement()
    if (audio) audio.volume = this.radioLevel()
  }
  /** Quieter, as through the glass (the balcony). */
  muffleRadio(muffled) {
    this.radio.muffled = muffled
    const audio = this.radioElement()
    if (audio) audio.volume = this.radioLevel()
  }
  /** Leaving the apartment: the radio stops, faded over `ms`. The choice is kept. */
  stopRadio(ms = 0) {
    this.radio.playing = false
    clearInterval(this.radioFade)
    const audio = this.radioElement()
    const all = Object.values(this.radioAudio)
    if (!audio || ms <= 0) return all.forEach((a) => a.pause())
    const from = audio.volume
    const start = Date.now()
    this.radioFade = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / ms)
      audio.volume = from * (1 - t)
      if (t === 1) {
        clearInterval(this.radioFade)
        all.forEach((a) => a.pause())
      }
    }, 50)
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
