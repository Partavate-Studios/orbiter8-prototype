// The interface's small parts. `Commit` is the only amber-filled control: it files a move.
import { useState } from 'preact/hooks'
import { wait } from '../format'
import { ui } from '../store'

/**
 * A commit button: states what it does and what it costs, and is busy while its filing is in flight.
 * `run` returns a promise (usually store.commit(…)). `why` explains a disabled button.
 */
export function Commit({ label, sub, why, disabled, run, primary, small, danger }) {
  const [pending, setPending] = useState(false)
  const off = disabled || Boolean(why) || pending
  const go = async () => {
    if (off) return
    setPending(true)
    try {
      await run()
    } finally {
      setPending(false)
    }
  }
  return (
    <button class={`commit${small ? ' small' : ''}${pending ? ' pending' : ''}${danger ? ' danger' : ''}`} disabled={off} onClick={go} data-primary={primary ? '' : undefined}>
      <span class="commit-label">{pending ? 'Filing with Minerva…' : label}</span>
      {(why || sub) && <span class="commit-sub">{why || sub}</span>}
    </button>
  )
}

/** A quantity: − value + and "max", with a slider when the range is long. */
export function Qty({ value, max, min = 0, onChange, step = 1 }) {
  const clamp = (v) => Math.max(min, Math.min(max, Math.round(v / step) * step || 0))
  return (
    <div class="qty">
      <button class="ghost" disabled={value <= min} onClick={() => onChange(clamp(value - step))} aria-label="Less">−</button>
      <input type="number" inputMode="numeric" value={value} min={min} max={max} step={step} onInput={(e) => onChange(clamp(Number(e.currentTarget.value)))} />
      <button class="ghost" disabled={value >= max} onClick={() => onChange(clamp(value + step))} aria-label="More">+</button>
      <button class="ghost max" disabled={value >= max} onClick={() => onChange(clamp(max))}>max</button>
      {max - min > 8 * step && (
        <input class="slide" type="range" value={value} min={min} max={max} step={step} onInput={(e) => onChange(clamp(Number(e.currentTarget.value)))} />
      )}
    </div>
  )
}

export const Section = ({ title, aside, children }) => (
  <section class="section">
    {title && (
      <h3>
        <span>{title}</span>
        {aside && <span class="aside">{aside}</span>}
      </h3>
    )}
    {children}
  </section>
)

/** A countdown to `at` (ms), reading the store's clock so it ticks. */
export const Timer = ({ at, done = 'ready' }) => <span class="num">{at > ui.now ? wait(at - ui.now) : done}</span>

/** A thin bar of parts: [{ value, tone }] out of `total`. */
export const Bar = ({ parts, total }) => (
  <div class="bar">
    {parts.map((p, i) => (
      <i key={i} class={p.tone} style={{ width: `${Math.max(0, Math.min(100, (p.value / Math.max(1, total)) * 100))}%` }} />
    ))}
  </div>
)

export const Tag = ({ tone = '', children }) => <span class={`tag ${tone}`}>{children}</span>

export const Fact = ({ label, children }) => (
  <div class="fact">
    <span class="label">{label}</span>
    <span>{children}</span>
  </div>
)

/** A segmented control. */
export const Tabs = ({ value, options, onChange }) => (
  <div class="tabs" role="tablist">
    {options.map(([id, label, badge]) => (
      <button key={id} role="tab" aria-selected={value === id} class={value === id ? 'on' : ''} onClick={() => onChange(id)}>
        {label}
        {badge ? <b>{badge}</b> : null}
      </button>
    ))}
  </div>
)

/** A text field with a commit beside it (names, chat). */
export function NameField({ label, placeholder, value: initial = '', sub, problem, run, max = 24 }) {
  const [value, setValue] = useState(initial)
  const issue = value ? problem?.(value) : null
  return (
    <div class="namefield">
      <input type="text" maxLength={max} placeholder={placeholder} value={value} onInput={(e) => setValue(e.currentTarget.value)} />
      <Commit small label={label} sub={sub} why={issue} disabled={!value.trim()} run={async () => (await run(value.trim())) && setValue('')} />
    </div>
  )
}
