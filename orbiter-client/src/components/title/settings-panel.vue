<template>
  <!-- The title's Settings panel: music, sound effects and graphics. -->
  <section class="side-panel" aria-labelledby="settings-panel-title">
    <h2 id="settings-panel-title">Settings</h2>

    <fieldset v-for="setting in volumeSettings" :key="setting.id">
      <legend>{{ setting.label }}</legend>
      <div class="steps">
        <label v-for="level in LEVELS + 1" :key="level">
          <input
            type="radio"
            :name="setting.id"
            :value="level - 1"
            :checked="o8audio.levels[setting.id] === level - 1"
            @change="setting.set(level - 1)"
          />
          <span>{{ level === 1 ? 'Off' : level - 1 }}</span>
        </label>
      </div>
    </fieldset>

    <fieldset>
      <legend>Graphics</legend>
      <div class="steps">
        <label v-for="quality in qualities" :key="quality.level">
          <input
            type="radio"
            name="graphics"
            :value="quality.level"
            :checked="graphicsQuality === quality.level"
            @change="chooseQuality(quality.level)"
          />
          <span>{{ quality.label }}</span>
        </label>
      </div>
    </fieldset>

    <fieldset>
      <legend>Interface size (in the game)</legend>
      <div class="steps">
        <label v-for="scale in UI_SCALES" :key="scale">
          <input
            type="radio"
            name="ui-scale"
            :value="scale"
            :checked="uiScale === scale"
            @change="chooseUiScale(scale)"
          />
          <span>{{ Math.round(scale * 100) }}%</span>
        </label>
      </div>
    </fieldset>

    <p class="footer"><button type="button" class="o8-button quiet" @click="$emit('close')">Close</button></p>
  </section>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useConfigStore, UI_SCALES } from '@/stores/config'
import { LEVELS } from '@/libs/08audio'

export default {
  name: 'SettingsPanel',
  emits: ['close'],
  data() {
    return {
      LEVELS,
      UI_SCALES,
      qualities: [
        { level: 1, label: 'Efficient' },
        { level: 2, label: 'Moderate' },
        { level: 3, label: 'Luxurious' }
      ]
    }
  },
  computed: {
    ...mapState(useConfigStore, ['graphicsQuality', 'uiScale']),
    volumeSettings() {
      return [
        { id: 'music', label: 'Music', set: (level) => this.setLevel('music', level) },
        { id: 'effects', label: 'Sound effects', set: (level) => this.setLevel('effects', level) }
      ]
    }
  },
  methods: {
    ...mapActions(useConfigStore, ['setGraphicsQuality', 'setUiScale']),
    chooseUiScale(scale) {
      this.setUiScale(scale)
      this.o8audio.playEffect('click')
    },
    setLevel(which, level) {
      if (which === 'music') this.o8audio.setMusicLevel(level)
      else this.o8audio.setEffectsLevel(level)
      this.o8audio.playEffect('click')
    },
    chooseQuality(level) {
      this.setGraphicsQuality(level)
      this.o8audio.playEffect('click')
    }
  }
}
</script>

<style scoped>
fieldset {
  border: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4em;
}
legend {
  color: #c3b3da;
  padding: 0;
  margin-bottom: 0.3em;
}
.steps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4em;
}
label {
  position: relative;
}
input {
  position: absolute;
  opacity: 0;
  inset: 0;
  margin: 0;
  cursor: pointer;
}
span {
  display: inline-block;
  min-width: 2.2em;
  text-align: center;
  padding: 0.3em 0.8em;
  border-radius: 999px;
  border: 1px solid #ffffff40;
  background: #ffffff10;
}
input:checked + span {
  background: #c3b3da;
  color: #1c0838;
  border-color: #c3b3da;
}
input:focus-visible + span {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}
</style>
