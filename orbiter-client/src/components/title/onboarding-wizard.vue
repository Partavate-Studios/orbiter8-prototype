<template>
  <!-- The onboarding wizard: whatever step the player is on (stores/onboarding.js), in Minerva's panel. -->
  <minerva-panel :title="title" :steps="dots" :current="wizardStep" @close="closeWizard">
    <wizard-register
      v-if="registerKind"
      ref="register"
      :key="registerKind"
      :kind="registerKind"
      :intro-done="introDone"
    />
    <wizard-connect v-else />

    <template #actions>
      <button v-if="action" type="button" class="o8-button primary" :disabled="!action.enabled" @click="action.run">
        {{ action.label }}
      </button>
    </template>
  </minerva-panel>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useOnboardingStore } from '@/stores/onboarding'
import { useGameStateStore } from '@/stores/gamestate'
import MinervaPanel from './minerva-panel.vue'
import WizardConnect from './wizard-connect.vue'
import WizardRegister from './wizard-register.vue'

const DOTS = [
  { id: 'wallet', label: 'Wallet' },
  { id: 'network', label: 'Network' },
  { id: 'callsign', label: 'Call sign' },
  { id: 'ship', label: 'Ship' },
  { id: 'command', label: 'Command' }
]

const TITLES = {
  searching: 'Connect a Wallet',
  wallet: 'Connect a Wallet',
  network: 'Choose Where to Play',
  loading: 'Reading the Galaxy',
  funds: 'Funds for Gas',
  callsign: 'Call Sign Registration',
  ship: 'Starship Registration',
  ready: 'Ready for Launch'
}

export default {
  name: 'OnboardingWizard',
  components: { MinervaPanel, WizardConnect, WizardRegister },
  data() {
    return { introDone: false, dots: DOTS }
  },
  computed: {
    ...mapState(useOnboardingStore, ['step', 'wizardStep', 'registration']),
    ...mapState(useGameStateStore, ['avatar']),
    /** A registration on screen keeps its own step until the player moves on from it. */
    registerKind() {
      if (this.registration) return this.registration.kind
      return this.step === 'callsign' || this.step === 'ship' ? this.step : null
    },
    title() {
      return TITLES[this.registerKind ?? this.step] ?? TITLES.wallet
    },
    /** The panel's main button, if this step has one. */
    action() {
      const registration = this.registration
      if (registration) {
        if (registration.status === 'failed') return { label: 'Try Again', enabled: true, run: this.clearRegistration }
        if (registration.status !== 'done') return null
        if (registration.kind === 'callsign')
          return { label: 'Find a Ship', enabled: true, run: this.clearRegistration }
        return { label: 'Take Command of ' + registration.name, enabled: true, run: this.takeCommand }
      }
      if (this.registerKind === 'callsign' && !this.introDone) {
        return { label: 'Register My Call Sign', enabled: true, run: this.readIntro }
      }
      if (this.registerKind) {
        return {
          label: this.registerKind === 'callsign' ? 'File My Registration' : 'Take Off',
          enabled: true,
          run: () => this.$refs.register.submit()
        }
      }
      if (this.step === 'ready') return { label: 'Take Command', enabled: true, run: this.takeCommand }
      return null
    }
  },
  mounted() {
    if (this.step === 'callsign') this.loadCallsigns()
  },
  methods: {
    ...mapActions(useOnboardingStore, ['closeWizard', 'clearRegistration', 'loadCallsigns']),
    readIntro() {
      this.o8audio.playEffect('click')
      this.introDone = true
      this.loadCallsigns()
    },
    takeCommand() {
      this.o8audio.playEffect('click')
      this.clearRegistration()
      this.closeWizard()
      this.$router.push('/play')
    }
  }
}
</script>
