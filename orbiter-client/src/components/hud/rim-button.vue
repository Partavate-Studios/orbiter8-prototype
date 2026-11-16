<template>
  <!-- One of the HUD's round buttons (the game's own icons and tints, libs/palette.js HUD_TINT), as a
       real button: a word under it, a count badge, a pink ring when it needs the player. -->
  <button
    type="button"
    class="rim-button"
    :class="{ on, small }"
    :title="title || label"
    :aria-label="label"
    :aria-pressed="on ? 'true' : undefined"
    @click="press"
  >
    <span class="disc">
      <svg viewBox="-32 -32 64 64" aria-hidden="true">
        <circle v-if="alert" r="30.5" fill="none" :stroke="PINK_LIGHT" stroke-width="2.5" />
        <tinted :tint="tint" :rest="on ? null : rest"><slot /></tinted>
      </svg>
      <span v-if="badge" class="badge">{{ badge }}</span>
    </span>
    <span v-if="label && !bare" class="label">{{ label }}</span>
  </button>
</template>

<script>
import Tinted from '@/components/star-map/hud/icons/tinted.svg.vue'
import { PINK_LIGHT } from '@/libs/palette'

export default {
  name: 'RimButton',
  components: { Tinted },
  props: {
    label: { type: String, default: '' },
    /** The tooltip, when it says more than the label (a key). */
    title: { type: String, default: '' },
    tint: { type: String, default: '#c3b3da' },
    rest: { type: String, default: null },
    badge: { type: [Number, String], default: 0 },
    /** Its menu is open. */
    on: { type: Boolean, default: false },
    /** Needs the player: a pink ring (a running siege). */
    alert: { type: Boolean, default: false },
    /** No word under it. */
    bare: { type: Boolean, default: false },
    small: { type: Boolean, default: false }
  },
  emits: ['press'],
  data() {
    return { PINK_LIGHT }
  },
  methods: {
    press() {
      this.o8audio.playEffect('click')
      this.$emit('press')
    }
  }
}
</script>

<style scoped>
.rim-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 52px;
  padding: 0;
  border: 0;
  background: none;
  color: #c3b3da;
  font: inherit;
  font-size: 11px;
  line-height: 1.2;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.disc {
  position: relative;
  display: block;
  width: 46px;
  height: 46px;
}
.small .disc {
  width: 38px;
  height: 38px;
}
.small {
  min-width: 40px;
}
svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.rim-button:hover .label,
.rim-button.on .label {
  color: #ffffff;
}
.rim-button.on .disc {
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--o8-brand-300);
}
.rim-button:focus-visible {
  outline: none;
}
.rim-button:focus-visible .disc {
  border-radius: 50%;
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 3px;
}
.label {
  white-space: nowrap;
  text-shadow: 0 1px 2px #000a;
}
.badge {
  position: absolute;
  right: -5px;
  top: -4px;
  min-width: 17px;
  height: 17px;
  box-sizing: border-box;
  padding: 0 4px;
  border: 1px solid #ffffff88;
  border-radius: 9px;
  background: #230b41;
  color: #ffffffdd;
  font-size: 10px;
  line-height: 15px;
  text-align: center;
}
</style>
