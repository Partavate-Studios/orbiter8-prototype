// The menus' amount dials (colony, armory): Koda found them broken after a move went through (the
// amount stayed above what was left, the bar ran off the menu) and stepping by more than one.
import { describe, it, expect, afterEach } from 'vitest'
import { createApp, h, nextTick, reactive } from 'vue'
import AmountDial from './amount-dial.svg.vue'

let app, root

afterEach(() => {
  app?.unmount()
  root?.remove()
})

function mount(props) {
  const state = reactive({ ...props })
  root = document.createElement('div')
  document.body.appendChild(root)
  app = createApp({
    render: () =>
      h('svg', [h(AmountDial, { label: 'Deliver', value: state.value, max: state.max, 'onUpdate:value': (v) => (state.value = v) })])
  })
  app.mount(root)
  return state
}

describe('AmountDial', () => {
  it('brings the amount down when what is there shrinks under it', async () => {
    const state = mount({ value: 40, max: 40 })
    state.max = 0 // the delivery landed: nothing aboard
    await nextTick()
    await nextTick()
    expect(state.value).toBe(0)
    expect(root.textContent).toContain('0 / 0')
  })

  it('steps by one on the arrows, even next to the track', async () => {
    const state = mount({ value: 0, max: 40 })
    await nextTick()
    // the arrows' tap areas are the last transparent rects; the right one is last
    const taps = [...root.querySelectorAll('rect.can-click[fill="transparent"]')]
    await new Promise((resolve) => setTimeout(resolve, 5))
    const tap = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    tap(taps.at(-1))
    await nextTick()
    expect(state.value).toBe(1)
    tap(taps.at(-1))
    await nextTick()
    expect(state.value).toBe(2)
    tap(taps[0])
    await nextTick()
    expect(state.value).toBe(1)
  })
})
