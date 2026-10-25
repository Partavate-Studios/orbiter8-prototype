<template>
  <div class="networkselect">
    <div class="icon" v-if="percentageLoaded <= 50">&#128543;</div>
    <div class="icon" v-else-if="percentageLoaded < 100">&#129320;</div>
    <div class="icon" v-else>&#128512;</div>
    <p>Preflight Checklist:</p>
      <div class="loadingbarContainer">
        <div class="loadingbar" :style="'width: ' + percentageLoaded + '%'">
          <span>{{ percentageLoaded }}%</span>
        </div>
      </div>
      <div class="checklist">
        <div class="item">
          <span class="name">Web3:</span>
          <span v-if="walletStatus === 'connected'"><b>Loaded</b> we found your wallet</span>
          <span v-else-if="walletStatus === 'connecting'">Waiting for <b>{{ walletName }}</b>: approve the connection in its popup.</span>
          <span v-else-if="walletStatus === 'none'" class="warning">No wallet found</span>
          <span v-else-if="wallets.length">Choose a wallet:
            <button v-for="wallet in wallets"
              :key="wallet.info.uuid"
              class="littlebutton"
              @click="chooseWallet(wallet)"><img v-if="wallet.info.icon" :src="wallet.info.icon" alt="" class="walleticon">{{ wallet.info.name }}</button>
          </span>
          <span v-else>...</span>
        </div>

        <div class="sectionhead">Choose Your Favorite Place To Play</div>

        <div class="item">
          <span class="name">EVM Networks:</span>
          <span>
            <a v-for="network in networkList"
              v-bind:key="'net-' + network.chainId"
              v-bind:class="{selectednetwork: chainId == network.chainId}"
              :title="'Connect your wallet to ' + network.name"
              class="littlebutton"
              v-on:click.prevent="connectNetwork(network.chainId)
              "><span v-if="network.chainId == chainId">&#128377;</span>{{ network.shortName }}</a>
          </span>
        </div>

        <div class="item" v-if="walletStatus === 'connected' && !isSupportedNetwork">
          <span class="name">Foreign Network:</span>
          <span class="warning">Your wallet is on {{ networkName }}. Pick one of the networks above to switch.</span>
        </div>

        <div class="sectionhead">{{networkName}} Status Report</div>

        <div class="item">
          <span class="name">Current Network:</span>
          <span v-if="chainId">{{ networkName }}
            <span v-if="!isSupportedNetwork" class="warning">Unsupported</span>
          </span>
          <span v-else>...not found</span>
        </div>
        <div class="item">
          <span class="name">Account Status:</span>
          <span v-if="account > 0">Connected
            with {{ balance }} {{ currencySymbol }}
            <span class="warning" v-if="balance < 0.001">(low balance warning)</span>
          </span>
          <span v-else>...not found</span>
        </div>
        <div class="item">
          <span class="name">Get Currency:</span>
          <span v-if="networkData[chainId]">
            <template v-for="(part, index) in networkData[chainId].funding" :key="index">
              <a v-if="part.url" class="faucetlink" target="_blank" :href="part.url">{{ part.text }}</a>
              <template v-else>{{ part.text }}</template>
            </template>
          </span>
        </div>

        <div class="item">
          <span class="name">Contracts:</span>
          <span v-if="contractsLoaded"><b>Found</b></span>
          <span v-else>Missing Contracts</span>
        </div>
        <div class="item">
          <span class="name">Credits Token:</span>
          <span class="tracker"> <a class="tracker" v-if="networkData[chainId]" :href="explorerLink(creditTokenAddress)" target="_blank">{{ creditTokenAddress }}</a></span>
          <span>
            <a v-if="creditTokenAddress" title="Import tokens to your wallet." class="littlebutton" v-on:click.prevent="addCreditsToken()">import 	&#65291;</a>
            <a v-if="creditTokenAddress" title="Swap tokens on Sushi" class="littlebutton" :href="'https://app.sushi.com/swap?inputCurrency=&outputCurrency=' + creditTokenAddress" target="_blank">swap 	&#8644;</a>
          </span>
        </div>
        <div class="item">
          <span class="name">Planet NFTs:</span>
          <span class="tracker"> <a class="tracker" v-if="networkData[chainId]" :href="explorerLink(planetTokenAddress)" target="_blank">{{ planetTokenAddress }}</a></span>
        </div>
        <div class="item">
          <span class="name">Ship NFTs:</span>
          <span class="tracker"> <a class="tracker" v-if="networkData[chainId]" :href="explorerLink(shipTokenAddress)" target="_blank">{{ shipTokenAddress }}</a></span>
        </div>
        <div class="item">
          <span class="name">Avatars:</span>
          <span class="tracker"> <a class="tracker" v-if="networkData[chainId]" :href="explorerLink(avatarAddress)" target="_blank">{{ avatarAddress }}</a></span>
        </div>
        <div class="item">
          <span class="name">Galaxy:</span>
          <span class="tracker"> <a class="tracker" v-if="networkData[chainId]" :href="explorerLink(galaxyAddress)" target="_blank">{{ galaxyAddress }}</a></span>
        </div>
        <div class="item">
          <span class="name">Game:</span>
          <span v-if="gameDataLoaded"><b>Loaded</b></span>
          <span v-else>...loading</span>
        </div>
        <div class="item">
          <span class="name">Your Avatar:</span>
          <span v-if="gameDataLoaded && haveAvatar"><b>{{ avatar.name }} </b></span>
          <span v-else-if="gameDataLoaded"><b>Awaiting your registration!</b></span>
          <span v-else></span>
        </div>
        <div class="item">
          <span class="name">Your Ship:</span>
          <span v-if="gameDataLoaded && haveAvatar && haveShip"><b>{{ avatar.ship.name }}</b></span>
          <span v-else-if="gameDataLoaded"><b>Ready for pickup.</b></span>
          <span v-else></span>
        </div>
        <div class="sectionhead">Your Custom Settings</div>
        <div class="item">
          <span class="name">Music Volume:</span>
          <span v-for="index in 4"
            :key="'music' + index"
            class="radioButton"
            v-on:click.prevent="setMusicVolume(index - 1)"
            v-bind:class="{'radioButtonSelected':(getMusicVolume() >= (index - 1))}" />
          <span v-if="getMusicVolume() == 0">off</span>
          <span v-else>{{ getMusicVolume() }}</span>
        </div>
        <div class="item">
          <span class="name">Effects Volume:</span>
          <span v-for="index in 4"
            :key="'effects' + index"
            class="radioButton"
            v-on:click.prevent="setEffectsVolume(index - 1)"
            v-bind:class="{'radioButtonSelected':(getEffectsVolume() >= (index - 1))}" />
          <span v-if="getEffectsVolume() == 0">off</span>
          <span v-else>{{ getEffectsVolume() }}</span>
        </div>
        <div class="item">
          <span class="name">Graphics Level:</span>
          <span v-for="index in 3"
            :key="'graphics' + index"
            class="radioButton"
            v-on:click.prevent="setGraphicsQuality(index)"
            v-bind:class="{'radioButtonSelected':(graphicsQuality >= index)}" />
          <span v-if="graphicsQuality == 1">Efficient</span>
          <span v-else-if="graphicsQuality == 3">Luxurious</span>
          <span v-else>Moderate</span>
        </div>
      </div>
    <div v-if="gameDataLoaded" class="play">
      <button v-on:click="setPlayerReady">Play</button>
    </div>
    <div v-else>
      <!-- What's holding things up, in the order the player has to deal with it. -->
      <div class="errormessage" v-if="walletStatus === 'none'">No wallet found. Orbiter 8 needs a browser wallet such as MetaMask: install one, then reload this page.</div>
      <div class="errormessage" v-else-if="walletStatus === 'choose'">Choose which wallet to play with (above).</div>
      <div class="errormessage" v-else-if="walletStatus === 'connecting'">Waiting for {{ walletName }}. Approve the connection in its popup; if you don't see one, open the wallet from your browser's toolbar.</div>
      <div class="errormessage" v-else-if="walletStatus === 'error'">Couldn't connect to {{ walletName }}: {{ walletError }}. Choose a wallet above to try again.</div>
      <div class="errormessage" v-else-if="!web3Loaded">Looking for your wallet...</div>
      <div class="errormessage" v-else-if="!(account > 0)">No account found. Unlock your wallet or create an account in it.</div>
      <div class="errormessage" v-else-if="!isSupportedNetwork">Your wallet is on {{ networkName }}, where Orbiter 8 isn't deployed. Pick Sepolia, Binance, Moonriver or Moonbase above to switch.</div>
      <div class="errormessage" v-else-if="!contractsLoaded">Contracts not found. The network may be unreachable right now; try reloading.</div>
    </div>
  </div>
</template>

<script>
import { useChainStore } from '@/stores/chain'
import { useGameStateStore } from '@/stores/gamestate'
import { mapActions, mapState } from 'pinia'
import { useConfigStore } from '@/stores/config'
import { walletRequest } from '@/chain/wallet'
import { networks } from '@/chain/networks'

export default {
  name: 'howtoweb3',
  methods: {
    ...mapActions(useChainStore, [
      'chooseWallet',
      'initContracts'
    ]),
    ...mapActions(useGameStateStore, [
      'loadGameState',
    ]),
    ...mapActions(useChainStore, [
      'setPlayerReady'
    ]),
    ...mapActions(useConfigStore, [
      'setGraphicsQuality',
    ]),
    async connectNetwork(chainId) {
      if (!this.networkData[chainId]) {
        return
      }
      if (this.walletStatus !== 'connected') {
        alert('Connect a wallet first, then pick a network.')
        return
      }
      try {
        await walletRequest('wallet_switchEthereumChain', [{ chainId: this.networkData[chainId].hexId }])
      } catch (error) {
        console.error('Switching networks failed:', error.shortMessage ?? error.message)
        if (confirm('Chain not found in your wallet. Would you like us to try to add it?')) {

          let data = [{
            chainId: this.networkData[chainId].hexId,
            chainName: this.networkData[chainId].name,
            nativeCurrency: this.networkData[chainId].currency,
            rpcUrls: this.networkData[chainId].rpc,
            blockExplorerUrls: this.networkData[chainId].explorer.length ? this.networkData[chainId].explorer : undefined
          }]
          try {
            await walletRequest('wallet_addEthereumChain', data)
          } catch (error) {
            alert('We were unable to add the network.')
          }

        }
      }
    },
    async addCreditsToken() {
      try {
        await walletRequest('wallet_watchAsset', {
          type: 'ERC20', // Initially only supports ERC20, but eventually more!
          options: {
            address: this.creditTokenAddress,
            symbol: 'OBTR8',
            decimals: 0,
            image: 'https://orbiter8.com/tokens/orbiter-8-credits.png'
          },
        })

      } catch (error) {
        console.error('Importing the credits token failed:', error)
      }
    },
    setMusicVolume(volume) {
      this.o8audio.setMusicVolume(volume / 3)
      this.o8audio.playEffect('click')
      this.$forceUpdate()
    },
    setEffectsVolume(volume) {
      this.o8audio.setEffectsVolume(volume / 3)
      this.o8audio.playEffect('click')
      this.$forceUpdate()
    },
    getMusicVolume() {
      return parseInt(this.o8audio.getMusicVolume() * 3)
    },
    getEffectsVolume() {
      return parseInt(this.o8audio.getEffectsVolume() * 3)
    },
    explorerLink(address) {
      const explorer = this.networkData[this.chainId]?.explorer[0]
      return explorer ? explorer + '/address/' + address : undefined
    }
  },
  watch: {
    account: function (val, oldVal) {
      if ((val != oldVal) && (val > 0)) {
        this.initContracts()
      }
    },
    contractsLoaded: function (val, oldVal) {
      if ((val != oldVal) && (val)) {
        this.loadGameState()
      }
    },
  },
  computed: {
    ...mapState(useChainStore, [
      'web3Loaded',
      'contractsLoaded',
      'account',
      'chainId',
      'networkName',
      'networkData',
      'creditTokenAddress',
      'planetTokenAddress',
      'shipTokenAddress',
      'avatarAddress',
      'galaxyAddress',
      'balance',
      'wallets',
      'walletError',
      'walletStatus',
      'walletName',
      'isSupportedNetwork'
    ]),
    currencySymbol() {
      return this.networkData[this.chainId]?.currency.symbol ?? ''
    },
    ...mapState(useGameStateStore, [
      'gameDataLoaded',
      'haveAvatar',
      'haveShip',
      'avatar',
    ]),
    ...mapState(useConfigStore, [
      'graphicsQuality'
    ]),
    networkList() {
      return networks
    },
    percentageLoaded() {
      if (this.gameDataLoaded) {
        return 100
      } else if (this.contractsLoaded) {
        return 75
      } else if (this.account > 0) {
        return 50
      } else if (this.web3Loaded) {
        return 25
      }
      return 10
    }
  }
}
</script>

<style scoped lang="scss">
  div.networkselect {
    background: #20202088;
    margin: 4em auto;
    padding: 2em;
    border: 1px solid #303030;
    min-width: 25%;
    max-width: 80em;
    border-radius: 1em;
    text-align: left;
  }
  .icon {
    background: #000000;
    color: #310e5c;
    padding: 0.25em 0.5em;
    font-weight: bold;
    margin: -1.5em -1.5em 0.5em 0.5em;
    display: inline-block;
    float: right;
    font-size: 2em;
    border-radius: 2em;
  }
  div.loadingbarContainer {
    background: #ffffff44;
    padding: 2px;
    border-radius: 15px;

    div.loadingbar {
    border-radius: 15px;
      display: inline-block;
      font-weight: bold;
      background: #ffffff;
      padding: 0px;
      margin: 0px;
      transition: width 2s;
      text-align: right;
      span {
        display: inline-block;
        color: #101010;
        padding: 10px;
        text-align: right;
      }
    }
  }
  div.checklist {
    padding: 1em;
    margin: 2px;
    div.item {
      margin: 0.25em 0;
      padding-left: 50%;
      span.name {
        color: #888;
        text-align: right;
        margin-right: 1em;
        margin-left: -50%;
        display: inline-block;
        width: 45%;
      }
    }
  }
  div.play {
    text-align: center;
    button {
      font-size: 16pt;
      margin: 2em auto 1em auto;
      min-width: 50%;
    }
  }
  span.radioButton {
    display: inline-block;
    height: 0.75em;
    width: 0.75em;
    margin: 0 0.25em;
    border: 1px solid #fff;
    border-radius: 5px;
  }
  span.radioButtonSelected {
    background: #fff;
  }
  span.radioButton:hover {
    background: #ffffff88;
    cursor: pointer;
  }
  .tracker {
    font-family: monospace;
    text-decoration: none;
    color: #fff;
  }
  a.addtoken {
    margin: 0 0.1em 0 0.5em;
    padding: 1px 5px;
    text-decoration: none;
    border: 1px solid #888;
    color: #fff;
    font-size: 0.8em;
  }
  a.addtoken:hover {
    cursor: pointer;
  }
  a.littlebutton, button.littlebutton {
    font-family: inherit;
    margin: 0px 0.2em 0 0.2em;
    padding: 1px 10px;
    text-decoration: none;
    border-radius: 8px;
    font-size: 0.8em;
    border: 1px solid #666;
    color: #aaa;
    background: #222;
  }
  a.littlebutton:hover, button.littlebutton:hover {
    cursor: pointer;
    border: 1px solid #888;
    color: #fff;
    background: #000;
  }
  img.walleticon {
    width: 1em;
    height: 1em;
    vertical-align: -0.15em;
    margin-right: 0.3em;
  }
  a.selectednetwork {
    border: 1px solid #f8f;
    color: #fff;
  }
  .faucetlink {
    font-size: 0.9em;
  }
  .faucetlink:hover {
    color: #fff;
    font-size: 0.9em;
  }
  .warning {
    color: #c44;
    font-size: 0.9em;
    margin-left: 0.25em;
  }
  @keyframes errorFadeIn {
   0% {opacity: 0;}
   50% {opacity: 0;}
   100% {opacity: 1;}
}
  .errormessage{
    text-align: center;
    color: #800;
    background: #ff8;
    padding: 0.5em;
    font-size: 1.1em;
    animation-name: errorFadeIn;
    animation-duration: 6s;
  }
  .sectionhead {
    font-size:1.2em;
    color:#ffffff;
    text-align:center;
    border-bottom: 1px solid #99999944;
    margin: 12px 0 8px 0;
    padding: 4px;
  }
</style>
