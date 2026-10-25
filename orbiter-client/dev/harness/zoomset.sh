#!/bin/sh
# zoomset.sh <outdir>: the star map at several zoom levels (star selected, card hidden), for before/after comparisons.
cd "$(dirname "$0")"
U="document.querySelector('[data-v-app]').__vue_app__.config.globalProperties.\$pinia._s.get('UI')"
rm -rf "$1"
INJECT=0 node explore.mjs "http://localhost:8080/?account=1" "$1" wait:5000 click:Play wait:3000 "click:Take Command" wait:10000 \
  commit:UI/selectSprite='"star"' wait:2500 commit:UI/toggleScope \
  "eval:(()=>{$U.scaleAnimateTo({scale:0.15,time:10}); return 1})()" wait:1500 shot:z0.15 \
  "eval:(()=>{$U.scaleAnimateTo({scale:0.4,time:10}); return 1})()" wait:1500 shot:z0.4 \
  "eval:(()=>{$U.scaleAnimateTo({scale:3,time:10}); return 1})()" wait:1500 shot:z3 \
  "eval:(()=>{$U.scaleAnimateTo({scale:30,time:10}); return 1})()" wait:1500 shot:z30 \
  "eval:(()=>{$U.scaleAnimateTo({scale:400,time:10}); return 1})()" wait:1500 shot:z400 >/dev/null 2>&1
grep -i "pageerror" "$1/console.log"
