export default class Sprite {
  constructor (type, autoFillValues) {
    //set defaults
    this.objectId = parseInt(autoFillValues.id)
    this.orbiting = 0
    this.distance = 0
    this.speed = 100
    this.rotation = 45
    this.selectorSize = 1
    this.isMine = false
    this.owner = 0,
    this.ownerName = '',
    this.telemetry = {
      translatex: 0,
      translatey: 0,
      rotation: 0
    }
    this.menu = {
      showing: false
    }

    //fill in imported values
    for (let [key, value] of Object.entries(autoFillValues)) {
      if (key != 'gametime') {
        this[key] = value
      }
    }

    //type specific transforms
    this.type = type
    switch (type) {
      case 'star':
        this.selectorSize = this.size * 40,
        this.targetScale = 0.6
        break;
      case 'planet':
        this.distance = 150 + (this.orbitalPosition * 50) + (this.orbitalPosition * this.orbitalPosition * 15)
        this.selectorSize = 14
        this.targetScale = 0.3
        break;
      case 'station':
        this.speed = 3000
        this.orbitalPosition = 0
        this.selectorSize = 12
        this.targetScale = 0.1
        this.telemetry.rotation = -15
        break;
      case 'moon':
        this.speed = this.speed * this.distance
        this.selectorSize = 6
        this.targetScale = 0.05
        break;
      case 'ship':
        this.speed = ((this.id * 25.25) % 10) * 100 + 2000
        //this.distance = 50
        this.size = 10
        this.selectorSize = 10
        this.targetScale = 0.06
        break;
    }
  }

  updateTelemetry (gameTime) {
    let throttle = 0.000000005
    let theta = gameTime * this.speed * throttle % (Math.PI * 2)
    let translatex = this.distance * Math.cos(theta)
    let translatey = this.distance * Math.sin(theta)


    let rad = Math.atan2(translatey, translatex)
    let rotation  = rad * (180 / Math.PI)

    this.telemetry.translatex = translatex
    this.telemetry.translatey = translatey
    if (this.type == 'station') {
      this.telemetry.rotation = -rotation * 4
    } else {
      this.telemetry.rotation = rotation
    }


    return this.telemetry
  }

  openMenu () {
    if (!this.menu.showing) {
      this.menu.showing = true
    }
  }
  closeMenu () {
    if (this.menu.showing) {
      this.menu.showing = false
    }
  }

  //carry over non-chain data from an old sprite
  consumeSpriteData(oldSprite) {
    if (this.matchesSprite(oldSprite)) {
      this.telemetry = oldSprite.telemetry
      this.menu = oldSprite.menu
    }
  }

  matchesSprite(sprite) {
    if ((this.type == sprite.type) && (this.objectId == sprite.objectId)) {
      if ((this.type == 'moon') && (this.planet != sprite.planet)) {
        return false
      }
      return true
    }
    return false
  }

  //todo: this can be created in the constructor and just passed as a var
  getMenu () {
    let menu = []
    switch (this.type) {
      case 'star':
        menu.push({
          text: 'Jump To Neighbor Star',
          enabled: true,
          command: 'jump'
        })
        break

      case 'moon':
        if (this.isMine) {
          menu.push({
            text: 'Build Infrastructure',
            enabled: false,
            command: 'build'
          })
        }
        menu.push({
          text: 'Visit Planet',
          enabled: true,
          command: 'visitPlanet',
          value: this.objectId
        })
        break

      case 'planet':
        console.log('Planet belongs to', this.owner)
        if (parseInt(this.owner) === 0) {
          menu.push({
            text: 'Claim Planet',
            enabled: true,
            command: 'claim',
            value: this.objectId
          })
        } else if (this.isMine) {
          if (!this.hasStation) {
            menu.push({
              text: 'Build Space Station',
              enabled: true,
              command: 'buildStation',
              value: this.objectId
            })
          }
        } else {
          menu.push({
            text: 'Attack',
            enabled: false,
            command: 'attack'
          })
        }
        if (this.hasStation) {
          menu.push({
            text: 'Visit Space Station',
            enabled: true,
            command: 'visitStation',
            value: this.objectId
          })
        }
        if (this.moons.length > 0) {
          menu.push({
            text: 'Visit Moon',
            enabled: true,
            command: 'visitMoon',
            value: this.objectId
          })
        }
        menu.push({
          text: 'View on OpenSea',
          enabled: true,
          command: 'opensea',
          value: this.objectId
        })
        break

      case 'ship':
        if (this.isMine) {
          menu.push({
            text: 'Visit Star',
            enabled: true,
            command: 'jump'
          })
        } else {
          menu.push({
            text: 'Attack',
            enabled: false,
            command: 'attack'
          })
        }
        break

      case 'station':
        if (this.isMine) {
          //todo: more
        }
        menu.push({
          text: 'Trade at Port',
          enabled: false,
          command: 'trade'
        })
        menu.push({
          text: 'Dock at Shipyards',
          enabled: false,
          command: 'shipyards'
        })
        menu.push({
          text: 'Visit Planet',
          enabled: true,
          command: 'visitPlanet',
          value: this.objectId
        })
        break
    }

    if (this.isMine) {
      menu.push({
        text: 'Rename '+ this.type.charAt(0).toUpperCase() + this.type.slice(1),
        enabled: true,
        command: 'rename'
      })
    } else {
      if ((this.owner != null) && (this.owner.length === 0)) {
        menu.push({
          text: 'Claim Ownership',
          enabled: true,
          command: 'claim'
        })
      }
    }

    return menu
  }
}
