import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { discoverWallets, preferredWallet, rememberWallet, connectWallet } from '@/sdk/chain/wallet'
import {
  initContracts as bindContracts,
  contractAddresses,
  galaxy,
  getBlockNumber,
  getNativeBalance,
  gameChangedBetween
} from '@/sdk/chain/contracts'
import { networks, networkFor, chainName } from '@/sdk/chain/networks'
import { useStarMapStore } from '@/stores/starmap'
import { useGameStateStore } from '@/stores/gamestate'
import { useConfigStore } from '@/stores/config'

let blockPoller = null
let checkingBlocks = false

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
    lastBlockNumber: 0,
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
        const session = await connectWallet(wallet)
        rememberWallet(wallet)
        this.chainId = session.chainId
        this.account = session.account
        this.lastBlockNumber = await getBlockNumber()
        this.web3Loaded = true
        this.walletStatus = 'connected'
        this.balance = await getNativeBalance()
      } catch (error) {
        console.error('Wallet connection failed:', error)
        this.walletError = error.shortMessage ?? error.message
        this.walletStatus = 'error'
      }
    },
    /** Binds the game contracts on the connected network and looks up the token contracts. */
    async initContracts() {
      if (!(await bindContracts())) return
      const addresses = contractAddresses()
      this.avatarAddress = addresses.avatars
      this.galaxyAddress = addresses.game
      const [planetToken, shipToken, creditToken] = await Promise.all([
        galaxy.getPlanetToken(),
        galaxy.getShipToken(),
        galaxy.getCreditToken()
      ])
      this.planetTokenAddress = planetToken
      this.shipTokenAddress = shipToken
      this.creditTokenAddress = creditToken
      this.contractsLoaded = true
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
    /**
     * Game state only changes when a block completes. Reload it when a new block contains a
     * transaction to one of the game's contracts (or on the first check); skip blocks that don't.
     */
    async checkForNewBlock() {
      if (checkingBlocks) return
      checkingBlocks = true
      try {
        const blockNumber = await getBlockNumber()
        if (blockNumber <= this.currentBlockId) return
        const isFirstLoad = this.currentBlockId === 0
        const changed =
          isFirstLoad ||
          (await gameChangedBetween(this.currentBlockId, blockNumber, [
            this.galaxyAddress,
            this.avatarAddress,
            this.planetTokenAddress,
            this.shipTokenAddress,
            this.creditTokenAddress
          ]))
        this.currentBlockId = blockNumber
        if (!changed) return
        console.debug('Game changed by block ' + blockNumber + '; reloading')
        useGameStateStore().loadGameState()
        useGameStateStore().loadEvents()
        useStarMapStore().loadStarMap()
      } catch (error) {
        console.error('Block check failed:', error.message)
      } finally {
        checkingBlocks = false
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
