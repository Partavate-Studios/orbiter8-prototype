<template>
  <!-- Registering a callsign or a ship: Minerva's introduction (callsign only), the form, then the
       registration's progress: confirm in the wallet, transmitting, success or failure. -->
  <div class="wizard-register">
    <template v-if="registration">
      <launch-pad v-if="kind === 'ship'" :warming-up="registration.status === 'sent'" />
      <pilot-card v-else :pilot-name="registration.name" />

      <template v-if="registration.status === 'confirm'">
        <p>Confirm the registration in your wallet.</p>
        <p class="hint">Don't see it? Click your wallet's icon in your browser's toolbar.</p>
      </template>

      <template v-else-if="registration.status === 'sent'">
        <p v-if="kind === 'callsign'">Transmitting your registration to the Minerva galactic database…</p>
        <p v-else>
          Warming up <b>{{ registration.name }}</b
          >'s engines! Once the transaction completes we are clear for launch.
        </p>
        <p class="hint">
          <a v-if="transactionLink" :href="transactionLink" target="_blank" rel="noopener">View the transaction ↗</a>
          <span v-if="slow"> Still waiting on the network; when it's busy this can take a minute or two.</span>
        </p>
      </template>

      <template v-else-if="registration.status === 'done'">
        <template v-if="kind === 'callsign'">
          <p>
            <b>Success!</b> Welcome aboard, <b>{{ registration.name }}</b
            >. It's time to find you a ship.
          </p>
        </template>
        <template v-else>
          <p>
            <b>Success!</b> You're ready to take command of <b>{{ registration.name }}</b
            >.
          </p>
          <p class="motto">Liberta Galactica!</p>
        </template>
      </template>

      <template v-else-if="registration.status === 'failed'">
        <p class="problem" role="alert">{{ failureMessage }}</p>
      </template>
    </template>

    <template v-else-if="kind === 'callsign' && !introDone">
      <p><b>Greetings Pilot</b></p>
      <p>You have been recruited by the Cascadian Cyber Corp to command a new Orbiter 8 space craft.</p>
      <p>
        Your ongoing mission will be to explore the galactic frontier, liberate resources for the greater good, and
        profit.
      </p>
      <p>
        All new pilots must create a profile in the Minerva galactic database. Once registered, you will be granted
        flight clearance for the entire galaxy. Are you ready to register your call sign?
      </p>
    </template>

    <form v-else class="name-form" @submit.prevent="submit">
      <pilot-card v-if="kind === 'callsign'" :pilot-name="cleaned" />
      <template v-else>
        <launch-pad />
        <p>
          The time has come to conquer the stars. <b>{{ pilotName }}</b
          >, this is your new starship.
        </p>
      </template>
      <!-- The corporation you join (Koda, 2026-11-19); the intro's housing computer will ask this later -->
      <fieldset v-if="kind === 'ship' && corporationNames.length" class="corporations">
        <legend>You'll fly for</legend>
        <label v-for="(corp, i) in corporationNames" :key="corp" class="corporation">
          <input v-model="corporation" type="radio" name="corporation" :value="i + 1" />
          {{ corp }}
        </label>
      </fieldset>
      <label :for="inputId">{{
        kind === 'callsign' ? 'Your call sign' : 'What will you name your new Orbiter 8?'
      }}</label>
      <input
        :id="inputId"
        ref="input"
        v-model="name"
        name="name"
        type="text"
        autocomplete="off"
        spellcheck="false"
        :maxlength="NAME_MAX_LENGTH + 10"
        :aria-invalid="problem && problem !== 'empty' ? 'true' : 'false'"
        :aria-describedby="inputId + '-hint'"
      />
      <p :id="inputId + '-hint'" class="hint" :class="{ problem: problem && problem !== 'empty' }" aria-live="polite">
        {{ hint }}
      </p>
      <p v-if="lowBalance" class="hint">
        Your balance is low ({{ balanceText }}); the registration may not have enough for gas.
      </p>
    </form>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useChainStore } from '@/stores/chain'
import { useGameStateStore } from '@/stores/gamestate'
import { useOnboardingStore } from '@/stores/onboarding'
import { cleanName, nameProblem, NAME_MAX_LENGTH, PILOT_NAME_MIN_LENGTH } from '@/libs/onboarding'
import LaunchPad from './launch-pad.vue'
import PilotCard from './pilot-card.vue'

// After this long transmitting, reassure the player that waiting is normal.
const SLOW_MS = 30000
// Below this much native currency, warn that gas may run short.
const LOW_BALANCE = 0.001

export default {
  name: 'WizardRegister',
  components: { LaunchPad, PilotCard },
  props: {
    /** 'callsign' | 'ship' */
    kind: { type: String, required: true },
    /** Minerva's introduction has been read (callsign). */
    introDone: { type: Boolean, default: false }
  },
  emits: ['blocked'],
  data() {
    return { name: '', slow: false, NAME_MAX_LENGTH, inputId: 'register-' + this.kind }
  },
  computed: {
    ...mapState(useOnboardingStore, ['registration', 'callsigns', 'corporationNames']),
    /** Which corporation the ship step joins (1-based). */
    corporation: {
      get() {
        return useOnboardingStore().corporation
      },
      set(value) {
        useOnboardingStore().corporation = value
      }
    },
    ...mapState(useChainStore, ['networkData', 'chainId', 'balance']),
    ...mapState(useGameStateStore, ['avatar']),
    pilotName() {
      return this.avatar.name
    },
    cleaned() {
      return cleanName(this.name)
    },
    problem() {
      return nameProblem(this.name, { taken: this.kind === 'callsign' ? this.callsigns : null, minLength: PILOT_NAME_MIN_LENGTH })
    },
    hint() {
      if (this.problem === 'too long') return `That's ${this.cleaned.length} characters; ${NAME_MAX_LENGTH} at most.`
      if (this.problem === 'too short') return `At least ${PILOT_NAME_MIN_LENGTH} characters.`
      if (this.problem === 'taken') return `A pilot already flies as ${this.cleaned}. Pick another call sign.`
      if (this.kind === 'callsign') return `${PILOT_NAME_MIN_LENGTH} to ${NAME_MAX_LENGTH} characters. Other pilots will see it.`
      return `${PILOT_NAME_MIN_LENGTH} to ${NAME_MAX_LENGTH} characters.`
    },
    lowBalance() {
      return Number(this.balance) > 0 && Number(this.balance) < LOW_BALANCE
    },
    balanceText() {
      return `${Number(this.balance).toFixed(4)} ${this.networkData[this.chainId]?.currency.symbol ?? ''}`
    },
    transactionLink() {
      const explorer = this.networkData[this.chainId]?.explorer[0]
      return explorer && this.registration?.hash ? `${explorer}/tx/${this.registration.hash}` : null
    },
    failureMessage() {
      const { failure, reason } = this.registration
      if (failure === 'rejected') return 'You declined the registration in your wallet, so nothing was sent.'
      if (failure === 'pending') return 'Your wallet already has a request open: click its icon in the toolbar.'
      return `The registration didn't go through: ${reason}`
    },
    /** The name can't be sent as it is (an empty name only focuses the box). */
    blocked() {
      return this.problem === 'taken' || this.problem === 'too long' || this.problem === 'too short'
    }
  },
  watch: {
    blocked: {
      immediate: true,
      handler(blocked) {
        this.$emit('blocked', blocked)
      }
    },
    'registration.status': {
      immediate: true,
      handler(status, before) {
        clearTimeout(this.slowTimer)
        this.slow = false
        if (status === 'done' && before) this.o8audio.speak(this.kind === 'callsign' ? 'registered' : 'launched')
        if (status === 'sent') this.slowTimer = setTimeout(() => (this.slow = true), SLOW_MS)
      }
    },
    // Back from a failure: the form returns with the name that was tried.
    registration(now, before) {
      if (!now && before) {
        this.name = before.name
        this.$nextTick(() => this.$refs.input?.focus())
      }
    },
    introDone(done) {
      if (done) this.$nextTick(() => this.$refs.input?.focus())
    }
  },
  mounted() {
    this.$refs.input?.focus()
    if (this.kind === 'ship') useOnboardingStore().loadCorporations()
    // Minerva introduces herself as the new pilot's introduction opens.
    if (this.kind === 'callsign' && !this.introDone && !this.registration) this.o8audio.speak('greetings')
  },
  unmounted() {
    clearTimeout(this.slowTimer)
  },
  methods: {
    /** Sends the registration if the name is usable. Called by the form and the wizard's button. */
    submit() {
      if (this.problem) {
        this.$refs.input?.focus()
        return
      }
      this.o8audio.playEffect('click')
      useOnboardingStore().register(this.kind, this.cleaned)
    }
  }
}
</script>

<style scoped>
.corporations {
  border: none;
  margin: 0 0 0.75rem;
  padding: 0;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.corporations legend {
  margin-bottom: 0.25rem;
}
.corporation {
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
}
.wizard-register {
  display: grid;
  gap: 0.9em;
}
p {
  margin: 0;
}
.name-form {
  display: grid;
  gap: 0.6em;
}
label {
  font-size: 0.9em;
  color: #c3b3da;
}
input {
  font: inherit;
  font-size: 1.2em;
  color: #ffffff;
  background: #00000055;
  border: 1px solid #ffffff55;
  border-radius: 0.5em;
  padding: 0.45em 0.7em;
  width: 100%;
  box-sizing: border-box;
}
input:focus {
  outline: 2px solid #c3b3da;
  outline-offset: 1px;
  border-color: #ffffffaa;
}
input[aria-invalid='true'] {
  border-color: #ffb3c1;
}
.motto {
  font-style: italic;
  color: #c3b3da;
}
</style>
