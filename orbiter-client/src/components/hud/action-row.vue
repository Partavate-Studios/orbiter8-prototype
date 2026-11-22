<template>
  <!-- A card's actions (docs/ui-guide.md section 11): the main one as a pill with its icon and word,
       the others as round wells with a one-word caption. A price, or why one can't be used now, sits
       under it. Keys 1–9 press them by slot (selection-panel.vue). -->
  <div class="action-row" :class="{ compact }">
    <button v-if="main" type="button" class="pill" :class="{ dim: !main.option.enabled }" :title="tip(main)" @click="$emit('run', main.option)">
      <span class="pill-well"><small-icon :name="main.icon" /></span>
      <span class="word">{{ main.word }}</span>
      <small v-if="main.note" class="note" :class="{ pink: main.needsYou }">{{ main.note }}</small>
    </button>
    <button v-for="button in wells" :key="button.option.command" type="button" class="well-button" :class="{ dim: !button.option.enabled }" :title="tip(button)" @click="$emit('run', button.option)">
      <span class="well"><small-icon :name="button.icon" /></span>
      <span class="caption">{{ button.word }}</span>
      <small v-if="button.note" class="note" :class="{ pink: button.needsYou }">{{ button.note }}</small>
    </button>
  </div>
</template>

<script>
import SmallIcon from './small-icon.vue'

export default {
  name: 'ActionRow',
  components: { SmallIcon },
  props: {
    /** cardButtons()'s main action, or null. */
    main: { type: Object, default: null },
    /** cardButtons()'s other actions. */
    wells: { type: Array, default: () => [] },
    /** A phone's sheet: the pill fills the row, the wells wrap under it. */
    compact: { type: Boolean, default: false }
  },
  emits: ['run'],
  methods: {
    /** The action's full name and its number key. */
    tip(button) {
      return button.key <= 9 && !this.compact ? `${button.option.text} (${button.key})` : button.option.text
    }
  }
}
</script>

<style scoped>
.action-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-height: 62px;
}
button {
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
button:focus-visible {
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 3px;
}
/* the main action: the brand purple, the strongest button on the card */
.pill {
  position: relative;
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  min-width: 112px;
  box-sizing: border-box;
  padding: 0 16px 0 5px;
  border: 1.8px solid #b9a0ff;
  border-radius: 22px;
  background: linear-gradient(180deg, #8f6cf0 0%, #7b4fe6 100%);
  color: #ffffff;
  font-size: 15.5px;
  font-weight: bold;
  white-space: nowrap;
}
.pill:hover {
  background: linear-gradient(180deg, #9d7df5 0%, #8b5cf6 100%);
}
.pill-well {
  flex: none;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #00000033;
}
.pill .note {
  position: absolute;
  left: 0;
  right: 0;
  top: 47px;
}
/* any other action: a round well, its word under it */
.well-button {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: 46px;
  padding: 0;
  border: 0;
  background: none;
  color: #efe7ff;
}
.well {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  box-sizing: border-box;
  border: 1.5px solid #5a4c8c;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 40%, #3d2a6e 0%, #1a1331 80%);
}
.well-button:hover .well {
  border-color: #b9a0ff;
  background: radial-gradient(circle at 50% 40%, #5a4596 0%, #2a1f4c 80%);
}
.caption {
  font-size: 11px;
  line-height: 13px;
  white-space: nowrap;
}
.note {
  display: block;
  color: #c3b3da;
  font-size: 11px;
  font-weight: normal;
  line-height: 12px;
  text-align: center;
  white-space: nowrap;
}
.note.pink {
  color: var(--o8-pink-light, #ff6fb0);
}
/* can't be used now: dimmed, the note says why */
.dim .pill-well,
.dim .word,
.dim .well,
.dim .caption {
  opacity: 0.4;
}
.compact {
  flex-wrap: wrap;
  row-gap: 18px;
}
.compact .pill {
  flex: 1 0 100%;
  justify-content: flex-start;
}
</style>
