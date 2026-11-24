/**
 * Colores de cada zona del camino según la galaxia y el anillo en que vas.
 */
import { lvl } from '../core/state.js';
import { tutorial } from '../core/run-state.js';
import { BONE } from '../core/display.js';

const ZONES = [
  { ring: BONE, ast: BONE, s1: '#ffe2b0', s2: '#ff5a1f', bg: '#0d1220' },
  { ring: BONE, ast: BONE, s1: '#ffe2b0', s2: '#ff5a1f', bg: '#120f1e' },
  { ring: BONE, ast: BONE, s1: '#ffe2b0', s2: '#ff5a1f', bg: '#0f1220' },
  { ring: BONE, ast: BONE, s1: '#ffe2b0', s2: '#ff5a1f', bg: '#120c22' },
];

const ZONE_AND = { ring: '#ece6d8', ast: '#ece6d8', s1: '#ffe2b0', s2: '#ff5a1f', bg: '#060714' };

const ZONE_MAG = { ring: '#ece6d8', ast: '#ece6d8', s1: '#ffe2b0', s2: '#ff5a1f', bg: '#04070e' };

const ZONE_LV = {
  3: { ring: '#ece6d8', ast: '#ece6d8', s1: '#ffe2b0', s2: '#ff5a1f', bg: '#07060a' },
  4: { ring: '#ece6d8', ast: '#ece6d8', s1: '#ffe2b0', s2: '#ff5a1f', bg: '#050712' },
  5: { ring: '#ece6d8', ast: '#ece6d8', s1: '#ffe2b0', s2: '#ff5a1f', bg: '#05050a' },
  6: { ring: '#ece6d8', ast: '#ece6d8', s1: '#ffe2b0', s2: '#ff5a1f', bg: '#07050a' },
  7: { ring: '#ece6d8', ast: '#ece6d8', s1: '#ffe2b0', s2: '#ff5a1f', bg: '#0a0607' },
};

/**
 * Colores de la zona de un anillo: cada nivel lejano tiene los suyos; en el Sistema solar y el
 * tutorial cambian cada 25 anillos.
 *
 * @param {number} k Nivel de anillo.
 * @returns {object} Zona {ring, ast, s1, s2, bg}.
 */
const zoneOf = k =>
  lvl >= 3 && !tutorial
    ? ZONE_LV[lvl]
    : lvl === 1 && !tutorial
      ? ZONE_MAG
      : lvl === 2 && !tutorial
        ? ZONE_AND
        : ZONES[Math.floor(k / 25) % ZONES.length];

export { ZONES, zoneOf };
