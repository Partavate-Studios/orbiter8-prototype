<template>
  <!-- The title's Network panel: where the game is running and what it's made of, for the curious
       (and for sorting out a problem). Everything the old preflight checklist reported. -->
  <section class="side-panel" aria-labelledby="network-panel-title">
    <h2 id="network-panel-title">Network</h2>

    <dl>
      <dt>Wallet</dt>
      <dd v-if="walletStatus === 'connected'">{{ walletName }}</dd>
      <dd v-else-if="walletStatus === 'none'" class="problem">None found in this browser</dd>
      <dd v-else>Not connected</dd>

      <dt>Network</dt>
      <dd v-if="chainId">
        {{ networkName }}
        <span v-if="!isSupportedNetwork" class="problem">· Orbiter 8 isn't running here</span>
      </dd>
      <dd v-else>—</dd>

      <template v-if="account">
        <dt>Account</dt>
        <dd>
          <a v-if="explorer" class="address" :href="explorer + '/address/' + account" target="_blank" rel="noopener">{{
            account
          }}</a>
          <span v-else class="address">{{ account }}</span>
        </dd>
        <dt>Balance</dt>
        <dd>
          {{ balanceText }}
          <span v-if="Number(balance) < 0.001" class="problem">· low</span>
        </dd>
      </template>

      <template v-if="funding.length">
        <dt>Get {{ currency }}</dt>
        <dd>
          <template v-for="(part, index) in funding" :key="index">
            <a v-if="part.url" :href="part.url" target="_blank" rel="noopener">{{ part.text }}</a>
            <span v-else>{{ part.text }}</span>
            <br v-if="index < funding.length - 1" />
          </template>
        </dd>
      </template>

      <template v-if="contractsLoaded">
        <dt>Galaxy</dt>
        <dd v-if="gameDataLoaded">{{ gameState.avatarCount }} pilots, {{ gameState.starSystemCount }} star systems</dd>
        <dd v-else>Loading…</dd>
        <template v-for="contract in contracts" :key="contract.label">
          <dt>{{ contract.label }}</dt>
          <dd>
            <a
              v-if="explorer"
              class="address"
              :href="explorer + '/address/' + contract.address"
              target="_blank"
              rel="noopener"
              >{{ contract.address }}</a
            >
            <span v-else class="address">{{ contract.address }}</span>
            <button v-if="contract.label === 'Credits'" type="button" class="o8-button small" @click="addCreditsToken">
              Add to wallet
            </button>
          </dd>
        </template>
      </template>
    </dl>

    <h3>Where Orbiter 8 is running</h3>
    <ul class="galaxies">
      <li v-for="network in allNetworks" :key="network.chainId">
        <span class="galaxy-name">{{ network.name }}</span>
        <network-stats :chain-id="network.chainId" />
        <span v-if="network.chainId === chainId" class="here">· you're here</span>
        <button
          v-else-if="walletStatus === 'connected'"
          type="button"
          class="o8-button small"
          @click="switchTo(network.chainId)"
        >
          Switch
        </button>
      </li>
    </ul>
    <p v-if="switchError" class="problem" role="alert">{{ switchError }}</p>

    <p class="footer"><button type="button" class="o8-button quiet" @click="$emit('close')">Close</button></p>
  </section>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useChainStore } from '@/stores/chain'
import { useGameStateStore } from '@/stores/gamestate'
import { networks } from '@/sdk/chain/networks'
import { useOnboardingStore } from '@/stores/onboarding'
import NetworkStats from './network-stats.vue'

export default {
  name: 'NetworkPanel',
  components: { NetworkStats },
  emits: ['close'],
  data() {
    return { switchError: null }
  },
  computed: {
    ...mapState(useChainStore, [
      'walletStatus',
      'walletName',
      'chainId',
      'networkName',
      'networkData',
      'isSupportedNetwork',
      'account',
      'balance',
      'contractsLoaded',
      'galaxyAddress',
      'avatarAddress',
      'creditTokenAddress',
      'planetTokenAddress',
      'shipTokenAddress'
    ]),
    ...mapState(useGameStateStore, ['gameDataLoaded', 'gameState']),
    currentNetwork() {
      return this.networkData[this.chainId]
    },
    explorer() {
      return this.currentNetwork?.explorer[0]
    },
    currency() {
      return this.currentNetwork?.currency.symbol ?? ''
    },
    funding() {
      return this.currentNetwork?.funding ?? []
    },
    balanceText() {
      return `${Number(this.balance).toFixed(4)} ${this.currency}`
    },
    contracts() {
      return [
        { label: 'Game', address: this.galaxyAddress },
        { label: 'Avatars', address: this.avatarAddress },
        { label: 'Credits', address: this.creditTokenAddress },
        { label: 'Planet NFTs', address: this.planetTokenAddress },
        { label: 'Ship NFTs', address: this.shipTokenAddress }
      ].filter((contract) => contract.address)
    },
    allNetworks() {
      return networks
    }
  },
  mounted() {
    this.loadNetworkStats()
  },
  methods: {
    ...mapActions(useChainStore, ['switchNetwork', 'addCreditsToken']),
    ...mapActions(useOnboardingStore, ['loadNetworkStats']),
    async switchTo(chainId) {
      this.o8audio.playEffect('click')
      this.switchError = await this.switchNetwork(chainId)
    }
  }
}
</script>

<style scoped>
dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.45em 1em;
  margin: 0;
}
dt {
  color: #c3b3da;
}
dd {
  margin: 0;
  min-width: 0;
}
.address {
  font-family: 'Ubuntu Mono', ui-monospace, monospace;
  font-size: 0.9em;
  overflow-wrap: anywhere;
}
dd .o8-button {
  margin-left: 0.5em;
}
h3 {
  margin: 0.4em 0 0;
  font-weight: 400;
  font-size: 1em;
  color: #c3b3da;
}
.galaxies {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.45em;
}
.galaxies li {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.3em 0.7em;
}
.galaxy-name {
  min-width: 12em;
}
.here {
  font-size: 0.8em;
  color: #9be3b0;
}
@media (max-width: 600px) {
  dl {
    grid-template-columns: 1fr;
  }
  dt {
    margin-top: 0.4em;
  }
}
</style>
