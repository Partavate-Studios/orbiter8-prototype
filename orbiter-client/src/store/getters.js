export default {
  readyToPlay: state => {
    if (state.web3Loaded && state.contractsLoaded && state.account > 0) {
      return true
    }
    return false
  },
  web3Loaded: state => state.web3Loaded,
  chainId: state => state.chainId,
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
  contractsLoaded: state => state.contractsLoaded,
  blockId: state => state.currentBlockId,
  account: state => state.account,
  playerReady: state => state.playerReady,
  creditTokenAddress: state => state.creditTokenAddress,
  shipTokenAddress: state => state.shipTokenAddress,
  planetTokenAddress: state => state.planetTokenAddress,
  galaxyAddress: state => state.galaxyAddress,
  avatarAddress: state => state.avatarAddress,
  balance: state => state.balance
}
