const HDWalletProvider = require('@truffle/hdwallet-provider');
const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  contracts_build_directory: "./orbiter-client/src/contract-artifacts",
  networks: {
    development: {
      host: "127.0.0.1",
      network_id: '*',
      port: 9545,
      gas: 0xfffffffffff,	// <-- Use this high gas value
      gasPrice: 0x01,	// <-- Use this low gas price
    },

    main: {
      provider: function() {
        return new HDWalletProvider(
          process.env.PRIVATEKEY,
          "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
        )
      },
      network_id: '1',
      skipDryRun: true,
      gas: 6500000,           // Default gas to send per transaction
      gasPrice: 100000000000,  // 10 gwei (default: 20 gwei)
    },
    nomad: {
      provider: function() {
        return new HDWalletProvider(
          process.env.PRIVATEKEY,
          "http://nomad.local/rpc"
        );
      },
      network_id: '1337'
    },
    mumbai: {
      provider: () => new HDWalletProvider(
        process.env.PRIVATEKEY,
        "https://matic-mumbai.chainstacklabs.com/"),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 20000,
      skipDryRun: true,
      gas: 6000000,
      gasPrice: 10000000000,
    },
    partavateRopsten: {
      provider: function() {
        return new HDWalletProvider(
          process.env.PRIVATEKEY,
          "http://ropsten.partavate.com/rpc"
        )
      },
      network_id: '3',
      skipDryRun: true,
      confirmations: 2
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(
          process.env.PRIVATEKEY,
          "https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
        )
      },
      network_id: '3',
      skipDryRun: true,
      confirmations: 10
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(
          process.env.PRIVATEKEY,
          "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
        )
      },
      network_id: '4',
      skipDryRun: true,
      confirmations: 10
    },
    partavateRinkeby: {
      provider: function() {
        return new HDWalletProvider(
          process.env.PRIVATEKEY,
          "http://rinkeby.partavate.com/rpc"
        )
      },
      network_id: '4',
      skipDryRun: true,
      confirmations: 10
    },
    kovan: {
      provider: function() {
        return new HDWalletProvider(
          process.env.PRIVATEKEY,
          "https://kovan.poa.network/"
        )
      },
      network_id: '42',
      networkCheckTimeout: 3000000,
      timeoutBlocks: 600,
      confirmations: 0,
      deploymentPollingInterval: 8000,
      skipDryRun: true,
    },
    binanceTest: {
      provider: function() {
        return new HDWalletProvider(
          process.env.PRIVATEKEY,
          "https://data-seed-prebsc-1-s1.binance.org:8545/"
        )
      },
      network_id: '97',
      skipDryRun: true,
      confirmations: 2

    },
    harmonyTest: {
      provider: () => {
        return new HDWalletProvider({
          privateKeys: [process.env.PRIVATEKEY],,
          providerOrUrl: 'https://api.s0.b.hmny.io/'
        });
      },
      network_id: 1666700000,
      networkCheckTimeout: 3000000,
      timeoutBlocks: 300
    },
    bobaTest: {
      provider: () => {
        return new HDWalletProvider({
          privateKeys: [process.env.PRIVATEKEY],,
          providerOrUrl: 'https://rinkeby.boba.network'
        });
      },
      network_id: 28,
      networkCheckTimeout: 3000000,
      gas: 11000000,
      timeoutBlocks: 600,
//      confirmations: 1,
      deploymentPollingInterval: 8000,
      skipDryRun: true,
    },
    metistest: {
      provider: () => {
        return new HDWalletProvider({
          privateKeys: [process.env.PRIVATEKEY],,
          providerOrUrl: 'https://goerli.gateway.metisdevops.link'
        });
      },
      network_id: 599,
      networkCheckTimeout: 3000000,
      timeoutBlocks: 600,
      deploymentPollingInterval: 8000,
      skipDryRun: true,
    },
    arbitrumTest: {
      provider: () => {
        return new HDWalletProvider({
          privateKeys: [process.env.PRIVATEKEY],,
          providerOrUrl: 'https://rinkeby.arbitrum.io/rpc'
        });
      },
      network_id: 421611,
      skipDryRun: true,
      confirmations: 0,
      deploymentPollingInterval: 8000,
      networkCheckTimeout: 3000000,
      timeoutBlocks: 600,
      gas: 60000000,
    },
    optimismTest: {
      provider: () => {
        return new HDWalletProvider({
          privateKeys: [process.env.PRIVATEKEY],,
          providerOrUrl: 'https://kovan.optimism.io'
        });
      },
      network_id: 69,
      skipDryRun: true,
      confirmations: 1,
      deploymentPollingInterval: 8000,
      networkCheckTimeout: 3000000,
      timeoutBlocks: 600,
      gas: 15000000,
    },
    moonbase: {
      provider: () => {
        return new HDWalletProvider({
          privateKeys: [process.env.PRIVATEKEY],,
          providerOrUrl: 'https://moonbase-alpha.blastapi.io/b56cff2d-5539-43e8-81a9-875fb74ae2f0'
        });
      },
      network_id: 1287,
      skipDryRun: true,
      confirmations: 0,
      deploymentPollingInterval: 8000,
      networkCheckTimeout: 3000000,
      timeoutBlocks: 600
    },
    moonriver: {
      provider: () => {
        return new HDWalletProvider({
          privateKeys: [process.env.PRIVATEKEY],,
          providerOrUrl: 'https://moonriver.blastapi.io/b56cff2d-5539-43e8-81a9-875fb74ae2f0'
        });
      },
      network_id: 1285,
      skipDryRun: true,
      confirmations: 1,
      deploymentPollingInterval: 8000,
      networkCheckTimeout: 3000000,
      timeoutBlocks: 600
    },
    godwoken: {
      provider: () => {
        return new HDWalletProvider({
          privateKeys: [process.env.PRIVATEKEY],,
          providerOrUrl: 'https://v1.testnet.godwoken.io/rpc'
        });
      },
      network_id: 71401,
      skipDryRun: true,
      confirmations: 4,
      gas: 44000000,
      deploymentPollingInterval: 8000,
      networkCheckTimeout: 3000000,
      timeoutBlocks: 600
    },
    trusttest: {
      provider: () => {
        return new HDWalletProvider({
          privateKeys: [process.env.PRIVATEKEY],,
          providerOrUrl: 'https://api.testnet-dev.trust.one'
        });
      },
      network_id: 15555,
      skipDryRun: true,
      confirmations: 1,
      deploymentPollingInterval: 12000,
      networkCheckTimeout: 9000000,
      timeoutBlocks: 900
    },
    metaltest: {
      provider: () => {
        return new HDWalletProvider({
          privateKeys: [process.env.PRIVATEKEY],,
          providerOrUrl: 'https://tahoe.metalblockchain.org/ext/bc/C/rpc'
        });
      },
      network_id: 381932,
      skipDryRun: true,
      confirmations: 0,
      deploymentPollingInterval: 8000,
      networkCheckTimeout: 3000000,
      timeoutBlocks: 600
    },
    sepoliatest: {
      provider: () => {
        return new HDWalletProvider({
          privateKeys: [process.env.PRIVATEKEY],,
          providerOrUrl: 'https://rpc.sepolia.org/'
        });
      },
      network_id: 11155111,
      skipDryRun: true,
      confirmations: 1,
      deploymentPollingInterval: 8000,
      networkCheckTimeout: 3000000,
      timeoutBlocks: 600
    },
    bobabase: {
      provider: () => {
        return new HDWalletProvider({
          privateKeys: [process.env.PRIVATEKEY],,
          providerOrUrl: 'https://bobabase.boba.network/b56cff2d-5539'
        });
      },
      network_id: 1297,
      skipDryRun: true,
//      confirmations: 1,
//      deploymentPollingInterval: 8000,
//      networkCheckTimeout: 3000000,
//      timeoutBlocks: 600
    },
  },
  compilers: {
    solc: {
      version: "0.5.16",
      settings: {
        optimizer: {
          enabled: true, // Default: false
          runs: 1000      // Default: 200
        },
      }
    }
  },
  ens: {
    enabled: false
  },
  mocha: {
    reporter: "eth-gas-reporter",
    reporterOptions: {
      maxMethodDiff: 25,
    }
  },
  plugins: [
    'truffle-contract-size',
    'truffle-plugin-verify'
  ],
  api_keys: {
    etherscan: '',
    bscscan: '',
    moonscan: '',
    polygonscan: '',
    arbiscan: ''
  }
};