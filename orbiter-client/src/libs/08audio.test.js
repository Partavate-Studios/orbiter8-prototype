import { afterEach, describe, expect, it, vi } from 'vitest'
import Cookies from 'js-cookie'
import Sound, { RADIO_TRACKS } from './08audio'

describe('volume settings', () => {
  afterEach(() => {
    Cookies.remove('musicVolume')
    Cookies.remove('effectsVolume')
    Cookies.remove('voiceVolume')
  })

  it('reads a saved volume back as the step it was set to', () => {
    // Saved as fractions; 1/3 comes back from the cookie as "0.3333333333333333", and 3x that is just under 1.
    Cookies.set('musicVolume', String(1 / 3))
    Cookies.set('effectsVolume', String(2 / 3))
    const sound = new Sound()
    expect(sound.levels).toEqual({ music: 1, effects: 2, voice: 2 })
  })

  it('snaps the old 0.25 default to a step instead of showing it as off', () => {
    Cookies.set('musicVolume', '0.25')
    expect(new Sound().levels.music).toBe(1)
  })

  it('saves a level so the next visit gets the same step', () => {
    new Sound().setMusicLevel(2)
    expect(new Sound().levels.music).toBe(2)
  })
})

describe("Minerva's voice", () => {
  afterEach(() => {
    Cookies.remove('voiceVolume')
    vi.restoreAllMocks()
  })

  it('says a line once, not again within half a minute, and nothing when turned off', () => {
    const play = vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue()
    const sound = new Sound()
    sound.speak('upgraded')
    sound.speak('upgraded')
    expect(play).toHaveBeenCalledTimes(1)
    sound.setVoiceLevel(0)
    sound.speak('transmission')
    expect(play).toHaveBeenCalledTimes(1)
  })
})

describe("the apartment's radio", () => {
  afterEach(() => {
    localStorage.removeItem('o8.radio')
    Cookies.remove('musicVolume')
    vi.restoreAllMocks()
  })

  it('starts off at half volume, and keeps its own level whatever Settings says', () => {
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue()
    const sound = new Sound()
    expect(sound.radio).toMatchObject({ track: 'off', volume: 0.5 })
    sound.startRadio()
    sound.tuneRadio(RADIO_TRACKS[0].key)
    sound.setMusicLevel(0)
    expect(sound.radioElement().volume).toBe(0.5)
    expect(sound.radio.playing).toBe(true)
  })

  it('remembers the volume for the next visit, but is off again when you come back', () => {
    const sound = new Sound()
    sound.tuneRadio(RADIO_TRACKS[1].key)
    sound.setRadioVolume(0.8)
    expect(new Sound().radio).toMatchObject({ track: 'off', volume: 0.8 })
  })
})

describe('the new-star track', () => {
  afterEach(() => vi.restoreAllMocks())

  it('plays once, then hands back to the map music', () => {
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue()
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    const sound = new Sound()
    sound.playMusic('discovery')
    expect(sound.music['discovery'].loop).toBe(false)
    sound.music['discovery'].dispatchEvent(new Event('ended'))
    expect(sound.currentMusic).toBe('map')
  })
})
