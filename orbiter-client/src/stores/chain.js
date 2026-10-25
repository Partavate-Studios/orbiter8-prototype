import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { discoverWallets, preferredWallet, rememberWallet } from '@/sdk/chain/wallet'
import { networks, networkFor, chainName } from '@/sdk/chain/networks'
import { game } from '@/sdk/client'
import { useConfigStore } from '@/stores/config'

let blockPoller = null

export const useChainStore = defineStore('Chain', {
  state: () => ({
    web3Loaded: false,
    contractsLoaded: false,
    creditTokenAddress: null,
    shipTokenAddress: null,
    planetTokenAddress: null,
    avatarAddress: null,
    galaxyAddress: null,
    chainId: 0,
    account: null,
    currentBlockId: 0,
    playerReady: false,
    balance: 0,
    /** Wallets found via EIP-6963, when the player has to pick one. Raw: they hold provider objects. */
    wallets: markRaw([]),
    /** 'searching' | 'none' | 'choose' | 'connecting' | 'connected' | 'error' */
    walletStatus: 'searching',
    /** The wallet being connected or connected to, for messages. */
    walletName: null,
    walletError: null
  }),
  getters: {
    readyToPlay: (state) => {
      if (state.web3Loaded && state.contractsLoaded && state.account > 0) {
        return true
      }
      return false
    },
    networkName: (state) => (state.chainId ? chainName(state.chainId) : ''),
    /** Network metadata keyed by chain id, plus the hex chain id wallets expect. */
    networkData: () =>
      Object.fromEntries(
        networks.map((network) => [
          network.chainId,
          { ...network, id: String(network.chainId), hexId: '0x' + network.chainId.toString(16) }
        ])
      ),
    isSupportedNetwork: (state) => Boolean(networkFor(state.chainId)),
    blockId: (state) => state.currentBlockId
  },
  actions: {
    /** Finds the player's wallet and connects to it, unless they need to choose between several. */
    async initWeb3() {
      this.walletStatus = 'searching'
      const wallets = await discoverWallets()
      if (wallets.length === 0) {
        this.walletStatus = 'none'
        return
      }
      // Kept even when we connect automatically, so the player can pick again if connecting fails.
      this.wallets = markRaw(wallets)
      const wallet = preferredWallet(wallets)
      if (wallet) return this.chooseWallet(wallet)
      this.walletStatus = 'choose'
    },
    /** Connects to the given EIP-6963 wallet; walletStatus tracks how it goes. */
    async chooseWallet(wallet) {
      this.walletError = null
      this.walletName = wallet.info.name
      // The wallet usually shows a popup now; until the player approves it, we wait here.
      this.walletStatus = 'connecting'
      try {
        await game.connect(wallet)
        rememberWallet(wallet)
        this.web3Loaded = true
        this.walletStatus = 'connected'
      } catch (error) {
        console.error('Wallet connection failed:', error)
        this.walletError = error.shortMessage ?? error.message
        this.walletStatus = 'error'
      }
    },
    /** Binds the game contracts on the connected network (addresses arrive through stores/game-bindings.js). */
    async initContracts() {
      if (await game.bindContracts()) this.contractsLoaded = true
    },
    /** Polls for new blocks for the rest of the session. Safe to call again: only one poller ever runs. */
    startBlockPolling() {
      if (blockPoller) return
      // Paused while the tab is hidden; checks right away when the player comes back.
      const poll = () => {
        if (!document.hidden) this.checkForNewBlock()
      }
      poll()
      blockPoller = setInterval(poll, useConfigStore().blockCheckDelay)
      document.addEventListener('visibilitychange', poll)
    },
    /** Checks for a new block now; the game client reloads the game if it changed. */
    async checkForNewBlock() {
      try {
        await game.checkForNewBlock()
      } catch (error) {
        console.error('Block check failed:', error.message)
      }
    },
    setProp({ key, value }) {
      this[key] = value
    },
    setPlayerReady() {
      this.playerReady = true
    }
  }
})
