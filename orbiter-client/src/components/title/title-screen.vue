<template>
  <!-- The first screen: the title scene, a status pill, and either the title menu on its dark band or
       the onboarding wizard. Its watchers drive connecting: wallet → contracts → the player's data. -->
  <div class="title-screen" @pointerdown.capture="unlockAudio" @keydown.capture="unlockAudio">
    <title-scene />

    <div v-if="walletStatus === 'connected'" class="status-pill" :class="{ warning: !isSupportedNetwork }">
      <span class="status-dot"></span>
      <span>{{ networkName }}</span>
      <span class="status-account">{{ shortAccount }}</span>
      <span v-if="currentBlockId" class="status-block">#{{ currentBlockId }}</span>
    </div>

    <div class="stage">
      <onboarding-wizard v-if="wizardOpen" />

      <div v-else-if="panel" class="panel-frame">
        <network-panel v-if="panel === 'network'" @close="panel = null" />
        <settings-panel v-else @close="panel = null" />
      </div>

      <section v-else class="band" aria-label="Orbiter 8">
        <h1 class="logo"><orbiter8-logo role="img" aria-label="Orbiter 8" /></h1>
        <!-- The button's label only changes once the new one has held for a moment, and its size never
             does, so brief in-between states don't make the band jump. -->
        <button type="button" class="o8-button main" :disabled="!buttonEnabled" @click="start">
          {{ shownAction.label }}
        </button>
        <!-- Its line is always there, so the band keeps its height when the welcome arrives. -->
        <p class="welcome" :class="{ shown: step === 'ready' }">
          <template v-if="step === 'ready'">
            Welcome back, {{ avatar.name }}. {{ gameState.avatarCount }} pilots have discovered
            {{ gameState.starSystemCount }} star systems.
          </template>
        </p>
        <div class="secondary">
          <button type="button" class="o8-button" @click="openPanel('settings')">Settings</button>
          <button type="button" class="o8-button" @click="openPanel('network')">Network</button>
          <button type="button" class="o8-button" @click="openStory">Story</button>
        </div>
      </section>
    </div>

    <p class="version">Version {{ version }}</p>

    <story-scene v-if="storyOpen" @close="closeStory" />
  </div>
</template>

<script>
import { mapActions, mapState, mapWritableState } from 'pinia'
import { useChainStore } from '@/stores/chain'
import { useGameStateStore } from '@/stores/gamestate'
import { useOnboardingStore } from '@/stores/onboarding'
import Orbiter8Logo from '@/components/assets/Orbiter8Logo.svg'
import TitleScene from './title-scene.vue'
import OnboardingWizard from './onboarding-wizard.vue'
import NetworkPanel from './network-panel.vue'
import SettingsPanel from './settings-panel.vue'
import StoryScene from './story-scene.vue'

// The main button's label waits this long before following a change (ms), so a state that only
// lasts a moment (a quick reconnect) never flashes on it.
const SETTLE_MS = 400

export default {
  name: 'TitleScreen',
  components: { TitleScene, OnboardingWizard, NetworkPanel, SettingsPanel, StoryScene, Orbiter8Logo },
  data() {
    return {
      version: __APP_VERSION__,
      // What the main button shows: titleAction, once it has held for SETTLE_MS.
      shownAction: null,
      storyOpen: false
    }
  },
  computed: {
    ...mapState(useChainStore, [
      'walletStatus',
      'account',
      'isSupportedNetwork',
      'networkName',
      'contractsLoaded',
      'currentBlockId',
      'wallets',
      'walletName'
    ]),
    ...mapState(useGameStateStore, ['avatar', 'gameState']),
    ...mapState(useOnboardingStore, ['step', 'titleAction']),
    ...mapWritableState(useOnboardingStore, ['wizardOpen', 'panel']),
    /** Clickable only when what it shows is what it would do. */
    buttonEnabled() {
      return this.titleAction.enabled && this.shownAction.label === this.titleAction.label
    },
    shortAccount() {
      const account = String(this.account ?? '')
      return account.length > 10 ? account.slice(0, 6) + '…' + account.slice(-4) : account
    }
  },
  watch: {
    titleAction: {
      immediate: true,
      handler(action) {
        clearTimeout(this.settleTimer)
        if (!this.shownAction) this.shownAction = action
        else this.settleTimer = setTimeout(() => (this.shownAction = action), SETTLE_MS)
      }
    },
    // Connected to a network the game is on: bind its contracts.
    account: {
      immediate: true,
      handler(account) {
        if (account && this.isSupportedNetwork && !this.contractsLoaded) this.initContracts()
      }
    },
    // Contracts bound: read the player, pick up a registration sent before a reload, watch for blocks.
    contractsLoaded: {
      immediate: true,
      handler(loaded) {
        if (!loaded) return
        this.loadGameState()
        this.resumeRegistration()
        this.startBlockPolling()
      }
    }
  },
  created() {
    if (this.walletStatus === 'searching') this.initWeb3()
    this.o8audio.playMusic('title')
  },
  beforeUnmount() {
    this.o8audio.stopMusic()
    clearTimeout(this.settleTimer)
  },
  methods: {
    ...mapActions(useChainStore, ['initWeb3', 'initContracts', 'chooseWallet', 'defaultWallet', 'startBlockPolling']),
    ...mapActions(useGameStateStore, ['loadGameState']),
    ...mapActions(useOnboardingStore, ['openWizard', 'resumeRegistration']),
    /** Browsers only allow sound after the player's first click or key: start the title music then. */
    unlockAudio() {
      this.o8audio.unlock()
    },
    /** The main button: straight into the game when ready, otherwise the wizard at the current step. */
    start() {
      this.o8audio.playEffect('click')
      if (this.step === 'ready') {
        this.o8audio.speak('welcomeBack')
        this.$router.push('/play')
        return
      }
      // With one wallet (or the one used last time), connecting is the obvious next move: the click
      // that opens the wizard also opens the wallet's approval window.
      if (this.walletStatus === 'idle') {
        const wallet = this.defaultWallet()
        if (wallet) this.chooseWallet(wallet)
      }
      this.openWizard()
    },
    openStory() {
      this.o8audio.playEffect('click')
      this.storyOpen = true
    },
    closeStory() {
      this.o8audio.playEffect('click')
      this.storyOpen = false
    },
    openPanel(panel) {
      this.o8audio.playEffect('click')
      this.panel = panel
    }
  }
}
</script>

<style scoped>
.title-screen {
  position: fixed;
  inset: 0;
  color: #ffffff;
  font-family: 'Ubuntu', system-ui, sans-serif;
}
.stage {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 3.5em 0 2.5em;
  box-sizing: border-box;
}

/* The dark band behind the menu, for contrast; it fades out at the sides so the scene shows. */
.band {
  width: 100%;
  display: grid;
  justify-items: center;
  gap: 1.1em;
  padding: 2.2em 1em 2.4em;
  box-sizing: border-box;
  background: linear-gradient(90deg, #0000 12%, #0000008c 30%, #0000008c 70%, #0000 86%);
  border-block: 1px solid #ffffff14;
  /* Fixed line heights: the band is the same size before and after the Ubuntu font arrives. */
  line-height: 1.4;
}
.band .o8-button {
  line-height: 1.2;
}
.logo {
  margin: 0;
  font-size: 1rem;
  width: min(34rem, 80vw);
  line-height: 0;
}
.logo svg {
  width: 100%;
  height: auto;
}
.o8-button.main {
  font-size: 1.9em;
  width: 9em;
  padding: 0.35em 1em;
}
.welcome {
  margin: -0.3em 0 0;
  min-height: 1.6em;
  color: #c3b3da;
  text-align: center;
  max-width: 34em;
  opacity: 0;
  transition: opacity 0.4s;
}
.welcome.shown {
  opacity: 1;
}
/* Narrow screens: the welcome takes two lines; keep room for both. */
@media (max-width: 640px) {
  .welcome {
    min-height: 3.2em;
  }
}
.secondary {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1em;
}
.secondary .o8-button {
  min-width: 7em;
  font-size: 1.2em;
}

.panel-frame {
  width: min(40em, 100% - 2em);
  max-height: 100%;
  overflow-y: auto;
}

.status-pill {
  position: absolute;
  top: 0.8em;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.6em;
  font-size: 0.8em;
  padding: 0.35em 0.9em;
  border-radius: 999px;
  border: 1px solid #ffffff30;
  background: #12052acc;
  color: #c3b3da;
  white-space: nowrap;
  z-index: 1;
}
.status-dot {
  width: 0.55em;
  height: 0.55em;
  border-radius: 50%;
  background: #8fe3a5;
}
.status-pill.warning .status-dot {
  background: #ffb3c1;
}
.status-account,
.status-block {
  font-family: 'Ubuntu Mono', ui-monospace, monospace;
}
.version {
  position: absolute;
  left: 1em;
  bottom: 0.6em;
  margin: 0;
  font-size: 0.8em;
  color: #c3b3da99;
}
@media (max-width: 600px) {
  .status-block {
    display: none;
  }
}
</style>

<style>
/* Shared by the title's menu, wizard and panels. */
.o8-button {
  font: inherit;
  color: #ffffff;
  background: #3a1a66cc;
  border: 1px solid #ffffff40;
  border-radius: 999px;
  padding: 0.45em 1.2em;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.o8-button:hover:not(:disabled) {
  background: #5a2f96;
  border-color: #ffffff80;
}
.o8-button:focus-visible {
  outline: 2px solid #c3b3da;
  outline-offset: 2px;
}
.o8-button:disabled {
  opacity: 0.55;
  cursor: default;
}
.o8-button.primary {
  background: #c3b3da;
  color: #1c0838;
  border-color: #c3b3da;
}
.o8-button.primary:hover:not(:disabled) {
  background: #e6dcf5;
}
.o8-button.quiet {
  background: transparent;
}
.o8-button.small {
  font-size: 0.85em;
  padding: 0.25em 0.8em;
}
.title-screen a {
  color: #e6dcf5;
}
.title-screen .hint {
  font-size: 0.85em;
  color: #c3b3da;
}
.title-screen .problem {
  color: #ffb3c1;
}
.side-panel {
  background: #280b4bf2;
  border: 1px solid #ffffff40;
  border-radius: 0.8em;
  padding: 1.4em 1.6em;
  display: grid;
  gap: 1em;
  text-align: left;
  box-shadow: 0 1em 3em #0008;
}
.side-panel h2 {
  margin: 0;
  font-weight: 400;
  font-size: 1.7em;
  color: #e6dcf5;
}
.side-panel p {
  margin: 0;
}
.side-panel .footer {
  border-top: 1px solid #ffffff20;
  padding-top: 0.8em;
}
@media (prefers-reduced-motion: reduce) {
  .o8-button {
    transition: none;
  }
}
</style>
