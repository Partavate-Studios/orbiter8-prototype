#!/bin/sh
# Usage: jitter-run.sh <outdir>  — measures selected-sprite jitter at DPR 1 and 2.
cd "$(dirname "$0")"
J=$(cat jitter.js)
for DPRV in 1 2; do
  rm -rf "$1"
  DPR=$DPRV INJECT=0 node explore.mjs "http://localhost:8080/?account=1" "$1" wait:5000 click:Play wait:3000 "click:Take Command" wait:10000 commit:UI/closeMenu \
    commit:UI/selectSprite='"ship:1"' wait:4000 "eval:$J" \
    commit:UI/selectSprite='"moon:3:1"' wait:4000 "eval:$J" \
    commit:UI/selectSprite='"moon:5:2"' wait:4000 "eval:$J" \
    commit:UI/selectSprite='"station:3"' wait:4000 "eval:$J" \
    commit:UI/selectSprite='"planet:3"' wait:4000 "eval:$J" >/dev/null 2>&1
  grep "eval\|pageerror" "$1/console.log"
done
