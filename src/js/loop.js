/**
 * Bucle principal: cada cuadro avanza y dibuja la pantalla actual. Va al final porque usa
 * funciones de casi todos los archivos.
 */
import { ctx } from './core/display.js';
import { state } from './core/state.js';
import { outcome, setT, time } from './core/run-state.js';
import { elWallet } from './game/beat.js';

import { update } from './game/update.js';
import { render } from './render/frame.js';
import { renderIntro, updateIntro } from './screens/intro.js';
import { renderSplash, updateSplash } from './screens/splash.js';

import { logoSounds, renderHomeIntro, updateHomeShow } from './screens/home-animation.js';
import { renderPlanetsScene } from './screens/planets.js';
import { drawLevelsBG } from './screens/level-cards.js';
import { misOpen, misPlanetDraw } from './screens/missions.js';
import { MEDIR, medFrame, setMedMid } from './screens/perf-meter.js';
import { HOME_IN, homeT, paused, setHomeT } from './core/screen.js';
import { last, setLast } from './core/clock.js';
import { elHome } from './core/dom.js';
import { astPrebake } from './render/sprites.js';

/**
 * Un cuadro del juego. El paso de tiempo se limita a 0,05 segundos para que una pausa del
 * navegador no haga saltar la física. Un error en un cuadro se registra sin detener el bucle.
 *
 * @param {number} now Momento del cuadro, en milisegundos.
 */
function frame(now) {
  const m0 = MEDIR ? performance.now() : 0;
  const dt = Math.min((now - last) / 1000, 0.05);
  setLast(now);
  requestAnimationFrame(frame);
  {
    const pl = state === 'play' || state === 'dead';
    if (pl !== frame.pl) {
      frame.pl = pl;
      if (document.body && document.body.classList) {
        document.body.classList.toggle('playing', pl);
      }
    }
  }
  try {
    if (elWallet) {
      elWallet.style.opacity =
        state === 'splash' ||
        state === 'pretitle' ||
        state === 'intro' ||
        (state === 'home' && homeT < HOME_IN + 0.9) ||
        misOpen
          ? '0'
          : '1';
    }
    if (state === 'splash' || state === 'pretitle') {
      updateSplash(dt);
      renderSplash();
    } else if (state === 'intro') {
      updateIntro(dt);
      renderIntro();
    } else if (state === 'planets') {
      renderPlanetsScene(dt);
    } else if (state === 'levels') {
      setT(time.t + dt);
      drawLevelsBG();
    } else if (state === 'home' && homeT >= HOME_IN && homeT < HOME_IN + 2.5) {
      setHomeT(homeT + dt);
      logoSounds();
      if (
        homeT >= HOME_IN + 0.9 &&
        elHome &&
        elHome.classList.contains &&
        elHome.classList.contains('off')
      ) {
        elHome.classList.remove('off');
      }
      update(dt);
      render();
    } else if (state === 'home' && homeT < HOME_IN) {
      setHomeT(homeT + dt);
      update(dt);
      updateHomeShow(dt);
      renderHomeIntro();
    } else if (paused) {
      /* En pausa: el lienzo conserva el último cuadro. */
    } else {
      update(dt);
      if (MEDIR) {
        setMedMid(performance.now());
      }
      render();
    }
    if (misOpen) {
      misPlanetDraw();
    }
    // En pantallas tranquilas se preparan por adelantado las rocas de la partida (ver astPrebake).
    if (
      state === 'menu' ||
      state === 'levels' ||
      state === 'win' ||
      paused ||
      (state === 'dead' && outcome.deadT > 0.6) ||
      (state === 'home' && homeT >= HOME_IN + 2.5)
    ) {
      astPrebake();
    }
  } catch (e) {
    try {
      ctx.restore();
    } catch (_) {}
    console.error(e);
  }
  if (MEDIR) {
    medFrame(now, m0);
  }
}

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initMainLoop() {
  setLast(performance.now());
}

export { frame };
