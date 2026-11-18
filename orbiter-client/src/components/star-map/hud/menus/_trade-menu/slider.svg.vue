<template>
  <g stroke-width="0">
    <rect
      ref="sliderLine"
      ry="3"
      rx="3"
      :x="sliderLeft"
      y="-5"
      :width="sliderWidth"
      height="10"
      stroke-width="3"
      stroke="#5c1aae88"
      fill="#00000044"
    />

    <g v-if="reverse">
      <rect
        v-if="highlightValue > 0"
        ref="sliderLineHighlight"
        ry="2"
        rx="2"
        :x="sliderRight - highlight"
        y="-4"
        :width="highlight"
        height="8"
        stroke-width="1"
        fill="url(#cardGradient)"
        stroke="#ffffff44"
      />
      <rect
        ry="3"
        rx="3"
        :x="sliderRight - placement"
        y="-2"
        :width="placement"
        height="4"
        stroke="#ffffff"
        stroke-width="0"
        fill="#ffffff88"
      />

      <g :transform="'translate(' + (sliderRight - placement) + ' 0) scale(1.5) rotate(180)'"><slider-arrow /></g>
    </g>
    <g v-else>
      <rect
        v-if="highlightValue > 0"
        ref="sliderLineHighlight"
        ry="2"
        rx="2"
        :x="sliderLeft"
        y="-4"
        :width="highlight"
        height="8"
        stroke-width="1"
        fill="url(#cardGradient)"
        stroke="#ffffff44"
      />
      <rect
        ry="3"
        rx="3"
        :x="sliderLeft"
        y="-2"
        :width="placement"
        height="4"
        stroke="#ffffff"
        stroke-width="0"
        fill="#ffffff88"
      />
      <g :transform="'translate(' + (sliderLeft + placement) + ' 0) scale(1.5)'"><slider-arrow /></g>
    </g>

    <!-- Dragging: pointer events, so a finger works as well as a mouse; the pointer is captured, so a
         drag that leaves the bar keeps going. -->
    <g>
      <rect
        ref="touchArea"
        :x="touchAreaLeftEdge"
        :y="-7 - padding"
        :width="highlight"
        :height="14 + padding * 2"
        stroke="#ffffff"
        stroke-width="0"
        fill="#00000000"
        class="can-drag"
        :class="{ 'is-dragging': mouseHold }"
        @pointerdown.stop="handlePointerDown"
        @pointerup.stop="handlePointerUp"
        @pointercancel.stop="handlePointerUp"
        @pointermove.stop="handlePointerMove"
      />
    </g>
    <!-- The arrow buttons, over the drag area so a tap on one always steps by one: drawn 16 wide, but
         a thumb-sized area round each takes the tap. -->
    <g :opacity="opacityLeft">
      <g :transform="'translate(' + (sliderWidth / -2 - 16) + ' 0) rotate(180)'" opacity="0.5"><slider-arrow /></g>
      <rect
        ref="leftButton"
        :x="sliderWidth / -2 - 23"
        y="-8"
        ry="3"
        rx="3"
        width="16"
        height="16"
        stroke="#ffffff44"
        stroke-width="0.5"
        fill="#ffffff22"
        class="can-click"
      />
      <rect
        :x="sliderWidth / -2 - 30"
        y="-15"
        width="30"
        height="30"
        fill="transparent"
        class="can-click"
        @click="decrementSlider"
      />
    </g>

    <g :opacity="opacityRight">
      <g :transform="'translate(' + (sliderWidth / 2 + 16) + ' 0 )'" opacity="0.5"><slider-arrow /></g>
      <rect
        ref="rightButton"
        :x="sliderWidth / 2 + 7"
        y="-8"
        ry="3"
        rx="3"
        width="16"
        height="16"
        stroke="#ffffff44"
        stroke-width="0.5"
        fill="#ffffff22"
        class="can-click"
      />
      <rect :x="sliderWidth / 2" y="-15" width="30" height="30" fill="transparent" class="can-click" @click="incrementSlider" />
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
  emits: ['update:percentage', 'update:increment', 'update:decrement'],
  data() {
    return {
      mouseHold: false,
      padding: 5
    }
  },
  computed: {
    sliderLeft() {
      return this.sliderWidth / -2
    },
    sliderRight() {
      return this.sliderWidth / 2
    },
    /** The share of the track a value fills, kept on the track (a value past the end, as when what's
     *  aboard shrinks under a chosen amount, no longer runs the bar off the menu). */
    share() {
      return (value) => Math.max(0, Math.min(1, value / Math.max(1e-9, this.highestValue)))
    },
    placement() {
      return this.share(this.currentValue) * this.sliderWidth
    },
    highlight() {
      return Math.round(this.share(this.highlightValue) * this.sliderWidth)
    },
    /** The drag area: the track's live part, no wider (past its ends are the arrows' taps). */
    touchAreaLeftEdge() {
      if (this.reverse) {
        return this.sliderRight - this.highlight
      }
      return this.sliderLeft
    },
    opacityLeft() {
      if (
        (!this.reverse && this.currentValue > this.lowestValue) ||
        (this.reverse && this.currentValue < this.highlightValue)
      ) {
        return 1
      }
      return 0.25
    },
    opacityRight() {
      if (
        (this.reverse && this.currentValue > this.lowestValue) ||
        (!this.reverse && this.currentValue < this.highlightValue)
      ) {
        return 1
      }
      return 0.25
    }
  },
  methods: {
    handlePointerDown(event) {
      this.mouseHold = true
      event.currentTarget.setPointerCapture?.(event.pointerId)
      this.updateSlider(event)
    },
    handlePointerUp(event) {
      if (!this.mouseHold) return
      this.mouseHold = false
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    },
    handlePointerMove: _.throttle(function (event) {
      if (this.mouseHold) {
        this.updateSlider(event)
      }
    }, 2),
    updateSlider(event) {
      let boxLeft = parseInt(this.$refs.sliderLine.getBoundingClientRect().left)
      let boxRight = parseInt(this.$refs.sliderLine.getBoundingClientRect().right)
      let width = boxRight - boxLeft
      let percentage = Math.max(0, Math.min(1, (event.clientX - boxLeft) / width))
      if (this.reverse) {
        percentage = 1 - percentage
      }
      this.$emit('update:percentage', percentage)
    },
    decrementSlider() {
      if (this.reverse) {
        this.$emit('update:increment')
      } else {
        this.$emit('update:decrement')
      }
    },
    incrementSlider() {
      if (this.reverse) {
        this.$emit('update:decrement')
      } else {
        this.$emit('update:increment')
      }
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
