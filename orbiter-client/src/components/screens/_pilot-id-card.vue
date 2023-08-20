<template>
    <div class="pilot-card">
        <p class="c3">United Federation of Planets</p>
        <p class="department">Department of Transportation * Intergalactic Aviation</p>

        <div class="picture">
            <svg
            viewBox="-32 -32 64 64"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink" >
                <g transform="scale(1)" opacity="0.75">
                <avatar-icon />
                </g>
            </svg>
        </div>


        <div class="certified">
            <p class="pilotQualifications">Qualified Pilot<br />Orbiter 8 Series</p>
        </div>

        <p class="pilotName">{{ pilotName }}</p>

    </div>
</template>

<script>
import AvatarIcon from '../star-map/hud/icons/avatar-icon.svg'

export default {
  name: 'pilot-id-card',
  components: {
    AvatarIcon
  },
  props: {
    pilotName: {
      type: String,
      default: 'PilotName'
    }
  }
}
</script>

<style scoped lang="scss">
  p.c3 {
    font-size: 1.7em;
    color: #000000aa;
    margin: 0.1em 0;
    padding: 0;
    text-align: center;
  }
  p.department {
      font-size: 0.9em;
      color: #000000;
      margin: 0.1em 0 1em 0;
      border-top: 1px solid #ffffff44;
      padding: 0.1em;
      text-align: center;
  }
  div.certified {
    margin: 1em 0 0 0;
    text-align: center;
  }
  .ship {
      height: 64px;
      width: 64px;
      float: left;
      margin: 0.1em;
  }
  p.pilotQualifications {
      padding: 0;
      font-size: 0.9em;
  }
  .pilot-card {
      height: 256px;
      width: 512px;
      border: 4px solid #ffffff44;
      background: #ffffff33;
      padding: 0.1em;
      margin: 1em;
      border-radius: 1em;
  }
  .picture {
      float: right;
      height: 128px;
      width: 128px;
      border: 4px solid #ffffff66;
      background: #ffffff22;
      padding: 0.1em;
      border-radius: 4em;
      margin: 8px 16px 0 0;
  }
  .pilotName {
      clear: left;
      font-size: 2em;
      padding: 0;
      margin: 0.5em 0.5em 0 0.5em;
      text-align: center;
      color: #ffffff;
      max-width: 400px;
      overflow: hidden;
  }
</style>
