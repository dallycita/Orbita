/**
 * Pantalla de inicio, como en Geometry Dash: se queda hasta que el jugador elige (jugar, planetas,
 * misiones, historia o ajustes).
 */
import { elHud, elPanel } from './01-pantalla-y-utilidades.js';
import { AC, initAudio, outBus } from './02-audio.js';
import { stopMusic } from './05-musica-reproductor.js';
import { setState } from './06-record-y-estado.js';
import { allPlanets, setAllPlanets } from './07-planetas.js';
import { setTutorial } from './08-partida-estado.js';
import { setup } from './16-partida.js';
import { introDrone, startIntro } from './23-intro.js';
import { openLevels, resetProgress, setTutAfterStory, storySeen } from './25-selector-niveles.js';
import {
  HOME_BIG,
  setHsBoost,
  setHsEvents,
  setHsFlare,
  setHsJet,
  setHsRipple,
  setHsShake,
} from './27-inicio-animacion.js';
import { showStart, showStop } from './28-sonidos-interfaz.js';
import { openPlanets } from './29-planetas-hd.js';
import { misMoons, misReady, openMissions } from './34-misiones.js';
import { MEDIR, medEl, setMEDIR, setMedEl, setMedPrev } from './35-medidor.js';
import { PLANET_SVG } from './data/planets.js';
import { loadMute, muted, setMuted } from './core/settings.js';
import { homeAmbience } from './audio/ui-sounds.js';
import { HOME_IN, homeT, setHomeT, setLogoT0, setPendingTut } from './core/screen.js';
import { elLv } from './core/dom.js';

let elHome;
/** Sonido apagado por el jugador (se guarda en localStorage). */
/** Aplica `muted` al volumen general de salida. */
function applyMute() {
  if (AC && outBus) {
    try {
      outBus.gain.setValueAtTime(muted ? 0 : 0.6, AC.currentTime);
    } catch (e) {}
  }
}
let storyReturn = null; // a dónde volver después de ver la historia desde un menú
/**
 * Si hay un planeta recién desbloqueado que el jugador aún no vio.
 *
 * @returns {boolean} Verdadero si hay que marcar el botón de planetas.
 */
function hasNewPlanet() {
  try {
    return localStorage.getItem('orbita_pl_nuevo') === '1';
  } catch (e) {
    return false;
  }
}
/** Arma los botones de la pantalla de inicio y su hoja de ajustes. */
function renderHome() {
  if (!elHome) {
    return;
  }
  elHome.innerHTML =
    '<div class="playrow"><button type="button" class="plan' +
    (hasNewPlanet() ? ' new' : '') +
    '" data-h="planets" aria-label="Elegir planeta"><span class="orb"></span><svg viewBox="0 0 100 100" aria-hidden="true">' +
    PLANET_SVG.saturno +
    '</svg><span class="plabel">PLANETAS</span></button>' +
    '<button type="button" class="bigplay" data-h="play" aria-label="Jugar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="#fff"/></svg></button><button type="button" class="plan mis' +
    (misReady() ? ' new' : '') +
    '" data-h="missions" aria-label="Misiones"><svg viewBox="0 0 100 100" aria-hidden="true">' +
    misMoons() +
    '</svg><span class="plabel">MISIONES</span></button></div>' +
    '<div class="playlbl">JUGAR</div>' +
    '<div class="row"><button type="button" class="sm" data-h="story">Historia</button><button type="button" class="sm" data-h="cfg">Ajustes</button></div>' +
    '<div class="sheet" role="dialog" aria-label="Ajustes"><h3>Ajustes</h3>' +
    '<button type="button" class="opt" data-h="snd"><span>Sonido</span><b>' +
    (muted ? 'Apagado' : 'Encendido') +
    '</b></button>' +
    '<button type="button" class="opt" data-h="allp"><span>Todos los planetas (pruebas)</span><b>' +
    (allPlanets ? 'Sí' : 'No') +
    '</b></button>' +
    '<button type="button" class="opt" data-h="medir"><span>Medidor de rendimiento (pruebas)</span><b>' +
    (MEDIR ? 'Sí' : 'No') +
    '</b></button>' +
    '<button type="button" class="opt danger" data-h="reset"><span>Borrar progreso</span><b>Empezar de cero</b></button>' +
    '<button type="button" class="opt" data-h="close" style="justify-content:center"><span>Cerrar</span></button></div>';
  if (!elHome.querySelectorAll) {
    return;
  }
  elHome
    .querySelectorAll('[data-h]')
    .forEach(b => b.addEventListener('click', () => homeAction(b.dataset.h, b)));
}
/**
 * Atiende un botón de la pantalla de inicio.
 *
 * @param {string} a Acción del botón (su `data-h`): play, story, cfg, planets, snd, reset...
 * @param {HTMLElement} b El botón tocado (para cambiar su texto).
 */
function homeAction(a, b) {
  initAudio();
  if (AC && AC.state === 'suspended') {
    AC.resume();
  }
  applyMute();
  const sheet = elHome.querySelector ? elHome.querySelector('.sheet') : null;
  if (a === 'play') {
    if (!storySeen) {
      hideHome();
      startIntro();
    } else {
      hideHome(true);
      openLevels();
    }
  } else if (a === 'story') {
    hideHome();
    storyReturn = 'home';
    startIntro();
  } else if (a === 'tut') {
    hideHome();
    setTutAfterStory(true);
    startIntro();
  } else if (a === 'cfg') {
    if (sheet) {
      sheet.classList.add('on');
    }
  } else if (a === 'planets') {
    openPlanets();
  } else if (a === 'missions') {
    openMissions();
  } else if (a === 'medir') {
    setMEDIR(!MEDIR);
    try {
      localStorage.setItem('orbita_medidor', MEDIR ? '1' : '0');
    } catch (e) {}
    if (!MEDIR && medEl) {
      medEl.remove();
      setMedEl(null);
    }
    setMedPrev(0);
    const v = b.querySelector('b');
    if (v) {
      v.textContent = MEDIR ? 'Sí' : 'No';
    }
  } else if (a === 'allp') {
    setAllPlanets(!allPlanets);
    try {
      localStorage.setItem('orbita_p1_todos', allPlanets ? '1' : '0');
    } catch (e) {}
    const v = b.querySelector('b');
    if (v) {
      v.textContent = allPlanets ? 'Sí' : 'No';
    }
  } else if (a === 'close') {
    if (sheet) {
      sheet.classList.remove('on');
    }
  } else if (a === 'snd') {
    setMuted(!muted);
    try {
      localStorage.setItem('orbita_p1_sonido', muted ? '0' : '1');
    } catch (e) {}
    applyMute();
    const v = b.querySelector('b');
    if (v) {
      v.textContent = muted ? 'Apagado' : 'Encendido';
    }
  } else if (a === 'reset') {
    const v = b.querySelector('b');
    // pide un segundo toque antes de borrar el progreso
    if (!b.dataset.sure) {
      b.dataset.sure = '1';
      if (v) {
        v.textContent = '¿Seguro? Toca otra vez';
        v.style.color = 'var(--sun)';
      }
      return;
    }
    hideHome();
    resetProgress();
  }
}
/**
 * Oculta la pantalla de inicio.
 *
 * @param {boolean} keepAmb Mantener el sonido ambiente del inicio (al ir al selector de niveles).
 */
function hideHome(keepAmb) {
  if (elHome) {
    elHome.classList.add('off');
  }
  if (!keepAmb) {
    homeAmbience(false);
  }
  showStop(0.3);
}
/**
 * Abre la pantalla de inicio y deja la partida preparada detrás.
 *
 * @param {boolean} withIntro Hacer la animación de entrada (logo grande que se acomoda).
 */
function openHome(withIntro) {
  if (elLv) {
    elLv.classList.add('off');
  }
  setTutorial(false);
  setPendingTut(false);
  introDrone(false);
  setup();
  setState('home');
  renderHome();
  setHomeT(withIntro ? 0 : HOME_IN);
  setLogoT0(withIntro ? HOME_BIG + 0.45 : -99);
  setHsEvents({});
  setHsFlare(setHsBoost(setHsShake(setHsJet(setHsRipple(0)))));
  if (withIntro) {
    showStart();
  }
  if (elHome) {
    if (homeT >= HOME_IN) {
      elHome.classList.remove('off');
    } else {
      elHome.classList.add('off');
    }
  }
  elPanel.classList.add('hide');
  elHud.style.opacity = 0;
  stopMusic();
  applyMute();
  homeAmbience(true);
}

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initHome() {
  elHome = document.getElementById('home');
  loadMute();
}

/**
 * Cambia `storyReturn` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setStoryReturn(value) {
  storyReturn = value;
  return value;
}

export { applyMute, elHome, openHome, renderHome, storyReturn };
