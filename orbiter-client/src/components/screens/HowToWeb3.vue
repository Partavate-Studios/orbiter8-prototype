<template>
  <div class="howtoweb3 layer">
    <p>
      If you've found this page, you do not have a compatable Web 3 wallet installed and conneted to the correct
      Ethereum test network. This demo was designed with the
      <a href="https://metamask.io/" target="_blank">Meta Mask plugin</a> in mind.
      There are many other options available, but they may not yet work with this demo.
    </p>
    <p>
      If you have a Meta Mask or another compatable wallet installed, be sure to:
      <ul>
        <li>give this page permission to access Meta Mask,</li>
        <li>switch to the Ropsten test network, and </li>
        <li>grab an ETH from a faucet like <a href="https://faucet.metamask.io/" target="_blank">this one from MetaMask.</a></li>
      </ul>
    </p>
    <p>Once done, head back to the <a href="#/">Title Screen</a></p>
  </div>
</template>

<script>

export default {
  components: {
  },
  name: 'HowToWeb3',
  data () {
    return {
    }
  },
  methods: {
  },
  computed: {
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.howtoweb3 {
  p {
    text-align: left;
    width: 40em;
  }
}
</style>
