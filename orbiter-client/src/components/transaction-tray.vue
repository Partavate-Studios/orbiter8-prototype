<template>
  <!-- The player's transactions (stores/transactions.js), top center: what's waiting for the wallet,
       what's sent and waiting for the network, and what went through or failed, and why. -->
  <div class="transaction-tray" aria-live="polite">
    <TransitionGroup name="tray">
      <div v-for="item in items" :key="item.id" class="transaction" :class="item.status">
        <span class="mark" aria-hidden="true"></span>
        <span class="words">
          <span class="headline">{{ headline(item) }}</span>
          <span v-if="detail(item)" class="detail">{{ detail(item) }}</span>
        </span>
        <button
          v-if="item.status === 'failed'"
          type="button"
          class="dismiss"
          aria-label="Dismiss"
          @click="dismiss(item.id)"
        >
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useTransactionsStore } from '@/stores/transactions'

export default {
  name: 'TransactionTray',
  computed: {
    ...mapState(useTransactionsStore, ['items'])
  },
  methods: {
    ...mapActions(useTransactionsStore, ['dismiss']),
    headline(item) {
      if (item.status === 'done') return item.done
      if (item.status === 'failed' || item.status === 'declined') return item.failed
      return item.doing
    },
    detail(item) {
      switch (item.status) {
        case 'wallet':
          return 'Confirm it in your wallet'
        case 'sent':
          return 'Sent: waiting for the network'
        case 'declined':
          return 'You declined it in your wallet'
        case 'failed':
          return item.reason
      }
      return ''
    }
  }
}
</script>

<style scoped>
.transaction-tray {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1100;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: min(92vw, 420px);
  pointer-events: none;
  font-family: Ubuntu, sans-serif;
}
.transaction {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 100%;
  padding: 8px 14px;
  border: 1px solid #c3b3da44;
  border-radius: 12px;
  background: #12052ae6;
  color: #e6dcf5;
  font-size: 13px;
  line-height: 1.35;
  pointer-events: auto;
}
.words {
  display: flex;
  flex-direction: column;
  min-width: 0;
  text-align: left;
}
.detail {
  color: #c3b3da;
  font-size: 12px;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.mark {
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
/* Waiting: a turning ring. Sent: the ring turns faster. */
.wallet .mark,
.sent .mark {
  border: 2px solid #c3b3da44;
  border-top-color: #e6dcf5;
  animation: turn 1.2s linear infinite;
}
.sent .mark {
  animation-duration: 0.7s;
}
.done .mark {
  background: #8fe3a5;
}
.failed .mark,
.declined .mark {
  background: #ffb3c1;
}
.failed {
  border-color: #ffb3c166;
}
.dismiss {
  flex: none;
  margin-left: 4px;
  padding: 0 4px;
  border: 0;
  background: none;
  color: #c3b3da;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}
.dismiss:hover {
  color: #ffffff;
}
.tray-enter-active,
.tray-leave-active {
  transition:
    opacity 0.25s,
    transform 0.25s;
}
.tray-enter-from,
.tray-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
@keyframes turn {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .wallet .mark,
  .sent .mark {
    animation: none;
  }
}
</style>
