import { afterEach, describe, expect, it, vi } from 'vitest'
import Cookies from 'js-cookie'
import Sound from './08audio'

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
