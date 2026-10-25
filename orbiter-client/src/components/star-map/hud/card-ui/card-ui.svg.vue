<template>
  <g>
    <card-scaling :sprite="sprites[objectId]">
      <g v-if="viewRatio > 1" stroke="#c3b3da88" stroke-width="2" stroke-dasharray="3 3">
        <line x1="-70" y1="70" x2="-120" y2="120" />
        <line x1="-150" y1="120" x2="-120" y2="120" />
        <g v-if="menuShouldDisplay">
          <line x1="70" y1="-70" x2="120" y2="-120" />
          <line x1="120" y1="-120" x2="150" y2="-120" />
        </g>
        <circle cx="0" cy="0" r="95" fill="none" />
      </g>
      <g :transform="getInfoCardTranslate()">
        <info :object-id="objectId" />

        <g transform="translate(45 120) scale(0.4)">
          <a v-if="viewRatio <= 1" cursor="pointer" @click.prevent="selectMainMenu()">
            <hamburger-icon :selected="menuShouldDisplay" />
          </a>
        </g>

        <g transform="translate(-45 120) scale(0.4)">
          <a cursor="pointer" @click.prevent="toggleScope()"><x-icon /></a>
        </g>

        <g v-if="systemObjects[objectId].type == 'planet'">
          <g v-if="systemObjects[objectId].hasStation" transform="translate(15 120) scale(0.4)">
            <a cursor="pointer" @click.prevent="selectSprite(systemObjects[objectId].stationKey)">
              <icon-container>
                <g transform="scale(0.5)">
                  <sprite :object-id="systemObjects[objectId].stationKey" />
                </g>
              </icon-container>
            </a>
          </g>
          <g v-if="systemObjects[objectId].moons.length > 0" transform="translate(-15 120) scale(0.4)">
            <a cursor="pointer" @click.prevent="selectMenu('moons')">
              <icon-container :selected="currentMenu == 'moons'">
                <g transform="translate(-2 -2) scale(0.75)">
                  <sprite :object-id="systemObjects[objectId].moons[0].moonId" />
                </g>
              </icon-container>
              <circle cx="18" cy="18" fill="#000000" stroke="#ffffff" stroke-width="1" r="10" opacity="0.15" />
              <text x="18" y="19" text-anchor="middle" font-size="1em" fill="#ffffff" dominant-baseline="middle">
                {{ systemObjects[objectId].moons.length }}
              </text>
            </a>
          </g>
        </g>
        <g v-else-if="systemObjects[objectId].type == 'station'">
          <g transform="translate(15 120) scale(0.4)">
            <a cursor="pointer" @click.prevent="selectSprite(systemObjects[objectId].orbiting)">
              <icon-container>
                <g transform="scale(0.5)">
                  <sprite :object-id="systemObjects[objectId].orbiting" />
                </g>
              </icon-container>
            </a>
          </g>
        </g>
        <g v-else-if="systemObjects[objectId].type == 'moon'">
          <g transform="translate(15 120) scale(0.4)">
            <a cursor="pointer" @click.prevent="selectSprite(systemObjects[objectId].orbiting)">
              <icon-container>
                <g transform="scale(0.5)">
                  <sprite :object-id="systemObjects[objectId].orbiting" />
                </g>
              </icon-container>
            </a>
          </g>
        </g>
      </g>

      <g :transform="getMenuTranslate()">
        <g v-if="menuShouldDisplay">
          <g v-if="currentMenu == 'main'">
            <main-menu :object-id="objectId" @moon-menu="selectMenu('moons')" />
            <g transform="translate(45 120) scale(0.4)">
              <a v-if="viewRatio <= 1" cursor="pointer" @click.prevent="closeMenu()"><info-icon /></a>
            </g>
          </g>

          <g v-else-if="currentMenu == 'moons'">
            <moons-menu :object-id="objectId" />
            <g transform="translate(45 120) scale(0.4)">
              <a v-if="viewRatio <= 1" cursor="pointer" @click.prevent="closeMenu()"><info-icon /></a>
              <a v-else cursor="pointer" @click.prevent="selectMainMenu()"><back-icon /></a>
            </g>
          </g>
        </g>
      </g>
    </card-scaling>
  </g>
</template>

<script>
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { mapActions, mapState } from 'pinia'

import IconContainer from '../icons/_icon-container.svg'
import Info from './info.svg'
import MainMenu from './menus/main-menu.svg'
import MoonsMenu from './moons-menu.svg'
import HamburgerIcon from '../icons/hamburger-icon.svg'
import XIcon from '../icons/x-icon.svg'
import InfoIcon from '../icons/info-icon.svg'
import BackIcon from '../icons/back-icon.svg'
import Sprite from './sprite.svg'
import CardScaling from './card-scaling.svg'

export default {
  name: 'SpriteInfo',
  components: {
    CardScaling,
    MainMenu,
    MoonsMenu,
    HamburgerIcon,
    IconContainer,
    InfoIcon,
    BackIcon,
    Info,
    Sprite,
    XIcon
  },
  props: {
    /** The selected object's key (see sdk/system.js objectKey). */
    objectId: { type: String, default: null }
  },
  data() {
    return {
      menuShowing: false,
      currentMenu: 'main'
    }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects', 'sprites']),
    ...mapState(useUIStore, ['viewRatio']),
    menuShouldDisplay() {
      if (this.menuShowing || this.viewRatio > 1) {
        return true
      }
      return false
    }
  },
  watch: {
    objectId: {
      handler: function (val, oldVal) {
        if (val != oldVal) {
          this.selectMainMenu()
        }
      }
    }
  },
  methods: {
    ...mapActions(useUIStore, ['toggleScope', 'selectSprite']),
    getInfoCardTranslate() {
      if (this.viewRatio > 1) {
        return 'translate(-260 -35) scale(1.75)'
      }
      return 'scale(2.5)'
    },
    getMenuTranslate() {
      if (this.viewRatio > 1) {
        return 'translate(260 -35) scale(1.75)'
      }
      return 'scale(2.5)'
    },
    closeMenu() {
      this.menuShowing = false
      this.currentMenu = 'main'
    },
    selectMenu(menu) {
      this.menuShowing = true
      this.currentMenu = menu
    },
    selectMainMenu() {
      this.menuShowing = true
      this.currentMenu = 'main'
    }
  }
}
</script>
