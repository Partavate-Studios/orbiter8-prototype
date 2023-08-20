import Cookies from 'js-cookie'

export default class Sound {
  constructor () {
    this.currentMusic = ''
    this.musicVolume = Cookies.get('musicVolume') || 0.25
    this.effectsVolume = Cookies.get('effectsVolume') || 0.25

    this.music = []

    this.music['map'] = new Audio('./audio/music/starmap/UnderwaterWorld.mp3')
    this.music['map'].loop = true

    this.music['jump'] =  new Audio('./audio/music/jumping/BeyondTheSkies.mp3')
    this.music['jump'].loop = true

    this.music['title'] =  new Audio('./audio/music/title/WhereNoManHasGoneBefore.mp3')
    this.music['title'].loop = true

    this.effects = []
    this.effects['click'] =  new Audio('./audio/effects/beep.mp3')
  }

  getMusicVolume() {
    return this.musicVolume
  }

  getEffectsVolume() {
    return this.effectsVolume
  }

  setMusicVolume(musicVolume) {
    this.musicVolume = Math.max(0, Math.min(1, musicVolume))
    Cookies.set('musicVolume', this.musicVolume, { expires: 30 })

    if (musicVolume == 0) {
      this.silenceMusic()
    } else {
      this.resumeMusic()
    }
    console.log('music ' + this.musicVolume)
  }

  setEffectsVolume(effectsVolume) {
    this.effectsVolume = Math.max(0, Math.min(1, effectsVolume))
    Cookies.set('effectsVolume', this.effectsVolume, { expires: 30 })
  }

  playMusic(song) {

    if (this.currentMusic != '') {
      this.music[this.currentMusic].pause()
    }

    if (this.musicVolume > 0) {
      this.music[song].currentTime = 0;
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

  silenceMusic () {
    if (this.currentMusic != '') {
      this.music[this.currentMusic].pause()
    }
  }

  resumeMusic () {
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

