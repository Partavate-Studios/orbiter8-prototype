<template>
  <!-- The in-game dialog (stores/dialog.js), drawn like the selection card: the striped purple frame,
       the wide rounded corners and the title pill. -->
  <Transition name="dialog">
    <div
      v-if="open"
      class="game-dialog"
      data-own-scroll
      @keydown.stop="onKey"
      @keyup.stop
      @pointerdown.self.prevent="onBackdrop"
    >
      <form
        class="card"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="'dialog-title'"
        :aria-describedby="open.message ? 'dialog-message' : undefined"
        @submit.prevent="confirm"
      >
        <div class="inside">
          <h2 id="dialog-title" class="title">{{ open.title }}</h2>
          <p v-if="open.message" id="dialog-message" class="message">{{ open.message }}</p>
          <template v-if="open.input">
            <label for="dialog-input">{{ open.input.label }}</label>
            <input
              id="dialog-input"
              ref="input"
              v-model="text"
              :type="isNumber ? 'number' : 'text'"
              :min="isNumber ? (open.input.min ?? 1) : undefined"
              :max="isNumber ? open.input.max : undefined"
              :inputmode="isNumber ? 'numeric' : undefined"
              autocomplete="off"
              spellcheck="false"
              :maxlength="maxLength"
              :aria-invalid="problem === 'too long' || problem === 'out of range' ? 'true' : 'false'"
              aria-describedby="dialog-hint"
            />
            <p id="dialog-hint" class="hint" :class="{ problem: problem === 'too long' }" aria-live="polite">
              {{ hint }}
            </p>
          </template>
          <div class="buttons">
            <button v-if="open.cancel" type="button" class="card-pill" @click="cancel">{{ open.cancel }}</button>
            <button ref="confirm" type="submit" class="card-pill accent" :disabled="!!problem">
              {{ open.confirm }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </Transition>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useDialogStore } from '@/stores/dialog'
import { cleanName, nameProblem, NAME_MAX_LENGTH } from '@/libs/onboarding'

// A broadcast's length when the dialog doesn't say.
const MESSAGE_MAX_LENGTH = 120

export default {
  name: 'GameDialog',
  data() {
    return { text: '' }
  },
  computed: {
    ...mapState(useDialogStore, ['open']),
    isName() {
      return !['message', 'number'].includes(this.open?.input?.kind)
    },
    /** A count (Demo 4: colonists, units, parts): whole numbers from min (1) to max. */
    isNumber() {
      return this.open?.input?.kind === 'number'
    },
    maxLength() {
      // Names may be typed long and trimmed; the hint says when one is still too long.
      return this.isName ? NAME_MAX_LENGTH + 10 : (this.open.input.maxLength ?? MESSAGE_MAX_LENGTH)
    },
    /** Why the text can't be sent yet ('empty' only disables the button), or null. */
    problem() {
      if (!this.open?.input) return null
      if (this.isNumber) {
        const n = Number(this.text)
        const { min = 1, max = Infinity } = this.open.input
        return Number.isInteger(n) && n >= min && n <= max ? null : 'out of range'
      }
      if (this.isName) return nameProblem(this.text)
      return this.text.trim() ? null : 'empty'
    },
    hint() {
      if (this.isNumber) {
        const { min = 1, max } = this.open.input
        return this.open.input.hint ?? (max != null ? `From ${min} to ${max.toLocaleString('en-US')}.` : '')
      }
      if (!this.isName) {
        const left = this.maxLength - this.text.length
        return left <= 20 ? `${left} characters left.` : 'Broadcasts are public, and stay on the chain.'
      }
      if (this.problem === 'too long')
        return `That's ${cleanName(this.text).length} characters; ${NAME_MAX_LENGTH} at most.`
      return `Up to ${NAME_MAX_LENGTH} characters. Other pilots will see it.`
    }
  },
  watch: {
    open(dialog) {
      if (!dialog) return
      this.text = dialog.input?.value ?? ''
      this.$nextTick(() => {
        if (this.$refs.input) {
          this.$refs.input.focus()
          this.$refs.input.select()
        } else {
          this.$refs.confirm?.focus()
        }
      })
    }
  },
  methods: {
    ...mapActions(useDialogStore, ['close']),
    confirm() {
      if (this.problem) return
      this.o8audio.playEffect('click')
      if (!this.open.input) this.close(true)
      else if (this.isNumber) this.close(Number(this.text))
      else this.close(this.isName ? cleanName(this.text) : this.text.trim())
    },
    cancel() {
      this.o8audio.playEffect('click')
      this.close(null)
    },
    onKey(event) {
      if (event.key === 'Escape') this.cancel()
    },
    // Clicking beside a note closes it; beside a form, it keeps what's been typed.
    onBackdrop() {
      if (!this.open.input) this.cancel()
    }
  }
}
</script>

<style scoped>
.game-dialog {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
  height: 100dvh;
  background: #12052a99;
  font-family: Ubuntu, sans-serif;
}
/* The card's frame: cardGradient (svg-defs.vue) showing round the edge and, darkened, through the inside. */
.card {
  width: min(100%, 25em);
  padding: 3px;
  border-radius: 40px / 9px;
  background: linear-gradient(135deg, #5c1aae 0%, #280b4b 10%, #5c1aae 50%, #280b4b 90%, #5c1aae 100%);
  box-shadow: 0 1.2em 3em #0009;
  margin: 0;
}
.inside {
  display: grid;
  gap: 0.75em;
  padding: 0.6em 1.4em 1.3em;
  border: 1px solid #5b1aaa;
  border-radius: 38px / 8px;
  background: #00000080;
  text-align: left;
  color: #e6dcf5;
}
/* The card's name pill. */
.title {
  margin: 0 -0.8em 0.2em;
  padding: 0.3em 1em;
  border: 1px solid #5b1aaa88;
  border-radius: 40px / 12px;
  background: linear-gradient(135deg, #5c1aae 0%, #280b4b 10%, #5c1aae 50%, #280b4b 90%, #5c1aae 100%);
  color: #ffffff;
  font-size: 1.1em;
  font-weight: normal;
  text-align: center;
  text-shadow: 0 1px 3px #000a;
}
.message {
  margin: 0;
  line-height: 1.45;
}
label {
  font-size: 0.9em;
  color: #c3b3da;
  margin-bottom: -0.4em;
}
input {
  font: inherit;
  font-size: 1.15em;
  color: #ffffff;
  background: #00000055;
  border: 1px solid #ffffff55;
  border-radius: 0.5em;
  padding: 0.45em 0.7em;
  width: 100%;
  box-sizing: border-box;
}
input::selection {
  background: #5c1aae;
}
input:focus {
  outline: 2px solid #c3b3da;
  outline-offset: 1px;
  border-color: #ffffffaa;
}
input[aria-invalid='true'] {
  border-color: var(--o8-pink-light);
}
.hint {
  margin: -0.3em 0 0;
  font-size: 0.85em;
  color: #c3b3da;
}
.hint.problem {
  color: var(--o8-pink-light);
}
.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.7em;
  margin-top: 0.4em;
}
/* card-button.svg.vue's pill; hovered, only its outline stays, as in the cards. */
.card-pill {
  font: inherit;
  font-weight: bold;
  min-width: 7.5em;
  padding: 0.45em 1.2em;
  border: 1px solid #5b1aaa88;
  border-radius: 40px / 12px;
  background: linear-gradient(135deg, #5c1aae 0%, #280b4b 10%, #5c1aae 50%, #280b4b 90%, #5c1aae 100%);
  color: #ffffff;
  text-shadow: 0 1px 2px #0008;
  cursor: pointer;
}
.card-pill:hover:not(:disabled) {
  background: transparent;
  border-color: #5b1aaa;
}
.card-pill:focus-visible {
  outline: 2px solid #c3b3da;
  outline-offset: 2px;
}
.card-pill:disabled {
  color: #ffffff66;
  cursor: default;
}
/* The dialog's action, lavender like the title's primary buttons (.o8-button.primary). */
.card-pill.accent:not(:disabled) {
  background: #c3b3da;
  border-color: #c3b3da;
  color: #1c0838;
  text-shadow: none;
}
.card-pill.accent:hover:not(:disabled) {
  background: #e6dcf5;
  border-color: #e6dcf5;
}
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.15s;
}
.dialog-enter-active .card,
.dialog-leave-active .card {
  transition: transform 0.15s;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
.dialog-enter-from .card,
.dialog-leave-to .card {
  transform: scale(0.96);
}
@media (prefers-reduced-motion: reduce) {
  .dialog-enter-active,
  .dialog-leave-active,
  .dialog-enter-active .card,
  .dialog-leave-active .card {
    transition: none;
  }
}
</style>
