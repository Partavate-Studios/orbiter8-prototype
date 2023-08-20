import Web3 from 'web3'
import AvatarContract from '@/contract-interfaces/avatar'
import GalaxyContract from '@/contract-interfaces/galaxy'

export default {
  /** Init all the things */
  async initWeb3 ({ commit }) {
    console.log('Seeking Web 3 interface...')

    //todo: do I really need to attach this to the window
    //when I can make it a state variable?
    window.ethereum = new Web3(Web3.givenProvider || "ws://localhost:9545")
    window.web3 = window.ethereum

    window.ethereum.eth.getChainId((err, chainId) => {
      if (!err) {
        commit('setProp', {key: 'chainId', value: chainId})
      } else {
        console.log(err)
      }
    })

    //Set our initial block
    window.ethereum.eth.getBlockNumber((err, blockNumber) => {
      if(!err) {
        commit('setProp', {key: 'lastBlockNumber', value: blockNumber})
        commit('setProp', {key: 'web3Loaded', value: true})
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
  async setDefaultAccount ({ commit }) {

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
        commit('setProp', {key: 'account', value: accounts[0]})
        console.log('Accounts found', [accounts])
        window.ethereum.eth.getBalance(accounts[0], (err, balance) => {
          if (!err) {
            balance = window.web3.utils.fromWei(balance, 'ether');
            commit('setProp', {key: 'balance', value: balance})
          } else {
            console.log(err)
          }
        })
      } else {
        console.log('Error loading accounts:', err)
      }
    })


  },
  async initContracts ({ commit }) {
    await AvatarContract.init()
    await GalaxyContract.init()

    commit('setProp', {key: 'avatarAddress', value: AvatarContract.instance.address})
    commit('setProp', {key: 'galaxyAddress', value: GalaxyContract.instance.address})

    GalaxyContract.getPlanetToken().then(token => {
      commit('setProp', {key: 'planetTokenAddress', value: token})
    })
    GalaxyContract.getShipToken().then(token => {
      commit('setProp', {key: 'shipTokenAddress', value: token})
    })
    GalaxyContract.getCreditToken().then(token => {
      commit('setProp', {key: 'creditTokenAddress', value: token})
    })
    commit('setProp', {key: 'contractsLoaded', value: true})
  },
  /** game state only changes when a block completes */
  //todo: check into "isSyncing"
  async checkForNewBlock ({ state, commit, dispatch }) {
    window.ethereum.eth.getBlockNumber((err, blockNumber) => {
      if(!err) {
        if (state.currentBlockId < blockNumber) {
          console.log('Block increase from ' + state.currentBlockId + ' to ' + blockNumber)
          commit('setProp', {key: 'currentBlockId', value: blockNumber })
          dispatch('GameState/loadGameState', null, {root:true})
          dispatch('GameState/loadEvents', null, {root:true})
          dispatch('StarMap/loadStarMap', null, {root:true})
        }
      }
    })
  }
}
