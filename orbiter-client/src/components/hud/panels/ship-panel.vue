<template>
  <!-- Your Orbiter 8 (D59; the Loadout, rebuilt as the ship's own screen: docs/ui-plan.md 4.3): the ship
       as it flies and opened up, drawn from what's fitted to it; its room, each kind with its limit;
       what's fitted, what's out of action, and unloading parts at a planet of yours; damage; and the
       four built-in drones, set between mining and repairing. -->
  <div v-if="ship" class="k-panel ship-panel" :class="{ narrow }">
    <header class="k-head">
      <span class="k-title"><small-icon name="ship" /><span><b>{{ ship.name }}</b><small>Orbiter 8 · yours</small></span></span>
    </header>
    <p v-if="condition?.retreated" class="state k-needs">Retreated: repair before attacking again (a shipyard, or your drones in time).</p>
    <p v-else-if="docked" class="state">In the yard after repairs: ready {{ docked }}.</p>

    <div class="pictures">
      <figure><svg ref="art" class="art" :viewBox="SHIP_ART_VIEWBOX" aria-hidden="true" /><figcaption>As it flies</figcaption></figure>
      <figure><svg ref="inside" class="art" :viewBox="SHIP_ART_VIEWBOX" aria-hidden="true" /><figcaption>Opened up</figcaption></figure>
    </div>

    <section class="room">
      <p><span>Mounts</span><span class="pips"><i v-for="n in SHIP_MOUNTS" :key="n" :class="{ on: n <= mounts }" /></span><b>{{ mounts }} of {{ SHIP_MOUNTS }}</b></p>
      <p><span>Holds</span><span class="bar"><i :style="{ width: holdsPart * 100 + '%' }" /></span><b>{{ ship.bays - player.freeBays }} of {{ ship.bays }}</b></p>
      <p><span>Drone room</span><span class="bar"><i :style="{ width: dronePart * 100 + '%' }" /></span><b>{{ droneCount }} of {{ droneRoom }}</b></p>
      <p><span>Jump range</span><span class="pips range"><i v-for="n in 4" :key="n" :class="{ on: n <= range, lost: n > range && n <= ship.range }" /></span><b>{{ range }}</b></p>
    </section>

    <section>
      <h3><span>Fitted</span><span v-if="myPlanetHere" class="k-meter">Unload to your planet here</span></h3>
      <p v-if="!fitted.length" class="k-none">Nothing fitted: no weapons, armor or shields. Armories sell them.</p>
      <p v-for="row in fitted" :key="row.part" class="line-row">
        <span><b>{{ row.count }}</b> × {{ row.name }}<small v-if="row.off" class="k-needs">{{ row.off }} out of action</small></span>
        <span class="split"><small>{{ row.space }}</small><button v-if="myPlanetHere" type="button" class="k-quiet" @click="unload(row)">Unload</button></span>
      </p>
      <p v-if="damage.range || damage.bays" class="k-needs damage">Damage: {{ damage.range }} range, {{ damage.bays }} holds lost. A shipyard repairs everything.</p>
    </section>

    <!-- The four built-in drones (D79, D92): each repairs the ship slowly, or mines -->
    <section>
      <h3><span>Built-in drones</span><span class="k-meter">4</span></h3>
      <p class="line-row">
        <span><b>{{ 4 - repairing }}</b> mining · <b>{{ repairing }}</b> repairing</span>
        <span class="split">
          <button type="button" class="step" :disabled="repairing <= 0" aria-label="One fewer repairing" @click="setRepairing(repairing - 1)">−</button>
          <button type="button" class="step" :disabled="repairing >= 4" aria-label="One more repairing" @click="setRepairing(repairing + 1)">+</button>
        </span>
      </p>
    </section>
  </div>
</template>

<script>
import { SHIP_PARTS, SHIP_MOUNTS, mountsUsed } from '@orbiter8/sdk/parts'
import { shipArtParts, shipInsideParts, SHIP_ART_VIEWBOX } from '@orbiter8/sdk/ship-art'
import { usePlayerStore } from '@/stores/player'
import SmallIcon from '../small-icon.vue'

export default {
  name: 'ShipPanel',
  components: { SmallIcon },
  props: {
    objectId: { type: String, default: null },
    narrow: { type: Boolean, default: false }
  },
  data() {
    return { player: usePlayerStore(), SHIP_ART_VIEWBOX, SHIP_MOUNTS }
  },
  computed: {
    ship() {
      return this.player.ship
    },
    condition() {
      return this.player.condition
    },
    art() {
      const off = this.condition?.off ?? []
      const scarred = Boolean(this.condition?.armorLost || off.some((n) => n > 0))
      // (its own ids: other ships may be drawn on the same page)
      return shipArtParts(this.ship, scarred, 'loadout-')
    },
    inside() {
      return shipInsideParts(this.ship)
    },
    mounts() {
      return mountsUsed(this.ship.loadout)
    },
    holdsPart() {
      return this.ship.bays ? (this.ship.bays - this.player.freeBays) / this.ship.bays : 0
    },
    droneRoom() {
      return (this.ship.droneBays ?? 0) * (this.player.economy?.dronesPerBay ?? 1)
    },
    droneCount() {
      return this.ship.loadout.drones + (this.ship.loadout.miningDrones ?? 0)
    },
    dronePart() {
      return this.droneRoom ? Math.min(1, this.droneCount / this.droneRoom) : 0
    },
    /** The range the ship jumps now: what's fitted less what's damaged, never under 1. */
    range() {
      return Math.max(1, this.ship.range - this.damage.range)
    },
    /** How many built-in drones repair (the rest mine). */
    repairing() {
      return this.condition?.repairing ?? 0
    },
    /** Engine and bay damage now, the drones' repairs counted. */
    damage() {
      return { range: this.condition?.rangeLost ?? this.ship.rangeLost, bays: this.condition?.baysLost ?? this.ship.baysLost }
    },
    docked() {
      const left = (this.condition?.dockedUntil ?? 0) - this.player.now / 1000
      return left > 0 ? `in ${Math.ceil(left / 60)} min` : null
    },
    fitted() {
      const l = this.ship.loadout
      const off = this.condition?.off ?? []
      return SHIP_PARTS.filter((p) => l[p.field] > 0).map((p) => ({
        part: p.id,
        name: this.player.rules.parts[p.id].name,
        count: l[p.field],
        off: p.off === undefined ? 0 : off[p.off],
        space: p.space
      }))
    },
    /** One of the player's planets at this star, to unload parts to. */
    myPlanetHere() {
      return this.player.planets.find((p) => p.owner === this.player.account) ?? null
    }
  },
  watch: {
    // The drawings are our own strings (sdk/ship-art.js), set as the inline <svg>s' content.
    art() {
      this.draw()
    },
    inside() {
      this.draw()
    }
  },
  mounted() {
    this.draw()
  },
  methods: {
    draw() {
      if (this.$refs.art) this.$refs.art.innerHTML = this.art
      if (this.$refs.inside) this.$refs.inside.innerHTML = this.inside
    },
    setRepairing(n) {
      if (n < 0 || n > 4 || n === this.repairing) return
      this.o8audio?.playEffect('click')
      this.player.assignDrones(n)
    },
    unload(row) {
      this.o8audio?.playEffect('click')
      this.player.unloadShip(this.myPlanetHere.id, row.part, row.count)
    }
  }
}
</script>

<style src="../kit.css"></style>
<style scoped>
.state {
  margin: 10px 0 0;
  padding: 8px 14px;
  border-radius: 12px;
  background: #ffffff10;
  font-size: 14px;
}
.pictures {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-top: 12px;
}
figure {
  margin: 0;
  text-align: center;
}
.art {
  display: block;
  width: 170px;
  height: 170px;
  border-radius: 12px;
  background: #150f28;
}
.narrow .art {
  width: 140px;
  height: 140px;
}
figcaption {
  margin-top: 4px;
  color: #9088aa;
  font-size: 11.5px;
}
/* the ship's room: each kind with its limit */
.room p {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 13.5px;
  line-height: 28px;
}
.room p > span:first-child {
  width: 92px;
  color: #bdb5d4;
}
.room b {
  width: 76px;
  color: #ffffff;
  text-align: right;
}
.pips,
.bar {
  flex: 1;
}
.pips {
  display: flex;
  gap: 5px;
}
.pips i {
  width: 14px;
  height: 14px;
  box-sizing: border-box;
  border: 1.5px solid color-mix(in srgb, var(--base) 75%, transparent);
  border-radius: 50%;
}
.pips i.on {
  border-color: var(--accent);
  background: var(--accent);
}
/* engine power: the capacitors' warm yellow; a step lost to damage is pink */
.pips.range i {
  width: 26px;
  height: 8px;
  border-radius: 4px;
}
.pips.range i.on {
  border-color: #ffd2a1;
  background: #ffd2a1;
}
.pips.range i.lost {
  border-color: var(--o8-pink-light);
}
.bar {
  height: 8px;
  border-radius: 4px;
  background: #0f0a1e;
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  border-radius: 4px;
  background: var(--accent);
}
.line-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 40px;
  margin: 2px 0;
  color: #bdb5d4;
  font-size: 14px;
}
.line-row b {
  color: #ffffff;
}
.line-row small {
  display: inline;
  margin-left: 8px;
}
.split {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
}
.step {
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1.5px solid color-mix(in srgb, var(--base) 60%, transparent);
  border-radius: 50%;
  background: #ffffff10;
  color: #ffffff;
  font-size: 22px;
  line-height: 1;
}
.step:disabled {
  opacity: 0.35;
}
.damage {
  margin: 8px 0 0;
  font-size: 13.5px;
}
</style>
