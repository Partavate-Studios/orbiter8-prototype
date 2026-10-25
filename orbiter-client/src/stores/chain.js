import { defineStore } from 'pinia'
import Web3 from 'web3'
import AvatarContract from '@/contract-interfaces/avatar'
import GalaxyContract from '@/contract-interfaces/galaxy'
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

    networks: {
      '1337': {
        name: 'Truffle',
        shortName: 'Ethereum',
        id: '1337',
        hexId: '0x539',
        currency: {
          name: 'DEV',
          symbol: 'DEV',
          decimals: 18
        },
        rpc: ['http://127.0.0.1:9545/'],
        explorer: [],
      },
      '1': {
        name: 'Ethereum Main Net',
        shortName: 'Ethereum',
        id: '1',
        hexId: '0x1',
        currency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18
        },
        rpc: ['https://mainnet.infura.io/v3/'],
        explorer: ['https://ropsten.etherscan.io']
      },
      '2': {
        name: 'Deprecated Morden Testnet',
        shortName: 'Deprecated',
        id: '2',
        hexId: '0x2',
        currency: {
          name: 'Deprecated',
          symbol: 'ETH',
          decimals:18
        },
        rpc: [''],
        explorer: ['']
      },
      '3': {
        name: 'Ethereum Ropsten Testnet',
        shortName: 'Ropsten',
        id: '3',
        hexId: '0x3',
        currency: {
          name: 'Ropsten Ether',
          symbol: 'ETH',
          decimals:18
        },
        rpc: ['https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
        explorer: ['https://ropsten.etherscan.io']
      },
      '4': {
        name: 'Ethereum Rinkeby Testnet',
        shortName: 'Rinkeby',
        id: '4',
        hexId: '0x4',
        currency: {
          name: 'Rinkeby Ether',
          symbol: 'ETH',
          decimals: 18
        },
        rpc: ['https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
        explorer:['https://rinkeby.etherscan.io']
      },
      '28': {
        name: 'Boba Rinkeby Testnet',
        shortName: 'BobaRinkeby',
        id: '28',
        hexId: '0x1C',
        currency: {
          name: 'Boba Ether',
          symbol: 'ETH',
          decimals: 18
        },
        rpc: ['https://rinkeby.boba.network'],
        explorer: ['https://blockexplorer.rinkeby.boba.network']
      },
      '42': {
        name: 'Ethereum Kovan Testnet',
        shortName: 'Kovan',
        id: '42',
        hexId: '0x2A',
        currency: {
          name: 'Kovan Ether',
          symbol: 'ETH',
          decimals: 18
        },
        rpc: ['https://kovan.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
        explorer: ['https://kovan.etherscan.io']
      },
      '61': {
        name: 'Ethereum Classic',
        shortName: 'EthClassic',
        id: '61',
        hexId: '0x3D',
        currency: {
          name: 'ETH Classic',
          symbol: 'ETC',
          decimals: 18
        },
        rpc: ['https://www.ethercluster.com/etc'],
        explorer:['https://blockscout.com/etc/mainnet/']
      },
      '69': {
        name: 'Optimism Kovan Testnet',
        shortName: 'Optimism',
        id: '69',
        hexId: '0x45',
        currency: {
          name: 'Optimism Ether',
          symbol: 'ETH',
          decimals: 18
        },
        rpc: ['https://kovan.optimism.io'],
        explorer:['https://kovan-optimistic.etherscan.io']
      },
      '97': {
        name: 'Binance Smartchain Testnet',
        shortName: 'Binance',
        id: '97',
        hexId: '0x61',
        currency: {
          name: 'Binance Coin',
          symbol: 'BNB',
          decimals: 18
        },
        rpc: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
        explorer:['https://testnet.bscscan.com']
      },
      '599': {
        name: 'Goerli Metis Testnet',
        shortName: 'Metis',
        id: '599',
        hexId: '0x257',
        currency: {
          name: 'Metis',
          symbol: 'Met',
          decimals: 18
        },
        rpc: ['https://goerli.gateway.metisdevops.link'],
        explorer:['https://goerli.explorer.metisdevops.link']
      },
      '1284': {
        name: 'Moonbeam',
        shortName: 'Moonbeam',
        id: '1284',
        hexId: '0x504',
        currency: {
          name: 'GLMR',
          symbol: 'GLMR',
          decimals: 18
        },
        rpc: ['https://rpc.api.moonbeam.network'],
        explorer:['https://moonscan.io']
      },
      '1285': {
        name: 'Moonriver Alpha',
        shortName: 'Moonriver',
        id: '1285',
        hexId: '0x505',
        currency: {
          name: 'MOVR',
          symbol: 'MOVR',
          decimals: 18
        },
        rpc: ['https://rpc.api.moonriver.moonbeam.network'],
        explorer:['https://moonriver.moonscan.io']
      },
      '1287': {
        name: 'Moonbase Alpha',
        shortName: 'Moonbase',
        id: '1287',
        hexId: '0x507',
        currency: {
          name: 'DEV MOVR',
          symbol: 'DEV',
          decimals: 18
        },
        rpc: ['https://rpc.api.moonbase.moonbeam.network'],
        explorer:['https://moonbase.moonscan.io']
      },
      '1297': {
        name: 'Bobabase Test Network',
        shortName: 'Bobabase',
        id: '1297',
        hexId: '0x511',
        currency: {
          name: 'GLMRDEV',
          symbol: 'DEV',
          decimals: 18
        },
        rpc: ['https://bobabase.boba.network'],
        explorer: ['https://blockexplorer.bobabase.boba.network']
      },
      '4447': {
        name: 'Truffle Development Network',
        shortName: 'Truffle',
        id: '4447',
        hexId: '0x115F',
        currency: {
          name: 'Truffle Ether',
          symbol: 'ETH',
          decimals: 18
        },
        rpc: [''],
        explorer: ['']
      },
      '5777': {
        name: 'Ganache Development Network',
        shortName: 'Ganache',
        id: '5777',
        hexId: '0x1691',
        currency: {
          name: 'Ganache Ether',
          symbol: 'ETH',
          decimals: 18
        },
        rpc: [''],
        explorer: ['']
      },
      '71401': {
        name: 'Godworken Testnet',
        shortName: 'Godwoken',
        id: '71401',
        hexId: '0x116E9',
        currency: {
          name: 'Polyjuice',
          symbol: 'pCKB',
          decimals: 18
        },
        rpc: ['https://v1.testnet.godwoken.io/rpc'],
        explorer: ['https://v1.testnet.gwscan.com/']
      },
      '15555': {
        name: 'Trust EVM Testnet',
        shortName: 'TrustEVM',
        id: '15555',
        hexId: '0x3CC3',
        currency: {
          name: 'Trust EVM',
          symbol: 'EVM',
          decimals: 18
        },
        rpc: ['https://api.testnet-dev.trust.one'],
        explorer: ['https://trustscan.one/']
      },
      '80001': {
        name: 'Polygon Mumbai Testnet',
        shortName: 'Mumbai',
        id: '80001',
        hexId: '0x13881',
        currency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18
        },
        rpc: ['https://rpc-mumbai.maticvigil.com/'],
        explorer: ['https://mumbai.polygonscan.com']
      },
      '381932': {
        name: 'Metal Tahoe C-Chain',
        shortName: 'Metal',
        id: '381932',
        hexId: '0x5D3EC',
        currency: {
          name: 'METAL',
          symbol: 'METAL',
          decimals: 18
        },
        rpc: ['https://tahoe.metalblockchain.org/ext/bc/C/rpc'],
        explorer: ['https://tahoe.metalscan.io/']

      },
      '421611': {
        name: 'Arbitrum Testnet',
        shortName: 'Arbitrum',
        id: '421611',
        hexId: '0x66EEB',
        currency: {
          name: 'Arbitrum Ether',
          symbol: 'ETH',
          decimals: 18
        },
        rpc: ['https://rinkeby.arbitrum.io/rpc'],
        explorer: ['https://testnet.arbiscan.io']
      },
      '11155111': {
        name: 'Sepolia Testnet',
        shortName: 'Sepolia',
        id: '421611',
        hexId: '0xAA36A7',
        currency: {
          name: 'Arbitrum Ether',
          symbol: 'ETH',
          decimals: 18
        },
        rpc: ['https://rpc.sepolia.org/'],
        explorer: ['https://sepolia.etherscan.io/']
      },


      '1666700000': {
        name: 'Harmony One Testnet',
        shortName: 'Harmony',
        id: '1666700000',
        hexId: '0x6357D2E0',
        currency: {
          name: 'Harmony',
          symbol: 'ONE',
          decimals: 18
        },
        rpc: ['https://api.s0.b.hmny.io/'],
        explorer: ['https://explorer.pops.one']
      },
    }
  }),
  getters: {
    readyToPlay: state => {
      if (state.web3Loaded && state.contractsLoaded && state.account > 0) {
        return true
      }
      return false
    },
    networkName: state => {
      if (state.networks[state.chainId]) {
        return state.networks[state.chainId].name
      } else {
        return state.chainId
      }
    },
    networkData: state => {
      return state.networks
    },
    blockId: state => state.currentBlockId
  },
  actions: {
    /** Init all the things */
    async initWeb3 () {
      console.log('Seeking Web 3 interface...')

      //todo: do I really need to attach this to the window
      //when I can make it a state variable?
      window.ethereum = new Web3(Web3.givenProvider || "ws://localhost:9545")
      window.web3 = window.ethereum

      window.ethereum.eth.getChainId((err, chainId) => {
        if (!err) {
          this.setProp({key: 'chainId', value: chainId})
        } else {
          console.log(err)
        }
      })

      //Set our initial block
      window.ethereum.eth.getBlockNumber((err, blockNumber) => {
        if(!err) {
          this.setProp({key: 'lastBlockNumber', value: blockNumber})
          this.setProp({key: 'web3Loaded', value: true})
          console.log('...web 3 connected')
        } else {
          console.log(err)
        }
      })
  /*
      let subscription = web3Obj.eth.subscribe('logs', {
        address: '0x123456..', //Smart contract address
        topics: ['0x12345...'] //topics for events
    }, function(error, result){
        if (error) console.log(error)
    }).on("data", function(trxData){
      console.log("Event received", trxData)
      //Code from here would be run immediately when event appeared
    }))
  */
    },
    async setDefaultAccount () {

      //this makes metamask mobile work...
      try {
        await window.ethereum.eth.currentProvider.request('eth_requestAccounts')
        console.log('enabled')
        return true}
      catch(e) {
        console.log('did not enable')
      }

      //if the user changes wallets, we just reload
      window.ethereum.eth.currentProvider.on('accountsChanged', function() {location.reload()} )
      window.ethereum.eth.currentProvider.on('chainChanged', function() {location.reload()} )
      window.ethereum.eth.currentProvider.on('disconnect', function() {location.reload()} )

      window.ethereum.eth.currentProvider.on('connect',  function() {
        console.log('connection detected')
      } );

      console.log('attempting to set default account')
      console.log('selectedAddress: ' + window.ethereum.eth.currentProvider.selectedAddress)
      window.ethereum.eth.requestAccounts((err, accounts) => {
        if(!err) {
          //todo: add support to recognize more than one connected account
          this.setProp({key: 'account', value: accounts[0]})
          console.log('Accounts found', [accounts])
          window.ethereum.eth.getBalance(accounts[0], (err, balance) => {
            if (!err) {
              balance = window.web3.utils.fromWei(balance, 'ether');
              this.setProp({key: 'balance', value: balance})
            } else {
              console.log(err)
            }
          })
        } else {
          console.log('Error loading accounts:', err)
        }
      })


    },
    async initContracts () {
      await AvatarContract.init()
      await GalaxyContract.init()

      this.setProp({key: 'avatarAddress', value: AvatarContract.instance.address})
      this.setProp({key: 'galaxyAddress', value: GalaxyContract.instance.address})

      GalaxyContract.getPlanetToken().then(token => {
        this.setProp({key: 'planetTokenAddress', value: token})
      })
      GalaxyContract.getShipToken().then(token => {
        this.setProp({key: 'shipTokenAddress', value: token})
      })
      GalaxyContract.getCreditToken().then(token => {
        this.setProp({key: 'creditTokenAddress', value: token})
      })
      this.setProp({key: 'contractsLoaded', value: true})
    },
    /** game state only changes when a block completes */
    //todo: check into "isSyncing"
    async checkForNewBlock () {
      window.ethereum.eth.getBlockNumber((err, blockNumber) => {
        if(!err) {
          if (this.currentBlockId < blockNumber) {
            console.log('Block increase from ' + this.currentBlockId + ' to ' + blockNumber)
            this.setProp({key: 'currentBlockId', value: blockNumber })
            useGameStateStore().loadGameState()
            useGameStateStore().loadEvents()
            useStarMapStore().loadStarMap()
          }
        }
      })
    },
    setProp ({ key, value }) {
      //console.log('setting props', [key, value])
      this[key] = value
    },
    setPlayerReady () {
      this.playerReady = true
    }
  }
})
