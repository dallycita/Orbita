/**
 * Récords guardados (mejor anillo e intentos de cada nivel) y el estado principal de la partida:
 * pantalla actual (`state`), anillos, nivel de anillo del planeta y de la cámara, salto y carga.
 * Los récords viven en localStorage con claves `orbita_pN_anillo` y `orbita_pN_intentos`.
 */
import {
  elArcFg,
  elBest,
  elPbar,
  elPnum,
  elScore,
  elWrap,
  hudMode,
} from './01-pantalla-y-utilidades.js';
import { attempts, curGoal, tutorial } from './08-partida-estado.js';

let best = 0;
const saveBest = () => {
  try {
    localStorage.setItem('orbita_best_v2', String(best));
  } catch (e) {}
};
let bestRing = 0;
const saveBestRing = () => {
  try {
    localStorage.setItem('orbita_p1_anillo', String(bestRing));
  } catch (e) {}
};
let runRecord = 0,
  newRec = false;
/**
 * Actualiza el marcador de anillos: la barra de viaje de arriba (como en Geometry Dash, el
 * planeta avanza del agujero negro a la salida y la marca dorada es el récord), el número y el
 * arco de progreso.
 */
function updateRingHUD() {
  if (elPbar && elPbar.style) {
    const g = curGoal(),
      v = Math.min(level, g),
      rec = tutorial ? 0 : Math.min(runRecord, g);
    elPbar.style.setProperty('--p', ((v / g) * 100).toFixed(2) + '%');
    elPbar.style.setProperty('--r', ((rec / g) * 100).toFixed(2) + '%');
    if (elPbar.classList) {
      elPbar.classList.toggle('hasrec', rec > 0 && rec < g);
      elPbar.classList.toggle('beat', rec > 0 && v > rec);
    }
    if (elPnum) {
      elPnum.innerHTML = v + '<span>/ ' + g + '</span>';
      if (elPnum.classList) {
        elPnum.classList.toggle('beat', rec > 0 && v > rec);
      }
    }
  }
  elScore.innerHTML = Math.min(level, curGoal()) + '<small>/ ' + curGoal() + '</small>';
  elBest.textContent = '';
  const arc = hudMode === 'arco' && runRecord > 0;
  elWrap.classList.toggle('arc', arc);
  if (arc) {
    elArcFg.style.strokeDashoffset = String(276.5 * (1 - Math.min(level / runRecord, 1)));
    elArcFg.style.stroke = newRec ? 'var(--fg)' : 'var(--sun)';
  }
}

// Pantalla actual: 'pretitle', 'splash', 'intro', 'home', 'planets', 'levels', 'menu',
// 'play', 'dead' o 'win'.
let state = 'pretitle';
let rings, level, pLevel, camLevel, pAng, jumping, jumpT, combo, lastLand, score;
let astFade = 0,
  appear = 1;
let charge = 0,
  jumpTarget = 1,
  crossed = false;
// Anillo de la salida.
const GOAL = 50;
let lvl = 0; // Índice en LEVELS: 0 Sistema solar, 1 Nubes de Magallanes, 2 Andrómeda…
let best2 = 0,
  attempts2 = 0,
  best3 = 0,
  attempts3 = 0;
const bestX = {},
  attX = {};
/**
 * Mejor anillo alcanzado en un nivel.
 *
 * @param {number} i Índice del nivel.
 * @returns {number} Nivel de anillo.
 */
const bestOf = i => (i >= 3 ? bestX[i] || 0 : i === 2 ? best3 : i === 1 ? best2 : bestRing);
/**
 * Guarda el mejor anillo de un nivel.
 *
 * @param {number} i Índice del nivel.
 * @param {number} v Nivel de anillo.
 */
function setBestOf(i, v) {
  if (i >= 3) {
    bestX[i] = v;
    try {
      localStorage.setItem('orbita_p' + (i + 1) + '_anillo', String(v));
    } catch (e) {}
  } else if (i === 2) {
    best3 = v;
    try {
      localStorage.setItem('orbita_p3_anillo', String(v));
    } catch (e) {}
  } else if (i === 1) {
    best2 = v;
    try {
      localStorage.setItem('orbita_p2_anillo', String(v));
    } catch (e) {}
  } else {
    bestRing = v;
    saveBestRing();
  }
}
/**
 * Intentos hechos en un nivel.
 *
 * @param {number} i Índice del nivel.
 * @returns {number} Cantidad de intentos.
 */
const attemptsOf = i =>
  i >= 3 ? attX[i] || 0 : i === 2 ? attempts3 : i === 1 ? attempts2 : attempts;

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initRecords() {
  try {
    best = parseInt(localStorage.getItem('orbita_best_v2') || '0', 10) || 0;
  } catch (e) {
    best = 0;
  }
  try {
    bestRing = parseInt(localStorage.getItem('orbita_p1_anillo') || '0', 10) || 0;
  } catch (e) {
    bestRing = 0;
  }
  try {
    best3 = parseInt(localStorage.getItem('orbita_p3_anillo') || '0', 10) || 0;
    attempts3 = parseInt(localStorage.getItem('orbita_p3_intentos') || '0', 10) || 0;
  } catch (e) {}
  try {
    best2 = parseInt(localStorage.getItem('orbita_p2_anillo') || '0', 10) || 0;
    attempts2 = parseInt(localStorage.getItem('orbita_p2_intentos') || '0', 10) || 0;
  } catch (e) {}
  for (let i = 3; i < 8; i++) {
    try {
      bestX[i] = parseInt(localStorage.getItem('orbita_p' + (i + 1) + '_anillo') || '0', 10) || 0;
      attX[i] = parseInt(localStorage.getItem('orbita_p' + (i + 1) + '_intentos') || '0', 10) || 0;
    } catch (e) {
      bestX[i] = 0;
      attX[i] = 0;
    }
  }
}

/**
 * Cambia `appear` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setAppear(value) {
  appear = value;
  return value;
}

/**
 * Cambia `astFade` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setAstFade(value) {
  astFade = value;
  return value;
}

/**
 * Cambia `attempts2` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setAttempts2(value) {
  attempts2 = value;
  return value;
}

/**
 * Cambia `attempts3` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setAttempts3(value) {
  attempts3 = value;
  return value;
}

/**
 * Cambia `best` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setBest(value) {
  best = value;
  return value;
}

/**
 * Cambia `bestRing` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setBestRing(value) {
  bestRing = value;
  return value;
}

/**
 * Cambia `camLevel` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setCamLevel(value) {
  camLevel = value;
  return value;
}

/**
 * Cambia `charge` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setCharge(value) {
  charge = value;
  return value;
}

/**
 * Cambia `combo` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setCombo(value) {
  combo = value;
  return value;
}

/**
 * Cambia `crossed` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setCrossed(value) {
  crossed = value;
  return value;
}

/**
 * Cambia `jumpT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setJumpT(value) {
  jumpT = value;
  return value;
}

/**
 * Cambia `jumpTarget` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setJumpTarget(value) {
  jumpTarget = value;
  return value;
}

/**
 * Cambia `jumping` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setJumping(value) {
  jumping = value;
  return value;
}

/**
 * Cambia `lastLand` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setLastLand(value) {
  lastLand = value;
  return value;
}

/**
 * Cambia `level` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setLevel(value) {
  level = value;
  return value;
}

/**
 * Cambia `lvl` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setLvl(value) {
  lvl = value;
  return value;
}

/**
 * Cambia `newRec` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setNewRec(value) {
  newRec = value;
  return value;
}

/**
 * Cambia `pAng` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setPAng(value) {
  pAng = value;
  return value;
}

/**
 * Cambia `pLevel` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setPLevel(value) {
  pLevel = value;
  return value;
}

/**
 * Cambia `rings` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setRings(value) {
  rings = value;
  return value;
}

/**
 * Cambia `runRecord` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setRunRecord(value) {
  runRecord = value;
  return value;
}

/**
 * Cambia `score` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setScore(value) {
  score = value;
  return value;
}

/**
 * Cambia `state` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setState(value) {
  state = value;
  return value;
}

export {
  GOAL,
  appear,
  astFade,
  attX,
  attempts2,
  attempts3,
  attemptsOf,
  best,
  bestOf,
  bestRing,
  camLevel,
  charge,
  combo,
  crossed,
  jumpT,
  jumpTarget,
  jumping,
  lastLand,
  level,
  lvl,
  newRec,
  pAng,
  pLevel,
  rings,
  runRecord,
  saveBest,
  score,
  setBestOf,
  state,
  updateRingHUD,
};
