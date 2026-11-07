#!/bin/sh
# A local Polkadot Hub for testing the Demo 4 contracts against Polkadot's real contract engine
# (docs/demo4-plan.md, D37, D42), with no testnet.
#
#   contracts-v4/polkadot-node.sh install   download and verify the tools (once)
#   contracts-v4/polkadot-node.sh start     run the node and its Ethereum RPC on http://127.0.0.1:8545
#
# It runs the *live* Polkadot Hub runtime (Fellowship release v2.5.2, spec 2005002) in Parity's
# generic omni node, in development mode, with Parity's eth-rpc adapter in front, so ethers, Foundry
# and the game client talk to it like any EVM node. Everything is downloaded from Parity's and the
# Fellowship's GitHub releases and checked against their published SHA-256 sums. Files go in
# contracts-v4/.polkadot/ (not committed).
set -e
cd "$(dirname "$0")"
DIR=.polkadot
SDK=https://github.com/paritytech/polkadot-sdk/releases/download/polkadot-stable2609-1
RUNTIME=https://github.com/polkadot-fellows/runtimes/releases/download/v2.5.2/asset-hub-polkadot_runtime-v2005002.compact.compressed.wasm

install() {
  mkdir -p "$DIR/bin"
  for tool in polkadot-omni-node chain-spec-builder eth-rpc; do
    curl -sSfL -o "$DIR/bin/$tool" "$SDK/$tool"
    curl -sSfL -o "$DIR/bin/$tool.sha256" "$SDK/$tool.sha256"
    (cd "$DIR/bin" && echo "$(cut -d' ' -f1 "$tool.sha256")  $tool" | sha256sum -c -)
    chmod +x "$DIR/bin/$tool"
  done
  curl -sSfL -o "$DIR/asset-hub-polkadot.wasm" "$RUNTIME"
  # A development chain spec from the runtime's own development preset (funded dev accounts).
  "$DIR/bin/chain-spec-builder" -c "$DIR/dev-spec.json" create --relay-chain polkadot-local --para-id 1000 \
    --runtime "$DIR/asset-hub-polkadot.wasm" named-preset development
  echo "Installed in $DIR"
}

start() {
  [ -x "$DIR/bin/polkadot-omni-node" ] || { echo "Run '$0 install' first."; exit 1; }
  # Development mode: blocks every 2 seconds without a relay chain, state thrown away on exit.
  "$DIR/bin/polkadot-omni-node" --chain "$DIR/dev-spec.json" --dev --dev-block-time 2000 --tmp &
  NODE=$!
  trap 'kill $NODE 2>/dev/null' EXIT INT TERM
  sleep 5
  "$DIR/bin/eth-rpc" --dev --node-rpc-url ws://127.0.0.1:9944 --rpc-port 8545
}

case "$1" in
  install) install ;;
  start) start ;;
  *) echo "usage: $0 install | start"; exit 1 ;;
esac
