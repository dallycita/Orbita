/**
 * Récords guardados (mejor anillo e intentos de cada nivel) y el estado principal de la partida:
 * pantalla actual (`state`), anillos, nivel de anillo del planeta y de la cámara, salto y carga.
 * Los récords viven en localStorage con claves `orbita_pN_anillo` y `orbita_pN_intentos`.
 */
import { elArcFg, elBest, elPbar, elPnum, elScore, elWrap, hudMode } from './display.js';
import { curGoal, tutorialState } from './run-state.js';

const records = {
  best: 0,
  bestRing: 0,
  best2: 0,
  attempts2: 0,
  best3: 0,
  attempts3: 0,
  attempts: 0,
};
const saveBest = () => {
  try {
    localStorage.setItem('orbita_best_v2', String(records.best));
  } catch (e) {}
};
const saveBestRing = () => {
  try {
    localStorage.setItem('orbita_p1_anillo', String(records.bestRing));
  } catch (e) {}
};
const run = {
  runRecord: 0,
  newRec: false,
  rings: undefined,
  level: undefined,
  pLevel: undefined,
  pAng: undefined,
  jumping: undefined,
  jumpT: undefined,
  combo: undefined,
  lastLand: undefined,
  score: undefined,
  astFade: 0,
  appear: 1,
  charge: 0,
  jumpTarget: 1,
  crossed: false,
  lvl: 0,
};
/**
 * Actualiza el marcador de anillos: la barra de viaje de arriba (como en Geometry Dash, el
 * planeta avanza del agujero negro a la salida y la marca dorada es el récord), el número y el
 * arco de progreso.
 */
function updateRingHUD() {
  if (elPbar && elPbar.style) {
    const g = curGoal(),
      v = Math.min(run.level, g),
      rec = tutorialState.tutorial ? 0 : Math.min(run.runRecord, g);
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
  elScore.innerHTML = Math.min(run.level, curGoal()) + '<small>/ ' + curGoal() + '</small>';
  elBest.textContent = '';
  const arc = hudMode === 'arco' && run.runRecord > 0;
  elWrap.classList.toggle('arc', arc);
  if (arc) {
    elArcFg.style.strokeDashoffset = String(276.5 * (1 - Math.min(run.level / run.runRecord, 1)));
    elArcFg.style.stroke = run.newRec ? 'var(--fg)' : 'var(--sun)';
  }
}

// Pantalla actual: 'pretitle', 'splash', 'intro', 'home', 'planets', 'levels', 'menu',
// 'play', 'dead' o 'win'.
let state = 'pretitle';
const camera = {
  camLevel: undefined,
};
// Índice en LEVELS: 0 Sistema solar, 1 Nubes de Magallanes, 2 Andrómeda…
const bestX = {};
const attX = {};
/**
 * Mejor anillo alcanzado en un nivel.
 *
 * @param {number} i Índice del nivel.
 * @returns {number} Nivel de anillo.
 */
const bestOf = i =>
  i >= 3 ? bestX[i] || 0 : i === 2 ? records.best3 : i === 1 ? records.best2 : records.bestRing;
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
    records.best3 = v;
    try {
      localStorage.setItem('orbita_p3_anillo', String(v));
    } catch (e) {}
  } else if (i === 1) {
    records.best2 = v;
    try {
      localStorage.setItem('orbita_p2_anillo', String(v));
    } catch (e) {}
  } else {
    records.bestRing = v;
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
  i >= 3
    ? attX[i] || 0
    : i === 2
      ? records.attempts3
      : i === 1
        ? records.attempts2
        : records.attempts;

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initRecords() {
  try {
    records.best = parseInt(localStorage.getItem('orbita_best_v2') || '0', 10) || 0;
  } catch (e) {
    records.best = 0;
  }
  try {
    records.bestRing = parseInt(localStorage.getItem('orbita_p1_anillo') || '0', 10) || 0;
  } catch (e) {
    records.bestRing = 0;
  }
  try {
    records.best3 = parseInt(localStorage.getItem('orbita_p3_anillo') || '0', 10) || 0;
    records.attempts3 = parseInt(localStorage.getItem('orbita_p3_intentos') || '0', 10) || 0;
  } catch (e) {}
  try {
    records.best2 = parseInt(localStorage.getItem('orbita_p2_anillo') || '0', 10) || 0;
    records.attempts2 = parseInt(localStorage.getItem('orbita_p2_intentos') || '0', 10) || 0;
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
  run.appear = value;
  return value;
}

/**
 * Cambia `astFade` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setAstFade(value) {
  run.astFade = value;
  return value;
}

/**
 * Cambia `attempts2` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setAttempts2(value) {
  records.attempts2 = value;
  return value;
}

/**
 * Cambia `attempts3` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setAttempts3(value) {
  records.attempts3 = value;
  return value;
}

/**
 * Cambia `best` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setBest(value) {
  records.best = value;
  return value;
}

/**
 * Cambia `bestRing` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setBestRing(value) {
  records.bestRing = value;
  return value;
}

/**
 * Cambia `camLevel` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setCamLevel(value) {
  camera.camLevel = value;
  return value;
}

/**
 * Cambia `charge` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setCharge(value) {
  run.charge = value;
  return value;
}

/**
 * Cambia `combo` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setCombo(value) {
  run.combo = value;
  return value;
}

/**
 * Cambia `crossed` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setCrossed(value) {
  run.crossed = value;
  return value;
}

/**
 * Cambia `jumpT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setJumpT(value) {
  run.jumpT = value;
  return value;
}

/**
 * Cambia `jumpTarget` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setJumpTarget(value) {
  run.jumpTarget = value;
  return value;
}

/**
 * Cambia `jumping` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setJumping(value) {
  run.jumping = value;
  return value;
}

/**
 * Cambia `lastLand` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setLastLand(value) {
  run.lastLand = value;
  return value;
}

/**
 * Cambia `level` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setLevel(value) {
  run.level = value;
  return value;
}

/**
 * Cambia `lvl` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setLvl(value) {
  run.lvl = value;
  return value;
}

/**
 * Cambia `newRec` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setNewRec(value) {
  run.newRec = value;
  return value;
}

/**
 * Cambia `pAng` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setPAng(value) {
  run.pAng = value;
  return value;
}

/**
 * Cambia `pLevel` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setPLevel(value) {
  run.pLevel = value;
  return value;
}

/**
 * Cambia `rings` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setRings(value) {
  run.rings = value;
  return value;
}

/**
 * Cambia `runRecord` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setRunRecord(value) {
  run.runRecord = value;
  return value;
}

/**
 * Cambia `score` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setScore(value) {
  run.score = value;
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

/**
 * Cambia `attempts` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
function setAttempts(value) {
  records.attempts = value;
  return value;
}

export {
  attX,
  attemptsOf,
  bestOf,
  camera,
  records,
  run,
  saveBest,
  setAttempts,
  setBestOf,
  state,
  updateRingHUD,
};
