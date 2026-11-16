<template>
  <!-- Minerva's panel: every onboarding step is her speaking. Her emblem, the step's title, the step
       dots, then the step itself, and a way back to the title. -->
  <section class="minerva-panel" :aria-labelledby="headingId">
    <header>
      <div class="badge" aria-hidden="true">
        <svg viewBox="-110 -70 220 130"><minerva-emblem color="#ffffffdd" /></svg>
        <span class="badge-name">MINERVA AMI</span>
        <span class="badge-role">Artificial Machine Intelligence</span>
      </div>
      <div class="heading">
        <ol v-if="steps.length" class="dots" aria-label="Steps">
          <li
            v-for="(step, index) in steps"
            :key="step.id"
            :class="{ done: index < currentIndex, current: index === currentIndex }"
            :aria-current="index === currentIndex ? 'step' : null"
          >
            <span class="dot"></span><span class="dot-label">{{ step.label }}</span>
          </li>
        </ol>
        <h2 :id="headingId" ref="heading" tabindex="-1">{{ title }}</h2>
      </div>
    </header>
    <div class="content">
      <slot />
    </div>
    <footer>
      <button type="button" class="o8-button quiet" @click="$emit('close')">Title</button>
      <slot name="actions" />
    </footer>
  </section>
</template>

<script>
import MinervaEmblem from '@/components/assets/minerva-emblem.svg'

let panels = 0

export default {
  name: 'MinervaPanel',
  components: { MinervaEmblem },
  props: {
    title: { type: String, required: true },
    /** @type {{ id: string, label: string }[]} */
    steps: { type: Array, default: () => [] },
    current: { type: String, default: '' }
  },
  emits: ['close'],
  data() {
    return { headingId: 'minerva-heading-' + ++panels }
  },
  computed: {
    currentIndex() {
      return this.steps.findIndex((step) => step.id === this.current)
    }
  },
  watch: {
    // A new step: move keyboard and screen-reader focus to its text field if it has one (the call
    // sign, the ship's name: ready to type, its label read out), else to its heading.
    title() {
      this.$nextTick(() => {
        const field = this.$el.querySelector('input:not([type="hidden"]):not([disabled]), textarea')
        ;(field ?? this.$refs.heading)?.focus()
      })
    }
  }
}
</script>

<style scoped>
.minerva-panel {
  position: relative;
  width: min(44em, 100% - 2em);
  max-height: calc(100% - 2em);
  overflow-y: auto;
  box-sizing: border-box;
  background: #280b4bf2;
  border: 1px solid #ffffff40;
  border-radius: 0.8em;
  padding: 1.4em 1.6em 1.2em;
  display: grid;
  gap: 1.2em;
  text-align: left;
  color: #ffffff;
  box-shadow: 0 1em 3em #0008;
}
header {
  display: flex;
  gap: 1.2em;
  align-items: flex-start;
}
.badge {
  flex: none;
  width: 8.5em;
  background: #310e5b;
  border: 1px solid #ffffff40;
  border-radius: 0.6em;
  padding: 0.5em 0.4em 0.45em;
  display: grid;
  justify-items: center;
}
.badge svg {
  width: 100%;
  height: 3.6em;
}
.badge-name {
  font-family: 'Ubuntu Mono', ui-monospace, monospace;
  font-size: 1.05em;
  letter-spacing: 0.08em;
  color: #c3b3da;
}
.badge-role {
  font-size: 0.55em;
  color: #c3b3da99;
  text-align: center;
}
.heading {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.6em;
}
h2 {
  margin: 0;
  font-weight: 400;
  font-size: 1.9em;
  color: #e6dcf5;
  text-wrap: balance;
}
h2:focus {
  outline: none;
}
.dots {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3em 0.9em;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.75em;
  color: #c3b3da88;
}
.dots li {
  display: flex;
  align-items: center;
  gap: 0.4em;
}
.dot {
  width: 0.6em;
  height: 0.6em;
  border-radius: 50%;
  border: 1px solid currentColor;
}
.dots li.done {
  color: #c3b3da;
}
.dots li.done .dot {
  background: currentColor;
}
.dots li.current {
  color: #ffffff;
}
.dots li.current .dot {
  background: #ffffff;
  box-shadow: 0 0 0.5em #ffffffaa;
}
.content {
  display: grid;
  gap: 1em;
  line-height: 1.5;
}
footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6em;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #ffffff20;
  padding-top: 1em;
}
@media (max-width: 600px) {
  .minerva-panel {
    padding: 1em;
  }
  .badge {
    width: 5.5em;
  }
  .badge-role {
    display: none;
  }
  h2 {
    font-size: 1.4em;
  }
}
</style>
