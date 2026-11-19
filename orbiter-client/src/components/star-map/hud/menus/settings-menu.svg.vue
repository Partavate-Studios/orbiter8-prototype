<template>
  <g>
    <menu-container>
      <text
        x="2"
        y="-398"
        font-size="2em"
        text-anchor="middle"
        font-style="normal"
        fill="#00000088"
        stroke-width="2"
        stroke="#00000044"
      >
        Settings
      </text>
      <text
        x="0"
        y="-400"
        font-size="2em"
        text-anchor="middle"
        font-style="normal"
        fill="#ffffff"
        stroke-width="1"
        stroke="#ffffff44"
      >
        Settings
      </text>

      <text
        x="0"
        y="-300"
        font-size="1.2em"
        text-anchor="middle"
        font-style="normal"
        fill="#ffffff"
        stroke-width="1"
        stroke="#ffffff44"
      >
        Graphics Intensity
      </text>
      <text
        x="-115"
        y="-265"
        font-size="1em"
        text-anchor="middle"
        font-style="normal"
        fill="#ffffff"
        stroke-width="0"
        stroke="#00000000"
      >
        Efficiency
      </text>
      <text
        x="100"
        y="-265"
        font-size="1em"
        text-anchor="middle"
        font-style="normal"
        fill="#ffffff"
        stroke-width="0"
        stroke="#00000000"
      >
        Luxury
      </text>

      <g v-for="index in 3" :key="'grapahics' + index" :transform="'translate(' + (index * 40 - 80) + ' -270)'">
        <a cursor="pointer" @click.prevent="chooseGraphicsQuality(index)">
          <menu-checkbox :checked="graphicsQuality == index" />
        </a>
      </g>

      <text
        x="0"
        y="-200"
        font-size="1.2em"
        text-anchor="middle"
        font-style="normal"
        fill="#ffffff"
        stroke-width="1"
        stroke="#ffffff44"
      >
        Audio
      </text>

      <g font-size="1em" text-anchor="middle" fill="#ffffff" font-style="normal" stroke-width="0">
        <text x="-40" y="-160"> off </text>

        <text x="20" y="-160"> low </text>

        <text x="80" y="-160"> medium </text>

        <text x="140" y="-160"> high </text>
      </g>

      <text
        x="-100"
        y="-120"
        font-size="1em"
        text-anchor="end"
        font-style="normal"
        fill="#ffffff"
        stroke-width="0"
        stroke="#00000000"
      >
        Music
      </text>
      <g v-for="index in 4" :key="'music' + index" :transform="'translate(' + (index * 60 - 100) + ' -125)'">
        <a cursor="pointer" @click.prevent="setMusicVolume(index - 1)">
          <menu-checkbox :checked="o8audio.levels.music == index - 1" />
        </a>
      </g>

      <text
        x="-100"
        y="-80"
        font-size="1em"
        text-anchor="end"
        font-style="normal"
        fill="#ffffff"
        stroke-width="0"
        stroke="#00000000"
      >
        Effects
      </text>

      <g v-for="index in 4" :key="'effects' + index" :transform="'translate(' + (index * 60 - 100) + ' -85)'">
        <a cursor="pointer" @click.prevent="setEffectsVolume(index - 1)">
          <menu-checkbox :checked="o8audio.levels.effects == index - 1" />
        </a>
      </g>

      <text
        x="-100"
        y="-40"
        font-size="1em"
        text-anchor="end"
        font-style="normal"
        fill="#ffffff"
        stroke-width="0"
        stroke="#00000000"
      >
        Voice
      </text>

      <g v-for="index in 4" :key="'voice' + index" :transform="'translate(' + (index * 60 - 100) + ' -45)'">
        <a cursor="pointer" @click.prevent="setVoiceVolume(index - 1)">
          <menu-checkbox :checked="o8audio.levels.voice == index - 1" />
        </a>
      </g>

      <g transform="translate(0 40)">
        <menu-button text="Back to Title" @buttonclick="backToTitle" />
      </g>

      <!-- Dev builds only: the cheat (dev/cheat.js pays through the deployment's admin) -->
      <g v-if="canCheat" transform="translate(0 110)">
        <menu-button :text="cheatLabel" @buttonclick="cheat" />
        <text v-if="cheatNote" x="0" y="52" font-size="0.9em" text-anchor="middle" fill="#c9b8e6">{{ cheatNote }}</text>
      </g>
    </menu-container>
  </g>
</template>

<script>
import { mapActions, mapState } from 'pinia'

import { useConfigStore } from '@/stores/config'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import { useChainStore } from '@/stores/chain'
import { game } from '@orbiter8/sdk/client'
import MenuContainer from './menu-container/_menu-container.svg'
import MenuCheckbox from './menu-checkbox.svg'
import MenuButton from './menu-button.svg'

export default {
  name: 'SettingsMenu',
  components: {
    MenuContainer,
    MenuCheckbox,
    MenuButton
  },
  data() {
    return { cheating: false, cheatNote: '' }
  },
  computed: {
    ...mapState(useConfigStore, ['graphicsQuality']),
    ...mapState(usePlayerStore, ['account']),
    ...mapState(useChainStore, ['chainId']),
    /** The cheat button: only in dev builds (the dev server answers it) and with a pilot. */
    canCheat() {
      return import.meta.env.DEV && Boolean(this.account)
    },
    cheatLabel() {
      return this.cheating ? 'Cheating…' : 'Cheat: +10,000,000¢'
    }
  },
  methods: {
    ...mapActions(useConfigStore, ['setGraphicsQuality']),
    ...mapActions(useUIStore, ['closeMenu']),
    backToTitle() {
      this.closeMenu()
      this.$router.push('/')
    },
    /** Asks the dev server to pay the pilot a pile of credits (dev/cheat.js), then reloads the pilot. */
    async cheat() {
      if (this.cheating) return
      this.o8audio.playEffect('click')
      this.cheating = true
      this.cheatNote = ''
      try {
        const res = await fetch(location.origin + '/__cheat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ address: this.account, network: Number(this.chainId) === 420420417 ? 'testnet' : 'local' })
        })
        const answer = await res.json()
        if (answer.error) throw new Error(answer.error)
        await game.refreshPlayer()
        this.cheatNote = `+${answer.amount.toLocaleString()}¢`
      } catch (error) {
        this.cheatNote = 'No cheat: ' + error.message
      } finally {
        this.cheating = false
      }
    },
    chooseGraphicsQuality(quality) {
      this.o8audio.playEffect('click')
      this.setGraphicsQuality(quality)
    },
    setMusicVolume(level) {
      this.o8audio.setMusicLevel(level)
      this.o8audio.playEffect('click')
    },
    setEffectsVolume(level) {
      this.o8audio.setEffectsLevel(level)
      this.o8audio.playEffect('click')
    },
    setVoiceVolume(level) {
      this.o8audio.setVoiceLevel(level)
      this.o8audio.playEffect('click')
    }
  }
}
</script>
