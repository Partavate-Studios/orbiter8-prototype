import contract from '@truffle/contract'
import StarSystemContract from '../contract-artifacts/Orbiter8.json'

const Galaxy = {
  contract: null,
  instance: null,

  init: function () {
    let self = this
    console.log('init galaxy interface...')
    return new Promise(function (resolve) {
      self.contract = contract(StarSystemContract)
      self.contract.setProvider(window.web3.currentProvider)
      self.contract.deployed().then(instance => {
        console.log('... got galaxy interface')
        self.instance = instance
        resolve()
      }).catch(err => {
        console.log('!!! no galaxy instance', err.message)
        //reject(err)
      })
    })
  },

  getEvents: function(name, from) {
    let self = this
    let options = {
      filter: {},
      fromBlock: from,                  //Number || "earliest" || "pending" || "latest"
      toBlock: 'latest'
    }
    return new Promise(function (resolve, reject) {
        self.instance.getPastEvents(
          name,
          options
        ).then(result => {
          resolve(result)
        }).catch(err => {
          console.log(err)
          reject(err)
        })
    })

  },

  sendChat: function (message, account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.sendChat(message, {from: account}).then(result => {
        resolve(result)
      }).catch(err => {
        console.log('problem sending chat: ' + err.message)
      })
    })
  },


  getPlanetToken: function (account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.getPlanetTokenizer(
        {from: account}
      ).then(result => {
        resolve(result)
      }).catch(err => {
        console.log('Error getting planet token address: ' + err.message)
      })
    })
  },

  getShipToken: function (account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.getShipTokenizer(
        {from: account}
      ).then(result => {
        resolve(result)
      }).catch(err => {
        console.log('Error getting planet token address: ' + err.message)
      })
    })
  },

  getCreditToken: function (account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.getCreditTokenizer(
        {from: account}
      ).then(result => {
        resolve(result)
      }).catch(err => {
        console.log('Error getting planet token address: ' + err.message)
      })
    })
  },

  genesis: function (account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.genesis(
        {from: account}
      ).then(result => {
        resolve(result)
      }).catch(err => {
        console.log('Error attempting genesis: ' + err.message)
      })
    })
  },

  makeSolarSystem: function (account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.makeSolarSystem(
        {from: account}
      ).then(result => {
        resolve(result)
      }).catch(err => {
        console.log('Error attempting makeSolarSystem: ' + err.message)
      })
    })
  },

  myBalance: function (account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.myBalance(
        {from: account}
      ).then(result => {
        console.log('credit check ' + result)
        resolve(result)
      }).catch(err => {
        console.log('Error attempting to get balance: ' + err.message)
      })
    })
  },

  moveToSystem: function (system, account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.moveToSystem(
        system,
        {from: account}
      ).then(result => {
        resolve(result)
      }).catch(err => {
        console.log('Error attempting to move: ' + err.message)
      })
    })
  },

  renameStar: function (name, account) {
    let self = this
    return new Promise((resolve) => {
      console.log('renaming system star to ' + name)
      self.instance.renameStar(name, {from: account}).then(result => {
        resolve(result)
      }).catch(err => {
        console.log('problem renaming star: ' + err.message)
      })
    })
  },

  getSystemCount: function (account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.getSystemCount({from: account}).then(count => {
        resolve(count)
      }).catch(err => {
        console.log('Get system count error: ' + err.message)
      })
    })
  },

  getPlayerSystemData: function (account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.getPlayerSystemData({from: account}).then(data => {
        resolve(data)
      }).catch(err => {
        console.log('get player system data error: ' + err.message)
      })
    })
  },

  getSystemName: function (systemId, account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.getSystemName(systemId, {from: account}).then(name => {
        resolve(name)
      }).catch(err => {
        console.log('get player system data error: ' + err.message)
      })
    })
  },

  getPlanet: function (planetId, account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.getPlanet(planetId, {from: account}).then(planet => {
        resolve(planet)
      }).catch(err => {
        console.log('problem getting planet: ' + err.message)
      })
    })
  },

  claimPlanet: function (planetId, name, account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.claimPlanet(planetId, name, {from: account}).then(result => {
        resolve(result)
      }).catch(err => {
        console.log('problem claiming planet: ' + err.message)
      })
    })
  },

  buildStation: function (planetId, name, account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.buildStation(planetId, name, {from: account}).then(result => {
        resolve(result)
      }).catch(err => {
        console.log('problem building station: ' + err.message)
      })
    })
  },

  renamePlanet: function (planetId, name, account) {
    let self = this
    return new Promise((resolve) => {
      console.log('planet ' + planetId + '  ' + name)
      self.instance.renamePlanet(planetId, name, {from: account}).then(result => {
        resolve(result)
      }).catch(err => {
        console.log('problem renaming planet: ' + err.message)
      })
    })
  },

  getMoon: function (planetId, moonId, account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.getMoon(planetId, moonId, {from: account}).then(moon => {
        resolve(moon)
      }).catch(err => {
        console.log('problem getting moon: ' + err.message)
      })
    })
  },

  renameMoon: function (planetId, moonId, name, account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.renameMoon(planetId, moonId, name, {from: account}).then(result => {
        resolve(result)
      }).catch(err => {
        console.log('problem renaming moon: ' + err.message)
      })
    })
  },

  getStation: function (planetId, account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.getStation(planetId, {from: account}).then(station => {
        resolve(station)
      }).catch(err => {
        console.log('problem getting station #' + planetId + ' : ' + err.message)
      })
    })
  },

  renameStation: function (planetId, name, account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.renameStation(planetId, name, {from: account}).then(result => {
        resolve(result)
      }).catch(err => {
        console.log('problem renaming station: #' + planetId + ' : ' + err.message)
      })
    })
  },

  tradeAtPort: function (planetId, equipment, fuel, organics, account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.tradeAtPort(planetId, equipment, fuel, organics, {from: account}).then((result) => {
        resolve(result)
      }).catch(err => {
        console.log('problem getting ship: ' + err.message)
      })
    })
  },

  getShip: function (shipId, account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.getShip(shipId, {from: account}).then(ship => {
        resolve(ship)
      }).catch(err => {
        console.log('problem getting ship: ' + err.message)
      })
    })
  },

  getMyShipLocation: function (account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.getMyShipLocation({from: account}).then(loc => {
        resolve(loc)
      }).catch(err => {
        console.log('problem getting ship location: ' + err.message)
      })
    })
  },

  getMyShipId: function (account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.getMyShipId({from: account}).then(ship => {
        resolve(ship)
      }).catch(err => {
        console.log('problem getting ship id: ' + err.message)
      })
    })
  },

  getMyShip: function (account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.getMyShip({from: account}).then(ship => {
        resolve(ship)
      }).catch(err => {
        console.log('problem getting own ship: ' + err.message)
      })
    })
  },

  launchShip: function (name, account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.launchShip(name, {from: account}).then(result => {
        resolve(result)
      }).catch(err => {
        console.log('problem getting ship: ' + err.message)
      })
    })
  },

  //TODO: should be renameMyShip
  renameMyShip: function (name, account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.renameMyShip(name, {from: account}).then(result => {
        resolve(result)
      }).catch(err => {
        console.log('problem renaming ship: ' + err.message)
      })
    })
  },

  //TODO: should be renameMyShip
  addHoldsToShip: function (planetId, holds, account) {
    let self = this
    return new Promise((resolve) => {
      self.instance.addHoldsToShip(planetId, holds, {from: account}).then(result => {
        resolve(result)
      }).catch(err => {
        console.log('problem adding hold ' + err.message)
      })
    })
  }

}

export default Galaxy
