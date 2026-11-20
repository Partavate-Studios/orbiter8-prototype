<template>
  <!-- The connect panel: the wallet, the network, and gas, in Minerva's panel. Once a new pilot is
       connected and funded, the intro takes over (components/intro/): the name, the corporation, the job
       and the ship are all asked there. -->
  <minerva-panel :title="title" :steps="dots" :current="wizardStep" @close="closeWizard">
    <wizard-connect />

    <template #actions>
      <button v-if="step === 'ready'" type="button" class="o8-button primary" @click="takeCommand">Take Command</button>
    </template>
  </minerva-panel>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useOnboardingStore } from '@/stores/onboarding'
import MinervaPanel from './minerva-panel.vue'
import WizardConnect from './wizard-connect.vue'

const DOTS = [
  { id: 'wallet', label: 'Wallet' },
  { id: 'network', label: 'Network' }
]

const TITLES = {
  searching: 'Connect a Wallet',
  wallet: 'Connect a Wallet',
  network: 'Choose Where to Play',
  loading: 'Reading the Galaxy',
  funds: 'Funds for Gas',
  ready: 'Ready'
}

export default {
  name: 'OnboardingWizard',
  components: { MinervaPanel, WizardConnect },
  data() {
    return { dots: DOTS }
  },
  computed: {
    ...mapState(useOnboardingStore, ['step', 'wizardStep']),
    title() {
      return TITLES[this.step] ?? TITLES.wallet
    }
  },
  watch: {
    // Connected, read and funded: a new pilot goes on into the intro.
    step: {
      immediate: true,
      handler(step) {
        if (step === 'callsign' || step === 'ship') {
          this.closeWizard()
          this.$router.push('/intro')
        }
      }
    }
  },
  methods: {
    ...mapActions(useOnboardingStore, ['closeWizard']),
    takeCommand() {
      this.o8audio.playEffect('click')
      this.closeWizard()
      this.$router.push('/play')
    }
  }
}
</script>
