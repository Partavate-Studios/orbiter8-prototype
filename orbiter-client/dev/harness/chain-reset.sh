#!/bin/sh
# Revert the local chain to the post-deploy snapshot (taken on first use), then re-snapshot.
cd "$(dirname "$0")"
rpc() { curl -s -H 'content-type: application/json' -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"$1\",\"params\":$2}" http://127.0.0.1:8545; }
if [ -f snapshot.id ]; then rpc evm_revert "[\"$(cat snapshot.id)\"]" > /dev/null; fi
rpc evm_snapshot '[]' | sed 's/.*"result":"\([^"]*\)".*/\1/' > snapshot.id
echo "chain reset to snapshot $(cat snapshot.id)"
