import Cookies from 'js-cookie'
import { reactive } from 'vue'

/** Volume settings are steps: 0 (off) to LEVELS (full). */
export const LEVELS = 3

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
    this.levels = reactive({ music: savedLevel('musicVolume', 1), effects: savedLevel('effectsVolume', 1) })

    this.music = []

    this.music['map'] = new Audio('./audio/music/starmap/UnderwaterWorld.mp3')
    this.music['map'].loop = true

    this.music['jump'] = new Audio('./audio/music/jumping/BeyondTheSkies.mp3')
    this.music['jump'].loop = true

    this.music['title'] = new Audio('./audio/music/title/WhereNoManHasGoneBefore.mp3')
    this.music['title'].loop = true

    this.effects = []
    this.effects['click'] = new Audio('./audio/effects/beep.mp3')
  }

  get musicVolume() {
    return this.levels.music / LEVELS
  }

  get effectsVolume() {
    return this.levels.effects / LEVELS
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

  playMusic(song) {
    if (this.currentMusic != '') {
      this.music[this.currentMusic].pause()
    }

    if (this.musicVolume > 0) {
      this.music[song].currentTime = 0
      this.music[song].volume = this.musicVolume
      this.music[song].play()
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
      this.music[this.currentMusic].play()
    }
  }

  playEffect(effect) {
    if (this.effectsVolume > 0) {
      this.effects[effect].volume = this.effectsVolume
      this.effects[effect].play()
    }
  }
}
