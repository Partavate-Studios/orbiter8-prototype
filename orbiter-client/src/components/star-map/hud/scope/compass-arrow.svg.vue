<template>
  <g>
    <g stroke="#7c6c91">
        <line x1="-120" y1="0" x2="-100" y2="0"></line>
        <line x1="100" y1="0" x2="120" y2="0"></line>
        <line x1="0" y1="100" x2="0" y2="135"></line>
    </g>
    <g stroke="#ffffff" stroke-width="2">
        <line x1="-130" y1="0" x2="-90" y2="0"></line>
        <line x1="90" y1="0" x2="130" y2="0"></line>
        <line x1="0" y1="80" x2="0" y2="145"></line>
    </g>
    <path v-if="true" fill="none" stroke="#7c6c91"
        d="
        M 0 0
        m -110 0
        a 11 11 0 1 0 220 00
        "
        />
  </g>
</template>
<script>

export default {
  name: 'CompassArrow'
}
</script>
