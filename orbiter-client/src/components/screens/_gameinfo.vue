<template>
  <div class="gameinfo">
    <p>
      <span class="light"><b>{{ gameState.avatarCount }}</b> pilots</span> have discovered
      <span class="light"><b>{{ gameState.starSystemCount }}</b> star systems systems</span>
    </p>
    <p>Welcome back, {{ gameState.avatar.name }}. Your ship is ready for your command.</p>
  </div>
</template>

<script>

import { mapGetters } from 'vuex'

export default {
  components: {
  },
  name: 'GameInfo',
  data () {
    return {
      newAvatarName: ''
    }
  },
  methods: {
  },
  computed: {
    ...mapGetters('GameState', [
      'gameState'
    ])
  },
  mounted () {
  },
  watch: {
    avatarCount () {},
    systemCount () {}
  }
}
</script>

<style scoped lang="scss">
  div.gameinfo {
    margin: 0;
    padding: 0.25em;
    font-size: 1.2em;
    border-radius: 1em;
  }
  .light {
    color: #ffffff;
  }
</style>
