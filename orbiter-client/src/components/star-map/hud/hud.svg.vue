<template>
  <g>
    <defs>
      <linearGradient id="profileGradient"
        x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(0)">
          <stop offset="0%" stop-color="#7c39cd" stop-opacity="1"/>
          <stop offset="20%" stop-color="#280b4b" stop-opacity="1"/>
          <stop offset="50%" stop-color="#5c1aae" stop-opacity="1"/>
          <stop offset="80%" stop-color="#280b4b" stop-opacity="1"/>
          <stop offset="100%" stop-color="#7c39cd" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <g  v-if="!isMenuOn">
      <current-system :transform="'translate(' + (rightMostX - 100) + ' ' + (topMostY + 45) + ')'" />

      <g :transform="'translate(' + (profileX) + ' ' + (profileY)  + ')'">
        <g font-size="0.7em" fill="#ffffff88" transform="translate(0 40)">
          <rect x="0" y="-40" width="200" height="100" fill="url(#profileGradient)" stroke="#ffffff22" rx="10" ry="10" stroke-width="1" />
          <rect x="4" y="-36" width="192" height="92" fill="#00000088" stroke="#000000" rx="8" ry="8" stroke-width="1" />
          <text text-anchor="start" transform="translate(35 -20)" fill="#ffffff" font-size="1.2em">{{avatar.name}} </text>
          <text text-anchor="end" transform="translate(70 -04)">Starship:</text>
          <text text-anchor="start" transform="translate(75 -04)"  fill="#ffffff">{{avatar.ship.name}}</text>
          <text text-anchor="end" transform="translate(70 11)">Credits:</text>
          <text text-anchor="start" transform="translate(75 11)" fill="#ffffff" >{{avatar.credits}}&cent;</text>

          <g font-size="0.9em">
            <text text-anchor="end" transform="translate(40 30)" fill="#ffffff">{{ avatar.ship.equipment }}</text>
            <text text-anchor="end" transform="translate(140 30)" fill="#ffffff">{{ avatar.ship.fuel }}</text>
            <text text-anchor="end" transform="translate(40 45)" fill="#ffffff">{{ avatar.ship.organics }}</text>
            <text text-anchor="end" transform="translate(140 45)" fill="#ffffff">{{ avatar.ship.holds - (avatar.ship.equipment + avatar.ship.fuel + avatar.ship.organics) }}</text>
            <text text-anchor="start" transform="translate(45 30)">Equipment</text>
            <text text-anchor="start" transform="translate(145 30)">Fuel</text>
            <text text-anchor="start" transform="translate(45 45)">Organics</text>
            <text text-anchor="start" transform="translate(145 45)">Empty</text>
          </g>
        </g>
      </g>

      <g :transform="'translate(' + (leftMostX + 50) + ' ' + (topMostY + 50)  + ')'">
        <a
          v-on:click.prevent="selectMyShip()"
          cursor="pointer">
          <avatar-icon />
        </a>
      </g>


      <g :transform="'translate(' + (rightMostX - 50) + ' ' + (topMostY + 50)  + ')'">
        <a
          v-on:click.prevent="selectStar()"
          cursor="pointer">
          <jump-icon />
        </a>
      </g>


      <g v-if="false" :transform="'translate(' + (leftMostX + 50) + ' ' + (bottomMostY - 150)  + ')'">
        <a
          v-on:click.prevent="mute()"
          cursor="pointer">
          <speaker-icon />
        </a>
      </g>

      <g :transform="'translate(' + (leftMostX + 50) + ' ' + (bottomMostY - 150)  + ')'">
        <a
          v-on:click.prevent="showChat()"
          cursor="pointer">
          <broadcast-icon />
          <g v-if="chatEventsCount">
            <circle cx=-25 cy=20 fill="#230b41" stroke="#ffffff88" stroke-width="0.5" r="10" />
            <text text-anchor="middle" dominant-baseline="middle" font-size="0.65em" fill="#ffffffaa" transform="translate(-25 20)">{{ chatEventsCount }}</text>
          </g>
        </a>
      </g>


      <zoom-slider transform="translate(0 430) scale(1.5)" />

      <scope-toggle :transform="'translate(' + 0 + ' ' + (bottomMostY - 100)  + ')'" />

      <g :transform="'translate(' + (leftMostX + 50) + ' ' + (bottomMostY - 50)  + ')'">
        <a
          v-on:click.prevent="showSettings()"
          cursor="pointer">
          <gear-icon />
        </a>
      </g>

      <g :transform="'translate(' + (rightMostX - 50) + ' ' + (bottomMostY - 150)  + ')'">
        <a
          v-on:click.prevent="showShips()"
          cursor="pointer">
          <ships-icon />
          <g v-if="shipCount">
            <circle cx=25 cy=20 fill="#230b41" stroke="#ffffff88" stroke-width="0.5" r="10" />
            <text text-anchor="middle" dominant-baseline="middle" font-size="0.65em" fill="#ffffffaa" transform="translate(25 20)">{{ shipCount }}</text>
          </g>
        </a>
      </g>
      <g :transform="'translate(' + (rightMostX - 50) + ' ' + (bottomMostY - 250)  + ')'">
        <a
          v-on:click.prevent="showPlanets()"
          cursor="pointer">
          <planets-icon />
          <g>
            <circle cx=25 cy=20 fill="#230b41" stroke="#ffffff88" stroke-width="0.5" r="10" />
            <text text-anchor="middle" dominant-baseline="middle" font-size="0.65em" fill="#ffffffaa" transform="translate(25 20)">{{ planetCount }}</text>
          </g>
        </a>
      </g>

      <g :transform="'translate(' + (rightMostX - 50) + ' ' + (bottomMostY - 50)  + ')'">
        <a
          v-on:click.prevent="toggleShowLabels()"
          cursor="pointer">
          <info-icon />
        </a>
      </g>

    </g>

    <g v-if="showScope" transform="translate(0 -100)">

      <!-- selected sprite menu -->
      <g v-if="(selected != null)">
        <card-ui :objectId="selected" />
      </g>
      <g v-else>
        <scope />
      </g>

    </g>

    <g>
      <g v-if="menuState.planetsMenu">
        <planets-menu />
      </g>
      <g v-if="menuState.shipsMenu">
        <ships-menu />
      </g>
      <g v-if="menuState.settingsMenu">
        <settings-menu />
      </g>
      <g v-if="menuState.tradeMenu">
        <trade-menu :objectId="selected" />
      </g>
      <g v-if="menuState.shipyardMenu">
        <shipyard-menu :objectId="selected" />
      </g>
      <g v-if="menuState.chatMenu">
        <chat-menu />
      </g>
    </g>


  </g>
</template>

<script>

import { mapGetters, mapMutations } from 'vuex'
import CurrentSystem from './current-system/system.svg'

import ScopeToggle from './toggles/scope-toggle.svg'
import Scope from './scope/scope.svg'
import ZoomSlider from './zoom-slider.svg'
import CardUi from './card-ui/card-ui.svg'
// import SpriteInfo from './scope/sprite-info-box.svg'
// import SpriteMenu from './scope/sprite-menu.svg'
//Icons
// import MyShipIcon from './icons/my-ship-icon.svg'
import AvatarIcon from './icons/avatar-icon.svg'
import GearIcon from './icons/gear-icon.svg'
import InfoIcon from './icons/info-icon.svg'
import JumpIcon from './icons/jump-icon.svg'
import PlanetsIcon from './icons/planets-icon.svg'
import ShipsIcon from './icons/ships-icon.svg'
import SpeakerIcon from './icons/speaker-icon.svg'
import BroadcastIcon from './icons/broadcast-icon.svg'
//Menus
import PlanetsMenu from './menus/planets-menu.svg'
import ShipsMenu from './menus/ships-menu.svg'
import TradeMenu from './menus/trade-menu.svg'
import ShipyardMenu from './menus/shipyard-menu.svg'
import ChatMenu from './menus/chat-menu.svg'
import SettingsMenu from './menus/settings-menu.svg'

export default {
  name: 'Hud',
  data () {
    return {
      scale: 1.25
    }
  },
  components: {
    AvatarIcon,
    CardUi,
    CurrentSystem,
    GearIcon,
    InfoIcon,
    JumpIcon,
    PlanetsIcon,
    PlanetsMenu,
    SettingsMenu,
    ChatMenu,
    ShipsIcon,
    ShipsMenu,
    SpeakerIcon,
    BroadcastIcon,
    Scope,
    ScopeToggle,
    TradeMenu,
    ShipyardMenu,
    ZoomSlider,
  },
  computed: {
    ...mapGetters('UI', [
      'viewport',
      'selected',
      'leftMostX',
      'rightMostX',
      'topMostY',
      'bottomMostY',
      'menuState',
      'isMenuOn',
      'viewRatio'
    ]),
    ...mapGetters('StarMap', [
      'myShipId',
      'systemObjects',
      'gameTime',
      'spriteIds'
    ]),
    ...mapGetters('Config', [
      'showScope'
    ]),
    ...mapGetters('GameState', [
      'starMap',
      'avatar',
      'events'
    ]),
    profileX () {
      if (this.viewRatio <= 1) {
        return this.leftMostX + 20
      }
        return this.leftMostX + 100
    },
    profileY () {
      if (this.viewRatio <= 1) {
        return this.topMostY + 90
      }
      return this.topMostY + 15
    },
    chatEventsCount () {
      if (Array.isArray(this.events.chatEvents)) {
        return this.events.chatEvents.length
      }
      return 0
    },
    planetCount () {
      if (Array.isArray(this.spriteIds.planets)) {
        return this.spriteIds.planets.length
      }
      return 0
    },
    shipCount () {
      if (Array.isArray(this.spriteIds.ships)) {
        return this.spriteIds.ships.length
      }
      return 0
    }
  },
  methods: {
    ...mapMutations('UI', [
      'selectSprite',
      'scaleAnimateTo',
      'jumpMenuOn',
      'toggleShowLabels',
      'openMenu'
    ]),
    showSettings() {
      this.o8audio.playEffect('click');
      this.openMenu('settings')
    },
    showPlanets() {
      this.o8audio.playEffect('click');
      this.openMenu('planets')
    },
    showShips() {
      this.o8audio.playEffect('click');
      this.openMenu('ships')
    },
    showChat() {
      this.o8audio.playEffect('click');
      this.openMenu('chat')
    },
    selectMyShip() {
      this.o8audio.playEffect('click');
      this.selectSprite(this.myShipId)
      this.scaleAnimateTo({scale: '0.05', time: 1000})
    },
    selectStar() {
      this.o8audio.playEffect('click');
      if (this.selected != 0) {
        this.selectSprite(0)
      } else {
        this.jumpMenuOn()
      }
    },
    isHorizontal: function () {
      if (this.container.y > this.container.x) {
        return true
      }
      return false
    }
  }
}
</script>
