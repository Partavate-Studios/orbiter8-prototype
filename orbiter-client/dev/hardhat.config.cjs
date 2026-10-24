// Local chain for playing and testing Orbiter 8 without a wallet extension or testnet funds.
// Chain 1337 matches the old Truffle dev network. Accounts are Hardhat test accounts: never use them on a real network.
module.exports = {
  networks: {
    hardhat: {
      chainId: 1337,
      hardfork: 'shanghai',
      blockGasLimit: 100000000,
      // Orbiter8 is ~24.2 KB, right at the 24 KB limit; don't let a tiny change make it undeployable locally.
      allowUnlimitedContractSize: true,
      accounts: { mnemonic: 'myth like bonus scare over problem client lizard pioneer submit female collect' }
    }
  }
}
