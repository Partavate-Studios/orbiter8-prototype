<template>
  <g>
    <menu-container>
        <text x="2" y="-398" font-size="2em" text-anchor="middle" font-style="normal" fill="#00000088" stroke-width="2" stroke="#00000044">
            Settings
        </text>
        <text x="0" y="-400" font-size="2em" text-anchor="middle" font-style="normal" fill="#ffffff" stroke-width="1" stroke="#ffffff44">
            Settings
        </text>


        <text x="0" y="-300" font-size="1.2em" text-anchor="middle" font-style="normal" fill="#ffffff" stroke-width="1" stroke="#ffffff44">
            Graphics Intensity
        </text>
        <text x="-115" y="-265" font-size="1em" text-anchor="middle" font-style="normal" fill="#ffffff" stroke-width="0" stroke="#00000000">
            Efficiency
        </text>
        <text x="100" y="-265" font-size="1em" text-anchor="middle" font-style="normal" fill="#ffffff" stroke-width="0" stroke="#00000000">
            Luxury
        </text>


        <g v-for="index in 3" :key="'grapahics' + index" :transform="'translate(' + (index * 40 - 80) + ' -270)'">
            <a
                v-on:click.prevent="o8audio.playEffect('click'); setGraphicsQuality(index)"
                cursor="pointer">
                <menu-checkbox :checked="graphicsQuality == index" />
            </a>
        </g>


        <text x="0" y="-200" font-size="1.2em" text-anchor="middle" font-style="normal" fill="#ffffff" stroke-width="1" stroke="#ffffff44">
            Audio
        </text>

        <g font-size="1em" text-anchor ="middle" fill="#ffffff" font-style="normal" stroke-width="0">
            <text x="-40" y="-160">
                off
            </text>

            <text x="20" y="-160">
                low
            </text>

            <text x="80" y="-160">
                medium
            </text>

            <text x="140" y="-160">
                high
            </text>
        </g>


        <text x="-100" y="-120" font-size="1em" text-anchor="end" font-style="normal" fill="#ffffff" stroke-width="0" stroke="#00000000">
            Music
        </text>
        <g v-for="index in 4" :key="'music' + index" :transform="'translate(' + (index * 60 - 100) + ' -125)'">
            <a
                v-on:click.prevent="setMusicVolume(index - 1)"
                cursor="pointer">
                <menu-checkbox :checked="getMusicVolume() == (index - 1)" />
            </a>
        </g>

        <text x="-100" y="-80" font-size="1em" text-anchor="end" font-style="normal" fill="#ffffff" stroke-width="0" stroke="#00000000">
            Effects
        </text>

        <g v-for="index in 4" :key="'effects' + index" :transform="'translate(' + (index * 60 - 100) + ' -85)'">
            <a
                v-on:click.prevent="setEffectsVolume(index - 1)"
                cursor="pointer">
                <menu-checkbox :checked="getEffectsVolume() == (index - 1)" />
            </a>
        </g>

        <text x="0" y="0" font-size="1em" text-anchor="middle" font-style="normal" fill="#ffffff" stroke-width="0" stroke="#00000000">
          Back to title screen, licensing information, how to play, about developers.
        </text>

    </menu-container>
  </g>
</template>

<script>

import { mapGetters, mapMutations } from 'vuex'
import MenuContainer from './menu-container/_menu-container.svg'
import MenuCheckbox from './menu-checkbox.svg'

export default {
  name: 'SettingsMenu',
  data () {
    return {
    }
  },
  components: {
    MenuContainer,
    MenuCheckbox,
  },
  methods: {
    ...mapMutations('Config', [
      'setGraphicsQuality',
    ]),
    setMusicVolume(volume) {
      this.o8audio.setMusicVolume(volume / 3)
      this.o8audio.playEffect('click')
      this.$forceUpdate()
    },
    setEffectsVolume(volume) {
      this.o8audio.setEffectsVolume(volume / 3)
      this.o8audio.playEffect('click')
      this.$forceUpdate()
    },
    getMusicVolume() {
      return parseInt(this.o8audio.getMusicVolume() * 3)
    },
    getEffectsVolume() {
      return parseInt(this.o8audio.getEffectsVolume() * 3)
    }
  },
  computed: {
    ...mapGetters('Config', [
      'graphicsQuality'
    ])
  }
}
</script>
