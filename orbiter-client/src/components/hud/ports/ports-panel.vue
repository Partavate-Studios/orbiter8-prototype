<template>
  <!-- Every port in this system (Koda, 2026-11-17: "what we're usually looking for is port information"):
       one row each, in orbit order, with where it is and whose, its trade code, what your cargo would
       fetch there, every good it buys and sells at its next-unit price, and what else it has (yards,
       armory). A row's buttons go straight to trading, the yards or the armory there; its name shows
       it on the map. -->
  <div class="ports-panel" :class="{ narrow }">
    <header>
      <h2>Ports of {{ starName }}</h2>
      <p v-if="ports.length">
        {{ ports.length }} {{ ports.length === 1 ? 'port' : 'ports' }} · S sells, B buys<template v-if="carrying">, <em>B</em> buys what you carry</template>
      </p>
    </header>
    <p v-if="!ports.length" class="none">No ports in this system.</p>

    <article v-for="port in ports" :key="port.key" class="port" :class="{ here: port.key === selected }">
      <div class="top">
        <button type="button" class="name" :title="'Show ' + port.name + ' on the map'" @click="show(port)">
          <img :src="PORT_ART" alt="" />
          <span>
            <b>{{ port.name }}</b>
            <small>at {{ port.homeName }} · {{ port.owner }}</small>
          </span>
        </button>
        <span class="letters" :aria-label="'Trade code ' + port.code.map((c) => c.letter).join('')">
          <b v-for="c in port.code" :key="c.id" :class="{ wanted: c.wanted, none: c.letter === '-' }" :title="goodNames[c.id]">{{ c.letter }}</b>
        </span>
      </div>

      <p v-if="port.cargoValue" class="fetch">
        Your cargo here: <b>{{ credits(port.cargoValue) }}¢</b>
        <small>({{ port.wantedNames }})</small>
      </p>

      <div class="goods">
        <div v-if="port.buys.length" class="side">
          <span class="label">Buys</span>
          <span v-for="g in port.buys" :key="g.id" class="good" :class="{ wanted: g.wanted }" :title="g.name + ': pays ' + g.price + '¢ for the next unit'">
            <img :src="g.icon" alt="" /><i :style="{ color: g.color }">{{ g.code }}</i> {{ g.price }}¢
          </span>
        </div>
        <div v-if="port.sells.length" class="side">
          <span class="label">Sells</span>
          <span v-for="g in port.sells" :key="g.id" class="good" :title="g.name + ': ' + g.price + '¢ for the next unit, ' + g.stock + ' in stock'">
            <img :src="g.icon" alt="" /><i :style="{ color: g.color }">{{ g.code }}</i> {{ g.price }}¢
          </span>
        </div>
      </div>

      <div class="actions">
        <button type="button" class="act" @click="go(port, 'trade')"><img :src="ACTION_ART.trade" alt="" />Trade</button>
        <button v-if="port.yard" type="button" class="act" @click="go(port, 'shipyard')"><img :src="ACTION_ART.shipyards" alt="" />Yards</button>
        <button v-if="port.armory" type="button" class="act" @click="go(port, 'armory')"><img :src="ACTION_ART.armory" alt="" />Armory</button>
      </div>
    </article>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { lineValue } from '@orbiter8/sdk/game/trade'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { useGameStateStore } from '@/stores/gamestate'
import { goodCode, goodIcon, portCode } from '@/libs/goods'
import { goodColor } from '@/libs/palette'
import { ACTION_ART, PORT_ART } from '@/libs/body-art'
import { portsOf } from './ports'

export default {
  name: 'PortsPanel',
  props: {
    /** The selection (menu-sheet passes it to every menu). */
    objectId: { type: String, default: null },
    /** A phone. */
    narrow: { type: Boolean, default: false }
  },
  data() {
    return { PORT_ART, ACTION_ART }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects', 'currentStarSystemName']),
    ...mapState(useUIStore, ['selected']),
    ...mapState(useGameStateStore, ['avatar', 'goods']),
    starName() {
      return this.currentStarSystemName ?? 'this system'
    },
    goodNames() {
      return this.goods ?? []
    },
    cargo() {
      return this.avatar?.ship?.cargo ?? []
    },
    carrying() {
      return this.cargo.some((units) => units > 0)
    },
    ports() {
      const cargo = this.cargo
      const goodRow = (g) => ({
        id: g.id,
        name: this.goodNames[g.id] ?? '',
        code: goodCode(g.id, this.goodNames[g.id]),
        icon: goodIcon(g.id),
        color: goodColor(g.id),
        price: g.price,
        stock: g.stock,
        wanted: g.mode === 'buys' && (cargo[g.id] ?? 0) > 0
      })
      return portsOf(this.systemObjects).map(({ station, home }) => {
        const goods = station.goods ?? []
        const wanted = goods.filter((g) => g.mode === 'buys' && (cargo[g.id] ?? 0) > 0)
        return {
          key: station.key,
          name: station.name,
          homeName: home?.name ?? '',
          owner: station.isMine ? 'yours' : station.ownerName || 'unclaimed',
          code: portCode(goods, this.goodNames.length, cargo),
          // what selling everything aboard that it buys would pay, fee taken
          cargoValue: wanted.reduce((sum, g) => sum + lineValue(g, -cargo[g.id]), 0),
          wantedNames: wanted.map((g) => this.goodNames[g.id]).join(', '),
          buys: goods.filter((g) => g.mode === 'buys').map(goodRow),
          sells: goods.filter((g) => g.mode === 'sells').map(goodRow),
          yard: Boolean(station.yard),
          armory: Boolean(station.armory)
        }
      })
    }
  },
  methods: {
    ...mapActions(useUIStore, ['selectSprite', 'openMenu', 'closeMenu']),
    credits(n) {
      return Math.round(n).toLocaleString('en-US')
    },
    show(port) {
      this.o8audio?.playEffect('click')
      this.closeMenu()
      this.selectSprite(port.key)
    },
    /** Straight to the port's trading, yards or armory: those menus act on the selected port. */
    go(port, menu) {
      this.o8audio?.playEffect('click')
      this.selectSprite(port.key)
      this.openMenu(menu)
    }
  }
}
</script>

<style scoped>
.ports-panel {
  width: min(720px, calc(100vw - 60px));
  text-align: left;
  box-sizing: border-box;
  padding: 18px 20px 20px;
  color: #e6dcf5;
}
header {
  margin-bottom: 12px;
  text-align: center;
}
h2 {
  margin: 0;
  font-size: 24px;
  font-weight: normal;
  color: #f1eefa;
}
header p {
  margin: 4px 0 0;
  color: #bdb5d4;
  font-size: 13px;
}
header em,
.letters b.wanted,
.good.wanted {
  color: var(--o8-yellow-light);
  font-style: normal;
}
.none {
  text-align: center;
  color: #bdb5d4;
}
.port {
  margin-top: 10px;
  padding: 12px 14px;
  border: 1.5px solid #4a3d7a;
  border-radius: 12px;
  background: linear-gradient(180deg, #241b44 0%, #1b1531 100%);
}
.port.here {
  border-color: #b9a0ff;
}
.top {
  display: flex;
  align-items: center;
  gap: 12px;
}
.name {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.name img {
  flex: none;
  width: 40px;
  height: 40px;
}
.name b {
  display: block;
  font-size: 17px;
  color: #ffffff;
}
.name:hover b {
  text-decoration: underline;
  text-decoration-color: #b9a0ff;
}
.name small {
  color: #bdb5d4;
  font-size: 12px;
}
.letters {
  flex: none;
  font-family: monospace;
  font-size: 15px;
  letter-spacing: 2px;
}
.letters b {
  color: #f1eefa;
}
.letters b.none {
  color: #6f6890;
}
.fetch {
  margin: 8px 0 0;
  font-size: 14px;
}
.fetch b {
  color: var(--o8-yellow-light);
}
.fetch small {
  color: #bdb5d4;
}
.goods {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.side {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  font-size: 13px;
}
.label {
  width: 40px;
  color: #9088aa;
}
.good {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.good img {
  width: 16px;
  height: 16px;
}
.good i {
  font-style: normal;
  font-weight: bold;
}
.actions {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
/* the selection menu's pills (selection-panel.vue), smaller */
.act {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px 0 6px;
  border: 1.5px solid #4a3d7a;
  border-radius: 17px;
  background: linear-gradient(180deg, #2e2354 0%, #211839 100%);
  color: #efe7ff;
  font: inherit;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}
.act:hover {
  border-color: #b9a0ff;
  background: linear-gradient(180deg, #3a2c69 0%, #2a1f4c 100%);
}
.act:focus-visible,
.name:focus-visible {
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 2px;
}
.act img {
  width: 24px;
  height: 24px;
}
.narrow {
  width: calc(100vw - 30px);
  padding: 14px 12px 16px;
}
.narrow .letters {
  display: none;
}
</style>
