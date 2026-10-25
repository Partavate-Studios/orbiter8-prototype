<template>
  <g>
    <g @mousedown.stop="handleMouseDown">
      <g transform="translate(-70 -70)">
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
            stroke-width="0"
          />
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
            stroke-width="0.25"
          />
        </g>
      </g>
    </g>
  </g>
</template>

<script>
export default {
  name: 'CardBackground',
  methods: {
    handleMouseDown() {}
  }
}
</script>
