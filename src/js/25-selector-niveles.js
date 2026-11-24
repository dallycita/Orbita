/**
 * Selector de niveles: la lista de galaxias (LEVELS), sus tarjetas con dificultad, estrellas y
 * dato real, y las funciones para abrir el selector y empezar un nivel.
 * Todos los niveles están abiertos desde el inicio, como en Geometry Dash.
 */
import { elHud, elPanel } from './01-pantalla-y-utilidades.js';
import { AC, initAudio } from './02-audio.js';
import { stopMusic } from './05-musica-reproductor.js';
import {
  GOAL,
  bestOf,
  setAppear,
  setBest,
  setBestRing,
  setLvl,
  setState,
} from './06-record-y-estado.js';
import { setAllPlanets, setCurPlanet, setMaxPerf, setPlutoOk } from './07-planetas.js';
import { setAttempts, setHintsShown, setTutorial, setTutorialDone } from './08-partida-estado.js';
import { setSeenTypes } from './09-recorridos.js';
import { setWallet, updateWallet } from './10-ritmo-y-objetos.js';
import { setSesTries, setup } from './16-partida.js';
import { MENU_HTML, introDrone, startIntro } from './23-intro.js';
import { applyMute, openHome, setStoryReturn } from './26-pantalla-inicio.js';

import { showStop } from './28-sonidos-interfaz.js';
import { setLvArts, setLvCanvas } from './33-tarjetas-niveles.js';
import { COIN_RINGS, LEVELS } from './data/levels.js';
import { homeAmbience } from './audio/ui-sounds.js';
import { lvStarsGot } from './game/progress.js';
import { setIntroFade, setPendingTut } from './core/screen.js';
import { elLv, setElLv } from './core/dom.js';

/** Si el jugador ya vio la historia de introducción (se guarda en localStorage). */
let storySeen = false;
/** Índice del nivel elegido en el selector. */
let lvIndex = 0;
let LV_ICONS;
const LV_DATO = [
  'El Sol contiene el 99,8 % de toda la masa del sistema solar.',
  'La Gran Nube de Magallanes tiene unos 30 000 millones de estrellas.',
  'Tiene alrededor de un billón de estrellas: más del doble que la Vía Láctea.',
  'Es una de las fuentes de ondas de radio más brillantes de todo el cielo.',
  'Fue la primera galaxia en la que se vio una forma espiral, en 1845.',
  'Su núcleo esconde un agujero negro de unos mil millones de soles.',
  'Su agujero negro tiene unos 6500 millones de veces la masa del Sol.',
  'Su primera fotografía se publicó en 2022, gracias al Event Horizon Telescope.',
];
// dificultad como gravedad: un mini agujero negro con 4 anillos; los encendidos dicen qué tan
// fuerte jala
const GRAV_TIER = { Fácil: 1, Medio: 2, Difícil: 3, 'Muy difícil': 4 };
/**
 * Icono SVG de dificultad.
 *
 * @param {number} n Anillos encendidos, de 1 a 4.
 * @returns {string} El SVG en texto.
 */
const GRAV_SVG = n =>
  '<svg viewBox="0 0 30 30" aria-hidden="true">' +
  [6, 8.6, 11.2, 13.8]
    .map(
      (r, i) =>
        '<circle cx="15" cy="15" r="' +
        r +
        '" fill="none" stroke="currentColor" stroke-width="' +
        (i < n ? 1.5 : 1.1) +
        '" stroke-opacity="' +
        (i < n ? 0.95 : 0.18) +
        '"/>',
    )
    .join('') +
  '<circle cx="15" cy="15" r="3.4" fill="#000" stroke="#ffa155" stroke-width="1.3"/></svg>';
/** Arma el HTML del selector de niveles y su navegación. */
function renderLevels() {
  sigShown = -1;
  if (!elLv) {
    return;
  }
  const pages = LEVELS.map((L, i) => {
    const v = Math.min(bestOf(i), GOAL),
      pct = Math.round((v / GOAL) * 100),
      done = v >= GOAL,
      got = lvStarsGot(i).length,
      all6 = got >= 6;
    const can = L.ready && (i === 0 || levelsUnlocked());
    // estrellas: pastilla junto a la dificultad (solo cuenta las de los anillos reales del nivel)
    const gotR = lvStarsGot(i),
      cr = COIN_RINGS[i] ? [...COIN_RINGS[i]] : [],
      nGot = cr.filter(k => gotR.includes(k)).length;
    return (
      '<section class="page' +
      (done ? ' done' : '') +
      (all6 ? ' perfect' : '') +
      '" style="--lc:' +
      L.col +
      ';--p:' +
      pct +
      '%" aria-label="Nivel ' +
      (i + 1) +
      ': ' +
      L.name +
      '">' +
      '<div class="num">NIVEL ' +
      (i + 1) +
      ' DE ' +
      LEVELS.length +
      '</div>' +
      '<div class="art"><svg viewBox="0 0 200 200" aria-hidden="true">' +
      LV_ICONS[L.icon] +
      '</svg></div>' +
      '<div class="name">' +
      L.name +
      '</div>' +
      '<div class="tags"><span class="grav" aria-label="Dificultad: ' +
      L.diff +
      '">' +
      GRAV_SVG(GRAV_TIER[L.diff] || 1) +
      '<span>' +
      L.diff +
      '</span></span>' +
      (cr.length
        ? '<i class="tsep"></i><div class="stb' +
          (nGot ? ' on' : '') +
          '" aria-label="Estrellas: ' +
          nGot +
          ' de ' +
          cr.length +
          '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>' +
          nGot +
          ' / ' +
          cr.length +
          '</div>'
        : '') +
      '</div>' +
      '<div class="dist">' +
      L.dist +
      '</div>' +
      // el progreso como un viaje: del agujero negro (izquierda) a la salida (derecha), con tu
      // planeta en el punto al que llegaste
      '<div class="trip" aria-label="' +
      (done ? 'Completado' : pct + ' % recorrido') +
      '"><span class="bh"></span><span class="line"><i></i><b class="me"></b></span><span class="exit"></span></div>' +
      (done ? '<div class="tripinfo"><span><em>Escapaste</em></span></div>' : '') +
      '<div class="sig" data-txt="' +
      sigTxt(i).replace(/"/g, '&quot;') +
      '"><div class="sighead"><i class="bars"><b></b><b></b><b></b></i><span>Señal recibida</span></div><p class="sigtxt"><span class="on"></span><b class="caret"></b><span class="off">' +
      sigTxt(i) +
      '</span></p></div>' +
      '<button type="button" class="play" data-play="' +
      i +
      '"' +
      (can ? '' : ' disabled') +
      '><span class="ring"></span><span class="core"></span><span class="pin">' +
      (can ? 'Escapar' : 'Próximamente') +
      '</span></button></section>'
    );
  }).join('');
  elLv.innerHTML =
    '<canvas class="lvbg" aria-hidden="true"></canvas><div class="lvshade"></div><button type="button" class="back" aria-label="Volver al inicio">' +
    ARC_L +
    CHEV_L +
    '</button><div class="top">Elige tu escape</div><div class="track">' +
    pages +
    '</div>' +
    '<button type="button" class="arrow l" aria-label="Nivel anterior">' +
    ARC_L +
    CHEV_L +
    '</button><button type="button" class="arrow r" aria-label="Nivel siguiente">' +
    ARC_R +
    CHEV_R +
    '</button>' +
    '<div class="foot"><div class="dots">' +
    LEVELS.map(() => '<i></i>').join('') +
    '</div></div>';
  setLvCanvas(elLv.querySelector ? elLv.querySelector('.lvbg') : null);
  setLvArts(elLv.querySelectorAll ? [...elLv.querySelectorAll('.art')] : []);
  const track = elLv.querySelector ? elLv.querySelector('.track') : null;
  if (!track || !track.addEventListener) {
    return;
  }
  const al = elLv.querySelector('.arrow.l'),
    ar = elLv.querySelector('.arrow.r'),
    dots = elLv.querySelectorAll('.dots i');
  const sync = () => {
    lvIndex = Math.max(
      0,
      Math.min(LEVELS.length - 1, Math.round(track.scrollLeft / Math.max(1, track.clientWidth))),
    );
    dots.forEach((d, i) => d.classList.toggle('on', i === lvIndex));
    if (al) {
      al.disabled = lvIndex === 0;
    }
    if (ar) {
      ar.disabled = lvIndex === LEVELS.length - 1;
    }
    if (lvIndex !== sigShown) {
      sigType(lvIndex);
    }
  };
  const go = i => {
    lvIndex = Math.max(0, Math.min(LEVELS.length - 1, i));
    track.scrollTo({ left: lvIndex * track.clientWidth, behavior: 'smooth' });
  };
  track.addEventListener('scroll', sync, { passive: true });
  if (al) {
    al.addEventListener('click', () => go(lvIndex - 1));
  }
  if (ar) {
    ar.addEventListener('click', () => go(lvIndex + 1));
  }
  elLv
    .querySelectorAll('.play')
    .forEach(b => b.addEventListener('click', () => startLevel(Number(b.dataset.play))));
  const bk = elLv.querySelector('.back');
  if (bk) {
    bk.addEventListener('click', () => openHome());
  }
  requestAnimationFrame(() => {
    track.style.scrollBehavior = 'auto';
    track.scrollLeft = lvIndex * track.clientWidth;
    track.style.scrollBehavior = '';
    sync();
  });
}

// dato real como transmisión: se escribe letra por letra al llegar a cada galaxia
let sigShown = -1;
let sigTimer = null;
// espacio irrompible entre cifras (30 000, 99,8 %) para que no se partan en dos líneas
const sigTxt = i => LV_DATO[i].replace(/(\d) (?=[\d%])/g, '$1\u00a0');
/**
 * Escribe letra por letra el dato real de un nivel en su tarjeta.
 *
 * @param {number} i Índice del nivel en LEVELS.
 */
function sigType(i) {
  if (!elLv || !elLv.querySelectorAll) {
    return;
  }
  const sigs = elLv.querySelectorAll('.sig');
  if (!sigs.length) {
    return;
  }
  sigShown = i;
  if (sigTimer) {
    clearTimeout(sigTimer);
  }
  sigs.forEach((g, k) => {
    if (k !== i) {
      g.classList.remove('rx', 'done');
      const on = g.querySelector('.on'),
        off = g.querySelector('.off');
      on.textContent = '';
      off.textContent = g.dataset.txt;
    }
  });
  const g = sigs[i];
  if (!g) {
    return;
  }
  const txt = g.dataset.txt,
    on = g.querySelector('.on'),
    off = g.querySelector('.off');
  g.classList.remove('done');
  g.classList.remove('rx');
  void g.offsetWidth;
  g.classList.add('rx');
  let n = 0;
  on.textContent = '';
  off.textContent = txt;
  const step = () => {
    if (sigShown !== i) {
      return;
    }
    n++;
    on.textContent = txt.slice(0, n);
    off.textContent = txt.slice(n);
    if (n >= txt.length) {
      g.classList.add('done');
      return;
    }
    const c = txt[n - 1];
    sigTimer = setTimeout(step, c === ',' || c === '.' ? 160 : 22 + Math.random() * 26);
  };
  sigTimer = setTimeout(step, 420);
}

const levelsUnlocked = () => true; // todos los niveles están abiertos desde el inicio
// tutAfterStory: al terminar la historia sigue el tutorial ("Repetir tutorial").
// pendingTut: al tocar en el menú empieza el tutorial en vez de la partida.
let tutAfterStory = false;
/** Al terminar la pantalla de presentación, abre el inicio. */
function afterSplash() {
  openHome(true);
}
/** Empieza como jugador nuevo: olvida historia, tutorial, intentos y récords. */
function resetProgress() {
  try {
    [
      'orbita_p1_historia',
      'orbita_p1_tutorial',
      'orbita_p1_intentos',
      'orbita_p1_anillo',
      'orbita_best_v2',
      'orbita_p1_vistos',
      'orbita_p1_pista',
      'orbita_p1_planeta',
      'orbita_p1_maxperf',
      'orbita_p1_pluton',
      'orbita_p1_todos',
      'orbita_estrellas',
      'orbita_lvstars',
      'orbita_p1_poderlisto',
      'orbita_p2_anillo',
      'orbita_p2_intentos',
      'orbita_p3_anillo',
      'orbita_p3_intentos',
      'orbita_p4_anillo',
      'orbita_p4_intentos',
      'orbita_p5_anillo',
      'orbita_p5_intentos',
      'orbita_p6_anillo',
      'orbita_p6_intentos',
      'orbita_p7_anillo',
      'orbita_p7_intentos',
      'orbita_p8_anillo',
      'orbita_p8_intentos',
    ].forEach(k => localStorage.removeItem(k));
  } catch (e) {}
  storySeen = false;
  setTutorialDone(true);
  setAttempts(0);
  setBestRing(0);
  setBest(0);
  setSeenTypes({});
  setHintsShown(0);
  lvIndex = 0;
  setCurPlanet('tierra');
  setMaxPerf(0);
  setPlutoOk(false);
  setAllPlanets(false);
  setWallet(0);
  updateWallet(false);
  initAudio();
  if (AC && AC.state === 'suspended') {
    AC.resume();
  }
  if (elLv) {
    elLv.classList.add('off');
  }
  setStoryReturn(null);
  tutAfterStory = false;
  startIntro();
}
/** Abre el selector de niveles: para la música de partida y suena el ambiente del inicio. */
function openLevels() {
  setTutorial(false);
  stopMusic();
  introDrone(false);
  homeAmbience(true);
  applyMute();
  setup();
  setState('levels');
  renderLevels();
  if (elLv) {
    elLv.classList.remove('off');
  }
  elPanel.classList.add('hide');
  elHud.style.opacity = 0;
}
/**
 * Empieza un nivel: cierra el selector, prepara la partida y muestra el menú de inicio del nivel.
 *
 * @param {number} i Índice del nivel en LEVELS.
 */
function startLevel(i) {
  setSesTries(1);
  if (!LEVELS[i] || !LEVELS[i].ready) {
    return;
  }
  homeAmbience(false);
  try {
    showStop(0.3);
  } catch (e) {}
  initAudio();
  if (AC && AC.state === 'suspended') {
    AC.resume();
  }
  if (elLv) {
    elLv.classList.add('off');
  }
  setLvl(i);
  setTutorial(false);
  setPendingTut(false);
  setup();
  setState('menu');
  setAppear(0);
  setIntroFade(0.5);
  elPanel.innerHTML = MENU_HTML();
  elPanel.classList.add('top');
  elPanel.classList.remove('hide');
}

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initLevelSelect() {
  try {
    storySeen = localStorage.getItem('orbita_p1_historia') === '1';
  } catch (e) {}
  setElLv(document.getElementById('levels'));
  LV_ICONS = {
    centaurus:
      '<defs><radialGradient id="g-cen"><stop offset="0" stop-color="#fff2d6"/><stop offset=".5" stop-color="#e8c79a" stop-opacity=".5"/><stop offset="1" stop-color="#d9a76a" stop-opacity="0"/></radialGradient></defs>' +
      '<path d="M100 100 L60 20 L68 18 Z M100 100 L140 180 L132 182 Z" fill="#9fc6ff" opacity=".45"/><circle cx="100" cy="100" r="62" fill="url(#g-cen)"/>' +
      '<path d="M38 112 Q100 70 162 88" fill="none" stroke="#2a1a10" stroke-width="16" stroke-linecap="round" opacity=".85"/><path d="M42 110 Q100 74 158 90" fill="none" stroke="#ff8fbf" stroke-width="2" opacity=".5"/>',
    sombrero:
      '<defs><radialGradient id="g-som"><stop offset="0" stop-color="#fff6e0"/><stop offset=".45" stop-color="#f0d9b0" stop-opacity=".6"/><stop offset="1" stop-color="#d9b98a" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="100" cy="100" rx="70" ry="40" fill="url(#g-som)"/><ellipse cx="100" cy="102" rx="88" ry="16" fill="#c9b08a" opacity=".55"/><ellipse cx="100" cy="106" rx="84" ry="7" fill="#24160d" opacity=".9"/>',
    m87:
      '<defs><radialGradient id="g-m87"><stop offset="0" stop-color="#fff4dc"/><stop offset=".4" stop-color="#ffd9a0" stop-opacity=".55"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></radialGradient></defs>' +
      '<circle cx="100" cy="100" r="74" fill="url(#g-m87)"/><path d="M100 100 L176 54 L178 60 Z" fill="#9fc6ff" opacity=".8"/><circle cx="100" cy="100" r="6" fill="#000" stroke="#ff5a1f" stroke-width="2"/>',
    solar:
      '<defs><radialGradient id="g-sun"><stop offset="0" stop-color="#fff3cf"/><stop offset=".45" stop-color="#ffd36b"/><stop offset="1" stop-color="#ff9a3d" stop-opacity="0"/></radialGradient></defs>' +
      '<circle cx="100" cy="100" r="34" fill="url(#g-sun)"/>' +
      [28, 42, 58, 76, 94]
        .map(
          r =>
            '<circle cx="100" cy="100" r="' +
            r +
            '" fill="none" stroke="#ece6d8" stroke-opacity=".16"/>',
        )
        .join('') +
      '<circle cx="100" cy="100" r="14" fill="#ffd36b"/><circle cx="126" cy="88" r="3" fill="#a9a6a0"/><circle cx="66" cy="118" r="4.5" fill="#e3c27a"/>' +
      '<circle cx="146" cy="128" r="5.5" fill="#3d8bff"/><path d="M143 126 Q146 123 149 126 Q147 130 143 129 Z" fill="#5ccf6b"/><circle cx="48" cy="72" r="4" fill="#c1543a"/>' +
      '<ellipse cx="170" cy="62" rx="15" ry="4.5" transform="rotate(-18 170 62)" fill="none" stroke="#e6cf8f" stroke-width="2"/><circle cx="170" cy="62" r="7.5" fill="#e6cf8f"/>',
    andromeda:
      '<defs><radialGradient id="g-and"><stop offset="0" stop-color="#fff4d6"/><stop offset=".25" stop-color="#e8dcff" stop-opacity=".8"/><stop offset="1" stop-color="#8fa8ff" stop-opacity="0"/></radialGradient></defs>' +
      '<g transform="rotate(-28 100 100)"><ellipse cx="100" cy="100" rx="88" ry="30" fill="url(#g-and)" opacity=".55"/>' +
      [84, 66, 48, 30]
        .map(
          (r, i) =>
            '<ellipse cx="100" cy="100" rx="' +
            r +
            '" ry="' +
            r * 0.34 +
            '" fill="none" stroke="#c9d6ff" stroke-opacity="' +
            (0.35 + i * 0.12) +
            '" stroke-width="' +
            (1.5 + i * 0.4) +
            '"/>',
        )
        .join('') +
      '<ellipse cx="100" cy="100" rx="16" ry="7" fill="#fff4d6"/></g>' +
      [
        [40, 52],
        [160, 150],
        [30, 140],
        [170, 40],
        [120, 30],
        [70, 170],
      ]
        .map(
          ([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="1.4" fill="#ece6d8" opacity=".6"/>',
        )
        .join(''),
    magallanes:
      '<defs><radialGradient id="g-mag"><stop offset="0" stop-color="#e8f0ff" stop-opacity=".75"/><stop offset="1" stop-color="#8fa8ff" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="82" cy="86" rx="62" ry="38" transform="rotate(-18 82 86)" fill="url(#g-mag)"/><ellipse cx="140" cy="140" rx="34" ry="22" transform="rotate(12 140 140)" fill="url(#g-mag)" opacity=".8"/>' +
      [
        [70, 80],
        [92, 92],
        [60, 98],
        [100, 72],
        [84, 104],
        [132, 138],
        [146, 144],
        [140, 130],
        [52, 74],
        [112, 88],
      ]
        .map(
          ([x, y], i) =>
            '<circle cx="' +
            x +
            '" cy="' +
            y +
            '" r="' +
            (1.2 + (i % 3) * 0.6) +
            '" fill="#fff4d6" opacity=".85"/>',
        )
        .join(''),
    remolino:
      '<defs><radialGradient id="g-rem"><stop offset="0" stop-color="#fff4d6"/><stop offset=".3" stop-color="#d9c8ff" stop-opacity=".6"/><stop offset="1" stop-color="#8fa8ff" stop-opacity="0"/></radialGradient></defs>' +
      '<circle cx="96" cy="104" r="70" fill="url(#g-rem)" opacity=".45"/>' +
      '<path d="M96 104 C96 82 126 80 128 104 C131 136 82 146 66 116 C50 84 84 50 124 56 C150 60 168 84 164 110" fill="none" stroke="#c9d6ff" stroke-width="4" stroke-linecap="round" stroke-opacity=".85"/>' +
      '<path d="M96 104 C96 126 66 128 64 104 C61 72 110 62 126 92 C142 124 108 158 68 152 C42 148 28 124 32 98" fill="none" stroke="#c9d6ff" stroke-width="3" stroke-linecap="round" stroke-opacity=".55"/>' +
      '<circle cx="96" cy="104" r="8" fill="#fff4d6"/><circle cx="168" cy="44" r="12" fill="url(#g-rem)"/><circle cx="168" cy="44" r="4" fill="#fff4d6"/>',
    sgr:
      '<defs><radialGradient id="g-sgr"><stop offset=".45" stop-color="#ff5a1f" stop-opacity=".5"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/></radialGradient></defs>' +
      '<circle cx="100" cy="100" r="92" fill="url(#g-sgr)"/><circle cx="100" cy="100" r="56" fill="none" stroke="#ffd36b" stroke-width="3" stroke-opacity=".5"/>' +
      '<circle cx="100" cy="100" r="47" fill="none" stroke="#ff5a1f" stroke-width="12"/><circle cx="100" cy="100" r="40" fill="#000"/>' +
      '<path d="M60 112 A42 42 0 0 0 140 112" fill="none" stroke="#fff3cf" stroke-width="3" stroke-opacity=".8"/>',
  };
}

/**
 * Cambia `lvIndex` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setLvIndex(value) {
  lvIndex = value;
  return value;
}

/**
 * Cambia `storySeen` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setStorySeen(value) {
  storySeen = value;
  return value;
}

/**
 * Cambia `tutAfterStory` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setTutAfterStory(value) {
  tutAfterStory = value;
  return value;
}

export { afterSplash, lvIndex, openLevels, resetProgress, startLevel, storySeen, tutAfterStory };
