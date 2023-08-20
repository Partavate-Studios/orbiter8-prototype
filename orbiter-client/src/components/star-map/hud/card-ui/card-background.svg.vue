<template>
    <g>

      <defs>
      <linearGradient id="cardGradient"
        x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(0)">
          <stop offset="0%" stop-color="#5c1aae" stop-opacity="1"/>
          <stop offset="10%" stop-color="#280b4b" stop-opacity="1"/>
          <stop offset="50%" stop-color="#5c1aae" stop-opacity="1"/>
          <stop offset="90%" stop-color="#280b4b" stop-opacity="1"/>
          <stop offset="100%" stop-color="#5c1aae" stop-opacity="1"/>
        </linearGradient>
      </defs>
    <g @mousedown.stop="handleMouseDown">
      <g transform="translate(-70 -70) scale(1)">
        <g>
          <rect
            x="-2"
            y="-2"
            ry="5"
            rx="25"
            width="144"
            height="214"
            fill="url(#cardGradient)"
            opacity="1"
            stroke-width="0" />
          <rect
            x="0"
            y="0"
            ry="5"
            rx="25"
            width="140"
            height="210"
            fill="#000000"
            opacity="0.5"
            stroke="#5b1aaa"
            stroke-width="0.25" />
        </g>


      </g>
      </g>
    </g>
</template>

<script>

export default {
  name: 'CardBackground',
  props: {
  },
  methods: {
    handleMouseDown () {
    },
  },
  computed: {
  },
}
</script>
