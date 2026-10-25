#!/bin/sh
# idle.sh <outdir>: 5 s traces while following the player's ship, and with the whole system in view.
cd "$(dirname "$0")"
U="document.querySelector('[data-v-app]').__vue_app__.config.globalProperties.\$pinia._s.get('UI')"
rm -rf "$1"
INJECT=0 node explore.mjs "http://localhost:8080/?account=1" "$1" wait:5000 click:Play wait:3000 "click:Take Command" wait:10000 commit:UI/closeMenu \
  commit:UI/selectSprite='"ship:1"' wait:3000 idletrace:follow-ship \
  commit:UI/selectSprite='"star"' wait:2500 "eval:(()=>{$U.scaleAnimateTo({scale:3,time:10}); return 1})()" wait:1500 idletrace:whole-system >/dev/null 2>&1
for t in follow-ship whole-system; do printf "%s " $t; node trace-summary.mjs "$1/$t.json" | tr -d '\n ' ; echo; done
