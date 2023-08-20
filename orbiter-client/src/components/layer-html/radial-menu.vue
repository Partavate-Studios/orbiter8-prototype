<template>
  <span>
    <span class="homering"></span>
    <ul class="menulist" ref="menu">
      <li v-for="(button, index) in buttons" v-bind:key="'button' + index">
          <span
            v-bind:style="{ 'top': button.yoffset + 'px', 'left': button.xoffset + 'px' }"
            v-on:click.prevent="warp(button.sector)"
            class="menuitem">{{ button.text }}</span>
      </li>
    </ul>
  </span>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'radialmenu',
  data () {
    return {
      menuWidth: 0,
      menuHeight: 0,
      buttons: []
    }
  },
  props: {
    menudata: {},
    scale: {
      type: Number,
      default: 1
    },
    startRad: {
      type: Number,
      default: (Math.PI * 1.2)
    },
    spanRad: {
      type: Number,
      default: (2 * Math.PI)
    }
  },
  mounted: function () {
    this.buttons = this.menudata
    this.setButtonDirection()
    this.setButtonOffsets()
  },
  methods: {
    ...mapActions('Map', [
      'moveToSystem',
    ]),
    ...mapActions('Avatar', [
      'getAvatarMyData'
    ]),
    warp: function (systemId) {
      this.moveToSystem(systemId)
    },
    setButtonDirection: function () {
      var total = this.menudata.length
      var current = 0
      var unit = this.spanRad / total
      this.buttons.forEach(button => {
        button.direction = (current * unit) + this.startRad
        current++
      })
    },
    setButtonOffsets: function () {
      this.menuWidth = this.$refs.menu.clientWidth
      this.menuHeight = this.$refs.menu.clientHeight
      let distance = Math.max(this.menuWidth, this.menuHeight)
      this.buttons.forEach(button => {
        button.distance = distance * 0.5 + 128
      })

      this.menuWidth = this.$refs.menu.clientWidth
      this.menuHeight = this.$refs.menu.clientHeight
      this.buttons.forEach(button => {
        button.xoffset = button.distance * Math.cos(button.direction)
        button.yoffset = button.distance * Math.sin(button.direction)
      })
    },
    spawnButton: function (options) {
      return (Object.assign({}, {
        distance: 0,
        xoffset: 0,
        yoffset: 0,
        emit: '',
        action: function () {
          alert('test')
          return true
        }
      },
      options))
    }
  },
  watch: {
    scale () {
      this.setButtonOffsets()
    },
    menudata: {
      handler: function () {
        this.buttons = this.menudata
        this.setButtonDirection()
        this.setButtonOffsets()
      },
      deep: true
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  .menulist {
    border: 0;
    padding: 0;
    margin: 0;
    width: 100%;
    height: 100%;
    display: inline-box;
    li {
      position: absolute;
      margin: 0;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      display: block;
    }
  }
  .menuitem {
    position: absolute;
    border-radius: 50%;
    display: block;
    border: 2px dashed #ffffff;;
    font-weight: bold;
    width: 6em;
    height: 6em;
    margin: -3em;
    box-shadow: 1px 1px 0px #310e5c, -1px 1px 0px #310e5c, 1px -1px 0px #310e5c, -1px -1px 0px #310e5c, ;
    color: #ffffff;
    cursor: pointer;
    z-index: 1;
    background: #310e5c;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .menuitem:hover {
    border: 2px solid #ffffff;;
  }

  .homering {
    border-radius: 50%;
    width: 100%;
    height: 100%;
    top: -3px;
    left: -3px;
    display: inline-block;
    position: absolute;
    border: 4px solid #fff;
  }
</style>
