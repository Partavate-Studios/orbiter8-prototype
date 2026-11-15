#!/usr/bin/env bash
# Neighbors to watch while you play: a few scripted pilots on the local chain, moving at a person's
# pace. Traders work Sol's stations (their ships dock where they trade), a wanderer hops among Sol and
# its neighbors, and an explorer heads outward discovering stars. They use accounts 5-9; play as
# ?account=1 to 4.
#   dev/harness/crowd.sh start [-8546]   (the chain's deployment suffix: CHAIN_PORT=8546 → -8546)
#   dev/harness/crowd.sh stop
# Logs go to dev/harness/.crowd/<name>.log; PACE_MS (default 12000) sets the pace.
set -euo pipefail
cd "$(dirname "$0")/../.."
DIR=dev/harness/.crowd
mkdir -p "$DIR"

stop() {
  if [ -f "$DIR/pids" ]; then
    while read -r pid; do kill "$pid" 2>/dev/null || true; done < "$DIR/pids"
    rm -f "$DIR/pids"
    echo "crowd stopped"
  fi
}

case "${1:-start}" in
  stop) stop ;;
  start)
    stop
    export LOCAL_FILE="${2:-}" PACE_MS="${PACE_MS:-12000}"
    run() { # name ship script account [env…]
      local name=$1 ship=$2 script=$3 account=$4
      shift 4
      env NAME="$name" SHIP="$ship" "$@" node "dev/harness/$script" 100000 "$account" > "$DIR/$name.log" 2>&1 &
      echo $! >> "$DIR/pids"
      echo "$name ($ship), account $account: $script"
    }
    run Rook Kestrel trade-bot.mjs 5
    run Juno 'Long Haul' trade-bot.mjs 6
    run Mira 'Salt Line' trade-bot.mjs 7
    run Tamsin Driftwood explore-bot.mjs 8 WANDER=1
    run Okafor 'Far Reach' explore-bot.mjs 9
    echo "logs in $DIR; stop with: dev/harness/crowd.sh stop"
    ;;
esac
