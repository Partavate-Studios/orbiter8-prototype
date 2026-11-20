<template>
  <!--
    Minerva's console, opened from a terminal: her face and voice are its spine (a column on wide screens,
    a band across the top on narrow ones), then what she's talking about. The subscribed corporation's
    skin is a thin band across the top: its color, logo, typeface and name; her face and words never change
    with it. Tabs: Account, Health, Mail, Jobs; the first boot (choosing a corporation) comes before them,
    and the band's corporation button opens switching. The job runs on in Jobs: the opening, naming your
    ship (the second transaction), the escort's wait.
  -->
  <section
    class="intro-console"
    role="dialog"
    aria-modal="true"
    aria-label="Minerva"
    @keydown.esc.stop="$emit('close')"
  >
    <header class="band" :style="{ '--corp': corp?.color ?? '#3f3566', background: corp?.band ?? '#14111e' }">
      <!-- eslint-disable-next-line vue/no-v-html -- the game's own SVG art (libs/intro-art.js), not user content -->
      <span v-if="corp" class="logo" aria-hidden="true" v-html="logo(corp.key, 22)"></span>
      <span class="band-text" :style="{ fontFamily: corp?.font }">{{ bandText }}</span>
      <button
        v-if="corp && tab !== 'boot' && !locked"
        type="button"
        class="o8-pill small"
        @click="$emit('tab', 'corp')"
      >
        Corporation
      </button>
      <button ref="close" type="button" class="o8-pill small close" aria-label="Close" @click="$emit('close')">
        ✕
      </button>
    </header>

    <div class="body">
      <aside class="minerva">
        <minerva-face ref="face" class="face" :state="face.state" :size="faceSize" />
        <p class="name" aria-hidden="true">MINERVA</p>
        <p class="say" aria-live="polite">{{ face.say }}</p>
        <nav v-if="tab !== 'boot'" class="tabs" aria-label="Console">
          <button
            v-for="(name, i) in TABS"
            :key="name"
            type="button"
            class="o8-pill tab"
            :class="{ on: tab === name }"
            :aria-current="tab === name ? 'page' : null"
            :disabled="locked && name !== 'Jobs'"
            :title="`${name} (${i + 1})`"
            @click="$emit('tab', name)"
          >
            <span class="o8-well" aria-hidden="true">
              <svg viewBox="-12 -12 24 24"><path :d="TAB_GLYPHS[name]" /></svg>
            </span>
            {{ name }}
            <span v-if="name === 'Mail'" class="badge" aria-label="2 overdue">2</span>
          </button>
        </nav>
      </aside>

      <div class="content">
        <!-- the first boot: subscribe to a corporation -->
        <template v-if="tab === 'boot'">
          <h2>Subscribe to a corporation</h2>
          <div class="corps">
            <article v-for="c in corps" :key="c.id" class="corp-card" :style="{ '--corp': c.color }">
              <!-- eslint-disable-next-line vue/no-v-html -- the game's own SVG art (libs/intro-art.js), not user content -->
              <span class="corp-logo" aria-hidden="true" v-html="logo(c.key, 54)"></span>
              <h3 :style="{ fontFamily: c.font }">{{ c.name }}</h3>
              <p class="kind">{{ c.kind }}</p>
              <p class="character">{{ c.character }}</p>
              <p class="feels">{{ c.feels }}</p>
              <button type="button" class="o8-pill wide" @click="subscribeTo(c.id)">Subscribe</button>
            </article>
          </div>
          <p class="note">
            Your corporation runs this unit, your job board, the curfew and this console’s look. Minerva works the same
            for everyone.
          </p>
        </template>

        <!-- switching -->
        <template v-else-if="tab === 'corp'">
          <h2>Your corporation</h2>
          <div class="corps skins">
            <article
              v-for="c in corps"
              :key="c.id"
              class="skin"
              :class="{ on: c.id === subscription }"
              :style="{ '--corp': c.color }"
            >
              <div class="skin-band" :style="{ background: c.band }">
                <!-- eslint-disable-next-line vue/no-v-html -- the game's own SVG art (libs/intro-art.js), not user content -->
                <span aria-hidden="true" v-html="logo(c.key, 16)"></span>
                <span :style="{ fontFamily: c.font }">{{ c.name }} housing</span>
              </div>
              <p :style="{ fontFamily: c.font }">{{ c.greeting }}</p>
              <button v-if="c.id !== subscription" type="button" class="o8-pill small" @click="subscribeTo(c.id)">
                Switch to {{ c.name }}
              </button>
              <p v-else class="subscribed">Subscribed</p>
            </article>
          </div>
          <dl class="terms">
            <dt>Here, on Earth</dt>
            <dd>Free. Your curfew warnings, ads, job board and this console’s look change with it.</dd>
            <dt>Later, as a pilot</dt>
            <dd>
              A fee, and maybe a wait before some benefits start. Your ports’ taxes, and the law over what you own, move
              with you.
            </dd>
            <dt>Never</dt>
            <dd>Minerva: her face, her records and how she speaks to you.</dd>
          </dl>
        </template>

        <template v-else-if="tab === 'Account'">
          <p class="greeting" :style="{ color: corp?.color, fontFamily: corp?.font }">{{ corp?.greeting }}</p>
          <div class="cards two">
            <div class="card">
              <p class="label">Balance</p>
              <p class="big owed">{{ money(BALANCE) }}</p>
              <p class="label">Owed. The stipend comes in 6 days.</p>
            </div>
            <div class="card">
              <p class="label">This cycle</p>
              <table class="cycle">
                <tr v-for="[what, amount] in CYCLE" :key="what">
                  <td>{{ what }}</td>
                  <td>{{ amount }}</td>
                </tr>
              </table>
            </div>
          </div>
        </template>

        <template v-else-if="tab === 'Health'">
          <div class="card">
            <p class="label">Health score</p>
            <p class="big owed">{{ health }} <span class="of">/ 100</span></p>
            <div
              class="meter"
              role="meter"
              :aria-valuenow="health"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Health score"
            >
              <span :style="{ width: health + '%' }"></span>
            </div>
            <p class="label">Vape −{{ hits }} today · Sleep −2 · Air quality −1</p>
          </div>
        </template>

        <template v-else-if="tab === 'Mail'">
          <div class="mail">
            <ul class="mail-list">
              <li v-for="(m, i) in MAIL" :key="m.from">
                <button type="button" class="mail-row" :class="{ open: i === openMail }" @click="openMail = i">
                  <span class="from">{{ m.from }}</span>
                  <span class="subject">{{ m.subject }}</span>
                  <span v-if="m.tag" class="tag" :class="{ overdue: m.tag === 'Overdue' }">{{ m.tag }}</span>
                </button>
              </li>
            </ul>
            <article class="letter" :style="{ fontFamily: corp?.font }">
              <h3>{{ MAIL[openMail].subject }}</h3>
              <p class="label">{{ MAIL[openMail].from }}</p>
              <p v-for="line in MAIL[openMail].body" :key="line">{{ line }}</p>
            </article>
          </div>
        </template>

        <!-- Jobs: the board and the opening -->
        <template v-else-if="tab === 'Jobs' && (jobStep === 'board' || jobStep === 'job')">
          <div class="jobs">
            <ul class="board" aria-label="Job board">
              <li>
                <button
                  type="button"
                  class="job-row yours"
                  :class="{ open: jobStep === 'job' }"
                  @click="$emit('job-step', 'job')"
                >
                  <span class="from">Pilot · Orbiter 8 program</span>
                  <span class="eligible">You’re eligible</span>
                </button>
              </li>
              <li v-for="job in OTHER_JOBS" :key="job" class="job-row other">
                <span class="from">{{ job }}</span>
                <span class="subject">Requires citizenship</span>
              </li>
            </ul>
            <article v-if="jobStep === 'job'" class="opening">
              <div class="ship-outline" aria-hidden="true">
                <svg viewBox="-6.5 -6.5 13 13"><ship /></svg>
              </div>
              <h2>Pilot, Orbiter 8 program</h2>
              <p class="label">{{ corp?.name }} Shipping · one opening · starts tonight</p>
              <p class="pitch">A new life, out there. We’ll be honest about what it takes.</p>
              <dl class="terms">
                <template v-for="[k, v] in terms" :key="k">
                  <dt>{{ k }}</dt>
                  <dd>{{ v }}</dd>
                </template>
              </dl>
              <div class="actions">
                <button ref="accept" type="button" class="o8-pill main big" @click="$emit('job-step', 'ship')">
                  Accept the job
                </button>
                <button type="button" class="o8-pill quiet" @click="$emit('job-step', 'board')">Not yet</button>
              </div>
              <p class="label">Accepting is the only way out (or back to the title).</p>
            </article>
          </div>
        </template>

        <!-- naming your ship: the second transaction -->
        <template v-else-if="tab === 'Jobs' && jobStep === 'ship'">
          <form class="ship-form" @submit.prevent="submitShip">
            <div class="ship-outline big" aria-hidden="true">
              <svg viewBox="-6.5 -6.5 13 13"><ship /></svg>
            </div>
            <label for="intro-ship" class="ship-label">Name your ship</label>
            <input
              id="intro-ship"
              ref="shipInput"
              v-model="shipName"
              type="text"
              autocomplete="off"
              spellcheck="false"
              :maxlength="NAME_MAX_LENGTH + 10"
              aria-describedby="intro-ship-hint"
              @keydown="$refs.face?.play('flash')"
            />
            <p id="intro-ship-hint" class="label" :class="{ problem: shipProblem && shipProblem !== 'empty' }">
              {{ shipHint }}
            </p>
            <button type="submit" class="o8-pill main big" :disabled="Boolean(shipProblem)">Sign and name her</button>
            <p class="label">Your wallet signs: the ship is made, and you join {{ corp?.name }}.</p>
          </form>
        </template>

        <!-- the escort's wait -->
        <template v-else-if="tab === 'Jobs' && jobStep === 'escort'">
          <h2>Pickup</h2>
          <ol class="steps" aria-label="Pickup">
            <li :class="signState">Signed</li>
            <li :class="{ done: status === 'done', now: status === 'sent' }">
              Ship registered: {{ registration?.name }}
            </li>
            <li :class="{ done: status === 'done' }">Escort at your door</li>
          </ol>
          <p v-if="status === 'confirm'" class="wallet-wait" role="status">Confirm it in your wallet</p>
          <template v-else-if="status === 'failed'">
            <p class="problem" role="alert">{{ failureText }}</p>
            <button ref="retry" type="button" class="o8-pill main" @click="$emit('retry')">Try again</button>
          </template>
          <div class="pickup">
            <div class="map" :class="status" aria-hidden="true">
              <span class="route"></span>
              <span class="car"></span>
              <span class="home">Block 7</span>
            </div>
            <div class="card waiting">
              <p class="label">While you wait</p>
              <p>Nothing to pack. They take the body as it is.</p>
              <p>Your debts and your name go with you.</p>
              <p>The door unlocks when they arrive. Curfew doesn’t apply to them.</p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script>
import { mapState } from 'pinia'
import { useOnboardingStore } from '@/stores/onboarding'
import MinervaFace from '@/components/minerva/minerva-face.vue'
import Ship from '@/components/star-map/sprites/ship.svg.vue'
import { BALANCE, CYCLE, MAIL, OTHER_JOBS, SAY, corporation, jobTerms } from '@/libs/intro'
import { corpLogo } from '@/libs/intro-art'
import { cleanName, nameProblem, NAME_MAX_LENGTH, PILOT_NAME_MIN_LENGTH } from '@/libs/onboarding'

const TABS = ['Account', 'Health', 'Mail', 'Jobs']
/** The tabs' pictures, in their wells (24 units, centered). */
const TAB_GLYPHS = {
  Account:
    'M-8 -5 h16 a2 2 0 0 1 2 2 v8 a2 2 0 0 1 -2 2 h-16 a2 2 0 0 1 -2 -2 v-8 a2 2 0 0 1 2 -2z M-10 -1 h20 M-6 4 h5',
  Health: 'M0 8 C-9 2 -10 -3 -7 -6 C-4 -9 -1 -7 0 -4 C1 -7 4 -9 7 -6 C10 -3 9 2 0 8z',
  Mail: 'M-9 -6 h18 v12 h-18z M-9 -6 L0 2 L9 -6',
  Jobs: 'M-9 -3 h18 v10 h-18z M-4 -3 v-3 h8 v3 M-9 2 h18'
}

export default {
  name: 'IntroConsole',
  components: { MinervaFace, Ship },
  props: {
    /** 'boot' | 'corp' | 'Account' | 'Health' | 'Mail' | 'Jobs' */
    tab: { type: String, required: true },
    /** In Jobs: 'board' | 'job' | 'ship' | 'escort' */
    jobStep: { type: String, default: 'board' },
    /** The subscribed corporation (libs/intro corporation()), or null before the first boot */
    corp: { type: Object, default: null },
    corpNames: { type: Array, default: () => [] },
    subscription: { type: Number, default: null },
    health: { type: Number, required: true },
    hits: { type: Number, required: true },
    /** onboarding's registration of the ship, if one is under way */
    registration: { type: Object, default: null },
    pilotName: { type: String, default: '' }
  },
  emits: ['tab', 'job-step', 'subscribe', 'submit-ship', 'retry', 'close'],
  data() {
    return {
      TABS,
      TAB_GLYPHS,
      BALANCE,
      CYCLE,
      MAIL,
      OTHER_JOBS,
      NAME_MAX_LENGTH,
      openMail: 2,
      shipName: this.registration?.name ?? '',
      faceSize: 230
    }
  },
  computed: {
    ...mapState(useOnboardingStore, ['callsigns']),
    corps() {
      return [1, 2, 3].map((id) => corporation(id, this.corpNames))
    },
    /** Once the job is accepted there's no going back to the other tabs. */
    locked() {
      return (
        this.tab === 'Jobs' && (this.jobStep === 'escort' || (this.jobStep === 'ship' && Boolean(this.registration)))
      )
    },
    bandText() {
      if (!this.corp) return 'Housing unit 7-2216 · first boot'
      return `${this.corp.name} housing · Unit 7-2216${this.tab === 'corp' ? ' · Corporation' : ''}`
    },
    status() {
      return this.registration?.status ?? 'confirm'
    },
    signState() {
      if (this.status === 'confirm') return 'you'
      return this.status === 'failed' && this.registration?.failure === 'rejected' ? 'you' : 'done'
    },
    terms() {
      return jobTerms(this.corp?.name ?? 'your corporation')
    },
    /** What her face does and says, by what's on screen. */
    face() {
      switch (this.tab) {
        case 'boot':
          return { state: 'talking', say: SAY.firstBoot }
        case 'corp':
          return { state: 'talking', say: SAY.switching }
        case 'Account':
          return { state: 'skeptical', say: SAY.account }
        case 'Health':
          return { state: 'skeptical', say: SAY.health(this.health) }
        case 'Mail':
          return { state: 'talking', say: SAY.mail }
      }
      if (this.jobStep === 'ship') return { state: 'listening', say: SAY.shipName }
      if (this.jobStep === 'escort') {
        if (this.status === 'failed') return { state: 'annoyed', say: 'That didn’t go through. Nothing was signed.' }
        if (this.status === 'confirm') return { state: 'waiting', say: 'Sign it in your wallet. I’ll wait.' }
        return { state: 'thinking', say: SAY.escort }
      }
      return { state: 'listening', say: SAY.jobs }
    },
    shipProblem() {
      return nameProblem(this.shipName, { minLength: PILOT_NAME_MIN_LENGTH })
    },
    shipHint() {
      if (this.shipProblem === 'too short') return `At least ${PILOT_NAME_MIN_LENGTH} characters.`
      if (this.shipProblem === 'too long') return `At most ${NAME_MAX_LENGTH} characters.`
      return 'Registered with Minerva by name.'
    },
    failureText() {
      if (this.registration?.failure === 'rejected') return 'You declined in your wallet. Nothing was signed.'
      return 'It didn’t go through: ' + (this.registration?.reason ?? 'unknown reason') + '.'
    }
  },
  watch: {
    tab() {
      this.focusFirst()
    },
    jobStep() {
      this.focusFirst()
    },
    status(status) {
      if (status === 'failed') {
        this.$refs.face?.play('glitch')
        this.$nextTick(() => this.$refs.retry?.focus())
      }
    }
  },
  mounted() {
    this.fit = () => (this.faceSize = window.innerWidth < 760 ? 120 : 230)
    this.fit()
    window.addEventListener('resize', this.fit)
    this.onKey = (event) => {
      // 1–4 pick the tabs
      if (this.tab === 'boot' || this.locked || event.target.tagName === 'INPUT') return
      const index = Number(event.key) - 1
      if (TABS[index]) this.$emit('tab', TABS[index])
    }
    window.addEventListener('keydown', this.onKey)
    this.focusFirst()
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.fit)
    window.removeEventListener('keydown', this.onKey)
  },
  methods: {
    logo(key, size) {
      return `<svg viewBox="${-size / 2 - 2} ${-size / 2 - 2} ${size + 4} ${size + 4}" width="${size + 4}" height="${size + 4}">${corpLogo(key, 0, 0, size)}</svg>`
    },
    money(n) {
      return (n < 0 ? '−' : '') + Math.abs(n) + '¢'
    },
    focusFirst() {
      this.$nextTick(() => {
        if (this.jobStep === 'ship' && this.tab === 'Jobs') this.$refs.shipInput?.focus()
        else if (this.jobStep === 'job' && this.tab === 'Jobs') this.$refs.accept?.focus()
        else this.$el.querySelector?.('.content button, .tabs .primary')?.focus()
      })
    },
    subscribeTo(id) {
      this.o8audio?.playEffect('click')
      this.$refs.face?.play('nod')
      this.$emit('subscribe', id)
      if (this.tab === 'boot') this.$emit('tab', 'Account')
    },
    submitShip() {
      if (this.shipProblem) return
      this.o8audio?.playEffect('click')
      this.$emit('submit-ship', cleanName(this.shipName))
    }
  }
}
</script>

<style scoped>
.intro-console {
  position: absolute;
  inset: 4.2em 3.5em 2.2em;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  background: #120f1c;
  border: 1.5px solid #3f3566;
  border-radius: 18px;
  overflow: hidden;
  z-index: 6;
  box-shadow: 0 0 0 100vmax #030306c4;
}
.band {
  display: flex;
  align-items: center;
  gap: 0.7em;
  padding: 0.45em 0.7em 0.45em 1em;
  border-bottom: 2px solid var(--corp);
  color: #bdb5d4;
  font-size: 0.95em;
}
.band-text {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.logo {
  display: flex;
}
.close {
  font-size: 1.05em;
}
.body {
  display: grid;
  grid-template-columns: 20em 1fr;
  min-height: 0;
}
.minerva {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 1.4em 1.6em 1.5em;
  background: #0d0b15;
  border-right: 1px solid #3f3566;
  min-height: 0;
}
.face {
  align-self: center;
}
.name {
  margin: 0.4em 0 0;
  text-align: center;
  font-size: 0.78em;
  font-weight: 700;
  letter-spacing: 0.35em;
  color: #9088aa;
}
.say {
  margin: 1em 0 1.2em;
  font-size: 1.2em;
  line-height: 1.4;
}
.tabs {
  margin-top: auto;
  display: grid;
  gap: 0.6em;
}
.tab {
  justify-content: flex-start;
  min-height: 2.75em;
  padding: 0 1em 0 0.3em;
  font-size: 1.1em;
}
.badge {
  margin-left: auto;
  min-width: 1.5em;
  height: 1.5em;
  border-radius: 999px;
  background: #e1177c;
  color: #fff;
  font-size: 0.7em;
  font-weight: 700;
  display: grid;
  place-items: center;
}
.content {
  padding: 1.5em 2em 2em;
  overflow-y: auto;
  min-height: 0;
  display: grid;
  align-content: start;
  gap: 1em;
}
h2 {
  margin: 0;
  font-weight: 500;
  font-size: 1.6em;
}
h3 {
  margin: 0;
  font-weight: 600;
}
.label {
  margin: 0;
  color: #9088aa;
  font-size: 0.92em;
}
.note {
  margin: 0;
  color: #bdb5d4;
}
.problem {
  color: #ff6fb0;
  margin: 0;
}

/* the first boot and switching */
.corps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1em;
}
.corp-card {
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 0.5em;
  padding: 1.4em 1.3em 1.3em;
  background: #17141f;
  border: 1.2px solid #3f3566;
  border-top: 3px solid var(--corp);
  border-radius: 16px;
  text-align: center;
}
.corp-card h3 {
  font-size: 1.5em;
}
.kind {
  margin: 0;
  font-size: 0.8em;
  color: #9088aa;
}
.character {
  margin: 0.5em 0 0;
  color: #bdb5d4;
}
.feels {
  margin: 0;
  font-style: italic;
  flex: 1;
}
.corp-card .o8-pill {
  margin-top: 0.6em;
  font-size: 1.1em;
}
.skin {
  background: #120f1c;
  border: 1px solid #3f3566;
  border-radius: 12px;
  overflow: hidden;
  display: grid;
  align-content: start;
}
.skin.on {
  border-color: #c3b3da;
}
.skin-band {
  display: flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.45em 0.7em;
  border-bottom: 2px solid var(--corp);
  font-size: 0.85em;
  color: #bdb5d4;
}
.skin p {
  margin: 0.8em 0.9em;
}
.skin .o8-pill {
  margin: 0 0.9em 0.9em;
  justify-self: start;
}
.subscribed {
  color: #c3b3da;
  font-weight: 600;
}
.terms {
  margin: 0;
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.6em 1.4em;
}
.terms dt {
  color: #9088aa;
  font-weight: 600;
}
.terms dd {
  margin: 0;
}

/* account and health */
.greeting {
  margin: 0;
}
.cards.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1em;
}
.card {
  background: #0d0b15;
  border: 1px solid #3f3566;
  border-radius: 14px;
  padding: 1.1em 1.3em;
  display: grid;
  gap: 0.4em;
  align-content: start;
}
.big {
  margin: 0;
  font-size: 3.6em;
  font-weight: 500;
  line-height: 1.1;
}
.owed {
  color: #ff6fb0;
}
.of {
  font-size: 0.35em;
  color: #9088aa;
}
.cycle {
  border-collapse: collapse;
}
.cycle td {
  padding: 0.2em 0;
}
.cycle td:last-child {
  text-align: right;
  font-family: 'Ubuntu Mono', monospace;
}
.meter {
  height: 14px;
  border-radius: 7px;
  background: #1a1726;
  overflow: hidden;
}
.meter span {
  display: block;
  height: 100%;
  background: #e1177c;
}

/* mail */
.mail {
  display: grid;
  grid-template-columns: minmax(16em, 22em) 1fr;
  gap: 1.2em;
  align-items: start;
}
.mail-list,
.board {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.5em;
}
.mail-row,
.job-row {
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.2em 0.6em;
  text-align: left;
  font: inherit;
  color: #efe7ff;
  background: linear-gradient(180deg, #2e2354 0%, #211839 100%);
  border: 1.5px solid #4a3d7a;
  border-radius: 14px;
  padding: 0.65em 0.9em;
  box-sizing: border-box;
}
button.mail-row,
button.job-row {
  cursor: pointer;
}
button.mail-row:hover,
button.job-row:hover,
.mail-row.open,
.job-row.open {
  background: linear-gradient(180deg, #3a2c69 0%, #2a1f4c 100%);
  border-color: #b9a0ff;
}
button.mail-row:focus-visible,
button.job-row:focus-visible {
  outline: 2.5px solid var(--o8-brand-300, #b9a0ff);
  outline-offset: 3px;
}
.from {
  font-weight: 600;
}
.subject {
  grid-column: 1;
  color: #bdb5d4;
  font-size: 0.92em;
}
.tag {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  font-size: 0.78em;
  font-weight: 600;
  border: 1.5px solid #9088aa;
  color: #bdb5d4;
  border-radius: 999px;
  padding: 0.15em 0.7em;
}
.tag.overdue {
  border-color: #e1177c;
  color: #ff6fb0;
}
.letter {
  background: #0d0b15;
  border: 1px solid #3f3566;
  border-radius: 12px;
  padding: 1.2em 1.4em;
}
.letter p {
  color: #bdb5d4;
  line-height: 1.45;
}

/* jobs */
.jobs {
  display: grid;
  grid-template-columns: minmax(14em, 17em) 1fr;
  gap: 1.2em;
  align-items: start;
}
.job-row.yours {
  border-color: #ccff00;
}
.job-row.yours.open {
  border-color: #ccff00;
  box-shadow: 0 0 0 3px #b9a0ff;
}
.eligible {
  grid-column: 1;
  color: #ebff99;
  font-size: 0.9em;
  font-weight: 600;
}
.eligible::before {
  content: '';
  display: inline-block;
  width: 0.6em;
  height: 0.6em;
  border-radius: 50%;
  background: #ccff00;
  margin-right: 0.45em;
}
.job-row.other {
  color: #9088aa;
  background: #14111c;
}
.job-row.other .from {
  font-weight: 400;
}
.opening {
  position: relative;
  background: #0d0b15;
  border: 1px solid #3f3566;
  border-radius: 14px;
  padding: 1.4em 1.6em;
  display: grid;
  gap: 0.8em;
}
.pitch {
  margin: 0;
  font-size: 1.2em;
}
.actions {
  display: flex;
  gap: 1em;
  flex-wrap: wrap;
}
/* your ship to be: the game's ship, drawn as a yellow outline (yellow: yours) */
.ship-outline {
  position: absolute;
  right: 1.2em;
  top: 1em;
  width: 4.5em;
  height: 4.5em;
  transform: rotate(30deg);
}
.ship-outline svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.ship-outline :deep(path) {
  fill: none;
  stroke: #ccff00;
  stroke-width: 120;
}
.ship-outline.big {
  position: static;
  width: 9rem;
  height: 9rem;
  transform: none;
  justify-self: center;
  align-self: center;
}
.ship-outline.big :deep(path) {
  stroke-width: 70;
}
.ship-form {
  display: grid;
  gap: 0.7em;
  width: min(32em, 100%);
  justify-self: center;
  text-align: center;
}
.ship-label {
  font-size: 1.7em;
  font-weight: 500;
}
.ship-form input {
  font: inherit;
  font-size: 1.6em;
  color: #ebff99;
  background: #120f1c;
  border: 2.5px solid #ccff00;
  border-radius: 14px;
  padding: 0.35em 0.6em;
  min-width: 0;
}

/* the escort's wait */
.steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  color: #9088aa;
}
.steps li::before {
  content: '';
  display: block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2.5px solid currentColor;
  margin-bottom: 0.4em;
}
.steps .done {
  color: #c3b3da;
}
.steps .done::before {
  background: #c3b3da;
}
.steps .now {
  color: #b9a0ff;
}
.steps .you {
  color: #ff6fb0;
}
.steps .you::before {
  border-style: dashed;
}
.wallet-wait {
  margin: 0;
  border: 2px solid #e1177c;
  border-radius: 999px;
  padding: 0.55em 1.2em;
  justify-self: start;
  color: #ff6fb0;
  font-weight: 500;
}
.pickup {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 1em;
}
.waiting p:not(.label) {
  margin: 0.3em 0;
}
/* the block from above: the escort's car drives in, in step with the chain */
.map {
  position: relative;
  height: 18em;
  border: 1px solid #3f3566;
  border-radius: 12px;
  background: repeating-linear-gradient(90deg, #0a0910 0 46px, #16131f 46px 60px), #0a0910;
  overflow: hidden;
}
.map::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(#0000 0 44px, #16131f 44px 56px);
}
.route {
  position: absolute;
  left: 8%;
  top: 45%;
  width: 72%;
  height: 0;
  border-top: 4px dotted #b9a0ff;
  z-index: 1;
}
.car {
  position: absolute;
  left: 6%;
  top: calc(45% - 7px);
  width: 24px;
  height: 16px;
  border-radius: 4px;
  background: #e6dcf5;
  z-index: 2;
  transition: left 3s ease-in-out;
}
.map.confirm .car {
  left: 6%;
}
.map.sent .car {
  left: 50%;
  animation: creep 6s ease-in-out infinite alternate;
}
.map.done .car {
  left: 78%;
}
@keyframes creep {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(80px);
  }
}
.home {
  position: absolute;
  left: 80%;
  top: calc(45% - 28px);
  padding: 4px 6px;
  border: 2px solid #c3b3da;
  border-radius: 4px;
  background: #221d30;
  font-size: 0.75em;
  color: #bdb5d4;
  z-index: 2;
}

/* narrow screens: her face and words across the top, the tabs along the bottom */
@media (max-width: 760px) {
  .intro-console {
    inset: 2.6em 0 0;
    border-radius: 0;
    border: 0;
  }
  .body {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr) auto;
  }
  .minerva {
    display: contents;
  }
  /* her face and words share the top cell; everything stays in the one column */
  .face,
  .say,
  .tabs,
  .content {
    grid-column: 1;
  }
  .face {
    grid-row: 1;
    margin: 0.8em 0 0 0.8em;
    align-self: start;
    justify-self: start;
  }
  .name {
    display: none;
  }
  .say {
    grid-row: 1;
    margin: 0.9em 1em 0.8em 9.5em;
    font-size: 1em;
    min-height: 4.6em;
  }
  .tabs {
    grid-row: 3;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.4em;
    padding: 0.5em 0.4em 0.8em;
    border-top: 1px solid #3f3566;
    background: #0d0b15;
  }
  /* on a phone, each tab stacks its picture over its name: a rounded tile, same plum and edge */
  .tab {
    flex-direction: column;
    justify-content: center;
    gap: 0.25em;
    min-height: 0;
    padding: 0.45em 0.2em 0.5em;
    border-radius: 16px;
    font-size: 0.85em;
  }
  .tab .badge {
    position: absolute;
    top: 0.2em;
    right: 0.3em;
    margin: 0;
  }
  .content {
    grid-row: 2;
    padding: 1em;
    border-top: 1px solid #3f3566;
  }
  .corps,
  .cards.two,
  .mail,
  .jobs,
  .pickup {
    grid-template-columns: minmax(0, 1fr);
  }
  .corp-card {
    grid-template-columns: auto 1fr;
    justify-items: start;
    text-align: left;
    gap: 0.2em 0.9em;
    padding: 0.9em 1em;
  }
  .corp-logo {
    grid-row: 1 / span 4;
    align-self: center;
  }
  .corp-card .character {
    display: none;
  }
  .corp-card .o8-pill {
    grid-column: 1 / -1;
    margin-top: 0.4em;
  }
  .board .other {
    display: none;
  }
  .map {
    height: 12em;
  }
  .terms {
    grid-template-columns: 1fr;
    gap: 0.1em;
  }
  .terms dd {
    margin-bottom: 0.5em;
  }
}
</style>
