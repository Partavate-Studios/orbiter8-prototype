// The Minerva drawer: the network's side of things. Filings (your moves on their way to the
// chain), Comms (the galaxy-wide broadcast), Sieges (the public feed), Ranks, and settings.
import { useEffect, useState } from 'preact/hooks'
import { rankPlayers } from '@orbiter8/sdk/leaderboard'
import { chainName } from '@orbiter8/sdk/chain/networks'
import { game, ui, commit, set, planetModel } from '../store'
import { setSound } from '../sound'
import { cr, short } from '../format'
import { Section, Tabs, NameField, Tag, Fact } from './parts'

const STATUS = { signing: 'awaiting approval', sent: 'sent · waiting for a block', stamped: 'stamped', refused: 'refused', declined: 'not approved' }

function Filings() {
  if (!ui.filings.length) return <p class="empty">Every move you make is filed with Minerva and shows here: sent, stamped into a block, or refused with the reason.</p>
  return (
    <ul class="filings">
      {ui.filings.map((f) => (
        <li key={f.id} class={f.status}>
          <i class="pip" />
          <span class="grow">
            <b>{f.label}</b>
            <span class="sub">{f.error ?? STATUS[f.status]}{f.block ? ` · block ${f.block}` : ''}</span>
          </span>
          <span class="num dim">{new Date(f.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </li>
      ))}
    </ul>
  )
}

function Comms() {
  const s = game.state
  // the call sign as it is now (it can be changed); the registration's name only as a fallback
  const names = Object.fromEntries((s.events?.avatarEvents ?? []).map((e) => [e.returnValues._owner, e.returnValues._name]))
  const chat = [...(s.events?.chatEvents ?? [])].reverse()
  return (
    <div class="stack">
      <NameField max={280} label="Broadcast" sub="to the whole galaxy" placeholder="Say something to every pilot" run={(message) => commit('Broadcast sent', (o) => game.actions.sendChat(message, o))} />
      {!chat.length && <p class="empty">Quiet out there. Broadcasts reach every pilot, everywhere.</p>}
      <ul class="plain chat">
        {chat.map((e) => (
          <li key={e.transactionHash}>
            <b class={e.returnValues._sender === s.account ? 'amber' : ''}>{s.callsigns[e.returnValues._sender] || names[e.returnValues._sender] || short(e.returnValues._sender)}</b>
            <span class="grow">{e.returnValues._message}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Sieges() {
  const s = game.state
  const who = (a) => (a === s.account ? 'You' : s.callsigns[a] || 'A pilot')
  const words = (e) => {
    // its given name when the client knows it (here, or one of yours), else the one the seed gives it
    const planet = planetModel(e.planet)?.name ?? game.derivedPlanetName(e.planet)
    const star = game.starName(Math.floor(e.planet / 256))
    switch (e.event) {
      case 'SiegeStarted': return `${who(e.who)} laid siege to ${planet} at ${star}`
      case 'DefenderJoined': return `${who(e.who)} joined the defense of ${planet}`
      case 'WornDown': return `${planet} at ${star} was worn down`
      case 'ClaimFiled': return `${who(e.who)} filed a claim on ${planet}`
      case 'ClaimFailed': return `The claim on ${planet} failed: its defenses returned`
      default: return e.args[2] ? `${who(e.who)} took ${planet} at ${star}` : e.args[3] ? `${who(e.who)} was driven off ${planet}` : `The siege of ${planet} ended`
    }
  }
  if (!s.feed.length) return <p class="empty">No sieges on record. Every siege is public: it will show here and on every chart.</p>
  return (
    <ul class="plain">
      {s.feed.map((e, i) => (
        <li key={i}><i class="pip red" /><span class="grow">{words(e)}</span><span class="num dim">#{e.block}</span></li>
      ))}
    </ul>
  )
}

function Ranks() {
  const [board, setBoard] = useState(null)
  const [by, setBy] = useState('planets')
  useEffect(() => {
    game.getLeaderboard().then(setBoard, () => setBoard({ players: [] }))
  }, [])
  if (!board) return <p class="empty">Asking Minerva…</p>
  return (
    <div class="stack">
      <Tabs value={by} onChange={setBy} options={[['planets', 'By planets'], ['credits', 'By credits']]} />
      <table class="desk">
        <thead><tr><th>#</th><th>Pilot</th><th class="r">Planets</th><th class="r">Ports</th><th class="r">Credits</th></tr></thead>
        <tbody>
          {rankPlayers([...board.players], by).map((p, i) => (
            <tr key={p.address} class={p.address === game.state.account ? 'active' : ''}>
              <td class="num dim">{i + 1}</td><td><b>{p.name}</b></td><td class="r num">{p.planets}</td><td class="r num">{p.ports}</td><td class="r num">{cr(p.credits)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Settings() {
  const s = game.state
  return (
    <div class="stack">
      <div class="facts">
        <Fact label="Network">{chainName(s.chainId)}</Fact>
        <Fact label="Block"><span class="num">{s.blockNumber}</span></Fact>
        <Fact label="Account"><span class="num">{short(s.account)}</span></Fact>
        <Fact label="Gas money"><span class="num">{Number(s.balance).toFixed(3)}</span></Fact>
        <Fact label="Pilots"><span class="num">{s.player?.avatarCount ?? 0}</span></Fact>
        <Fact label="Stars discovered"><span class="num">{s.player?.starSystemCount ?? 1}</span></Fact>
      </div>
      <label class="toggle">
        <input type="checkbox" checked={ui.sound} onChange={(e) => (setSound(e.currentTarget.checked), set({ sound: e.currentTarget.checked }))} />
        Sound cues (sent, stamped, refused, scan)
      </label>
      <p class="hint">Keys: 1–5 tabs · M Minerva · arrows pan · + − zoom · [ ] step through worlds or stars · Enter commits · Esc back. Gamepad: LB/RB tabs, d-pad steps, right stick pans, triggers zoom, A commits, B back.</p>
      {ui.devWallet && <Tag>dev wallet · add ?account=2 to the address for another pilot</Tag>}
    </div>
  )
}

export function Minerva() {
  const tab = ui.drawer
  const flying = ui.filings.filter((f) => f.status === 'signing' || f.status === 'sent').length
  return (
    <div class="drawer-wrap" onClick={(e) => e.target === e.currentTarget && set({ drawer: null })}>
      <aside class="drawer">
        <div class="head">
          <div class="grow">
            <h2>Minerva</h2>
            <p class="lede">The ledger every pilot files with. She keeps nothing, so no one can buy her.</p>
          </div>
          <button class="ghost x" aria-label="Close" onClick={() => set({ drawer: null })}>×</button>
        </div>
        <Tabs value={tab} onChange={(drawer) => set({ drawer })} options={[['filings', 'Filings', flying || null], ['comms', 'Comms'], ['sieges', 'Sieges'], ['ranks', 'Ranks'], ['settings', 'Set']]} />
        <Section>{tab === 'filings' ? <Filings /> : tab === 'comms' ? <Comms /> : tab === 'sieges' ? <Sieges /> : tab === 'ranks' ? <Ranks /> : <Settings />}</Section>
      </aside>
    </div>
  )
}
