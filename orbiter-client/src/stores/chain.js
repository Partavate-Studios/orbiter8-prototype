import { defineStore } from 'pinia'
import { gameAudio } from '@/libs/08audio'
import { markRaw } from 'vue'
import {
  discoverWallets,
  preferredWallet,
  rememberWallet,
  isAuthorized,
  walletErrorKind,
  walletRequest
} from '@/sdk/chain/wallet'
import { networks, networkFor, chainName } from '@/sdk/chain/networks'
import { game } from '@/sdk/client'
import { useConfigStore } from '@/stores/config'

let blockPoller = null

function switchFailure(error, networkName) {
  console.error('Switching networks failed:', error.shortMessage ?? error.message)
  const kind = walletErrorKind(error)
  if (kind === 'rejected') return `You declined the switch to ${networkName} in your wallet.`
  if (kind === 'pending') return 'Your wallet already has a request open: click its icon in the toolbar.'
  return `Your wallet couldn't switch to ${networkName}: ${error.shortMessage ?? error.message}`
}

// Block checks that failed in a row, and how many mean the connection is lost.
let blockCheckFailures = 0
const LOST_AFTER_FAILURES = 3

export const useChainStore = defineStore('Chain', {
  state: () => ({
    web3Loaded: false,
    contractsLoaded: false,
    /** Binding the contracts failed (the network's node didn't answer); the player can retry. */
    contractsFailed: false,
    /** The game's contracts on this network, by module (sdk/chain/networks.js). */
    contracts: {},
    creditTokenAddress: null,
    shipTokenAddress: null,
    planetTokenAddress: null,
    chainId: 0,
    account: null,
    currentBlockId: 0,
    balance: 0,
    /** Wallets found via EIP-6963, when the player has to pick one. Raw: they hold provider objects. */
    wallets: markRaw([]),
    /**
     * 'searching' | 'none' (no wallet installed) | 'idle' (found, waiting for the player to connect) |
     * 'connecting' | 'connected' | 'error'
     */
    walletStatus: 'searching',
    /** The wallet being connected or connected to, for messages. */
    walletName: null,
    walletError: null,
    /** 'rejected' | 'pending' | 'other' (sdk/chain/wallet.js walletErrorKind) */
    walletErrorKind: null,
    /** The network has stopped answering (several block checks in a row failed); see checkForNewBlock. */
    connectionLost: false,
    /** When contact came back (Date.now()), for the tray's brief "back in contact". */
    reconnectedAt: 0
  }),
  getters: {
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
    /**
     * Finds the player's wallets. A returning player's wallet (already trusting this site) is connected
     * right away, without a popup; anyone else connects when they choose to (chooseWallet).
     */
    async initWeb3() {
      this.walletStatus = 'searching'
      const wallets = await discoverWallets()
      if (wallets.length === 0) {
        this.walletStatus = 'none'
        return
      }
      this.wallets = markRaw(wallets)
      const wallet = preferredWallet(wallets)
      if (wallet && (await isAuthorized(wallet))) return this.chooseWallet(wallet)
      this.walletStatus = 'idle'
    },
    /** The wallet to connect without asking which: the remembered one, or the only one. */
    defaultWallet() {
      return preferredWallet(this.wallets)
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
        this.walletErrorKind = walletErrorKind(error)
        this.walletStatus = 'error'
      }
    },
    /** Binds the game contracts on the connected network (addresses arrive through stores/game-bindings.js). */
    async initContracts() {
      this.contractsFailed = false
      try {
        if (await game.bindContracts()) this.contractsLoaded = true
      } catch (error) {
        console.error('Binding the contracts failed:', error.shortMessage ?? error.message)
        this.contractsFailed = true
      }
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
        blockCheckFailures = 0
        if (this.connectionLost) {
          this.connectionLost = false
          this.reconnectedAt = Date.now()
          gameAudio().speak('reconnected')
        }
      } catch (error) {
        console.error('Block check failed:', error.message)
        // One failure can be a hiccup; a few in a row (about six seconds) means the network is gone.
        if (++blockCheckFailures >= LOST_AFTER_FAILURES) this.connectionLost = true
      }
    },
    /**
     * Asks the wallet to switch to one of the game's networks, adding it to the wallet first if the
     * wallet doesn't know it. The wallet then reloads the page (sdk/chain/wallet.js). Resolves with
     * null, or a message saying why it didn't happen.
     */
    async switchNetwork(chainId) {
      const network = this.networkData[chainId]
      if (!network) return 'Unknown network.'
      try {
        await walletRequest('wallet_switchEthereumChain', [{ chainId: network.hexId }])
        return null
      } catch (error) {
        // 4902: the wallet doesn't know this network (some wallets nest the code). Anything else,
        // such as the player declining the switch, isn't a reason to offer adding it.
        const unknownChain = error.code === 4902 || error.data?.originalError?.code === 4902
        if (!unknownChain) return switchFailure(error, network.name)
      }
      try {
        await walletRequest('wallet_addEthereumChain', [
          {
            chainId: network.hexId,
            chainName: network.name,
            nativeCurrency: network.currency,
            rpcUrls: network.rpc,
            blockExplorerUrls: network.explorer.length ? network.explorer : undefined
          }
        ])
        return null
      } catch (error) {
        return switchFailure(error, network.name)
      }
    },
    /** Asks the wallet to show the Credits token (wallet_watchAsset). */
    async addCreditsToken() {
      try {
        await walletRequest('wallet_watchAsset', {
          type: 'ERC20',
          options: {
            address: this.creditTokenAddress,
            symbol: 'O8C',
            decimals: 0,
            image: 'https://orbiter8.com/tokens/orbiter-8-credits.png'
          }
        })
      } catch (error) {
        console.error('Importing the credits token failed:', error)
      }
    }
  }
})
