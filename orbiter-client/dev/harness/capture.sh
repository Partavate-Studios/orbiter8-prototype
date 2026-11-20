#!/bin/sh
# Capture the standard screen set + pan/zoom trace for a build served at $1 into $2.
# Expects a freshly deployed local chain (start-chain.sh + deploy-local.cjs).
set -e
cd "$(dirname "$0")"
URL=$1
OUT=$2
NEW_PLAYER=0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0
./chain-reset.sh

# New player: the title, then the intro (components/intro/): the dark room and the ID scanner's name
# prompt, the lights on, the first boot and the job, the ship's name, waking in orbit.
B() { echo "eval:[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith('$1'))?.click()"; }
ACCOUNT=$NEW_PLAYER node explore.mjs "$URL" "$OUT" wait:5000 shot:01-title \
  click:Begin wait:2500 shot:02-dark "click:ID scanner" wait:1200 \
  'type:#intro-name=Tester' shot:03-callsign "$(B Register)" wait:9000 shot:04-lights-on \
  "click:Terminal" wait:1200 "$(B Subscribe)" wait:800 "$(B Jobs)" wait:500 "$(B Pilot)" wait:600 "$(B Accept)" wait:800 \
  'type:#intro-ship=Rocinante' "$(B Sign)" wait:14000 shot:05-launch "$(B Understood)" wait:3000

# Same player in the star map.
ACCOUNT=$NEW_PLAYER node explore.mjs "$URL" "$OUT" wait:5000 click:Continue wait:12000 \
  shot:06-starmap-ship-card \
  commit:UI/closeMenu commit:UI/selectSprite='"planet:3"' wait:2500 shot:07-planet-card \
  commit:UI/selectSprite='"station:3"' wait:2500 shot:08-station-card \
  commit:UI/openMenu='"planets"' wait:2500 shot:09-planets-menu \
  commit:UI/closeMenu commit:UI/openMenu='"trade"' wait:2500 shot:10-trade-menu \
  commit:UI/closeMenu commit:UI/openMenu='"settings"' wait:2500 shot:11-settings-menu \
  commit:UI/closeMenu commit:UI/zoomOutToNeighbors wait:3500 shot:12-neighbor-view \
  commit:UI/exitNeighborView commit:UI/jumpAnimationOn wait:1500 shot:13-jump-animation wait:2500 shot:14-jump-animation-later \
  commit:UI/jumpAnimationOff wait:6000 commit:UI/selectSprite='"star"' wait:2000 shot:15-starmap \
  trace:panzoom-trace wait:1000 shot:16-after-panzoom
