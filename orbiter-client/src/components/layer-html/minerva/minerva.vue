<template>
  <div v-if="show" class="box">
    <div class="heading">
      <a href="/" class="home" alt="Exit" title="Exit">&#x23FB;</a>
      <span class="owlcon" v-on:click="toggleMinerva">&#129417;</span>
      Minerva:
      <span v-if="currentStarSystemName.length > 0">{{ currentStarSystemName }} ({{ currentStarSystemId }})</span>
      <span v-else>Sector {{ currentStarSystemId }}</span>
    </div>
    <small>
      <div class="tabs">
        <span
          class="tab"
          :class="{ 'selected' : showTab == 'profile'}"
          v-on:click="showTab = 'profile'"
          >Profile
        </span>
        <span
          class="tab"
          :class="{ 'selected' : showTab == 'debug'}"
          v-on:click="showTab = 'debug'">Debug
        </span>
        <span
          class="tab"
          :class="{ 'selected' : showTab ==  'terminal'}"
          v-on:click="showTab = 'terminal'">Terminal
        </span>
        <span
          class="tab"
          :class="{ 'selected' : showTab ==  'sprites'}"
          v-on:click="showTab = 'sprites'">Sprites
        </span>
      </div>
      <div class="tabContent">
        <profile v-if="showTab == 'profile'"></profile>
        <debug v-if="showTab == 'debug'"></debug>
        <terminal v-if="showTab == 'terminal'"></terminal>
        <sprites v-if="showTab == 'sprites'"></sprites>
      </div>
    </small>
  </div>
  <div v-else class="icon">
      <!-- <span class="owlcon" v-on:click="toggleMinerva">&#129417;</span> -->
  </div>
</template>

<script>
import Terminal from '@/components/layer-html/minerva/terminal'
import Profile from '@/components/layer-html/minerva/profile'
import Debug from '@/components/layer-html/minerva/debug'
import Sprites from '@/components/layer-html/minerva/sprites'
import { mapGetters, mapMutations } from 'vuex'

export default {
  name: 'MinervaAI',
  components: {
    Terminal,
    Profile,
    Debug,
    Sprites
  },
  data () {
    return {
      showBox: '',
      showTab: 'profile'
    }
  },
  mounted: function () {
  },
  computed: {
    ...mapGetters('Avatar', [
      'avatarName',
      'avatarCount'
    ]),
    ...mapGetters('StarMap', [
      'currentStarSystemId',
      'currentStarSystemName',
    ]),
    ...mapGetters('Config', {
      show: 'minerva'
    }),
    ...mapGetters('UI', [
      'viewport'
    ])
  },
  methods: {
    ...mapMutations('Config', [
      'toggleMinerva'
    ])
  },
  watch: {
    id () {
    },
    viewport: {
      handler: function () {
      },
      deep: true
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  .tabs {
    margin: 0.5em 0 0em 0;
    padding: 0;
    border-bottom: 1px solid #5d289e;
    .tab {
      margin: 0 0 -1px 0;
      padding: 0.25em 0.5em;
      display: inline-block;
      border-bottom: 0;
      border: 1px solid #5d289e;
      color: #5d289e;
      border-top-left-radius: 0.5em;
      border-top-right-radius: 0.5em;
    }
    .selected {
      color: #8e7aaa;
      border-bottom: 1px solid #2a0c50;
    }
  }
  .tabContent {
    border: 1px solid #5d289e;
    border-top: 0;
    padding: 1em;
    margin: 0;
  }
  .box {
    padding: 1em;
    border: 1px solid #5d289e;
    text-align: left;
    position: absolute;
    top: 2em;
    right: 2em;
    background: #2a0c50;
    width: 16%;
    overflow: hidden;
    .heading {
      font-weight: bold;
      color: #310e5c;
      border: 1px solid #591ea0;
      margin: -0.8em -0.8em 0.8em -0.8em;
      padding: 0.25em;
      background: #8e7aaa;
      border-radius: 0.5em;
    }
    border-radius: 0.5em;
    opacity: 0.90;
  }
  .box:hover {
    opacity: 0.95;
  }
  .hiddenBox {
    display: none;
  }
  a.home {
    display: inline-block;
    float: right;
    margin: 0;
    color: #310e5c;
    text-decoration: none;
  }
  span.owlcon {
    display: inline-block;
    padding: 0em 0.25em;
    border-radius: 1em;
    font-size: 1.75em;
    border: 1px solid #8e7aaa;
    cursor: pointer;
  }
  .icon {
    padding: 0.2em;
    text-align: center;
    position: absolute;
    top: 2em;
    right: 2em;
    overflow: hidden;
    border-radius: 0.5em;
    opacity: 0.90;
  }
  span.owlcon:hover {
    background: #8e7aaa;
  }
</style>
