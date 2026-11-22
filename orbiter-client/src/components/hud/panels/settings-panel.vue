<template>
  <!-- Settings: how much the graphics draw, how big the HUD is, how loud the music, effects and
       Minerva's voice are; and the way back to the title. Each setting is a row of steps, the current
       one lit (a choice, so squares). In dev builds, the cheat. -->
  <div class="k-panel settings-panel" :class="{ narrow }">
    <header class="k-head">
      <span class="k-title"><small-icon name="settings" /><span><b>Settings</b><small>Kept in this browser</small></span></span>
    </header>

    <section v-for="setting in settings" :key="setting.key">
      <h3><span>{{ setting.title }}</span><span class="k-meter">{{ setting.now }}</span></h3>
      <div class="k-tabs steps" role="radiogroup" :aria-label="setting.title">
        <button v-for="step in setting.steps" :key="step.value" type="button" role="radio" class="k-tab" :class="{ on: step.value === setting.value }" :aria-checked="step.value === setting.value ? 'true' : 'false'" @click="setting.set(step.value)">
          {{ step.label }}
        </button>
      </div>
    </section>

    <section class="foot">
      <button type="button" class="k-quiet" @click="backToTitle"><small-icon name="back" />Back to title</button>
      <!-- Dev builds only: the cheat (dev/cheat.js pays through the deployment's admin) -->
      <button v-if="canCheat" type="button" class="k-quiet" :disabled="cheating" @click="cheat">{{ cheating ? 'Cheating…' : 'Cheat: +10,000,000¢' }}</button>
      <small v-if="cheatNote">{{ cheatNote }}</small>
    </section>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { game } from '@orbiter8/sdk/client'
import { useConfigStore, UI_SCALES } from '@/stores/config'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import { useChainStore } from '@/stores/chain'
import SmallIcon from '../small-icon.vue'

const GRAPHICS = ['Efficient', 'Normal', 'Luxurious']
const LOUD = ['Off', 'Low', 'Medium', 'Full']

export default {
  name: 'SettingsPanel',
  components: { SmallIcon },
  props: {
    objectId: { type: String, default: null },
    narrow: { type: Boolean, default: false }
  },
  data() {
    return { cheating: false, cheatNote: '' }
  },
  computed: {
    ...mapState(useConfigStore, ['graphicsQuality', 'uiScale']),
    ...mapState(usePlayerStore, ['account']),
    ...mapState(useChainStore, ['chainId']),
    /** The cheat button: only in dev builds (the dev server answers it) and with a pilot. */
    canCheat() {
      return import.meta.env.DEV && Boolean(this.account)
    },
    settings() {
      const config = useConfigStore()
      const audio = this.o8audio
      const click = () => audio.playEffect('click')
      const volume = (key, title, set) => ({
        key,
        title,
        value: audio.levels[key],
        now: LOUD[audio.levels[key]],
        steps: LOUD.map((label, value) => ({ value, label })),
        set: (value) => {
          set(value)
          click()
        }
      })
      return [
        {
          key: 'graphics',
          title: 'Graphics',
          value: this.graphicsQuality,
          now: GRAPHICS[this.graphicsQuality - 1],
          steps: GRAPHICS.map((label, i) => ({ value: i + 1, label })),
          set: (value) => {
            click()
            config.setGraphicsQuality(value)
          }
        },
        {
          key: 'size',
          title: 'Interface size',
          value: this.uiScale,
          now: Math.round(this.uiScale * 100) + '%',
          steps: UI_SCALES.map((value) => ({ value, label: Math.round(value * 100) + '%' })),
          set: (value) => {
            click()
            config.setUiScale(value)
          }
        },
        volume('music', 'Music', (v) => audio.setMusicLevel(v)),
        volume('effects', 'Effects', (v) => audio.setEffectsLevel(v)),
        volume('voice', 'Minerva\'s voice', (v) => audio.setVoiceLevel(v))
      ]
    }
  },
  methods: {
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
    }
  }
}
</script>

<style src="../kit.css"></style>
<style scoped>
.steps {
  flex-wrap: wrap;
}
.steps .k-tab {
  flex: 1;
  min-width: 64px;
}
.foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}
</style>
