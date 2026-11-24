/**
 * Controles: toques, gestos y teclado. Un toque hace algo distinto según la pantalla (`state`);
 * en partida salta, y deslizar hacia arriba justo después convierte el salto en salto doble.
 */
import {
  BONE,
  R0,
  elPanel,
  hudMode,
  musicStyle,
  refreshChips,
  setHudMode,
  setMusicStyle,
} from './01-pantalla-y-utilidades.js';
import { AC, initAudio } from './02-audio.js';
import { startMusic, stopMusic } from './05-musica-reproductor.js';
import { charge, jumping, lvl, setState, state } from './06-record-y-estado.js';
import { chargeMax } from './07-planetas.js';
import {
  canRestart,
  gest,
  pending,
  setGest,
  setPending,
  setPendingT,
  texts,
  tutorial,
} from './08-partida-estado.js';
import { pushing } from './10-ritmo-y-objetos.js';
import { wh, whTap } from './13-agujero-de-gusano.js';
import {
  doubleJump,
  jump,
  sesTries,
  setSesTries,
  showTry,
  start,
  upgradeToDouble,
} from './16-partida.js';
import { startTutorial } from './17-tutorial.js';
import { pauseGame, pausePress, paused, pzCount, resumeGame } from './18-pausa.js';
import { endIntro } from './23-intro.js';
import { skipSplash, splashT } from './24-presentacion.js';
import {
  LEVELS,
  elLv,
  openLevels,
  pendingTut,
  setLvIndex,
  setPendingTut,
  startLevel,
} from './25-selector-niveles.js';
import { elHome, openHome } from './26-pantalla-inicio.js';
import { HOME_IN, homeT, setHomeT, setLogoT0 } from './27-inicio-animacion.js';
import { showStop } from './28-sonidos-interfaz.js';
import { planetStep, uiGlass } from './29-planetas-hd.js';

/**
 * Atiende un toque o la tecla de acción según la pantalla actual: pausa, botones de los paneles,
 * opciones de música y modo, saltar pantallas, empezar la partida o saltar.
 *
 * @param {PointerEvent} [e] Evento del toque; sin evento, viene del teclado.
 */
function press(e) {
  if (paused) {
    pausePress(e);
    return;
  }
  if (e && e.target && e.target.closest && e.target.closest('#quit')) {
    if (e.cancelable) {
      e.preventDefault();
    }
    if (state === 'play') {
      pauseGame();
    } else if (state === 'dead') {
      setState('menu');
      stopMusic(true);
      openLevels();
    }
    return;
  }
  if (state === 'home' && homeT < HOME_IN) {
    setHomeT(HOME_IN + 0.6);
    setLogoT0(homeT - 3);
    showStop(0.3);
    if (elHome) {
      elHome.classList.remove('off');
    }
    return;
  }
  if (state === 'levels' || state === 'home' || state === 'planets' || state === 'missions') {
    return;
  }
  const act = e && e.target && e.target.closest ? e.target.closest('[data-act]') : null;
  if (act && (state === 'dead' || state === 'win')) {
    if (e.cancelable) {
      e.preventDefault();
    }
    if (elPanel.classList) {
      elPanel.classList.remove('wscr');
    }
    const A = act.dataset.act;
    if (A === 'levels') {
      openLevels();
    } else if (A === 'lvl1') {
      startLevel(0);
    } else if (A === 'next' && LEVELS[lvl + 1]) {
      setLvIndex(lvl + 1);
      startLevel(lvl + 1);
    } else if (A === 'again' && canRestart) {
      start();
      setSesTries(sesTries + 1);
      showTry(0);
    }
    return;
  }
  const chip = e && e.target && e.target.closest ? e.target.closest('.chip') : null;
  if (chip && state !== 'play') {
    if (e.cancelable) {
      e.preventDefault();
    }
    initAudio();
    if (AC && AC.state === 'suspended') {
      AC.resume();
    }
    if (chip.dataset.music) {
      setMusicStyle(chip.dataset.music);
      refreshChips();
      try {
        localStorage.setItem('orbita_p1_musica', musicStyle);
      } catch (_) {}
      startMusic(); // Vista previa: se escucha completa mientras se elige.
    } else {
      setHudMode(chip.dataset.mode);
      refreshChips();
      try {
        localStorage.setItem('orbita_p1_modo', hudMode);
      } catch (_) {}
    }
    return;
  }
  if (e && e.cancelable) {
    e.preventDefault();
  }
  initAudio();
  if (AC && AC.state === 'suspended') {
    AC.resume();
  }
  if (state === 'pretitle') {
    openHome(true);
    return;
  }
  if (state === 'splash') {
    if (splashT > 0.8) {
      skipSplash();
    }
    return;
  }
  if (state === 'intro') {
    endIntro(true);
    return;
  }
  if (state === 'menu') {
    if (pendingTut) {
      setPendingTut(false);
      startTutorial();
    } else {
      start();
      showTry(0);
    }
    return;
  }
  if (state === 'win' && tutorial) {
    return;
  }
  if (state === 'win') {
    return;
  }
  if (state === 'dead') {
    if (canRestart) {
      start();
    }
    return;
  }
  if (state === 'play' && wh) {
    whTap();
    return;
  }
  if (state === 'play' && !jumping && !pushing) {
    jump();
    if (e && e.pointerId !== undefined) {
      setGest({ id: e.pointerId, y: e.clientY });
      if (charge >= chargeMax()) {
        setPending(true);
        setPendingT(0);
      } // Espera un instante por si es un deslizamiento hacia arriba (salto doble).
    }
  }
}
const endGest = e => {
  if (gest && e.pointerId === gest.id) {
    setGest(null);
    setPending(false);
  }
};
/**
 * Tecla del poder (D o Mayúsculas): funciona antes de saltar y también en pleno salto; si no
 * está cargado, avisa cuántos Perfectos faltan.
 */
function powerKey() {
  if (state !== 'play' || wh) {
    return;
  }
  if (charge < chargeMax()) {
    const f = chargeMax() - charge;
    if (!texts.some(x => x.key === 'faltan')) {
      texts.push({
        txt: 'Te ' + (f === 1 ? 'falta 1 Perfecto' : 'faltan ' + f + ' Perfectos'),
        x: 0,
        y: -R0 - 30,
        life: 1,
        size: 13,
        col: BONE,
        center: true,
        key: 'faltan',
      });
    }
    return;
  }
  if (jumping) {
    upgradeToDouble();
  } else {
    doubleJump();
  }
}

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initControls() {
  // Deslizar más de 22 píxeles hacia arriba durante el toque mejora el salto a salto doble.
  window.addEventListener('pointermove', e => {
    if (!gest || e.pointerId !== gest.id) {
      return;
    }
    if (gest.y - e.clientY > 22) {
      setGest(null);
      if (pending) {
        upgradeToDouble();
      }
      setPending(false);
    }
  });
  window.addEventListener('pointerup', endGest);
  window.addEventListener('pointercancel', endGest);
  window.addEventListener('pointerdown', press, { passive: false });
  // Teclado: Escape o P pausan; Espacio, Enter y flecha arriba actúan como un toque; las flechas
  // laterales recorren planetas y niveles.
  window.addEventListener('keydown', e => {
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (paused) {
        if (!pzCount) {
          resumeGame();
        }
      } else if (state === 'play') {
        pauseGame();
      }
      return;
    }
    if (paused) {
      if ((e.code === 'Space' || e.code === 'Enter') && !pzCount) {
        e.preventDefault();
        resumeGame();
      }
      return;
    }
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
      e.preventDefault();
      if (!e.repeat) {
        press();
      }
    } else if (state === 'planets' && (e.code === 'ArrowRight' || e.code === 'ArrowLeft')) {
      uiGlass(e.code === 'ArrowRight' ? 1 : -1);
      planetStep(e.code === 'ArrowRight' ? 1 : -1);
    } else if (state === 'levels' && (e.code === 'ArrowRight' || e.code === 'ArrowLeft')) {
      const b =
        elLv &&
        elLv.querySelector &&
        elLv.querySelector(e.code === 'ArrowRight' ? '.arrow.r' : '.arrow.l');
      if (b && b.click) {
        b.click();
      }
    } else if (
      (e.code === 'KeyD' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') &&
      !e.repeat
    ) {
      e.preventDefault();
      powerKey();
    }
  });
}
