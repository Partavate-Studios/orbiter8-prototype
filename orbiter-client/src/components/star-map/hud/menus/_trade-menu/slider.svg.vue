<template>
  <g stroke-width="0">
    <rect
      ry="3"
      rx="3"
      ref="sliderLine"
      :x="sliderLeft"
      y="-5"
      :width="sliderWidth"
      height="10"
      stroke-width="3"
      stroke="#5c1aae88"
      fill="#00000044" />

    <g v-if="reverse">
      <rect
        v-if="highlightValue > 0"
        ry="2"
        rx="2"
        ref="sliderLineHighlight"
        :x="sliderRight - highlight"
        y="-4"
        :width="highlight"
        height="8"
        stroke-width="1"
        fill="url(#cardGradient)"
        stroke="#ffffff44" />
      <rect
        ry=3
        rx=3
        :x="sliderRight - placement"
        y="-2"
        :width="placement"
        height="4"
        stroke="#ffffff"
        stroke-width="0"
        fill="#ffffff88" />

      <g :transform="'translate(' + (sliderRight - placement) + ' 0) scale(1.5) rotate(180)'"><slider-arrow   /></g>
    </g>
    <g v-else>
      <rect
        v-if="highlightValue > 0"
        ry="2"
        rx="2"
        ref="sliderLineHighlight"
        :x="sliderLeft"
        y="-4"
        :width="highlight"
        height="8"
        stroke-width="1"
        fill="url(#cardGradient)"
        stroke="#ffffff44" />
      <rect
        ry=3
        rx=3
        :x="sliderLeft"
        y="-2"
        :width="placement"
        height="4"
        stroke="#ffffff"
        stroke-width="0"
        fill="#ffffff88" />
      <g :transform="'translate(' + (sliderLeft + placement) + ' 0) scale(1.5)'"><slider-arrow   /></g>
    </g>



    <g :opacity="opacityLeft">
      <g :transform="'translate(' + ((sliderWidth / -2) - 16) + ' 0) rotate(180)'" opacity="0.5"><slider-arrow   /></g>
      <rect
        ref="leftButton"
        :x="sliderWidth / -2 - 23"
        y="-8"
        ry=3
        rx=3
        width="16"
        height="16"
        stroke="#ffffff44"
        stroke-width="0.5"
        fill="#ffffff22"
        class="can-click"
        v-on:click="decrementSlider" />
    </g>

    <g :opacity="opacityRight">
      <g :transform="'translate(' + ((sliderWidth / 2) + 16) + ' 0 )'" opacity="0.5"><slider-arrow  /></g>
      <rect
        ref="rightButton"
        :x="sliderWidth / 2 + 7"
        y="-8"
        ry=3
        rx=3
        width="16"
        height="16"
        stroke="#ffffff44"
        stroke-width="0.5"
        fill="#ffffff22"
        class="can-click"
        v-on:click="incrementSlider" />
    </g>

    <g>
      <rect ref="touchArea"
        :x="touchAreaLeftEdge"
        :y="-7 - padding"
        :width="highlight + padding * 2"
        :height="14 + padding * 2"
        stroke="#ffffff"
        stroke-width="0"
        fill="#00000000"
        @mousedown.stop="handleMouseDown"
        @mouseup.stop="handleMouseUp"
        @mousemove.stop="handleMouseMove"
        @mouseleave="handleMouseLeave"
        class="can-drag"
        :class="{ 'is-dragging': mouseHold }"
          />
    </g>
  </g>
</template>

<script>

import _ from 'lodash'
import SliderArrow from '../widgets/arrow.svg'

export default {
  name: 'Slider',
  components: {
    SliderArrow
  },
  props: {
    lowestValue: {
      type: Number,
      default: 0
    },
    highestValue: {
      type: Number,
      default: 100
    },
    highlightValue: {
      type: Number,
      default: 0
    },
    currentValue: {
      type: Number,
      default: 50
    },
    sliderWidth: {
      type: Number,
      default: 200
    },
    reverse: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      mouseHold: false,
      padding: 5
    }
  },

  methods: {
    handleMouseDown (event) {
      console.log('attempting to handle mouse down')
      this.mouseHold = true
      this.updateSlider(event)
    },
    handleMouseUp () {
      this.mouseHold = false
    },
    handleMouseMove: _.throttle(function (event) {
      if(this.mouseHold) {
        this.updateSlider(event)
      }
    }, 2),
    handleMouseLeave (event) {
      if (this.mouseHold) {
        this.updateSlider(event)
        this.mouseHold = false
      }
    },
    updateSlider (event) {
      let boxLeft = parseInt(this.$refs.sliderLine.getBoundingClientRect().left)
      let boxRight = parseInt(this.$refs.sliderLine.getBoundingClientRect().right)
      let width = boxRight - boxLeft
      let percentage = Math.max(0, Math.min(1, (event.pageX - boxLeft)  / width))
      if (this.reverse) {
        percentage = 1 - percentage
      }
      this.$emit('update:percentage', percentage);
    },
    decrementSlider () {
      if (this.reverse) {
        this.$emit('update:increment')
      } else {
        this.$emit('update:decrement')
      }
    },
    incrementSlider () {
      if (this.reverse) {
        this.$emit('update:decrement')
      } else {
        this.$emit('update:increment')
      }
    }
  },
  computed: {
    sliderLeft () {
      return this.sliderWidth / -2
    },
    sliderRight () {
      return this.sliderWidth / 2
    },
    placement () {
      return (this.currentValue / this.highestValue) * this.sliderWidth
    },
    highlight () {
      return parseInt(this.highlightValue / this.highestValue * this.sliderWidth)
    },
    touchAreaLeftEdge () {
      if (this.reverse) {
        return (this.sliderRight - this.highlight - this.padding)
      }
      return (this.sliderLeft - this.padding)
    },
    opacityLeft () {
      if ((!this.reverse && (this.currentValue > this.lowestValue)) ||
          (this.reverse && (this.currentValue < this.highlightValue))){
          return 1
      }
      return 0.25
    },
    opacityRight () {
      if ((this.reverse && (this.currentValue > this.lowestValue)) ||
          (!this.reverse && (this.currentValue < this.highlightValue))){
          return 1
      }
      return 0.25
    }
  }
}
</script>

<style lang="scss">
  .is-dragging {
    cursor: grabbing;
  }
  .can-click:hover {
    cursor: pointer;
    fill: #ffffff44;
  }
  .can-drag:hover {
    cursor: grabbing;
  }
</style>
