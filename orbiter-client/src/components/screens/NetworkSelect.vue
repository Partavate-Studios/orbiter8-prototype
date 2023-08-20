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
          <span v-if="web3Loaded"><b>Loaded</b> we found your wallet</span>
          <span v-else>...</span>
        </div>

        <div class="sectionhead">Choose Your Favorite Place To Play</div>

        <div class="item">
          <span class="name">EVM Testnets:</span>
          <span>
            <a v-for="i in ['11155111', '97', '80001', '421611']"
              v-bind:key="'net-'+i"
              v-bind:class="{selectednetwork: chainId == i}"
              :title="'Connect your wallet to ' + networkData[i].name"
              class="littlebutton"
              v-on:click.prevent="connectNetwork(i)
              "><span v-if="i == chainId">&#128377;</span>{{ networkData[i].shortName }}</a>
          </span>
        </div>

        <div class="item">
          <span class="name"></span>
          <span>
            <a v-for="i in ['1285', '1287', '1297']"
              v-bind:key="'net-'+i"
              v-bind:class="{selectednetwork: chainId == i}"
              :title="'Connect your wallet to ' + networkData[i].name"
              class="littlebutton"
              v-on:click.prevent="connectNetwork(i)
              "><span v-if="i == chainId">&#128377;</span>{{ networkData[i].shortName }}</a>
          </span>
        </div>
        <div class="item">
          <span class="name"></span>
          <span>
            <a v-for="i in ['71401', '599', '381932']"
              v-bind:key="'net-'+i"
              v-bind:class="{selectednetwork: chainId == i}"
              :title="'Connect your wallet to ' + networkData[i].name"
              class="littlebutton"
              v-on:click.prevent="connectNetwork(i)
              "><span v-if="i == chainId">&#128377;</span>{{ networkData[i].shortName }}</a>
          </span>
        </div>

        <div class="item">
          <span class="name">Deprecated:</span>
          <span>
            <a v-for="i in ['4', '3', '42', '1666700000']"
              v-bind:key="'net-'+i"
              v-bind:class="{selectednetwork: chainId == i}"
              :title="'Connect your wallet to ' + networkData[i].name"
              class="littlebutton deadnetwork"
              v-on:click.prevent="connectNetwork(i)
              "><span v-if="i == chainId">&#128377;</span>{{ networkData[i].shortName }}</a>
          </span>
        </div>


        <div class="item" v-if="!isSupportedNetwork">
          <span class="name">Foreign Network:</span>
          <span class="warning">Please select a supported network.</span>
        </div>

        <div class="sectionhead">{{networkName}} Status Report</div>

        <div class="item">
          <span class="name">Current Network:</span>
          <span v-if="chainId != null">{{ networkName || 'Network ChainID: '+chainId }}
            <span v-if="!isSupportedNetwork" class="warning">Unsupported</span>
          </span>
          <span v-else>...not found</span>
        </div>
        <div class="item">
          <span class="name">Account Status:</span>
          <span v-if="account > 0">Connected
            with {{ balance }} {{ networkData[chainId].currency.symbol }}
            <span class="warning" v-if="balance < 0.001">(low balance warning)</span>
          </span>
          <span v-else>...not found</span>
        </div>
        <div class="item">
          <span class="name">Get Currency:</span>
          <span v-if="chainId == 4">
            Get test Rinkeby ETH from <a class="faucetlink" target="_blank" href="https://faucets.chain.link/rinkeby">Chainlink's Faucet &#8599;</a>
            or <a class="faucetlink" target="_blank" href="https://fauceth.komputing.org/">Komputing's Faucet &#8599;</a>
          </span>
          <span v-if="chainId == 3">
            <a class="faucetlink" target="_blank" href="https://faucet.egorfine.com/">Get test Ropsten ETH from Egor Egorov's Facuet &#8599;</a>
          </span>
          <span v-if="chainId == 28">
            Get Rinkeby ETH from <a class="faucetlink" target="_blank" href="https://faucets.chain.link/rinkeby">Chainlink &#8599;</a>
            or <a class="faucetlink" target="_blank" href="https://fauceth.komputing.org/">Komputing &#8599;</a> then use
            <a class="faucetlink" target="_blank" href="https://gateway.rinkeby.boba.network/">Boba Gateway</a>
          </span>
          <span v-if="chainId == 42">
            Get test Kavan ETH from <a class="faucetlink" target="_blank" href="https://faucets.chain.link/kovan">Chainlink's Facuet &#8599;</a>
          </span>
          <span v-if="chainId == 69">
            Get test ETH from a <a class="faucetlink" target="_blank" href="https://kovan.optifaucet.com/">OptiFacuet &#8599;</a>
             or <a class="faucetlink" target="_blank" href="https://optimismfaucet.xyz/">OptimismFaucet &#8599;</a>
          </span>
          <span v-if="chainId == 97">
            <a class="faucetlink" target="_blank" href="https://testnet.binance.org/faucet-smart/">Get test BNB from a Binance's Faucet &#8599;</a>
          </span>
          <span v-if="chainId == 599">
            Get Metis tokens with the <a class="faucetlink" target="_blank" href="https://goerli.faucet.metisdevops.link/">Goerli Facuet &#8599;</a>
          </span>
          <span v-if="chainId == 1285">
            Trade for MORV tokens with the <a class="faucetlink" target="_blank" href="https://moonbeam.network/networks/moonriver/">Moonbeam App &#8599;</a>
          </span>
          <span v-if="chainId == 1287">
            Get DEV tokens by
            <a class="faucetlink" target="_blank" href="https://docs.moonbeam.network/builders/get-started/networks/moonbase/">following this documentation &#8599;</a>.
          </span>
          <span v-if="chainId == 71401">
            Get CKB from the
            <a class="faucetlink" target="_blank" href="https://faucet.nervos.org/">Nervos faucet &#8599;</a>
            then use the
            <a class="faucetlink" target="_blank" href="https://testnet.bridge.godwoken.io">Godwoken Bridge &#8599;</a> .
          </span>
          <span v-if="chainId == 381932">
            Get METAL tokens from the
            <a class="faucetlink" target="_blank" href="https://t.me/protonxpr/">Proton Developers Telegram</a>
          </span>
          <span v-if="chainId == 11155111">
            <a class="faucetlink" target="_blank" href="https://sepolia-faucet.com/">Get test ETH from Sepolia Faucet &#8599;</a>
          </span>
          <span v-if="chainId == 15555">
            <a class="faucetlink" target="_blank" href="https://faucet.testnet-dev.trust.one/">Get test TrustEVM from Faucet &#8599;</a>
          </span>
          <span v-if="chainId == 80001">
            <a class="faucetlink" target="_blank" href="https://faucet.polygon.technology/">Get test MATIC from a Polygon's Faucet &#8599;</a>
          </span>
          <span v-if="chainId == 421611">
            <a class="faucetlink" target="_blank" href="https://rinkebyfaucet.com/">Get test ETH from a Faucet &#8599;</a> then transfer using
            <a target="_blank" href="https://bridge.arbitrum.io/">Arbitrum's Bridge &#8599;</a>
          </span>
          <span v-if="chainId == 1666700000">
            <a class="faucetlink" target="_blank" href="https://faucet.pops.one/">Get test ONE from a Harmony's Faucet &#8599;</a>
          </span>
        </div>

        <div class="item">
          <span class="name">Contracts:</span>
          <span v-if="contractsLoaded"><b>Found</b></span>
          <span v-else>Missing Contracts</span>
        </div>
        <div class="item">
          <span class="name">Credits Token:</span>
          <span class="tracker"> <a class="tracker" v-if="networkData[chainId]" :href="networkData[chainId].explorer[0] + '/address/' + creditTokenAddress" target="_blank">{{ creditTokenAddress }}</a></span>
          <span>
            <a v-if="creditTokenAddress" title="Import tokens to your wallet." class="littlebutton" v-on:click.prevent="addCreditsToken()">import 	&#65291;</a>
            <a v-if="creditTokenAddress" title="Swap tokens on Sushi" class="littlebutton" :href="'https://app.sushi.com/swap?inputCurrency=&outputCurrency=' + creditTokenAddress" target="_blank">swap 	&#8644;</a>
          </span>
        </div>
        <div class="item">
          <span class="name">Planet NFTs:</span>
          <span class="tracker"> <a class="tracker" v-if="networkData[chainId]" :href="networkData[chainId].explorer[0] + '/address/' + planetTokenAddress" target="_blank">{{ planetTokenAddress }}</a></span>
        </div>
        <div class="item">
          <span class="name">Ship NFTs:</span>
          <span class="tracker"> <a class="tracker" v-if="networkData[chainId]" :href="networkData[chainId].explorer[0] + '/address/' + shipTokenAddress" target="_blank">{{ shipTokenAddress }}</a></span>
        </div>
        <div class="item">
          <span class="name">Avatars:</span>
          <span class="tracker"> <a class="tracker" v-if="networkData[chainId]" :href="networkData[chainId].explorer[0] + '/address/'  + avatarAddress" target="_blank">{{ avatarAddress }}</a></span>
        </div>
        <div class="item">
          <span class="name">Galaxy:</span>
          <span class="tracker"> <a class="tracker" v-if="networkData[chainId]" :href="networkData[chainId].explorer[0] + '/address/' + galaxyAddress" target="_blank">{{ galaxyAddress }}</a></span>
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
      <div class="errormessage" v-if="!web3Loaded">Unable to load Web3 Library</div>
      <div class="errormessage" v-else-if="!(account > 0)">No account found, do you have a wallet provider?</div>
      <div class="errormessage" v-else-if="!contractsLoaded">Contracts not found. You may be on an unsupported network or the network may be unreachable.</div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'

export default {
  components: {
  },
  name: 'howtoweb3',
  data () {
    return {
    }
  },
  created: function () {
    this.setDefaultAccount()
  },
  methods: {
    ...mapActions([
      'setDefaultAccount',
      'initContracts'
    ]),
    ...mapActions('GameState', [
      'loadGameState',
    ]),
    ...mapMutations([
      'setPlayerReady'
    ]),
    ...mapMutations('Config', [
      'setGraphicsQuality',
    ]),
    async connectNetwork(chainId) {
      if (!this.networkData[chainId]) {
        console.log('no chain! ' + chainId)
        return
      }
      try {
        await window.ethereum.currentProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: this.networkData[chainId].hexId }]
        });
      } catch (error) {
        console.log('Error', error.message)
        if (confirm('Chain not found in your wallet. Would you like us to try to add it?')) {

          let data = [{
            chainId: this.networkData[chainId].hexId,
            chainName: this.networkData[chainId].name,
            nativeCurrency: this.networkData[chainId].currency,
            rpcUrls: this.networkData[chainId].rpc,
            blockExplorerUrls: this.networkData[chainId].explorer
          }]
          try {
            await window.ethereum.currentProvider.request({
              method: 'wallet_addEthereumChain',
              params: data
            });
          } catch (error) {
            alert('We were unable to add the network.')
          }

        }
      }
    },
    async addCreditsToken() {
      try {
        await window.ethereum.currentProvider.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20', // Initially only supports ERC20, but eventually more!
            options: {
              address: this.creditTokenAddress,
              symbol: 'OBTR8',
              decimals: 0,
              image: 'https://orbiter8.com/tokens/orbiter-8-credits.png'
            },
          },
        });

      } catch (error) {
        console.log(error);
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
    ...mapGetters([
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
      'balance'
    ]),
    ...mapGetters('GameState', [
      'gameDataLoaded',
      'haveAvatar',
      'haveShip',
      'avatar',
    ]),
    ...mapGetters('Config', [
      'graphicsQuality'
    ]),
    isSupportedNetwork() {
      let supportedNetworks = [
        '4', '3', '28', '42', '97',
        '1287', '1297', '1285', '71401', '80001',
        '599', '421611', '1666700000',
        '11155111', '381932'
      ]
      let supported = false
      supportedNetworks.forEach(element => {
        if (this.chainId == element) {
          supported = true
        }
      })
      return supported
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
  a.littlebutton {
    margin: 0px 0.2em 0 0.2em;
    padding: 1px 10px;
    text-decoration: none;
    border-radius: 8px;
    font-size: 0.8em;
    border: 1px solid #666;
    color: #aaa;
    background: #222;
  }
  a.littlebutton:hover {
    cursor: pointer;
    border: 1px solid #888;
    color: #fff;
    background: #000;
  }
  a.selectednetwork {
    border: 1px solid #f8f;
    color: #fff;
  }
  a.deadnetwork {
    border: 1px solid #444;
    color: #444;
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
