/**
 * Récords guardados (mejor anillo e intentos de cada nivel) y el estado principal de la partida:
 * pantalla actual (`state`), anillos, nivel de anillo del planeta y de la cámara, salto y carga.
 * Los récords viven en localStorage con claves `orbita_pN_anillo` y `orbita_pN_intentos`.
 */
let best = 0;
try {
  best = parseInt(localStorage.getItem('orbita_best_v2') || '0', 10) || 0;
} catch (e) {
  best = 0;
}
const saveBest = () => {
  try {
    localStorage.setItem('orbita_best_v2', String(best));
  } catch (e) {}
};
let bestRing = 0;
try {
  bestRing = parseInt(localStorage.getItem('orbita_p1_anillo') || '0', 10) || 0;
} catch (e) {
  bestRing = 0;
}
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
try {
  best3 = parseInt(localStorage.getItem('orbita_p3_anillo') || '0', 10) || 0;
  attempts3 = parseInt(localStorage.getItem('orbita_p3_intentos') || '0', 10) || 0;
} catch (e) {}
try {
  best2 = parseInt(localStorage.getItem('orbita_p2_anillo') || '0', 10) || 0;
  attempts2 = parseInt(localStorage.getItem('orbita_p2_intentos') || '0', 10) || 0;
} catch (e) {}
const bestX = {},
  attX = {};
for (let i = 3; i < 8; i++) {
  try {
    bestX[i] = parseInt(localStorage.getItem('orbita_p' + (i + 1) + '_anillo') || '0', 10) || 0;
    attX[i] = parseInt(localStorage.getItem('orbita_p' + (i + 1) + '_intentos') || '0', 10) || 0;
  } catch (e) {
    bestX[i] = 0;
    attX[i] = 0;
  }
}
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
