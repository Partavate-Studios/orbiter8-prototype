<template>
    <div class="terminal">
        <pre class="history" ref="history">
          <div
            v-for="(line, index) in minervaHistory"
            class="line"
            v-bind:key="'line' + index">{{ line }}</div>

        </pre>
        <form v-on:submit.prevent="doSubmit">
          <div class="input"><input v-model="terminalInput" type="text"></div>
        </form>
    </div>
</template>

<script>
import { mapActions, mapMutations, mapGetters } from 'vuex'

export default {
  name: 'Terminal',
  data () {
    return {
      terminalInput: ''
    }
  },
  mounted: function () {
  },
  beforeMount: function () {
  },
  computed: {
    ...mapGetters('UI', [
      'minervaHistory'
    ])
  },
  watch: {
    minervaHistory: {
      handler: function () {
        this.$refs.history.scrollTop = this.$refs.history.scrollHeight
      }
    }
  },
  methods: {
    ...mapActions([
      'checkForNewBlock'
    ]),
    ...mapActions('StarMap', [
      'moveToSystem',
      'genesis'
    ]),
    ...mapMutations('UI', [
      'scaleTo',
      'rotateTo',
      'addToHistory',
      'clearHistory'
    ]),
    doSubmit () {
      let parts = this.terminalInput.split(' ')
      this.addToHistory('> ' + this.terminalInput)
      if (parts.length > 0) {
        switch (parts[0]) {
          case 'genesis':
            this.genesis()
            break
          case 'move':
            if (parts.length > 1) {
              this.moveToSystem(parseInt(parts[1]))
              this.addToHistory('Moving to Sector ' + parseInt(parts[1]))
              break
            }
            this.addToHistory('Unable To Move.')
            break

          case 'select':
            this.setSelectedSpriteId(parseInt(parts[1]))
            this.addToHistory('Selecting sprite ' + parseInt(parts[1]))
            break

          case 'clear':
            this.clearHistory()
            break

          case 'scale':
            this.scaleTo(parseFloat(parts[1]))
            this.addToHistory('Setting scale to ' + parseFloat(parts[1]))
            break

          case 'rotate':
            this.rotateTo(parseFloat(parts[1]))
            this.addToHistory('Setting rotation to ' + parseFloat(parts[1]))
            break

          case 'say':
            this.addToHistory(parts[1])
            break

          case 'jump': {
            this.addToHistory('trying ' + parts[2])
            const satellite = this.spriteNameById(parts[1])
            const target = this.spriteNameById(parts[2])
            this.addToHistory('Jumping ' + satellite + ' to ' + target)
            this.changeOrbiting({
              spriteId: parts[1],
              orbitId: parts[2]
            })
            break
          }
          case 'screenshot': {
            const svgRoot = document.getElementById('gamelayer')
            const svgSource = svgRoot.outerHTML
            const svgDataUri = 'data:image/svg+xml;base64,' + btoa(svgSource)
            const downloadLink = document.createElement('a')
            downloadLink.href = svgDataUri
            let today = new Date();
            let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
            let time = today.getHours() + "." + today.getMinutes() + "." + today.getSeconds();
            let dateTime = date+'_'+time;
            downloadLink.download = 'screenshot' + dateTime + '.svg'
            document.body.appendChild(downloadLink)
            downloadLink.click()
            document.body.removeChild(downloadLink)
            break
          }
          case 'newLoad':
            this.checkForNewBlock()
            this.addToHistory(' I loaded the block ')
            break

          case 'cat':
            this.addToHistory('    /\\_____/\\    ')
            this.addToHistory('   /  o   o  \\   ')
            this.addToHistory('  ( ==  ^  == )  ')
            this.addToHistory('   )         (   ')
            this.addToHistory('  (           )  ')
            this.addToHistory(' ( (  )   (  ) ) ')
            this.addToHistory('(__(__)___(__)__)')

            break

          default:
            this.addToHistory('Unknown Command')
            break
        }
      }
      this.terminalInput = ''
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
    .terminal {
      border: 1px solid #5d289e;
      background: #00000025;
        .history {
            margin: 0;
            padding: 0.5em;
            height: 15em;
            overflow: auto;
            .line {
              font-family: monospace;
            }
        }
        form {
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        .input{
            input[type=text] {
                border: 0;
                width: 100%;
                margin: 0;
                padding: 0.5em;
                background: #5d289e;
            }
            input[type=text]:focus {
                background: #8e7aaa;
            }
        }
    }
</style>
