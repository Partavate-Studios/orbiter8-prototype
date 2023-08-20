<template>
  <div class="uilayer ">
    <minerva />
  </div>
</template>

<script>
import Minerva from './minerva/minerva.vue'

export default {
  name: 'uilayer',
  components: {
    Minerva,
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  .uilayer {
    z-index: 1000;
    width: 1px;
    height: 1px;

    // pointer-events: none;
  }
  #compassbuttonContainer {
    display: inline-block;
    position: absolute;
    top: 4vmin;
    left: 4vmin;
    width: 4em;
    height: 4em;
  }
  #compassbutton {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .spriteBox {
    color: #fff;
    border: 0px;
    position: absolute;
    margin: 0;
    padding: 0;
    text-decoration: none;
    .info {
      border-radius: 50%;
      position: absolute;
      border: 0px dotted #c3b3da;
      display: block;
      height: 100%;
      width: 100%;
      -webkit-transition: all 10s ease-out;
      -moz-transition: all 10s ease-out;
      -o-transition: all 10s ease-out;
      -ms-transition: all 10s ease-out;
      transition: all 10s ease-out;
      .infoitem {
        display: inline-block;
        position: relative;
        top: 0;
        text-align: right;
        left: 50%;
        height: 1em;
        width: 10em;
        margin-top: -0.75em;
        position: relative;
        padding-left: 15%;
        padding-right: 0.5em;
        border-top: 1px solid #fff;
        border-right: 1px solid #fff;
        text-shadow: -1px -1px 3px #310e5c,
                      1px -1px 3px #310e5c,
                      -1px 1px 3px #310e5c,
                      1px 1px 3px #310e5c;
      }
    }
    .popupmenu {
      display: none;
      position: absolute;
      top: -10px;
      left: -10px;
      padding: 10px;
      border: 0px;
      height: 100%;
      width: 100%;
    }
  }
  .spriteBox:hover .info {
    display: block;
  }
  a.selected .popupmenu {
    display: block;
  }
  .box {
    padding: 1em;
    border: 1px solid #fff;
    text-align: left;
    position: absolute;
    top: 5em;
    right: 5em;
    background: #310e5c;
    width: 15em;
    overflow: hidden;
    .heading {
      color: #310e5c;
      margin: -1em -1em 1em -1em;
      padding: 0.5em;
      background: #fff;
    }
  }
  .hiddenBox {
    display: none;
  }
</style>
