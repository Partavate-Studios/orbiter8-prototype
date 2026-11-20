<template>
  <!-- The ID scanner, close: Minerva asks your name (the first transaction) and files it. Her face listens
       while you type (every key flashes her eyes), waits on your wallet, then thinks while it's mined. -->
  <section class="intro-scanner" role="dialog" aria-labelledby="scanner-say">
    <div class="device">
      <div class="screen">
        <minerva-face ref="face" class="face" :state="faceState" size="min(200px, 52vw)" />
        <template v-if="phase === 'name'">
          <p id="scanner-say" class="say">{{ SAY.askName }}</p>
          <form class="name-form" @submit.prevent="submit">
            <label class="label" for="intro-name">Your name</label>
            <input
              id="intro-name"
              ref="input"
              v-model="name"
              type="text"
              autocomplete="off"
              spellcheck="false"
              :maxlength="NAME_MAX_LENGTH + 10"
              :aria-invalid="problem && problem !== 'empty' ? 'true' : 'false'"
              aria-describedby="intro-name-hint"
              @keydown="$refs.face?.play('flash')"
            />
            <p
              id="intro-name-hint"
              class="hint"
              :class="{ problem: problem && problem !== 'empty' }"
              aria-live="polite"
            >
              {{ hint }}
            </p>
            <button type="submit" class="o8-button primary register" :disabled="Boolean(problem)">
              Register with Minerva
            </button>
            <p class="hint small">Your wallet signs this: your first move on chain.</p>
          </form>
        </template>
        <template v-else>
          <p id="scanner-say" class="say name">{{ registration?.name }}</p>
          <p class="sub">{{ failed ? 'Not filed.' : SAY.filing }}</p>
          <div v-if="!failed" class="card-read" aria-hidden="true"><span class="scan-line"></span></div>
          <ol class="steps" aria-label="Filing your name">
            <li class="done">Card read</li>
            <li :class="signState">Your signature</li>
            <li :class="{ done: status === 'done', now: status === 'sent' }">Filed</li>
          </ol>
          <p v-if="status === 'confirm'" class="wallet-wait" role="status">Confirm it in your wallet</p>
          <p v-else-if="status === 'sent'" class="hint" role="status">
            On its way to the chain<span v-if="slow">: the network is slow, this can take a minute</span>.
          </p>
          <template v-else-if="failed">
            <p class="problem" role="alert">{{ failureText }}</p>
            <button ref="retry" type="button" class="o8-button primary" @click="$emit('retry')">Try again</button>
          </template>
        </template>
      </div>
      <p class="device-name" aria-hidden="true">MINERVA · ID</p>
    </div>
    <button v-if="phase === 'name'" type="button" class="o8-button quiet back" @click="$emit('close')">Back</button>
  </section>
</template>

<script>
import { mapState } from 'pinia'
import { useOnboardingStore } from '@/stores/onboarding'
import MinervaFace from '@/components/minerva/minerva-face.vue'
import { SAY } from '@/libs/intro'
import { cleanName, nameProblem, NAME_MAX_LENGTH, PILOT_NAME_MIN_LENGTH } from '@/libs/onboarding'

// After this long on its way to the chain, say that waiting is normal.
const SLOW_MS = 30000

export default {
  name: 'IntroScanner',
  components: { MinervaFace },
  props: {
    /** 'name': the prompt; 'filing': the registration on its way */
    phase: { type: String, required: true },
    /** onboarding's registration of the callsign, if one is under way */
    registration: { type: Object, default: null }
  },
  emits: ['submit', 'retry', 'close'],
  data() {
    return { SAY, NAME_MAX_LENGTH, name: this.registration?.name ?? '', slow: false }
  },
  computed: {
    ...mapState(useOnboardingStore, ['callsigns']),
    status() {
      return this.registration?.status ?? 'confirm'
    },
    failed() {
      return this.status === 'failed'
    },
    faceState() {
      if (this.phase === 'name') return 'listening'
      if (this.failed) return 'annoyed'
      return this.status === 'confirm' ? 'waiting' : 'thinking'
    },
    signState() {
      if (this.status === 'confirm') return 'you'
      return this.failed && this.registration?.failure === 'rejected' ? 'you' : 'done'
    },
    problem() {
      return nameProblem(this.name, { taken: this.callsigns, minLength: PILOT_NAME_MIN_LENGTH })
    },
    hint() {
      switch (this.problem) {
        case 'too short':
          return `At least ${PILOT_NAME_MIN_LENGTH} characters.`
        case 'too long':
          return `At most ${NAME_MAX_LENGTH} characters.`
        case 'taken':
          return 'That name is on file already. Names are unique.'
        default:
          return 'Filed with Minerva. Names are unique.'
      }
    },
    failureText() {
      if (this.registration?.failure === 'rejected') return 'You declined in your wallet. Nothing was filed.'
      return 'It didn’t go through: ' + (this.registration?.reason ?? 'unknown reason') + '.'
    }
  },
  watch: {
    status: {
      immediate: true,
      handler(status) {
        clearTimeout(this.slowTimer)
        this.slow = false
        if (status === 'sent') this.slowTimer = setTimeout(() => (this.slow = true), SLOW_MS)
        if (status === 'failed') {
          this.$refs.face?.play('glitch')
          this.$nextTick(() => this.$refs.retry?.focus())
        }
      }
    }
  },
  mounted() {
    this.$nextTick(() => this.$refs.input?.focus())
  },
  beforeUnmount() {
    clearTimeout(this.slowTimer)
  },
  methods: {
    submit() {
      if (this.problem) return
      this.o8audio?.playEffect('click')
      this.$emit('submit', cleanName(this.name))
    }
  }
}
</script>

<style scoped>
.intro-scanner {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 0.8em;
  padding: 3.5em 1em 1em;
  box-sizing: border-box;
  background: #03030699;
  z-index: 6;
}
.device {
  width: min(27em, 100%);
  box-sizing: border-box;
  background: #0c0a14;
  border: 2.5px solid #6a6188;
  border-radius: 24px;
  padding: 1em 1em 0.6em;
  box-shadow: 0 0 120px #e6dcf522;
}
.screen {
  background: #07060b;
  border: 1.5px solid #3a3352;
  border-radius: 14px;
  padding: 1em 1.2em 1.3em;
  display: grid;
  gap: 0.7em;
}
.face {
  justify-self: center;
}
.say {
  margin: 0;
  font-size: 1.3em;
  line-height: 1.35;
}
.say.name {
  font-size: 1.6em;
  font-weight: 500;
}
.sub {
  margin: -0.4em 0 0;
  color: #bdb5d4;
}
.name-form {
  display: grid;
  gap: 0.5em;
}
.label {
  font-size: 0.9em;
  color: #bdb5d4;
}
input {
  font: inherit;
  font-size: 1.4em;
  color: #f1eefa;
  background: #120f1c;
  border: 2.5px solid #b9a0ff;
  border-radius: 12px;
  padding: 0.4em 0.6em;
  min-width: 0;
}
input:focus-visible {
  outline: 2px solid #e6dcf5;
  outline-offset: 2px;
}
.hint {
  margin: 0;
  font-size: 0.9em;
  color: #9088aa;
}
.hint.small {
  text-align: center;
  font-size: 0.82em;
}
.hint.problem,
.problem {
  color: #ff6fb0;
  margin: 0;
}
.register {
  font-size: 1.25em;
  padding: 0.6em 1em;
  margin-top: 0.3em;
}
.card-read {
  position: relative;
  height: 5em;
  margin: 0 3em;
  border: 2px solid #b9a0ff;
  border-radius: 12px;
  overflow: hidden;
  background: repeating-linear-gradient(#0000 0 15px, #b9a0ff22 15px 18px);
}
.scan-line {
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: #b9a0ffdd;
  animation: scan 1.6s ease-in-out infinite alternate;
}
@keyframes scan {
  from {
    transform: translateY(0.2em);
  }
  to {
    transform: translateY(4.4em);
  }
}
.steps {
  list-style: none;
  margin: 0.3em 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  font-size: 0.85em;
  color: #9088aa;
}
.steps li::before {
  content: '';
  display: block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2.5px solid currentColor;
  margin-bottom: 0.4em;
}
.steps .done {
  color: #c3b3da;
}
.steps .done::before {
  background: #c3b3da;
}
.steps .now {
  color: #b9a0ff;
}
.steps .you {
  color: #ff6fb0;
}
.steps .you::before {
  border-style: dashed;
}
.wallet-wait {
  margin: 0.2em 0 0;
  border: 2px solid #e1177c;
  border-radius: 999px;
  padding: 0.55em;
  text-align: center;
  color: #ff6fb0;
  font-weight: 500;
}
.device-name {
  margin: 0.5em 0 0;
  text-align: center;
  font-size: 0.75em;
  font-weight: 700;
  letter-spacing: 0.3em;
  color: #9088aa;
}
@media (prefers-reduced-motion: reduce) {
  .scan-line {
    animation-duration: 4s;
  }
}
</style>
