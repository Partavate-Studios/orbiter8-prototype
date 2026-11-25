<template>
  <!-- Your corporation's database, a page of Minerva's console (docs/archive/briefs/corp-database.md; the words are
       libs/corp-database.js). Its name, voice and ship page are your sponsor's; the Orbiter 8, how it works
       and the history are the same for everyone. Redactions are drawn bars, heard as "classified". -->
  <div class="database" :style="{ '--corp': corp.color, '--corp-font': corp.font }">
    <header class="db-head">
      <h2 class="db-name">{{ db.name }}</h2>
      <p class="db-motto">{{ db.motto }}</p>
    </header>
    <nav class="db-pages" :aria-label="db.name">
      <button
        v-for="p in DATABASE_PAGES"
        :key="p.key"
        type="button"
        class="o8-pill small"
        :class="{ on: page === p.key }"
        :aria-current="page === p.key ? 'page' : null"
        @click="open(p.key)"
      >
        {{ p.key === 'ship' ? `The ${db.ship.name}` : p.title }}
      </button>
    </nav>

    <!-- 1. The Orbiter 8 -->
    <article v-if="page === 'orbiter8'" class="db-page">
      <p class="voice">{{ db.opening }}</p>
      <div class="split">
        <figure class="hero">
          <svg :viewBox="HERO_VIEWBOX" role="img" aria-label="The Orbiter 8, fitted out">
            <ellipse cx="0" cy="2500" rx="1500" ry="260" fill="url(#db-glow)" />
            <defs>
              <radialGradient id="db-glow">
                <stop offset="0" stop-color="#9fd4ff" stop-opacity="0.55" />
                <stop offset="1" stop-color="#9fd4ff" stop-opacity="0" />
              </radialGradient>
            </defs>
            <!-- eslint-disable-next-line vue/no-v-html -- numbers and fixed strings only (sdk/ship-art.js) -->
            <g v-html="showcase"></g>
          </svg>
        </figure>
        <div>
          <p v-for="(para, i) in ORBITER8.intro" :key="i">
            <strong v-if="para.lead">{{ para.lead }}</strong> {{ para.text }}
          </p>
          <dl class="specs">
            <template v-for="[k, v] in ORBITER8.specs" :key="k">
              <dt>{{ k }}</dt>
              <dd>{{ v }}</dd>
            </template>
          </dl>
        </div>
      </div>
    </article>

    <!-- 2. How it works -->
    <article v-else-if="page === 'how'" class="db-page">
      <figure class="diagram" aria-label="A star, the ship in its close orbit, the jump to the next star">
        <svg viewBox="0 0 520 150" aria-hidden="true">
          <defs>
            <radialGradient id="db-star">
              <stop offset="0" stop-color="#ffffff" />
              <stop offset="0.35" stop-color="#ffe6b0" />
              <stop offset="1" stop-color="#ff9e4f" stop-opacity="0" />
            </radialGradient>
            <marker id="db-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10z" fill="#b9a0ff" />
            </marker>
          </defs>
          <circle cx="90" cy="75" r="62" fill="url(#db-star)" />
          <circle cx="90" cy="75" r="20" fill="#fff4dc" />
          <ellipse
            cx="90"
            cy="75"
            rx="44"
            ry="18"
            fill="none"
            stroke="#9fd4ff"
            stroke-width="1.5"
            stroke-dasharray="4 4"
          />
          <circle cx="134" cy="75" r="5" fill="#e6dcf5" />
          <path
            d="M150 70 Q290 10 420 66"
            fill="none"
            stroke="#b9a0ff"
            stroke-width="2.5"
            marker-end="url(#db-arrow)"
          />
          <circle cx="450" cy="75" r="40" fill="url(#db-star)" />
          <circle cx="450" cy="75" r="12" fill="#fff4dc" />
          <text x="90" y="145" text-anchor="middle" class="diagram-label">charge</text>
          <text x="285" y="30" text-anchor="middle" class="diagram-label">one jump</text>
          <text x="450" y="145" text-anchor="middle" class="diagram-label">charge again</text>
        </svg>
      </figure>
      <div v-for="(para, i) in HOW_IT_WORKS" :key="i" class="para" :class="{ 'with-art': para.art }">
        <img v-if="para.art" class="art" :src="ART[para.art]" alt="" />
        <p>
          <strong v-if="para.lead">{{ para.lead }}</strong> {{ para.text }}
          <strong v-if="para.strong">{{ para.strong }}</strong> {{ para.after }}
        </p>
      </div>
      <p class="voice">{{ db.closing }}</p>
    </article>

    <!-- 3. Their own ship: mostly classified -->
    <article v-else-if="page === 'ship'" class="db-page classified">
      <div class="split">
        <figure class="hero file">
          <svg
            viewBox="-6 -6 12 12"
            role="img"
            :aria-label="`The ${db.ship.name}, a concept drawing, partly classified`"
          >
            <g stroke="var(--corp)" stroke-opacity="0.25" stroke-width="0.02">
              <path v-for="n in 11" :key="'h' + n" :d="`M-6 ${n - 6} H6`" />
              <path v-for="n in 11" :key="'v' + n" :d="`M${n - 6} -6 V6`" />
            </g>
            <fleet-ship :type="db.ship.hull" :color="corp.color" />
            <g fill="#05040a">
              <rect x="-2.6" y="-1.4" width="3.6" height="0.7" transform="rotate(-4)" />
              <rect x="-0.4" y="1.6" width="3.2" height="0.6" transform="rotate(3)" />
            </g>
            <text x="-5.6" y="5.5" class="concept">CONCEPT · NOT FLOWN</text>
          </svg>
          <span class="stamp">{{ db.ship.stamp }}</span>
        </figure>
        <div>
          <p><strong>Program:</strong> {{ db.ship.name }}. Status: {{ db.ship.status }}.</p>
          <p><strong>Focus:</strong> {{ db.ship.focus }}</p>
          <p class="spec-line">
            <template v-for="(bit, i) in db.ship.spec" :key="i">
              <span v-if="typeof bit === 'string'">{{ bit }}</span>
              <span
                v-else
                class="redact"
                role="img"
                aria-label="classified"
                :style="{ width: bit.redact * 0.62 + 'em' }"
              ></span>
            </template>
          </p>
          <div class="redacted-lines" role="img" aria-label="The rest is classified">
            <span v-for="(w, i) in REDACTED_LINES" :key="i" class="redact line" :style="{ width: w + '%' }"></span>
          </div>
          <p class="note">
            <em>{{ db.ship.stamp }}:</em> {{ db.ship.note }}
          </p>
          <p class="aside">The Orbiter 8 is still the standard every pilot flies. This one is a promise.</p>
        </div>
      </div>
    </article>

    <!-- 4. History -->
    <article v-else class="db-page">
      <div v-for="(era, i) in HISTORY" :key="i" class="para" :class="{ 'with-art': era.art }">
        <svg v-if="era.art === 'orbiter8'" class="art" viewBox="-6 -6 12 12" aria-hidden="true">
          <fleet-ship type="orbiter8" color="#e6dcf5" />
        </svg>
        <img v-else-if="era.art" class="art" :src="ART[era.art]" alt="" />
        <p>
          <strong>{{ era.lead }}</strong> {{ era.text }}
        </p>
      </div>
    </article>
  </div>
</template>

<script>
import FleetShip from '@/components/assets/fleet-ship.svg.vue'
import { shipArtParts } from '@orbiter8/sdk/ship-art'
import { DATABASE_PAGES, HISTORY, HOW_IT_WORKS, ORBITER8, corpDatabase } from '@/libs/corp-database'
import drive from '@/assets/art/engine-range.svg'
import scan from '@/assets/art/deep-scanner.svg'
import colony from '@/assets/art/colony.svg'
import water from '@/assets/art/good-water.svg'
import trade from '@/assets/art/exchange.svg'
import minerva from '@/assets/art/minerva-face.svg'
import belt from '@/assets/art/fleet.svg'

const ART = { drive, scan, pilot: minerva, colony, water, trade, minerva, belt }
/** The rest of a classified file: bars the length of lines. */
const REDACTED_LINES = [96, 88, 92, 54, 90, 72, 84, 40]

export default {
  name: 'IntroDatabase',
  components: { FleetShip },
  props: {
    /** The subscribed corporation (libs/intro corporation()) */
    corp: { type: Object, required: true }
  },
  /** page: the page opened, so Minerva can react to it (intro-console.vue) */
  emits: ['page'],
  data() {
    return {
      DATABASE_PAGES,
      ORBITER8,
      HOW_IT_WORKS,
      HISTORY,
      ART,
      REDACTED_LINES,
      HERO_VIEWBOX: '-2900 -2950 5800 5900',
      showcase: shipArtParts(ORBITER8.showcase),
      page: 'orbiter8'
    }
  },
  computed: {
    db() {
      return corpDatabase(this.corp.key)
    }
  },
  methods: {
    open(key) {
      this.o8audio?.playEffect('click')
      this.page = key
      this.$emit('page', key)
      this.$el.closest('.content')?.scrollTo?.({ top: 0 })
    }
  }
}
</script>

<style scoped>
.database {
  display: grid;
  gap: 1em;
}
.db-head {
  display: grid;
  gap: 0.2em;
}
.db-name {
  margin: 0;
  color: var(--corp);
  font-family: var(--corp-font);
}
.db-motto {
  margin: 0;
  color: #9088aa;
  font-size: 0.9em;
  font-family: var(--corp-font);
}
.db-pages {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
}
.db-page {
  display: grid;
  gap: 0.9em;
  line-height: 1.5;
}
.db-page p {
  margin: 0;
}
.voice {
  padding-left: 0.8em;
  border-left: 3px solid var(--corp);
  color: #e6dcf5;
  font-family: var(--corp-font);
  font-size: 1.05em;
}
.split {
  display: grid;
  grid-template-columns: minmax(180px, 2fr) 3fr;
  gap: 1.4em;
  align-items: start;
}
.split > div {
  display: grid;
  gap: 0.8em;
}
.hero {
  position: relative;
  margin: 0;
  padding: 0.6em;
  border: 1px solid #2a2540;
  border-radius: 12px;
  background: radial-gradient(circle at 50% 40%, #1f1838, #0c0a14 70%);
}
.hero svg {
  display: block;
  width: 100%;
  height: auto;
}
.specs {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.35em 1em;
  margin: 0;
  padding: 0.8em 1em;
  border: 1px solid #2a2540;
  border-radius: 10px;
  background: #0c0a14;
}
.specs dt {
  color: #9088aa;
}
.specs dd {
  margin: 0;
}
.diagram {
  margin: 0;
}
.diagram svg {
  display: block;
  width: 100%;
  max-width: 520px;
  height: auto;
}
.diagram-label {
  fill: #9088aa;
  font-size: 13px;
}
.para.with-art {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 1em;
  align-items: start;
}
/* each picture in a round well, like the tabs' */
.art {
  box-sizing: border-box;
  width: 64px;
  height: 64px;
  padding: 6px;
  border: 1.5px solid #4a3d7a;
  border-radius: 50%;
  background: radial-gradient(circle, #2e2354, #160f2a);
  object-fit: contain;
}
/* the classified file */
.file svg {
  opacity: 0.95;
}
.concept {
  fill: #9088aa;
  font-size: 0.42px;
  letter-spacing: 0.05px;
}
.stamp {
  position: absolute;
  top: 12%;
  right: 6%;
  padding: 0.1em 0.5em;
  border: 2px solid var(--corp);
  border-radius: 4px;
  color: var(--corp);
  font-family: var(--corp-font);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transform: rotate(-9deg);
  opacity: 0.9;
}
.redact {
  display: inline-block;
  height: 0.95em;
  vertical-align: -0.12em;
  background: #05040a;
  border: 1px solid #2a2540;
  border-radius: 2px;
}
.redacted-lines {
  display: grid;
  gap: 0.55em;
}
.redact.line {
  display: block;
  height: 0.8em;
}
.note {
  color: #bdb5d4;
  font-family: var(--corp-font);
}
.aside {
  color: #9088aa;
  font-size: 0.9em;
}
/* phones: the art above the words */
@media (max-width: 760px) {
  .split {
    grid-template-columns: 1fr;
  }
  .hero {
    max-width: 320px;
    justify-self: center;
    width: 100%;
  }
  .para.with-art {
    grid-template-columns: 46px 1fr;
  }
  .art {
    width: 46px;
    height: 46px;
    padding: 4px;
  }
}
</style>
