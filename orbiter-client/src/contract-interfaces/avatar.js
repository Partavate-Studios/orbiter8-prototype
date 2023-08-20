import contract from '@truffle/contract'
import AvatarContract from '../contract-artifacts/AvatarControls.json'

const Avatars = {
  contract: null,
  instance: null,

  init: function () {
    let self = this
    console.log('init avatar interface...')
    return new Promise(function (resolve) {
      self.contract = contract(AvatarContract)
      self.contract.setProvider(window.web3.currentProvider)
      self.contract.deployed().then(instance => {
        console.log('... got avatar interface')
        self.instance = instance
        resolve()
      }).catch(err => {
        console.log('!!! no avatar instance', err.message)
        //reject(err)
      })
    })
  },

  getEvents: function() {
    let self = this
    let options = {
      filter: {},
      fromBlock: 'latest',                  //Number || "earliest" || "pending" || "latest"
      toBlock: 'latest'
    }
    return new Promise(function (resolve, reject) {
        self.instance.getPastEvents(
          'New',
          options
        ).then(result => {
          resolve(result)
        }).catch(err => {
          console.log(err)
          reject(err)
        })
    })

  },

  createAvatar: function (name, account) {
    let self = this
    return new Promise((resolve, reject) => {
      self.instance.createAvatar(
        name,
        {from: account}
      ).then(result => {
        resolve(result)
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    })
  },

  getMyAvatarName: function (account) {
    let self = this
    return new Promise((resolve, reject) => {
      self.instance.getMyAvatarName(
        {from: account}
      ).then(result => {
        //console.log(JSON.stringify(result))
        resolve(result)
      }).catch(err => {
        //console.log(JSON.stringify(err))
        reject(err)
      })
    })
  },

  getAvatarNameByAddress: function (owner, account) {
    let self = this
    return new Promise((resolve, reject) => {
      self.instance.getAvatarNameByAddress(
        owner,
        {from: account}
      ).then(result => {
        //console.log(JSON.stringify(result))
        resolve(result)
      }).catch(err => {
        //console.log(JSON.stringify(err))
        reject(err)
      })
    })
  },

  haveAvatar: function (account) {
    let self = this
    return new Promise((resolve, reject) => {
      self.instance.haveAvatar(
        {from: account}
      ).then(result => {
        //console.log('Avatar check success: ' + JSON.stringify(result))
        resolve(result)
      }).catch(err => {
        //console.log('Avatar check fail: ' + JSON.stringify(err))
        reject(err)
      })
    })
  },

  getAvatarCount: function (account) {
    let self = this
    return new Promise((resolve, reject) => {
      self.instance.getAvatarCount(
        {from: account}
      ).then(result => {
        console.log('Avatar count success: ' + JSON.stringify(result))
        resolve(result)
      }).catch(err => {
        console.log('Avatar count fail: ' + JSON.stringify(err))
        reject(err)
      })
    })
  }
}

export default Avatars
