/**
 * Bucle principal: cada cuadro avanza y dibuja la pantalla actual. Va al final porque usa
 * funciones de casi todos los archivos.
 */
import { ctx } from './01-pantalla-y-utilidades.js';
import { state } from './06-record-y-estado.js';
import { deadT, setT, t } from './08-partida-estado.js';
import { elWallet } from './10-ritmo-y-objetos.js';

import { update } from './20-logica.js';
import { astPrebake, render } from './21-dibujo.js';
import { renderIntro, updateIntro } from './23-intro.js';
import { renderSplash, updateSplash } from './24-presentacion.js';

import { logoSounds, renderHomeIntro, updateHomeShow } from './27-inicio-animacion.js';
import { renderPlanetsScene } from './29-planetas-hd.js';
import { drawLevelsBG } from './33-tarjetas-niveles.js';
import { misOpen, misPlanetDraw } from './34-misiones.js';
import { MEDIR, medFrame, setMedMid } from './35-medidor.js';
import { HOME_IN, homeT, paused, setHomeT } from './core/screen.js';
import { last, setLast } from './core/clock.js';
import { elHome } from './core/dom.js';

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
      setT(t + dt);
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
      (state === 'dead' && deadT > 0.6) ||
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
