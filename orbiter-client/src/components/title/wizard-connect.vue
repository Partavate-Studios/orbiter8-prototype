<template>
  <!-- Getting connected: a wallet, the right network, the game read, and something to pay gas with. -->
  <div class="wizard-connect">
    <template v-if="step === 'searching'">
      <p>Looking for a wallet in this browser…</p>
    </template>

    <template v-else-if="step === 'wallet'">
      <template v-if="walletStatus === 'none'">
        <p>
          Orbiter 8 is played with a crypto wallet: it holds your ships and planets and signs every move you make. No
          wallet was found in this browser.
        </p>
        <p>
          <a class="o8-button" href="https://metamask.io/download/" target="_blank" rel="noopener"
            >Install MetaMask ↗</a
          >
        </p>
        <p class="hint">After installing it, reload this page.</p>
        <p v-if="appLink" class="hint">On a phone? <a :href="appLink">Open Orbiter 8 in MetaMask's browser ↗</a></p>
      </template>

      <template v-else-if="walletStatus === 'connecting'">
        <p>
          Waiting for <b>{{ walletName }}</b
          >. Approve the connection in its window.
        </p>
        <p class="hint">Don't see it? Click {{ walletName }}'s icon in your browser's toolbar.</p>
        <template v-if="walletSlow">
          <p class="problem" role="status">
            {{ walletName }} hasn't answered. Its window may be hidden, or it may be waiting to be unlocked.
          </p>
          <p><button type="button" class="o8-button" @click="retry">Ask {{ walletName }} again</button></p>
        </template>
      </template>

      <template v-else>
        <p v-if="walletStatus === 'error'" class="problem" role="alert">{{ errorMessage }}</p>
        <p v-else>Connect your wallet to play. It signs each move you make in the galaxy.</p>
        <div class="choices">
          <button
            v-for="wallet in wallets"
            :key="wallet.info.uuid"
            type="button"
            class="o8-button"
            @click="connect(wallet)"
          >
            <img v-if="wallet.info.icon" :src="wallet.info.icon" alt="" class="wallet-icon" />
            {{ walletStatus === 'error' ? 'Try ' + wallet.info.name + ' again' : 'Connect ' + wallet.info.name }}
          </button>
        </div>
      </template>
    </template>

    <template v-else-if="step === 'network'">
      <p>
        Your wallet is on <b>{{ networkName || 'an unknown network' }}</b
        >, where Orbiter 8 isn't running. Choose where to play:
      </p>
      <ul class="galaxies">
        <li v-for="network in networks" :key="network.chainId">
          <button type="button" class="o8-button" :disabled="switching" @click="switchTo(network.chainId)">
            {{ network.name }}
          </button>
          <network-stats :chain-id="network.chainId" />
        </li>
      </ul>
      <p v-if="switchError" class="problem" role="alert">{{ switchError }}</p>
      <p class="hint">Your wallet will ask you to approve the switch.</p>
    </template>

    <template v-else-if="step === 'loading'">
      <template v-if="contractsFailed">
        <p class="problem" role="alert">Couldn't reach the galaxy on {{ networkName }}. Its network may be busy.</p>
        <p><button type="button" class="o8-button" @click="initContracts">Try again</button></p>
      </template>
      <p v-else>Reading the galaxy on {{ networkName }}…</p>
    </template>

    <template v-else-if="step === 'funds'">
      <p>
        Every move in Orbiter 8 is a transaction, and transactions are paid for in <b>{{ currency }}</b
        >. Your wallet has none on {{ networkName }} yet.
      </p>
      <ul v-if="funding.length" class="faucets">
        <li v-for="(part, index) in funding" :key="index">
          <a v-if="part.url" :href="part.url" target="_blank" rel="noopener">{{ part.text }}</a>
          <span v-else>{{ part.text }}</span>
        </li>
      </ul>
      <p class="hint">
        Send it to <span class="address">{{ account }}</span
        >. This step moves on by itself once it arrives.
      </p>
    </template>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useChainStore } from '@/stores/chain'
import { useOnboardingStore } from '@/stores/onboarding'
import { networks } from '@/sdk/chain/networks'
import { walletAppLink } from '@/sdk/chain/wallet'
import { game } from '@/sdk/client'
import NetworkStats from './network-stats.vue'

// While waiting for funds, the balance is re-read this often.
const BALANCE_CHECK_MS = 6000

export default {
  name: 'WizardConnect',
  components: { NetworkStats },
  data() {
    return { switching: false, switchError: null, appLink: walletAppLink() }
  },
  computed: {
    ...mapState(useOnboardingStore, ['step']),
    ...mapState(useChainStore, [
      'wallets',
      'walletStatus',
      'walletName',
      'walletError',
      'walletErrorKind',
      'walletSlow',
      'networkName',
      'networkData',
      'chainId',
      'account',
      'contractsFailed'
    ]),
    networks() {
      return networks
    },
    errorMessage() {
      if (this.walletErrorKind === 'rejected')
        return `You closed ${this.walletName}'s request, so nothing was connected.`
      if (this.walletErrorKind === 'pending') {
        return `${this.walletName} already has a request open. Click its icon in your browser's toolbar to answer it.`
      }
      return `Couldn't connect to ${this.walletName}: ${this.walletError}`
    },
    currentNetwork() {
      return this.networkData[this.chainId]
    },
    currency() {
      return this.currentNetwork?.currency.symbol ?? 'gas'
    },
    funding() {
      return this.currentNetwork?.funding ?? []
    }
  },
  watch: {
    step: {
      immediate: true,
      handler(step) {
        clearInterval(this.balanceTimer)
        if (step === 'network') this.loadNetworkStats()
        if (step === 'funds') this.balanceTimer = setInterval(() => game.refreshBalance(), BALANCE_CHECK_MS)
      }
    }
  },
  unmounted() {
    clearInterval(this.balanceTimer)
  },
  methods: {
    ...mapActions(useChainStore, ['chooseWallet', 'retryConnect', 'switchNetwork', 'initContracts']),
    ...mapActions(useOnboardingStore, ['loadNetworkStats']),
    connect(wallet) {
      this.o8audio.playEffect('click')
      this.chooseWallet(wallet)
    },
    retry() {
      this.o8audio.playEffect('click')
      this.retryConnect()
    },
    async switchTo(chainId) {
      this.o8audio.playEffect('click')
      this.switching = true
      this.switchError = await this.switchNetwork(chainId)
      this.switching = false
    }
  }
}
</script>

<style scoped>
.wizard-connect {
  display: grid;
  gap: 0.9em;
}
p {
  margin: 0;
}
.choices {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6em;
}
.galaxies {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.5em;
}
.galaxies li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4em 0.9em;
}
.galaxies .o8-button {
  min-width: 13em;
  text-align: left;
}
.wallet-icon {
  width: 1.3em;
  height: 1.3em;
  vertical-align: -0.25em;
  margin-right: 0.3em;
}
.faucets {
  margin: 0;
  padding-left: 1.2em;
  display: grid;
  gap: 0.3em;
}
.address {
  font-family: 'Ubuntu Mono', ui-monospace, monospace;
  overflow-wrap: anywhere;
  color: #ffffff;
}
</style>
