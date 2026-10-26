<template>
  <!-- The pilot license, filling in as the player types their callsign. -->
  <div class="pilot-card">
    <div class="issuer">
      <p class="federation">United Federation of Planets</p>
      <p class="department">Department of Transportation * Intergalactic Aviation</p>
    </div>
    <div class="body">
      <div class="details">
        <p class="name" :class="{ placeholder: !pilotName }">{{ pilotName || '? ? ? ? ? ? ? ?' }}</p>
        <p class="label">Pilot Identification</p>
        <p class="qualifications">Qualified Pilot · Orbiter 8 Series · Rank: Newb</p>
      </div>
      <div class="picture">
        <svg viewBox="-32 -32 64 64" aria-hidden="true">
          <g opacity="0.75"><avatar-icon /></g>
        </svg>
      </div>
    </div>
  </div>
</template>

<script>
import AvatarIcon from '@/components/star-map/hud/icons/avatar-icon.svg'

export default {
  name: 'PilotCard',
  components: {
    AvatarIcon
  },
  props: {
    pilotName: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
.pilot-card {
  width: 100%;
  max-width: 30em;
  margin: 0 auto;
  border: 1px solid #ffffff40;
  border-radius: 0.8em;
  background: linear-gradient(160deg, #ffffff1f, #ffffff08);
  padding: 0.9em 1.1em 1.1em;
  box-sizing: border-box;
  text-align: left;
}
p {
  margin: 0;
}
.issuer {
  border-bottom: 1px solid #ffffff30;
  padding-bottom: 0.5em;
  margin-bottom: 0.8em;
}
.federation {
  font-size: 1.15em;
  color: #ffffffcc;
}
.department {
  font-size: 0.75em;
  color: #c3b3da;
  letter-spacing: 0.03em;
}
.body {
  display: flex;
  gap: 1em;
  align-items: center;
}
.details {
  flex: 1;
  min-width: 0;
}
.name {
  font-size: 1.8em;
  color: #ffffff;
  overflow-wrap: anywhere;
  line-height: 1.15;
}
.name.placeholder {
  color: #ffffff55;
  letter-spacing: 0.05em;
}
.label {
  font-size: 0.75em;
  color: #c3b3da99;
  border-top: 1px solid #ffffff20;
  margin-top: 0.3em;
  padding-top: 0.2em;
}
.qualifications {
  font-size: 0.8em;
  color: #c3b3da;
  margin-top: 0.8em;
}
.picture {
  flex: none;
  width: 5.5em;
  height: 5.5em;
  border: 2px solid #ffffff55;
  background: #ffffff15;
  border-radius: 50%;
}
.picture svg {
  width: 100%;
  height: 100%;
}
</style>
