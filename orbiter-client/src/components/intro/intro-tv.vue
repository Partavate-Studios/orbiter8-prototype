<template>
  <!-- The TV, close: the corporations' ads cycle on their own (each sells its business model), with
       Minerva's public notice running under every channel. Previous, Next, Turn off. -->
  <section class="intro-tv" role="dialog" aria-label="TV">
    <div class="set" :class="{ off: turningOff }">
      <transition name="ad" mode="out-in">
        <!-- eslint-disable-next-line vue/no-v-html -- the game's own SVG art (libs/intro-art.js), not user content -->
        <div :key="index" class="picture" role="img" :aria-label="altText" v-html="adSvg"></div>
      </transition>
      <p class="ticker">{{ TICKER }}</p>
    </div>
    <div class="controls">
      <button type="button" class="o8-button" @click="step(-1)">‹ Previous</button>
      <button ref="next" type="button" class="o8-button" @click="step(1)">Next ad ›</button>
      <button type="button" class="o8-button quiet" @click="turnOff">Turn off</button>
    </div>
    <p class="count">Ad {{ index + 1 }} of 3</p>
  </section>
</template>

<script>
import { TICKER, corporation } from '@/libs/intro'
import { adArt, artDefs } from '@/libs/intro-art'

const CYCLE_MS = 8000

export default {
  name: 'IntroTv',
  props: { corpNames: { type: Array, default: () => [] } },
  emits: ['close'],
  data() {
    return { TICKER, index: 0, turningOff: false }
  },
  computed: {
    look() {
      return corporation(this.index + 1, this.corpNames)
    },
    adSvg() {
      return `<svg viewBox="0 0 468 300" preserveAspectRatio="xMinYMid slice">${artDefs('tvc-')}${adArt('tvc-', this.look.key, this.look)}</svg>`
    },
    altText() {
      return `${this.look.name} ad: ${this.look.ad.join(' ')}`
    }
  },
  mounted() {
    this.timer = setInterval(() => (this.index = (this.index + 1) % 3), CYCLE_MS)
    this.$nextTick(() => this.$refs.next?.focus())
  },
  beforeUnmount() {
    clearInterval(this.timer)
  },
  methods: {
    step(by) {
      this.o8audio?.playEffect('click')
      this.index = (this.index + by + 3) % 3
      clearInterval(this.timer)
      this.timer = setInterval(() => (this.index = (this.index + 1) % 3), CYCLE_MS)
    },
    turnOff() {
      this.turningOff = true
      setTimeout(() => this.$emit('close'), 280)
    }
  }
}
</script>

<style scoped>
.intro-tv {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 1.2em;
  padding: 4em 1em 1em;
  box-sizing: border-box;
  background: radial-gradient(ellipse at 50% 45%, #d8d4e41f, #030306f2 65%);
  z-index: 6;
}
.set {
  width: min(64em, 100%, 140vh);
  aspect-ratio: 16 / 10;
  border: 4px solid #6a6188;
  border-radius: 20px;
  background: #030306;
  padding: 12px;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: 1fr auto;
  overflow: hidden;
  transition: transform 0.28s ease-in;
}
.set.off {
  transform: scaleY(0.01);
}
.picture {
  min-height: 0;
}
.picture :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
.ticker {
  margin: 0;
  padding: 0.4em 0.8em;
  background: #000000c0;
  color: #bdb5d4;
  font:
    0.9em 'Ubuntu Mono',
    ui-monospace,
    monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1em;
}
.controls .o8-button {
  font-size: 1.15em;
  min-width: 8em;
  padding: 0.55em 1em;
}
.count {
  margin: 0;
  color: #9088aa;
  font-size: 0.9em;
}
.ad-enter-active,
.ad-leave-active {
  transition: opacity 0.35s;
}
.ad-enter-from,
.ad-leave-to {
  opacity: 0;
}
@media (max-width: 760px) {
  .set {
    aspect-ratio: 1 / 1.05;
  }
  .controls .o8-button {
    min-width: 0;
    flex: 1 1 40%;
  }
}
</style>
