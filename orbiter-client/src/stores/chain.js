import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { discoverWallets, preferredWallet, rememberWallet, connectWallet } from '@/chain/wallet'
import { initContracts as bindContracts, contractAddresses, galaxy, getBlockNumber, getNativeBalance } from '@/chain/contracts'
import { networks, networkFor } from '@/chain/networks'
import { useStarMapStore } from '@/stores/starmap'
import { useGameStateStore } from '@/stores/gamestate'

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
    walletError: null
  }),
  getters: {
    readyToPlay: state => {
      if (state.web3Loaded && state.contractsLoaded && state.account > 0) {
        return true
      }
      return false
    },
    networkName: state => networkFor(state.chainId)?.name ?? state.chainId,
    /** Network metadata keyed by chain id, plus the hex chain id wallets expect. */
    networkData: () => Object.fromEntries(networks.map(network => [
      network.chainId,
      { ...network, id: String(network.chainId), hexId: '0x' + network.chainId.toString(16) }
    ])),
    isSupportedNetwork: state => Boolean(networkFor(state.chainId)),
    blockId: state => state.currentBlockId
  },
  actions: {
    /** Finds the player's wallet and connects to it, unless they need to choose between several. */
    async initWeb3 () {
      const wallets = await discoverWallets()
      const wallet = preferredWallet(wallets)
      if (wallet) return this.chooseWallet(wallet)
      this.wallets = markRaw(wallets)
    },
    async chooseWallet (wallet) {
      this.walletError = null
      try {
        const session = await connectWallet(wallet)
        rememberWallet(wallet)
        this.wallets = markRaw([])
        this.chainId = session.chainId
        this.account = session.account
        this.lastBlockNumber = await getBlockNumber()
        this.web3Loaded = true
        this.balance = await getNativeBalance()
      } catch (error) {
        console.log('Wallet connection failed:', error)
        this.walletError = error.shortMessage ?? error.message
      }
    },
    async initContracts () {
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
    /** game state only changes when a block completes */
    async checkForNewBlock () {
      let blockNumber
      try {
        blockNumber = await getBlockNumber()
      } catch (error) {
        console.log('Block check failed:', error.message)
        return
      }
      if (this.currentBlockId < blockNumber) {
        console.log('Block increase from ' + this.currentBlockId + ' to ' + blockNumber)
        this.currentBlockId = blockNumber
        useGameStateStore().loadGameState()
        useGameStateStore().loadEvents()
        useStarMapStore().loadStarMap()
      }
    },
    setProp ({ key, value }) {
      this[key] = value
    },
    setPlayerReady () {
      this.playerReady = true
    }
  }
})
