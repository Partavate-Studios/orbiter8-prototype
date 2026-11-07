// The in-game dialog (components/game-dialog.vue), in place of the browser's alert() and prompt():
// naming a planet, station or ship, writing a broadcast, and notes on features still to come.
// One dialog at a time; opening another answers the open one as cancelled.
import { defineStore } from 'pinia'

/**
 * @typedef {object} DialogInput
 * @property {string} label
 * @property {string} [value]  filled in to start with
 * @property {'name' | 'message' | 'number'} [kind]  names follow the callsign rules (libs/onboarding.js nameProblem)
 * @property {number} [maxLength]  for messages
 * @property {number} [min]  for numbers (1 when not given)
 * @property {number} [max]  for numbers
 * @property {string} [hint]  for numbers, in place of the range
 */

/**
 * @typedef {object} Dialog
 * @property {string} title
 * @property {string} [message]
 * @property {DialogInput} [input]  ask for a line of text
 * @property {string} [confirm]  the confirm button's label ('OK' when only telling)
 * @property {string | null} [cancel]  the cancel button's label; null for none
 */

let answer = null

export const useDialogStore = defineStore('Dialog', {
  state: () => ({
    /** @type {Dialog | null} */
    open: null
  }),
  actions: {
    /**
     * Shows a dialog. Resolves with the text typed (the cleaned name for names), true when confirmed
     * without an input, or null when cancelled.
     * @param {Dialog} dialog
     * @returns {Promise<string | true | null>}
     */
    ask(dialog) {
      this.close(null)
      this.open = { confirm: 'OK', cancel: 'Cancel', ...dialog }
      return new Promise((resolve) => (answer = resolve))
    },
    /** A note with only an OK button. */
    tell(title, message) {
      return this.ask({ title, message, cancel: null })
    },
    /** Answers the open dialog (null: cancelled) and closes it. */
    close(value) {
      const resolve = answer
      answer = null
      this.open = null
      resolve?.(value)
    }
  }
})
