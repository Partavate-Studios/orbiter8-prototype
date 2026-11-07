<template>
  <!-- A siege as it stands now (docs/demo4-plan.md, section 6): both sides' layers, and what the
       viewer can do about it. Played up to now by the contract's own preview. -->
  <section class="siege">
    <h4>Under siege · {{ who(siege.attacker) }} attacking</h4>
    <div class="sides">
      <div>
        <p class="label">Planet</p>
        <bar v-for="b in planetBars" :key="b.name" v-bind="b" />
        <p class="sub">{{ weapons(siege.side) }}</p>
      </div>
      <div>
        <p class="label">Attacker</p>
        <bar v-for="b in shipBars" :key="b.name" v-bind="b" />
        <p class="sub">{{ weapons(siege.ship) }}</p>
      </div>
    </div>
    <p v-if="siege.claimAt" class="alert">
      Claim filed: completes {{ when(siege.claimAt) }} unless the defenses come back.
    </p>
    <p v-else-if="siege.wornAt" class="alert">Worn down {{ ago(siege.wornAt) }}: production has stopped.</p>
    <p v-else class="sub">Rounds every 30 minutes since {{ ago(siege.started) }}.</p>

    <p class="row">
      <template v-if="mine">
        <button
          v-if="siege.wornAt && !siege.claimAt"
          class="o8-button small"
          :disabled="busy"
          @click="galaxy.fileClaim(siege.planet)"
        >
          File a claim with Minerva
        </button>
        <button
          v-if="siege.claimAt && siege.claimAt * 1000 <= now"
          class="o8-button small"
          :disabled="busy"
          @click="galaxy.completeClaim(siege.planet)"
        >
          Complete the claim
        </button>
        <button class="o8-button small" :disabled="busy" @click="galaxy.withdraw(siege.planet)">Withdraw</button>
      </template>
      <button v-else-if="canJoin" class="o8-button small" :disabled="busy" @click="galaxy.joinDefense(siege.planet)">
        Join the defense
      </button>
      <button
        class="o8-button small"
        :disabled="busy"
        title="Record the rounds so far on chain"
        @click="galaxy.advanceSiege(siege.planet)"
      >
        Record rounds
      </button>
    </p>
  </section>
</template>

<script>
import { h } from 'vue'
import { useGalaxyStore } from '@/stores/galaxy'

/** One layer as a thin bar: what's left of its full strength. */
const Bar = (props) =>
  h('div', { class: 'bar-row' }, [
    h('span', { class: 'bar-name' }, props.name),
    h('span', { class: 'bar' }, [
      h('span', { style: { width: `${props.max ? (100 * props.value) / props.max : 0}%` } })
    ]),
    h('span', { class: 'bar-num' }, String(props.value))
  ])
Bar.props = ['name', 'value', 'max']

export default {
  name: 'SiegeBox',
  components: { Bar },
  props: { siege: { type: Object, required: true }, owner: { type: String, default: null } },
  data() {
    return { galaxy: useGalaxyStore(), now: Date.now() }
  },
  computed: {
    busy() {
      return Boolean(this.galaxy.busy)
    },
    mine() {
      return this.siege.attacker === this.galaxy.account
    },
    canJoin() {
      return this.owner !== this.galaxy.account && this.galaxy.armed && !this.galaxy.condition?.retreated
    },
    planetBars() {
      const s = this.siege.side
      return [
        { name: 'Platforms', value: s.platforms, max: Math.max(s.platforms, 450) },
        { name: 'Shield', value: s.shield, max: s.shieldMax },
        { name: 'Armor', value: s.armor, max: s.armorMax },
        { name: 'Hull', value: s.hull, max: Math.max(s.hull, 360) }
      ].filter((b) => b.max > 0)
    },
    shipBars() {
      const s = this.siege.ship
      return [
        { name: 'Shield', value: s.shield, max: s.shieldMax },
        { name: 'Armor', value: s.armor, max: s.armorMax }
      ].filter((b) => b.max > 0)
    }
  },
  mounted() {
    this.clock = setInterval(() => (this.now = Date.now()), 30_000)
  },
  unmounted() {
    clearInterval(this.clock)
  },
  methods: {
    who(address) {
      return address === this.galaxy.account ? 'you' : address.slice(0, 6) + '…'
    },
    weapons(s) {
      const parts = [
        [s.railguns, 'railgun'],
        [s.missiles, 'missile rack'],
        [s.pointDefense, 'point defense'],
        [s.drones, 'drone'],
        [s.bfg, 'BFG']
      ].filter(([n]) => n > 0)
      return parts.length
        ? parts
            .map(([n, name]) => `${n} ${name}${n > 1 && name !== 'point defense' && name !== 'BFG' ? 's' : ''}`)
            .join(', ')
        : 'no weapons left'
    },
    ago(t) {
      const minutes = Math.round((this.now / 1000 - t) / 60)
      if (minutes < 1) return 'just now' // (the chain's clock can run a little ahead of this one)
      return minutes < 60 ? `${minutes} min ago` : `${(minutes / 60).toFixed(1)} h ago`
    },
    when(t) {
      const minutes = Math.round((t - this.now / 1000) / 60)
      return minutes <= 0 ? 'now' : minutes < 60 ? `in ${minutes} min` : `in ${(minutes / 60).toFixed(1)} h`
    }
  }
}
</script>

<style scoped>
.siege {
  border: 1px solid var(--o8-pink-light);
  border-radius: 8px;
  padding: 0.4em 0.6em;
  margin: 0.5em 0;
}
h4 {
  margin: 0;
  font-weight: 500;
  color: var(--o8-pink-light);
}
p {
  margin: 0.3em 0;
}
.sides {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8em;
}
.label {
  color: #fff;
}
.sub {
  color: #c3b3da;
  font-size: 0.85em;
}
.alert {
  color: var(--o8-pink-light);
  font-size: 0.9em;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4em;
}
:deep(.bar-row) {
  display: grid;
  grid-template-columns: 4.5em 1fr 2.5em;
  gap: 0.3em;
  align-items: center;
  font-size: 0.8em;
  color: #c3b3da;
}
:deep(.bar) {
  height: 0.4em;
  background: #ffffff1a;
  border-radius: 1em;
  overflow: hidden;
}
:deep(.bar span) {
  display: block;
  height: 100%;
  background: #c3b3da;
}
:deep(.bar-num) {
  text-align: right;
}
</style>
