#!/bin/sh
# Capture the standard screen set + pan/zoom trace for a build served at $1 into $2.
# Expects a freshly deployed local chain (start-chain.sh + deploy-local.cjs).
set -e
cd "$(dirname "$0")"
URL=$1
OUT=$2
NEW_PLAYER=0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0
./chain-reset.sh

# New player: preflight, registration, ship creation, launch.
ACCOUNT=$NEW_PLAYER node explore.mjs "$URL" "$OUT" wait:5000 shot:01-preflight \
  click:Play wait:3000 shot:02-register "click:Yes, register" wait:1500 shot:03-callsign \
  'type:input[name=name]=Tester' click:File wait:8000 shot:04-ship-create \
  'type:input[name=name]=Rocinante' "click:Take Off" wait:10000 shot:05-launch

# Same player in the star map.
ACCOUNT=$NEW_PLAYER node explore.mjs "$URL" "$OUT" wait:5000 click:Play wait:3000 "click:Take Command" wait:12000 \
  shot:06-starmap-ship-card \
  commit:UI/closeMenu commit:UI/selectSprite='"planet:3"' wait:2500 shot:07-planet-card \
  commit:UI/selectSprite='"station:3"' wait:2500 shot:08-station-card \
  commit:UI/openMenu='"planets"' wait:2500 shot:09-planets-menu \
  commit:UI/closeMenu commit:UI/openMenu='"trade"' wait:2500 shot:10-trade-menu \
  commit:UI/closeMenu commit:UI/openMenu='"settings"' wait:2500 shot:11-settings-menu \
  commit:UI/closeMenu commit:UI/jumpMenuOn wait:3000 shot:12-jump-menu \
  commit:UI/jumpMenuOff commit:UI/jumpAnimationOn wait:1500 shot:13-jump-animation wait:2500 shot:14-jump-animation-later \
  commit:UI/jumpAnimationOff wait:6000 commit:UI/selectSprite='"star"' wait:2000 shot:15-starmap \
  trace:panzoom-trace wait:1000 shot:16-after-panzoom
