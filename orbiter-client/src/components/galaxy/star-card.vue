<template>
  <!-- The selected star: what it is, who found it, its scan, and what your ship can do there. -->
  <aside class="star-card">
    <h3>{{ name }}</h3>
    <p class="sub">{{ kind }} · cell {{ cell }}</p>
    <template v-if="info">
      <p v-if="info.discoverer">Discovered by {{ discovererName }}</p>
      <p v-else-if="!info.visited">Charted, not yet visited</p>
      <template v-if="info.visited && !info.scanned">
        <p v-if="preview && !preview.stars && !preview.holes" class="scan">
          Long-range scan: nothing new nearby. It's recorded with your next move.
        </p>
        <p v-else-if="preview" class="scan">
          Long-range scan: {{ preview.stars }} new {{ preview.stars === 1 ? 'star' : 'stars'
          }}{{ preview.holes ? ` and ${preview.holes} black hole${preview.holes === 1 ? '' : 's'}` : '' }}
          found. It's recorded with your next move.
        </p>
        <p v-else class="scan">Long-range scan in progress…</p>
      </template>
    </template>
    <p v-if="distanceAway > 0" class="sub">{{ distanceAway }} {{ distanceAway === 1 ? 'step' : 'steps' }} away</p>

    <div class="actions">
      <button
        v-if="galaxy.canJumpTo(cell)"
        class="o8-button primary"
        :disabled="Boolean(galaxy.busy)"
        @click="galaxy.jump(cell)"
      >
        Jump here
      </button>
      <button v-if="atBlackHole" class="o8-button primary" :disabled="Boolean(galaxy.busy)" @click="galaxy.traverse()">
        Go through
      </button>
      <form v-if="canRename" class="rename" @submit.prevent="rename">
        <input v-model="newName" maxlength="24" placeholder="Rename this star" />
        <button class="o8-button small" :disabled="!newName.trim() || Boolean(galaxy.busy)">Rename</button>
      </form>
    </div>
  </aside>
</template>

<script>
import { useGalaxyStore, STATE } from '@/stores/galaxy'
import { starTraits, anomalyName } from '@/sdk/v4/traits'
import { distance, neighbors } from '@/sdk/v4/hex'
import { timeOf } from '@/sdk/v4/drand'

export default {
  name: 'StarCard',
  props: { cell: { type: Number, required: true } },
  data() {
    return { galaxy: useGalaxyStore(), preview: null, newName: '' }
  },
  computed: {
    info() {
      void this.galaxy.cellsVersion
      return this.galaxy.cellAt(this.cell)
    },
    isBlackHole() {
      return this.info?.state === STATE.BLACK_HOLE
    },
    name() {
      if (this.galaxy.names[this.cell]) return this.galaxy.names[this.cell]
      if (this.isBlackHole) return anomalyName(this.cell)
      return starTraits(this.galaxy.universe.seed, this.cell).name
    },
    kind() {
      return this.isBlackHole ? 'Black hole' : this.cell === 0 ? 'Home star' : 'Star'
    },
    discovererName() {
      const who = this.info.discoverer
      return who === this.galaxy.account ? 'you' : who.slice(0, 6) + '…' + who.slice(-4)
    },
    distanceAway() {
      return this.galaxy.shipCell === null ? 0 : distance(this.galaxy.shipCell, this.cell)
    },
    atBlackHole() {
      return this.isBlackHole && this.galaxy.shipCell === this.cell
    },
    canRename() {
      return this.info?.discoverer && this.info.discoverer === this.galaxy.account
    }
  },
  watch: {
    cell: {
      immediate: true,
      handler() {
        this.preview = null
        this.loadPreview()
      }
    }
  },
  unmounted() {
    clearTimeout(this.timer)
  },
  methods: {
    /** Shows a pending scan's outcome once its drand round is out (polling until then). */
    async loadPreview() {
      clearTimeout(this.timer)
      const c = this.info
      if (!c || !c.visited || c.scanned) return
      const wait = timeOf(c.scanRound) * 1000 - Date.now()
      if (wait > 0) {
        this.timer = setTimeout(() => this.loadPreview(), wait + 1500)
        return
      }
      const outcome = await this.galaxy.previewScan(this.cell).catch(() => null)
      if (!outcome) {
        this.timer = setTimeout(() => this.loadPreview(), 3000)
        return
      }
      // The outcome lists all six neighbors; count only what this scan charts for the first time.
      const fresh = neighbors(this.cell)
        .map((n, i) => [this.galaxy.cellAt(n)?.state ?? STATE.UNDECIDED, outcome.states[i]])
        .filter(([before]) => before === STATE.UNDECIDED)
        .map(([, after]) => after)
      this.preview = {
        stars: fresh.filter((s) => s === STATE.STAR).length,
        holes: fresh.filter((s) => s === STATE.BLACK_HOLE).length
      }
    },
    async rename() {
      if (await this.galaxy.renameStar(this.cell, this.newName.trim())) this.newName = ''
    }
  }
}
</script>

<style scoped>
.star-card {
  position: absolute;
  right: 16px;
  top: 56px;
  width: min(86vw, 18em);
  background: #12052ae6;
  border: 1px solid #c3b3da44;
  border-radius: 12px;
  padding: 0.8em 1.1em;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.4em;
  font-size: 14px;
  box-sizing: border-box;
}
h3 {
  margin: 0;
  font-weight: 500;
  color: #fff;
}
p {
  margin: 0;
}
.sub {
  color: #c3b3da;
  font-size: 0.9em;
}
.scan {
  color: var(--o8-yellow-light);
}
.actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.5em;
  margin-top: 0.4em;
}
.rename {
  display: flex;
  gap: 0.4em;
}
.rename input {
  flex: 1;
  min-width: 0;
  font: inherit;
  color: #fff;
  background: #00000055;
  border: 1px solid #ffffff55;
  border-radius: 0.5em;
  padding: 0.3em 0.5em;
}
/* Phones held upright: the card sits along the bottom, like the star map's. */
@media (max-width: 600px) and (orientation: portrait) {
  .star-card {
    top: auto;
    right: 8px;
    left: 8px;
    bottom: 64px;
    width: auto;
  }
}
</style>
