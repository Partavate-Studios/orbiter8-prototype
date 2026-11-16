// A body's id, as BodyId.sol makes it: `cell << 16 | kind << 8 | index`. Planets are kind 0 (so Sol's
// planets and Federation ports are ids 0–8); asteroids, by belt section, kind 1. Plain numbers: an
// id stays well inside a double's exact range (cells are under 2^32).

export const KIND = { PLANET: 0, ASTEROID: 1 }

export const bodyId = (cell, kind, index) => Number(cell) * 65536 + Number(kind) * 256 + Number(index)
export const planetId = (cell, index) => bodyId(cell, KIND.PLANET, index)
export const cellOf = (id) => Math.floor(Number(id) / 65536)
export const kindOf = (id) => Math.floor(Number(id) / 256) % 256
export const indexOf = (id) => Number(id) % 256
