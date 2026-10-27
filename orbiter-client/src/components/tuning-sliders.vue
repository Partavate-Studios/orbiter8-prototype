<template>
  <!-- TEMPORARY (Koda, 2026-10-27): size and speed sliders for comparing with Enterprise Circuit.
       2 = the game as it is, 4 = Enterprise Circuit, 1 and 5 a half step beyond. See libs/tuning.js. -->
  <div class="tuning" @mousedown.stop @wheel.stop>
    <label v-for="slider in sliders" :key="slider.id" class="slider">
      <span class="name">{{ slider.label }}</span>
      <input
        :id="'tuning-' + slider.id"
        type="range"
        min="1"
        max="5"
        step="1"
        :value="slider.value"
        :list="'tuning-marks-' + slider.id"
        @input="slider.set(Number($event.target.value))"
      />
      <datalist :id="'tuning-marks-' + slider.id">
        <option v-for="n in 5" :key="n" :value="n"></option>
      </datalist>
      <span class="value">{{ slider.value }} · {{ MEANING[slider.value] }}</span>
    </label>
  </div>
</template>

<script>
import { tuning, setSizeStep, setSpeedStep } from '@/libs/tuning'
import { useStarMapStore } from '@/stores/starmap'

const MEANING = { 1: 'below now', 2: 'now', 3: 'halfway', 4: 'Enterprise Circuit', 5: 'beyond' }

export default {
  name: 'TuningSliders',
  data() {
    return { MEANING }
  },
  computed: {
    sliders() {
      return [
        { id: 'size', label: 'Size', value: tuning.size, set: (step) => setSizeStep(step) },
        {
          id: 'speed',
          label: 'Speed',
          value: tuning.speed,
          set: (step) => setSpeedStep(step, useStarMapStore().gameTime)
        }
      ]
    }
  }
}
</script>

<style scoped>
.tuning {
  position: fixed;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 18px;
  padding: 6px 14px;
  border-radius: 10px;
  border: 1px solid #ffffff33;
  background: #12052add;
  color: #c3b3da;
  font:
    12px 'Ubuntu',
    system-ui,
    sans-serif;
}
.slider {
  display: flex;
  align-items: center;
  gap: 8px;
}
.name {
  color: #ffffff;
}
input {
  width: 110px;
  accent-color: #c3b3da;
}
.value {
  min-width: 9.5em;
  font-variant-numeric: tabular-nums;
}
</style>
