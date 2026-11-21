<template>
  <!-- A notice from Minerva while her console is closed: her face, small (as in a HUD corner), and a line.
       Pink when it needs you (the vape's toll). -->
  <aside class="intro-notice" :class="{ attention }" role="status">
    <minerva-face ref="face" class="face" :state="state" :size="84" pokeable />
    <div class="words">
      <p class="title">{{ title }}</p>
      <p class="body">{{ body }}</p>
    </div>
    <button type="button" class="o8-pill small close" aria-label="Dismiss" @click="$emit('close')">✕</button>
  </aside>
</template>

<script>
import MinervaFace from '@/components/minerva/minerva-face.vue'

export default {
  name: 'IntroNotice',
  components: { MinervaFace },
  props: {
    title: { type: String, required: true },
    body: { type: String, default: '' },
    state: { type: String, default: 'talking' },
    oneOff: { type: String, default: null },
    attention: { type: Boolean, default: false }
  },
  emits: ['close'],
  mounted() {
    if (this.oneOff) this.oneOffTimer = setTimeout(() => this.$refs.face?.play(this.oneOff), 250)
  },
  beforeUnmount() {
    clearTimeout(this.oneOffTimer)
  }
}
</script>

<style scoped>
.intro-notice {
  position: absolute;
  top: 3.6em;
  left: 1.5em;
  width: min(34em, 100% - 3em);
  box-sizing: border-box;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.9em;
  align-items: center;
  padding: 0.7em 0.8em 0.7em 0.9em;
  background: #0b0912f2;
  border: 1.2px solid #3f3566;
  border-radius: 12px;
  z-index: 7;
}
.intro-notice.attention {
  border: 2px solid #e1177c;
}
.title {
  margin: 0;
  font-weight: 700;
}
.attention .title {
  color: #ff6fb0;
}
.body {
  margin: 0.2em 0 0;
  color: #bdb5d4;
  line-height: 1.35;
}
.close {
  align-self: start;
}
@media (max-width: 760px) {
  .intro-notice {
    left: 0.6em;
    width: calc(100% - 1.2em);
  }
}
</style>
