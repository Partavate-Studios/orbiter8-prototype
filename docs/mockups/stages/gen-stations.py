#!/usr/bin/env python3
"""Draws the station proposals in docs/mockups/stages/ (Koda, 2026-11-18): three systems for planet
stations, three for asteroid stations, each a sheet of every stage plus its parts as standalone
120-unit SVGs. One set of module shapes (port pods, turrets, yard gantry, factory block, drill) is shared
by every system, so a port reads as a port everywhere. Run: python3 docs/mockups/stages/gen-stations.py"""
import math
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
ART = os.path.join(ROOT, 'orbiter-client', 'src', 'assets', 'art')

# The house style: flat white and pale lavender built things, dark cut-outs (color-guide.md).
W = '#f4eefc'   # lit faces
L = '#c9b8e6'   # shaded faces
D = '#2a2140'   # windows, slits
BG = '#0d0a17'
PANEL = '#1c1630'
EDGE = '#3a2f57'
TEXT = '#e6dcf5'
SUB = '#a99bc4'


def f(x):
    return f'{x:.4f}'.rstrip('0').rstrip('.')


def g(content, tx=0, ty=0, rot=0, s=1):
    t = []
    if tx or ty:
        t.append(f'translate({f(tx)} {f(ty)})')
    if rot:
        t.append(f'rotate({f(rot)})')
    if s != 1:
        t.append(f'scale({f(s)})')
    return f'<g transform="{" ".join(t)}">{content}</g>' if t else f'<g>{content}</g>'


def rect(x, y, w, h, fill=W, rx=0, extra=''):
    return f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(rx)}" fill="{fill}" {extra}/>'


def circ(cx, cy, r, fill=W, extra=''):
    return f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="{fill}" {extra}/>'


def line(x1, y1, x2, y2, w=2, col=W, extra=''):
    return (f'<line x1="{f(x1)}" y1="{f(y1)}" x2="{f(x2)}" y2="{f(y2)}" stroke="{col}" '
            f'stroke-width="{f(w)}" stroke-linecap="round" {extra}/>')


def path(d, fill=W, extra=''):
    return f'<path d="{d}" fill="{fill}" {extra}/>'


# ---- Shared modules, drawn pointing outward along +x from the origin (where they attach) ----

def pods(arm=12, n=3):
    """Trade port: an arm ending in a docking collar and a stack of cargo pods."""
    s = rect(0, -2, arm, 4, L)
    s += rect(arm - 1, -9, 4, 18, W, 1.5)                    # docking collar
    h = 5.2
    top = -(n * h + (n - 1) * 1.2) / 2
    for i in range(n):
        y = top + i * (h + 1.2)
        s += rect(arm + 4, y, 9, h, W, 1.6) + rect(arm + 8, y, 1.4, h, D)
    return s


def turret(barrels=2):
    """Armory: a domed turret on a base, barrels pointing outward (+x)."""
    s = rect(0, -5, 4, 10, L, 1)
    for i in range(barrels):
        off = (i - (barrels - 1) / 2) * 3.4
        s += rect(6, off - 0.9, 9, 1.8, W, 0.9)
    s += path('M3 -6 A6 6 0 0 1 3 6 Z', W)
    return s


def gantry(w=24, h=16):
    """Yards: an open construction frame with a hull in the cradle (outward along +x)."""
    s = rect(0, -1.6, 4, 3.2, L)
    x0, y0 = 4, -h / 2
    s += (f'<rect x="{f(x0)}" y="{f(y0)}" width="{f(w)}" height="{f(h)}" fill="none" stroke="{W}" '
          f'stroke-width="2.4" stroke-linejoin="round"/>')
    s += line(x0 + w / 3, y0, x0 + w / 3, y0 + h, 1.4) + line(x0 + 2 * w / 3, y0, x0 + 2 * w / 3, y0 + h, 1.4)
    # a ship's hull being built: the Orbiter's arrowhead, lavender
    cx = x0 + w / 2
    s += path(f'M{f(cx - 8)} {f(-3.2)} L{f(cx + 8)} 0 L{f(cx - 8)} {f(3.2)} L{f(cx - 5)} 0 Z', L)
    return s


def factory():
    """Autofactory: a solid block with vents and a stack."""
    s = rect(0, -2, 4, 4, L)
    s += rect(4, -8, 16, 16, W, 2)
    s += rect(20, -5, 4, 10, L, 1)
    for i in range(3):
        s += rect(7 + i * 4.2, -5, 2, 10, D, 1)
    return s


def drill(h=22):
    """Mine: a derrick (pointing outward along +x) with its bit, and drones about it."""
    s = path(f'M0 -7 L{f(h)} -1.6 L{f(h)} 1.6 L0 7 Z', 'none', f'stroke="{W}" stroke-width="2.2" stroke-linejoin="round"')
    s += line(h * 0.35, -4.7, h * 0.35, 4.7, 1.4) + line(h * 0.68, -2.8, h * 0.68, 2.8, 1.4)
    s += rect(-4, -8, 4, 16, W, 1.5)
    s += path(f'M{f(h)} -2.2 L{f(h + 6)} 0 L{f(h)} 2.2 Z', L)
    return s


def drones(pts):
    """Mining drones: small triangles in a loose swarm (ui-guide §6: many small things, drawn cheaply)."""
    s = ''
    for x, y, a in pts:
        s += g(path('M2.6 0 L-1.8 -1.8 L-1.8 1.8 Z', W), x, y, a)
    return s


def dome(r=6):
    """A habitat dome on a footing (flat side down)."""
    return path(f'M{f(-r)} 0 A{f(r)} {f(r)} 0 0 1 {f(r)} 0 Z', W) + rect(-r - 1.5, 0, 2 * r + 3, 2.2, L, 1) + rect(-1, -r * 0.55, 2, 2.4, D, 0.6)


def outward(module, x, y, angle):
    """Place a module at (x, y), turned so it points along `angle` degrees."""
    return g(module, x, y, angle)


def on_spoke(module, r, angle):
    """Place a module at the end of a spoke r units out at `angle` degrees, pointing outward."""
    a = math.radians(angle)
    return g(module, r * math.cos(a), r * math.sin(a), angle)


# ---- Colonies on the planet (shared idea, a little different per system) ----

def planet_marks(kind, stage):
    """Citadel and Colony marks for a planet of radius 40 centered at the origin."""
    s = ''
    if stage >= 1:  # Citadel: a domed citadel standing on the limb, upper right
        a = -50
        x, y = 40 * math.cos(math.radians(a)), 40 * math.sin(math.radians(a))
        if kind == 'a':
            s += g(dome(5.5) + rect(-0.8, -12, 1.6, 6, W), x, y, a + 90)
        elif kind == 'b':
            s += g(path('M-5 0 L-5 -7 L0 -11 L5 -7 L5 0 Z', W) + rect(-1, -6.5, 2, 3, D) + rect(-7, 0, 14, 2, L), x, y, a + 90)
        else:
            s += g(rect(-2, -14, 4, 14, W, 1) + rect(-6, -5, 12, 5, W, 1.5) + rect(-7, 0, 14, 2, L), x, y, a + 90)
    if stage >= 2:  # Colony: city lights on the night side (lower left), glows as gradients
        if kind == 'a':
            pts = [(-18, 14), (-23, 9), (-14, 20), (-25, 18), (-9, 26), (-19, 27), (-28, 4)]
        elif kind == 'b':
            pts = [(-24 + 6 * i + (3 if j % 2 else 0), 6 + 6 * j) for j in range(4) for i in range(4)
                   if (i + j) % 3 != 2 and (-24 + 6 * i) ** 2 + (6 + 6 * j) ** 2 < 31 ** 2]
        else:
            pts = [(-32 + 5 * i, 6 + 2.1 * i) for i in range(10)] + [(-20, 16), (-12, 22)]
        s += '<g>' + ''.join(circ(x, y, 3.6, 'url(#citylight)') + circ(x, y, 1.1, '#fbf6ff') for x, y in pts) + '</g>'
    return s


DEFS = ('<defs><radialGradient id="citylight"><stop offset="0" stop-color="#f3e6ff" stop-opacity="0.7"/>'
        '<stop offset="1" stop-color="#f3e6ff" stop-opacity="0"/></radialGradient>'
        '<radialGradient id="planetshade" cx="38%" cy="34%" r="72%"><stop offset="0" stop-color="#a98bc9"/>'
        '<stop offset="0.6" stop-color="#5b4580"/><stop offset="1" stop-color="#1f1733"/></radialGradient></defs>')


# ---- Planet station systems: core + port/yards/armory/autofactory, all in 120 units ----

def ring_core():
    s = path('M0 -22 A22 22 0 1 1 0 22 A22 22 0 1 1 0 -22 Z M0 -15 A15 15 0 1 0 0 15 A15 15 0 1 0 0 -15 Z', W,
             'fill-rule="evenodd"')
    for a in (45, 135, 225, 315):
        s += g(rect(6, -1.5, 10, 3, L), 0, 0, a)
    s += circ(0, 0, 7.5, W) + circ(0, 0, 3, D)
    for a in range(0, 360, 30):  # ring windows
        r = math.radians(a)
        s += circ(18.5 * math.cos(r), 18.5 * math.sin(r), 1.1, D)
    return s


def ring_parts():
    return {
        'core': ring_core(),
        'port': outward(pods(10, 3), 22, 0, 0) + outward(pods(10, 3), -22, 0, 180),
        'yards': outward(gantry(26, 16), 0, 22, 90),
        'armory': ''.join(outward(turret(2), 22 * math.cos(math.radians(a)), 22 * math.sin(math.radians(a)), a)
                          for a in (-90, -55, -125)),
        'autofactory': outward(factory(), 15.6, 15.6, 45) + outward(factory(), -15.6, 15.6, 135),
    }


def hub_core():
    hexa = ' '.join(f'{f(11 * math.cos(math.radians(a)))},{f(11 * math.sin(math.radians(a)))}' for a in range(30, 390, 60))
    s = ''.join(g(rect(9, -2, 9, 4, L) + rect(16, -4, 3, 8, W, 1), 0, 0, a) for a in (0, 90, 180, 270))
    s += f'<polygon points="{hexa}" fill="{W}"/>' + circ(0, 0, 4.6, D) + circ(0, 0, 2, L)
    return s


def hub_parts():
    # every facility on a spoke of its own, attached at the spoke's end (18 units out)
    return {
        'core': hub_core(),
        'port': on_spoke(pods(5, 3), 19, 180),
        'yards': on_spoke(gantry(22, 16), 19, 90),
        'armory': on_spoke(rect(0, -2, 4, 4, L) + g(rect(0, -8, 5, 16, W, 2) + g(turret(2), 4, -4.5) + g(turret(2), 4, 4.5), 4, 0),
                           19, -90),
        'autofactory': on_spoke(factory(), 19, 0),
    }


def spine_core():
    s = rect(-2.5, -26, 5, 46, L, 1)
    s += rect(-9, -16, 18, 22, W, 3) + rect(-5, -12, 10, 3, D, 1) + rect(-5, -6, 10, 3, D, 1)
    s += rect(-0.8, -36, 1.6, 10, W) + circ(0, -37, 2, W)
    return s


def spine_parts():
    return {
        'core': spine_core(),
        'port': rect(-26, -25, 52, 4, W, 1.5) + g(pods(0, 2), 26, -23) + g(pods(0, 2), -26, -23, 180),
        'yards': rect(-2.5, 20, 5, 12, L) + g(gantry(22, 30), 0, 30, 90),
        'armory': g(turret(2), 9, -2) + g(turret(2), -9, -2, 180),
        'autofactory': rect(-14, 8, 28, 12, W, 2.5) + ''.join(rect(-10 + 5 * i, 11, 2, 6, D, 1) for i in range(5)),
    }


PLANET_SYSTEMS = {
    'a': ('Ring', 'A ring station; each facility clamps onto the ring: pods docked left and right, turrets on '
          'top, a yard gantry below, factory blocks on the lower arcs.', ring_parts),
    'b': ('Hub and spokes', 'A hexagonal hub with four spokes; each facility takes a spoke of its own: '
          'port west, armory north, factory east, yards south.', hub_parts),
    'c': ('Spine', 'A vertical spine that stacks: a docking bar on top for the port, turrets mid-ship, a '
          'factory block below, the yard cage at the foot.', spine_parts),
}

PLANET_STAGES = [
    ('Citadel', 1, []), ('Colony', 2, []), ('Station', 2, ['core']), ('Port', 2, ['core', 'port']),
    ('Yards', 2, ['core', 'port', 'yards']), ('Armory', 2, ['core', 'port', 'yards', 'armory']),
    ('Autofactory', 2, ['core', 'port', 'yards', 'armory', 'autofactory']),
    ('Sol (Federation)', 2, ['core', 'port', 'yards', 'armory']),
]
ORDER = ['yards', 'autofactory', 'core', 'port', 'armory']  # draw order: frames behind the core


def station(parts, names):
    return ''.join(parts[n] for n in ORDER if n in names)


def standalone(content, note):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-60 -60 120 120">\n<!-- {note} (Orbiter 8 art, '
            f'120 units square, centered; proposal, docs/mockups/stages/) -->\n{DEFS}{content}\n</svg>\n')


def sheet_frame(title, idea, body, h=720):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 {h}" width="1280" height="{h}" '
            f'font-family="Ubuntu, sans-serif">{DEFS}<rect width="1280" height="{h}" fill="{BG}"/>'
            f'<text x="40" y="46" fill="{TEXT}" font-size="26" font-weight="500">{title}</text>'
            f'<text x="40" y="74" fill="{SUB}" font-size="15">{idea}</text>{body}</svg>')


def panel(x, y, w, h, label):
    return (f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="10" fill="{PANEL}" stroke="{EDGE}"/>'
            f'<text x="{f(x + w / 2)}" y="{f(y + h - 14)}" text-anchor="middle" fill="{TEXT}" font-size="14">{label}</text>')


def planet_disc(r=40):
    return circ(0, 0, r, 'url(#planetshade)')


def planet_sheets():
    out_dir = os.path.join(HERE, 'planet-stations')
    os.makedirs(out_dir, exist_ok=True)
    for key, (name, idea, make) in PLANET_SYSTEMS.items():
        parts = make()
        for n, c in parts.items():
            open(os.path.join(out_dir, f'system-{key}-{n}.svg'), 'w').write(
                standalone(c, f'Planet station, system {key.upper()} ({name}): {n}'))
        open(os.path.join(out_dir, f'system-{key}-colony.svg'), 'w').write(standalone(
            planet_disc() + planet_marks(key, 2), f'Planet, system {key.upper()}: citadel and colony lights (the disc is a stand-in)'))
        body = ''
        pw, ph, gap = 145, 300, 9
        x0 = (1280 - (8 * pw + 7 * gap)) / 2
        for i, (label, colony, names) in enumerate(PLANET_STAGES):
            x = x0 + i * (pw + gap)
            body += panel(x, 100, pw, ph, label)
            px, py = x + 44, 100 + 218
            body += g(planet_disc() + planet_marks(key, colony), px, py, 0, 0.9)
            if names:
                body += g(station(parts, names), x + pw / 2 + 4, 100 + 92, 0, 1.12)
        # actual size: the station at about 24 px, as the system view draws it
        body += f'<text x="40" y="452" fill="{TEXT}" font-size="16" font-weight="500">At game size</text>'
        body += f'<text x="40" y="474" fill="{SUB}" font-size="13">Sol (Federation) has Port + Yards + Armory. The station about 24 px across, beside a planet about 30 px, as the star system draws them.</text>'
        for i, (label, colony, names) in enumerate(PLANET_STAGES):
            x = x0 + i * (pw + gap)
            body += panel(x, 492, pw, 110, label)
            px, py = x + pw / 2 - 12, 540
            body += g(planet_disc() + planet_marks(key, colony), px, py, 0, 0.38)
            if names:
                body += g(station(parts, names), px + 26, py - 14, 0, 0.24)
        # the parts, labeled
        body += f'<text x="40" y="640" fill="{TEXT}" font-size="16" font-weight="500">Parts</text>'
        for i, n in enumerate(['core', 'port', 'yards', 'armory', 'autofactory']):
            x = 160 + i * 150
            body += g(parts[n], x, 664, 0, 0.62) + f'<text x="{x}" y="706" text-anchor="middle" fill="{SUB}" font-size="12">{n}</text>'
        open(os.path.join(out_dir, f'system-{key}.svg'), 'w').write(
            sheet_frame(f'Planet stations, system {key.upper()}: {name}', idea, body))


# ---- Asteroid station systems, drawn over the game's own rocks ----

def rock(comp):
    s = open(os.path.join(ART, f'asteroid-{comp}.svg')).read()
    s = re.sub(r'<\?xml[^>]*>|<!--.*?-->', '', s, flags=re.S)
    return re.search(r'<svg[^>]*>(.*)</svg>', s, re.S).group(1)


def surface_parts():
    return {
        'platform': (rect(-12, -20, 24, 4, L, 1.5) +                               # corridor
                     f'<polygon points="0,-17 13,-9.5 13,5.5 0,13 -13,5.5 -13,-9.5" fill="{W}"/>' +
                     circ(0, -2, 7, 'none', f'stroke="{D}" stroke-width="1.6"') + rect(-3.5, -3, 7, 2, D) +
                     g(dome(6), 20, -18)),
        'mine': rect(-30, 2, 18, 3, L) + g(drill(20), -24, 18, 110) + drones([(-36, 20, 30), (-30, 30, 160), (-18, 28, -60)]),
        'port': rect(12, -3, 16, 3, L) + g(pods(8, 3), 28, -1.5),
        'armory': g(turret(2), -16, -30, -120) + g(turret(2), 4, -36, -80) + rect(-14, -24, 18, 3, L),
        'yards': rect(8, 14, 3, 14, L) + g(gantry(22, 16), 10, 26, 30),
    }


def tether_parts():
    hub = (''.join(g(rect(5, -1.6, 5, 3.2, L), 0, 0, a) for a in (0, 90, 180, 270)) +
           f'<polygon points="{" ".join(f"{f(8 * math.cos(math.radians(a)))},{f(8 * math.sin(math.radians(a)))}" for a in range(30, 390, 60))}" fill="{W}"/>' +
           circ(0, 0, 3, D))
    hx, hy = 26, -40
    return {
        'platform': (line(4, -10, hx, hy, 1.6, W, 'stroke-dasharray="3 2"') + rect(-3, -12, 10, 5, W, 1.5) +
                     g(hub, hx, hy)),
        'mine': g(drill(16), 2, -8, 110) + drones([(10, -24, -55), (17, -31, -55), (-4, -2, 20)]),
        'port': g(pods(6, 2), hx + 10, hy, 0),
        'armory': g(turret(2), hx, hy - 10, -90) + g(turret(2), hx - 10, hy, 180),
        'yards': g(gantry(18, 12), hx, hy + 10, 90),
    }


def clamp_parts():
    back = '<ellipse cx="0" cy="4" rx="56" ry="14" fill="none" stroke="{c}" stroke-width="{w}" {e}/>'
    return {
        'platform': (back.format(c=L, w=3, e='opacity="0.5" transform="rotate(-14)" stroke-dasharray="0 0"') +
                     '<path d="M-54.3 4 A56 14 0 0 0 54.3 4" fill="none" stroke="#f4eefc" stroke-width="5" transform="rotate(-14)"/>' +
                     g(rect(-3, -10, 6, 12, W, 1.5), -40, 16, -14) + g(rect(-3, -10, 6, 12, W, 1.5), 38, -2, -14)),
        'mine': g(drill(14), -14, 22, -76) + g(drill(14), 16, 15, -104) + drones([(-26, 36, 90), (2, 34, 60), (24, 30, 120)]),
        'port': g(pods(6, 3), 53, -11, -14),
        'armory': g(turret(2), -54, 17, 166) + g(turret(2), -46, 8, -120),
        'yards': g(gantry(20, 13), 0, 22, 76),
    }


ASTEROID_SYSTEMS = {
    'a': ('Surface base', 'A base built across the rock: a hex landing pad and dome, a derrick and drones, '
          'pods on a jetty, turrets on the ridge, a yard frame off the edge. Pairs with planet system B.', surface_parts),
    'b': ('Tethered', 'A small hub hovers off the rock on a tether: the drill works below, drones climb the '
          'line, and the hub grows pods, turrets and a yard. Pairs with planet system B or C.', tether_parts),
    'c': ('Clamp ring', 'A ring clamped around the asteroid: drills bite in from the ring, pods dock on one '
          'end, turrets on the other, a yard frame hangs below. Pairs with planet system A.', clamp_parts),
}

ASTEROID_STAGES = [
    ('Platform', 'silicate', ['platform']),
    ('Mine', 'carbonaceous', ['platform', 'mine']),
    ('Port', 'metallic', ['platform', 'mine', 'port']),
    ('Armory', 'silicate', ['platform', 'mine', 'port', 'armory']),
    ('Sol (Federation)', 'metallic', ['platform', 'mine', 'port', 'armory', 'yards']),
]
A_ORDER = ['yards', 'mine', 'platform', 'port', 'armory']


def asteroid_sheets():
    out_dir = os.path.join(HERE, 'asteroid-stations')
    os.makedirs(out_dir, exist_ok=True)
    for key, (name, idea, make) in ASTEROID_SYSTEMS.items():
        parts = make()
        for n, c in parts.items():
            open(os.path.join(out_dir, f'system-{key}-{n}.svg'), 'w').write(
                standalone(c, f'Asteroid station, system {key.upper()} ({name}): {n}, laid over the rock'))
        body = ''
        pw, gap = 232, 10
        x0 = (1280 - (5 * pw + 4 * gap)) / 2
        for i, (label, comp, names) in enumerate(ASTEROID_STAGES):
            x = x0 + i * (pw + gap)
            body += panel(x, 100, pw, 300, label)
            body += g(rock(comp) + ''.join(parts[n] for n in A_ORDER if n in names), x + pw / 2, 240, 0, 1.55)
        body += f'<text x="40" y="452" fill="{TEXT}" font-size="16" font-weight="500">At game size</text>'
        body += f'<text x="40" y="474" fill="{SUB}" font-size="13">Sol (Federation) has all four plus Yards. The asteroid and its station about 28 px across, as the star system draws them up close.</text>'
        for i, (label, comp, names) in enumerate(ASTEROID_STAGES):
            x = x0 + i * (pw + gap)
            body += panel(x, 492, pw, 110, label)
            body += g(rock(comp) + ''.join(parts[n] for n in A_ORDER if n in names), x + pw / 2, 540, 0, 0.25)
        body += f'<text x="40" y="640" fill="{TEXT}" font-size="16" font-weight="500">Parts</text>'
        for i, n in enumerate(['platform', 'mine', 'port', 'armory', 'yards']):
            x = 160 + i * 150
            body += g(parts[n], x, 664, 0, 0.62) + f'<text x="{x}" y="706" text-anchor="middle" fill="{SUB}" font-size="12">{n}</text>'
        open(os.path.join(out_dir, f'system-{key}.svg'), 'w').write(
            sheet_frame(f'Asteroid stations, system {key.upper()}: {name}', idea, body))


def overview():
    """All six side by side, each fully built, to choose from."""
    body = ''
    pw, gap = 392, 12
    x0 = (1280 - (3 * pw + 2 * gap)) / 2
    for i, (key, (name, _, make)) in enumerate(PLANET_SYSTEMS.items()):
        x = x0 + i * (pw + gap)
        body += panel(x, 100, pw, 280, f'Planet {key.upper()}: {name}')
        parts = make()
        body += g(planet_disc() + planet_marks(key, 2), x + 90, 270, 0, 1.1)
        body += g(station(parts, ORDER), x + pw / 2 + 70, 205, 0, 1.6)
    for i, (key, (name, _, make)) in enumerate(ASTEROID_SYSTEMS.items()):
        x = x0 + i * (pw + gap)
        body += panel(x, 396, pw, 300, f'Asteroid {key.upper()}: {name}')
        parts = make()
        body += g(rock(['silicate', 'carbonaceous', 'metallic'][i]) + ''.join(parts[n] for n in A_ORDER), x + pw / 2, 530, 0, 1.75)
    open(os.path.join(HERE, 'overview.svg'), 'w').write(sheet_frame(
        'Station proposals, fully built', 'Planet stations with every facility (and colony lights); asteroid stations '
        'with every facility. Each system has its own sheet with every stage.', body))


# ---- Iteration 2 (Koda, 2026-11-18): bold, in the original station's and the ship's language ----
# The original station (sprites/station.svg.vue) is the core: a notched hexagon with an X-crossed window.
# Parts are solid and chunky like the ship's rounded pods and thick struts; no thin lines.

_STATION = re.search(r'd="(M291 0l61[^"]*)"', open(os.path.join(ROOT, 'orbiter-client', 'src', 'components',
                     'star-map', 'sprites', 'station.svg.vue')).read()).group(1)
_SHIP = re.search(r'd="(M2303 0c[^"]*)"', open(os.path.join(ROOT, 'orbiter-client', 'src', 'components',
                  'star-map', 'sprites', 'ship.svg.vue')).read()).group(1)


def hex_core(scale=0.075):
    """The original station, centered: about 43 units across at 0.075."""
    return g(f'<path d="{_STATION}" fill="{W}" fill-rule="evenodd"/>', 0, 0, 0, scale).replace(
        '<g transform="scale', f'<g transform="scale', 1).replace(
        f'scale({f(scale)})">', f'scale({f(scale)}) translate(-290 -301)">', 1)


def strut(length, w=6):
    return rect(-1, -w / 2, length + 1, w, L, w / 2)


def bold_pods():
    """Trade port: a collar and two capsule pods, rounded like the ship's."""
    return (strut(6) + rect(5, -11, 5, 22, W, 2.5) +
            rect(11, -10.5, 15, 9, W, 4.5) + rect(11, 1.5, 15, 9, W, 4.5))


def bold_turret():
    """Armory: a dome with one heavy barrel."""
    return strut(6) + circ(12, 0, 8, W) + rect(12, -2.8, 18, 5.6, W, 2.8)


def bold_yards():
    """Yards: a heavy open cradle with the Orbiter 8 being built in it."""
    s = strut(5)
    s += path('M4 -14 H29 a3 3 0 0 1 0 6 H10 V8 H29 a3 3 0 0 1 0 6 H4 Z', W)
    s += g(f'<path d="{_SHIP}" fill="{L}" transform="translate(-2300 -2300)"/>', 20, 0, 90, 0.0036)
    return s


def bold_factory():
    """Autofactory: a chunky block with three vents and a stack."""
    return (strut(5) + rect(4, -10, 20, 20, W, 4) + ''.join(rect(8 + 5 * i, -6, 2.6, 12, D, 1.3) for i in range(3)) +
            rect(24, -4, 5, 8, W, 2))


def bold_mast():
    """The citadel gun Koda liked (planet A): a dome and a heavy mast."""
    return circ(0, 0, 6.5, W) + rect(0, -2.5, 15, 5, W, 2.5) + rect(-7, -1, 3, 2, W)


def bold_drill():
    """Mine: a solid derrick with a cut-out, a heavy bit."""
    return (rect(-2, -10, 5, 20, W, 2) + path('M2 -8 L20 -4 L20 4 L2 8 Z', W) +
            path('M5 -4.6 L11 -3.3 L11 3.3 L5 4.6 Z', D) + path('M13 -2.8 L17.5 -2 L17.5 2 L13 2.8 Z', D) +
            rect(19, -2, 9, 4, W, 2))


def bold_drones(pts):
    return ''.join(g(path('M4 0 L-3 -3.2 L-1.5 0 L-3 3.2 Z', W), x, y, a) for x, y, a in pts)


def hexring_parts():
    """Planet, iteration 2: the original hexagon with attachments all the way round (A's idea)."""
    r = 22
    return {
        'core': hex_core(),
        'port': on_spoke(bold_pods(), r, 0) + on_spoke(bold_pods(), r, 180),
        'armory': on_spoke(bold_turret(), r, -60) + on_spoke(bold_turret(), r, -120),
        'yards': on_spoke(bold_yards(), r, 120),
        'autofactory': on_spoke(bold_factory(), r, 60),
    }


def planet_marks_bold(stage):
    s = ''
    if stage >= 1:  # the citadel gun on the limb
        a = -50
        s += g(bold_mast(), 40 * math.cos(math.radians(a)), 40 * math.sin(math.radians(a)), a, 0.85)
    if stage >= 2:
        pts = [(-18, 14), (-23, 8), (-13, 21), (-26, 18), (-8, 27), (-19, 27), (-29, 4)]
        s += ''.join(circ(x, y, 4.2, 'url(#citylight)') + circ(x, y, 1.6, '#fbf6ff') for x, y in pts)
    return s


def base_parts():
    """Asteroid, iteration 2: the hexagon set into the middle of the rock, facilities bunched tight round it."""
    r = 14
    pad = ('<ellipse cx="0" cy="4" rx="22" ry="17" fill="#000000" opacity="0.32"/>' +
           ''.join(on_spoke(rect(0, -3, 6, 6, L, 2), 13, a) for a in (30, 150, 270)) + hex_core(0.05))
    return {
        'platform': pad,
        'mine': g(bold_drill(), -11, 11, 135, 0.75) + bold_drones([(-24, 22, 135), (-27, 10, 160), (-12, 28, 110)]),
        'port': on_spoke(g(bold_pods(), 0, 0, 0, 0.8), r, 0),
        'armory': on_spoke(g(bold_turret(), 0, 0, 0, 0.8), r, -75) + on_spoke(g(bold_turret(), 0, 0, 0, 0.8), r, -145),
        'yards': on_spoke(g(bold_yards(), 0, 0, 0, 0.8), r, 55),
    }


def iteration_two():
    pdir = os.path.join(HERE, 'planet-stations')
    adir = os.path.join(HERE, 'asteroid-stations')
    parts = hexring_parts()
    for n, c in parts.items():
        open(os.path.join(pdir, f'system-d-{n}.svg'), 'w').write(standalone(c, f'Planet station, system D (Hex ring): {n}'))
    open(os.path.join(pdir, 'system-d-colony.svg'), 'w').write(standalone(
        planet_disc() + planet_marks_bold(2), 'Planet, system D: the citadel gun and colony lights (the disc is a stand-in)'))
    order = ['yards', 'autofactory', 'port', 'armory', 'core']
    stages = [('Citadel', 1, []), ('Colony', 2, []), ('Station', 2, ['core']), ('Port', 2, ['core', 'port']),
              ('Yards', 2, ['core', 'port', 'yards']), ('Armory', 2, ['core', 'port', 'yards', 'armory']),
              ('Autofactory', 2, ['core', 'port', 'yards', 'armory', 'autofactory']),
              ('Sol (Federation)', 2, ['core', 'port', 'yards', 'armory'])]
    st = lambda names: ''.join(parts[n] for n in order if n in names)
    body = ''
    pw, gap = 145, 9
    x0 = (1280 - (8 * pw + 7 * gap)) / 2
    for i, (label, colony, names) in enumerate(stages):
        x = x0 + i * (pw + gap)
        body += panel(x, 100, pw, 300, label)
        body += g(planet_disc() + planet_marks_bold(colony), x + 44, 318, 0, 0.9)
        if names:
            body += g(st(names), x + pw / 2 + 4, 192, 0, 1.12)
    body += f'<text x="40" y="452" fill="{TEXT}" font-size="16" font-weight="500">At game size</text>'
    body += f'<text x="40" y="474" fill="{SUB}" font-size="13">Sol (Federation) has Port + Yards + Armory. The station about 24 px across, beside a planet about 30 px.</text>'
    for i, (label, colony, names) in enumerate(stages):
        x = x0 + i * (pw + gap)
        body += panel(x, 492, pw, 110, label)
        body += g(planet_disc() + planet_marks_bold(colony), x + pw / 2 - 12, 540, 0, 0.38)
        if names:
            body += g(st(names), x + pw / 2 + 14, 526, 0, 0.24)
    body += f'<text x="40" y="640" fill="{TEXT}" font-size="16" font-weight="500">Parts</text>'
    for i, n in enumerate(['core', 'port', 'yards', 'armory', 'autofactory']):
        x = 160 + i * 150
        body += g(parts[n], x, 664, 0, 0.62) + f'<text x="{x}" y="706" text-anchor="middle" fill="{SUB}" font-size="12">{n}</text>'
    open(os.path.join(pdir, 'system-d.svg'), 'w').write(sheet_frame(
        'Planet stations, system D: Hex ring (iteration 2)',
        'The original station at the center; bold attachments all the way round: pods, turrets, factory blocks, the yard cradle.', body))

    aparts = base_parts()
    for n, c in aparts.items():
        open(os.path.join(adir, f'system-d-{n}.svg'), 'w').write(standalone(c, f'Asteroid station, system D (Hex base): {n}, laid over the rock'))
    a_order = ['mine', 'platform', 'yards', 'port', 'armory']
    body = ''
    pw, gap = 232, 10
    x0 = (1280 - (5 * pw + 4 * gap)) / 2
    for i, (label, comp, names) in enumerate(ASTEROID_STAGES):
        x = x0 + i * (pw + gap)
        body += panel(x, 100, pw, 300, label)
        body += g(rock(comp) + ''.join(aparts[n] for n in a_order if n in names), x + pw / 2, 240, 0, 1.55)
    body += f'<text x="40" y="452" fill="{TEXT}" font-size="16" font-weight="500">At game size</text>'
    body += f'<text x="40" y="474" fill="{SUB}" font-size="13">Sol (Federation) has all four plus Yards. The asteroid and its station about 28 px across.</text>'
    for i, (label, comp, names) in enumerate(ASTEROID_STAGES):
        x = x0 + i * (pw + gap)
        body += panel(x, 492, pw, 110, label)
        body += g(rock(comp) + ''.join(aparts[n] for n in a_order if n in names), x + pw / 2, 540, 0, 0.25)
    body += f'<text x="40" y="640" fill="{TEXT}" font-size="16" font-weight="500">Parts</text>'
    for i, n in enumerate(['platform', 'mine', 'port', 'armory', 'yards']):
        x = 160 + i * 150
        body += g(aparts[n], x, 664, 0, 0.62) + f'<text x="{x}" y="706" text-anchor="middle" fill="{SUB}" font-size="12">{n}</text>'
    open(os.path.join(adir, 'system-d.svg'), 'w').write(sheet_frame(
        'Asteroid stations, system D: Hex base (iteration 2)',
        "The original station set into the middle of the rock, its facilities bunched tight around it; the planet D parts, smaller.", body))

    # the pair, large, fully built
    body = panel(40, 100, 590, 590, 'Planet station D, fully built') + panel(650, 100, 590, 590, 'Asteroid station D, fully built (Sol)')
    body += g(planet_disc() + planet_marks_bold(2), 150, 560, 0, 1.6)
    body += g(st(['core', 'port', 'yards', 'armory', 'autofactory']), 370, 330, 0, 3.4)
    body += g(rock('metallic') + ''.join(aparts[n] for n in a_order), 945, 390, 0, 4.2)
    open(os.path.join(HERE, 'overview-2.svg'), 'w').write(sheet_frame(
        'Station proposals, iteration 2', 'Planet D (Hex ring) and asteroid D (Hex base), in the original station\'s and the ship\'s bold style.', body))


# ---- Iteration 3 (Koda, 2026-11-18): lighter lines, smaller parts, room for docked ships ----
# Docked ships sit side-on at the station's flat faces, about as long as the station is wide, at most
# three at once (sdk/game/docking.js). So three alternate faces are docking pads (0, 120, 240 degrees:
# the port's collars) and the facilities take the other three (60, 180, 300), hugging the hull.

PADS3 = (0, 120, 240)


def slim_strut(length, w=3.4):
    return rect(-1, -w / 2, length + 1, w, L, w / 2)


def slim_collar():
    """Port, at a pad: a short docking collar flanked by two cargo pods along the face."""
    return (slim_strut(3) + rect(2.5, -5, 3, 10, W, 1.5) +
            g(rect(-3.5, -2.1, 7, 4.2, W, 2.1), -1.5, -9.5, 90) + g(rect(-3.5, -2.1, 7, 4.2, W, 2.1), -1.5, 9.5, 90))


def slim_turrets():
    """Armory: two dome-and-barrel guns on a plate."""
    s = slim_strut(3) + rect(2.5, -9, 3, 18, W, 1.5)
    for y in (-4.6, 4.6):
        s += circ(8.5, y, 4.2, W) + rect(8.5, y - 1.4, 11, 2.8, W, 1.4)
    return s


def slim_yards():
    """Yards: an open cradle with the Orbiter 8 in it."""
    s = slim_strut(3)
    s += path('M2.5 -10 H21 a1.6 1.6 0 0 1 0 3.2 H5.7 V6.8 H21 a1.6 1.6 0 0 1 0 3.2 H2.5 Z', W)
    s += g(f'<path d="{_SHIP}" fill="{L}" transform="translate(-2300 -2300)"/>', 13.5, 0, 90, 0.0026)
    return s


def slim_factory():
    """Autofactory: a block with three vents and a stack."""
    return (slim_strut(3) + rect(2.5, -7, 13, 14, W, 2.5) +
            ''.join(rect(5 + 3.3 * i, -4, 1.7, 8, D, 0.85) for i in range(3)) + rect(15.5, -2.5, 3.5, 5, W, 1.5))


def slim_mast():
    return circ(0, 0, 5, W) + rect(0, -1.7, 11, 3.4, W, 1.7)


def slim_drill():
    return (rect(-1.5, -7, 3.5, 14, W, 1.5) + path('M1.5 -5.5 L15 -2.6 L15 2.6 L1.5 5.5 Z', W) +
            path('M4 -3 L8.5 -2.1 L8.5 2.1 L4 3 Z', D) + rect(14, -1.4, 6, 2.8, W, 1.4))


def slim_drones(pts):
    return ''.join(g(path('M3 0 L-2.2 -2.3 L-1.1 0 L-2.2 2.3 Z', W), x, y, a) for x, y, a in pts)


def padded_parts(r=22):
    return {
        'core': hex_core(),
        'port': ''.join(on_spoke(slim_collar(), r, a) for a in PADS3),
        'yards': on_spoke(slim_yards(), r, 180),
        'armory': on_spoke(slim_turrets(), r, 300),
        'autofactory': on_spoke(slim_factory(), r, 60),
    }


def docked_ships(r=22, pads=PADS3, ship=36):
    """Ships at the pads as the game docks them: side-on, on a short tube, about the station's width long."""
    tube = r * 0.25
    s = ''
    for a in pads:
        d = r + tube + ship / 2
        tubes = line(r, -2.2, r + tube + 1, -2.2, 1.1, '#e6dcf5', 'stroke-opacity="0.8"') + \
            line(r, 2.2, r + tube + 1, 2.2, 1.1, '#e6dcf5', 'stroke-opacity="0.8"')
        body = g(f'<path d="{_SHIP}" fill="#ffffff" transform="translate(-2300 -2300)"/>', d, 0, 180, ship / 4600)
        s += g(tubes + body, 0, 0, a)
    return s


def planet_marks_slim(stage):
    s = ''
    if stage >= 1:
        a = -50
        s += g(slim_mast(), 40 * math.cos(math.radians(a)), 40 * math.sin(math.radians(a)), a)
    if stage >= 2:
        pts = [(-18, 14), (-23, 8), (-13, 21), (-26, 18), (-8, 27), (-19, 27), (-29, 4)]
        s += ''.join(circ(x, y, 3.8, 'url(#citylight)') + circ(x, y, 1.3, '#fbf6ff') for x, y in pts)
    return s


def hexbase_parts():
    """Asteroid, iteration 3: the hexagon in the middle of the rock, the same parts, smaller, tight round it."""
    r, k = 14.5, 0.68
    sm = lambda m: g(m, 0, 0, 0, k)
    return {
        'platform': ('<ellipse cx="0" cy="3" rx="19" ry="15" fill="#000000" opacity="0.3"/>' +
                     ''.join(on_spoke(rect(0, -2, 5, 4, L, 1.5), 13.5, a) for a in (90, 210, 330)) + hex_core(0.05)),
        'mine': g(slim_drill(), -10, 13, 125, 0.75) + slim_drones([(-22, 23, 125), (-25, 12, 150), (-11, 29, 110)]),
        'port': ''.join(on_spoke(sm(slim_collar()), r, a) for a in PADS3),
        'armory': on_spoke(sm(slim_turrets()), r, 300),
        'yards': on_spoke(sm(slim_yards()), r, 180),
    }


def iteration_three():
    pdir = os.path.join(HERE, 'planet-stations')
    adir = os.path.join(HERE, 'asteroid-stations')
    parts = padded_parts()
    for n, c in parts.items():
        open(os.path.join(pdir, f'system-e-{n}.svg'), 'w').write(standalone(c, f'Planet station, system E (Hex, three pads): {n}'))
    open(os.path.join(pdir, 'system-e-colony.svg'), 'w').write(standalone(
        planet_disc() + planet_marks_slim(2), 'Planet, system E: the citadel gun and colony lights (the disc is a stand-in)'))
    order = ['yards', 'autofactory', 'armory', 'port', 'core']
    st = lambda names: ''.join(parts[n] for n in order if n in names)
    stages = [('Citadel', 1, []), ('Colony', 2, []), ('Station', 2, ['core']), ('Port', 2, ['core', 'port']),
              ('Yards', 2, ['core', 'port', 'yards']), ('Armory', 2, ['core', 'port', 'yards', 'armory']),
              ('Autofactory', 2, ['core', 'port', 'yards', 'armory', 'autofactory']),
              ('Sol (Federation)', 2, ['core', 'port', 'yards', 'armory'])]
    body = ''
    pw, gap = 145, 9
    x0 = (1280 - (8 * pw + 7 * gap)) / 2
    for i, (label, colony, names) in enumerate(stages):
        x = x0 + i * (pw + gap)
        body += panel(x, 100, pw, 300, label)
        body += g(planet_disc() + planet_marks_slim(colony), x + 44, 318, 0, 0.9)
        if names:
            body += g(st(names), x + pw / 2 + 4, 192, 0, 1.25)
    body += f'<text x="40" y="452" fill="{TEXT}" font-size="16" font-weight="500">At game size</text>'
    body += f'<text x="40" y="474" fill="{SUB}" font-size="13">Sol (Federation) has Port + Yards + Armory. The station about 24 px across, beside a planet about 30 px.</text>'
    for i, (label, colony, names) in enumerate(stages):
        x = x0 + i * (pw + gap)
        body += panel(x, 492, pw, 110, label)
        body += g(planet_disc() + planet_marks_slim(colony), x + pw / 2 - 12, 540, 0, 0.38)
        if names:
            body += g(st(names), x + pw / 2 + 14, 526, 0, 0.3)
    body += f'<text x="40" y="640" fill="{TEXT}" font-size="16" font-weight="500">Parts</text>'
    for i, n in enumerate(['core', 'port', 'yards', 'armory', 'autofactory']):
        x = 160 + i * 150
        body += g(parts[n], x, 664, 0, 0.7) + f'<text x="{x}" y="706" text-anchor="middle" fill="{SUB}" font-size="12">{n}</text>'
    open(os.path.join(pdir, 'system-e.svg'), 'w').write(sheet_frame(
        'Planet stations, system E: Hex, three pads (iteration 3)',
        'The original station; ships dock at three faces (the port\'s collars), the yard, guns and factory take the other three.', body))

    aparts = hexbase_parts()
    for n, c in aparts.items():
        open(os.path.join(adir, f'system-e-{n}.svg'), 'w').write(standalone(c, f'Asteroid station, system E (Hex base, three pads): {n}, laid over the rock'))
    a_order = ['mine', 'platform', 'yards', 'armory', 'port']
    body = ''
    pw, gap = 232, 10
    x0 = (1280 - (5 * pw + 4 * gap)) / 2
    for i, (label, comp, names) in enumerate(ASTEROID_STAGES):
        x = x0 + i * (pw + gap)
        body += panel(x, 100, pw, 300, label)
        body += g(rock(comp) + ''.join(aparts[n] for n in a_order if n in names), x + pw / 2, 240, 0, 1.55)
    body += f'<text x="40" y="452" fill="{TEXT}" font-size="16" font-weight="500">At game size</text>'
    body += f'<text x="40" y="474" fill="{SUB}" font-size="13">Sol (Federation) has all four plus Yards. The asteroid and its station about 28 px across.</text>'
    for i, (label, comp, names) in enumerate(ASTEROID_STAGES):
        x = x0 + i * (pw + gap)
        body += panel(x, 492, pw, 110, label)
        body += g(rock(comp) + ''.join(aparts[n] for n in a_order if n in names), x + pw / 2, 540, 0, 0.25)
    body += f'<text x="40" y="640" fill="{TEXT}" font-size="16" font-weight="500">Parts</text>'
    for i, n in enumerate(['platform', 'mine', 'port', 'armory', 'yards']):
        x = 160 + i * 150
        body += g(aparts[n], x, 664, 0, 0.7) + f'<text x="{x}" y="706" text-anchor="middle" fill="{SUB}" font-size="12">{n}</text>'
    open(os.path.join(adir, 'system-e.svg'), 'w').write(sheet_frame(
        'Asteroid stations, system E: Hex base, three pads (iteration 3)',
        'The original station in the middle of the rock; the planet E parts, smaller, hugging it; ships dock at three faces.', body))

    # docked ships: the planet station with one, two and three ships; the asteroid station with three
    body = ''
    full = st(['core', 'port', 'yards', 'armory', 'autofactory'])
    for i, n in enumerate((1, 2, 3)):
        x = 40 + i * 300
        body += panel(x, 100, 288, 330, f'{n} ship{"s" if n > 1 else ""} docked')
        body += g(docked_ships(pads=PADS3[:n]) + full, x + 144, 255, 0, 1.75)
    body += panel(940, 100, 300, 330, 'Asteroid (Sol), 3 docked')
    body += g(rock('metallic') + ''.join(aparts[n] for n in a_order) + docked_ships(14.5, PADS3, 24), 1090, 255, 0, 1.75)
    body += (f'<text x="40" y="470" fill="{TEXT}" font-size="16" font-weight="500">Fully built, large</text>')
    body += panel(40, 486, 1200, 210, '')
    body += g(planet_disc() + planet_marks_slim(2), 150, 600, 0, 1.4)
    body += g(full, 420, 590, 0, 1.8) + g(docked_ships() + full, 760, 590, 0, 1.3)
    body += g(rock('silicate') + ''.join(aparts[n] for n in a_order), 1070, 590, 0, 1.75)
    open(os.path.join(HERE, 'overview-3.svg'), 'w').write(sheet_frame(
        'Station proposals, iteration 3: docking',
        'Ships dock side-on at three faces, about as long as the station is wide (as the game draws them); the facilities keep to the other three.', body))


# ---- The chosen design (system E), written into the game's art (Koda, 2026-11-18: "please integrate") ----

def game_art():
    """Writes system E's parts to orbiter-client/src/assets/art/, in the 120-unit art frame:
    - station-port/-yards/-armory/-autofactory.svg: drawn round the original station (core radius 22);
      the station sprite (sprites/station.svg.vue) lays them under the core;
    - planet-citadel.svg, planet-colony.svg: on a planet of radius 40, lights on the night side (+x: the
      game lights planets from -x); the planet sprite draws them at a quarter size;
    - asteroid-platform.svg, asteroid-mine.svg: over the rock (the asteroid sprite's frame);
    - asteroid-station.svg (the Platform's and the asteroid action's icon): the hex base and a drill."""
    parts = padded_parts()
    head = lambda note: (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-60 -60 120 120">\n'
                         f'<!-- {note} (Orbiter 8 art, 120 units square, centered; drawn by docs/mockups/stages/gen-stations.py, system E) -->\n')
    for n in ('port', 'yards', 'armory', 'autofactory'):
        open(os.path.join(ART, f'station-{n}.svg'), 'w').write(
            head(f'Space station part: {n}, round the station core (sprites/station.svg.vue, core radius 22)') + parts[n] + '\n</svg>\n')
    a = -50
    citadel = g(slim_mast(), 40 * math.cos(math.radians(a)), 40 * math.sin(math.radians(a)), a)
    open(os.path.join(ART, 'planet-citadel.svg'), 'w').write(
        head("A planet's citadel: a dome and gun on its limb (planet radius 40)") + citadel + '\n</svg>\n')
    pts = [(18, 14), (23, 8), (13, 21), (26, 18), (8, 27), (19, 27), (29, 4), (24, -6)]
    lights = ''.join(circ(x, y, 3.6, '#f3e6ff', 'opacity="0.28"') + circ(x, y, 1.3, '#fbf6ff') for x, y in pts)
    open(os.path.join(ART, 'planet-colony.svg'), 'w').write(
        head("A colony's city lights on a planet's night side (planet radius 40, lit from -x)") + lights + '\n</svg>\n')
    ap = hexbase_parts()
    footing = ('<ellipse cx="0" cy="3" rx="19" ry="15" fill="#000000" opacity="0.3"/>' +
               ''.join(on_spoke(rect(0, -2, 5, 4, L, 1.5), 13.5, a) for a in (90, 210, 330)))
    open(os.path.join(ART, 'asteroid-platform.svg'), 'w').write(
        head("An asteroid's platform: the station's footing and legs, at the rock's middle") + footing + '\n</svg>\n')
    open(os.path.join(ART, 'asteroid-mine.svg'), 'w').write(
        head("An asteroid's mine: a derrick and its drones, beside the base") + ap['mine'] + '\n</svg>\n')
    icon = g(footing + hex_core(0.05) + ap['mine'], 4, -4, 0, 1.9)
    open(os.path.join(ART, 'asteroid-station.svg'), 'w').write(
        head('Asteroid station icon: the hex base on its legs, a derrick and drones') + icon + '\n</svg>\n')


if __name__ == '__main__':
    planet_sheets()
    asteroid_sheets()
    overview()
    iteration_two()
    iteration_three()
    game_art()
    print('written to', HERE)
