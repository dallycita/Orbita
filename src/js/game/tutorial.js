/**
 * El tutorial: empezarlo, reaparecer al chocar sin perder la partida y terminarlo.
 */
import { BONE, R0, buzz, elHud, elPanel, reduceMotion } from '../core/display.js';
import { noise } from '../audio/engine.js';
import { startMusic, stopMusic } from '../audio/music-player.js';
import {
  level,
  setCharge,
  setJumpTarget,
  setJumping,
  setNewRec,
  setPLevel,
  setRunRecord,
  setState,
  updateRingHUD,
} from '../core/state.js';
import { setShieldLeft, setUsedDouble } from './planets.js';
import {
  particles,
  setCanRestart,
  setCulprit,
  setCulpritT,
  setFlash,
  setGest,
  setLastEaten,
  setPending,
  setPerfCount,
  setPulse,
  setShake,
  setShowHint,
  setSunLevel,
  setSwallow,
  setTutorial,
  setTutorialDone,
  setWinT,
  sunLevel,
  texts,
} from '../core/run-state.js';
import { setup } from './run.js';

import { homeAmbience } from '../audio/ui-sounds.js';
import { elLv } from '../core/dom.js';
import { winSound } from '../audio/sfx.js';
import { on } from '../core/events.js';

/**
 * En el tutorial, un choque no termina la partida: el planeta estalla y reaparece en el mismo
 * anillo tras 0,7 segundos, con el agujero negro un poco más atrás.
 *
 * @param {number} x Posición horizontal del choque, en unidades del mundo.
 * @param {number} y Posición vertical del choque, en unidades del mundo.
 */
function tutRespawn(x, y) {
  setState('dead');
  setFlash(0.4);
  setShake(reduceMotion ? 0 : 6);
  buzz(30);
  noise(0.35, 3000, 200, 0.35, 'lowpass');
  for (let i = 0; i < 24; i++) {
    const a = Math.random() * Math.PI * 2,
      v = 40 + Math.random() * 120;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 0.6 + Math.random() * 0.4,
      col: ['#2b63c9', '#4fa35a', '#ffffff', '#8fd0ff'][i % 4],
      s: 2 + Math.random() * 2,
    });
  }
  texts.push({ txt: 'Otra vez', x: 0, y: -R0 - 70, life: 1.2, size: 18, col: BONE, center: true });
  setTimeout(() => {
    setState('play');
    setJumping(false);
    setJumpTarget(1);
    setPLevel(level);
    setPending(false);
    setGest(null);
    // aleja el agujero negro para que no vuelva a atrapar al jugador enseguida
    setSunLevel(Math.min(sunLevel, level - 1.6));
    setLastEaten(Math.floor(sunLevel));
    setSwallow(null);
    setCulprit(null);
    setCulpritT(0);
    if (level >= 8) {
      setCharge(3);
    }
  }, 700);
}
/** Termina el tutorial: lo marca como hecho y ofrece jugar el Sistema solar o ver los niveles. */
function tutorialWin() {
  setState('win');
  setWinT(0);
  setCanRestart(false);
  setFlash(0.5);
  setPulse(1);
  setTutorialDone(true);
  try {
    localStorage.setItem('orbita_p1_tutorial', '1');
  } catch (e) {}
  stopMusic();
  winSound();
  buzz([30, 50, 90]);
  elHud.style.opacity = 0;
  setTimeout(() => {
    elPanel.classList.remove('top');
    elPanel.innerHTML =
      '<div class="title" style="font-size:clamp(28px,8vw,50px);line-height:1.1">Ganaste tiempo…</div>' +
      '<div class="sub" style="margin-top:12px;font-size:17px;color:var(--fg)">…pero sigue tras de ti.</div>' +
      '<div class="msg" style="margin-top:22px;color:var(--muted);font-weight:400;font-size:13px;letter-spacing:.08em">TUTORIAL COMPLETADO</div>' +
      '<div class="sub" style="margin-top:10px">¿A dónde quieres escapar?</div>' +
      '<button type="button" class="chip act" data-act="lvl1" style="margin-top:22px;background:var(--sun);border-color:var(--sun);color:#fff;padding:12px 22px">Jugar el Sistema solar</button>' +
      '<button type="button" class="chip act" data-act="levels" style="margin-top:12px">Ver todos los niveles</button>';
    elPanel.classList.remove('hide');
    setTimeout(() => {
      setCanRestart(true);
    }, 600);
  }, 2200);
}
/** Empieza el tutorial con la partida limpia y la música. */
function startTutorial() {
  homeAmbience(false);
  if (elLv) {
    elLv.classList.add('off');
  }
  setTutorial(true);
  setup();
  setState('play');
  setWinT(0);
  setPerfCount(0);
  setRunRecord(0);
  setNewRec(false);
  updateRingHUD();
  elHud.style.opacity = 1;
  elPanel.classList.add('hide');
  setCharge(0);
  setJumpTarget(1);
  setPending(false);
  setGest(null);
  setShowHint(false);
  setShieldLeft(1);
  setUsedDouble(false);
  startMusic();
}

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initTutorial() {
  // la partida avisa cuando, en el tutorial, se gana o se choca
  on('tutorialWin', tutorialWin);
  on('tutorialRespawn', tutRespawn);
}

export { startTutorial };
