/**
 * Controles: toques, gestos y teclado. Un toque hace algo distinto según la pantalla (`state`);
 * en partida salta, y deslizar hacia arriba justo después convierte el salto en salto doble.
 */
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
      state = 'menu';
      stopMusic(true);
      openLevels();
    }
    return;
  }
  if (state === 'home' && homeT < HOME_IN) {
    homeT = HOME_IN + 0.6;
    logoT0 = homeT - 3;
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
      lvIndex = lvl + 1;
      startLevel(lvl + 1);
    } else if (A === 'again' && canRestart) {
      start();
      sesTries++;
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
      musicStyle = chip.dataset.music;
      refreshChips();
      try {
        localStorage.setItem('orbita_p1_musica', musicStyle);
      } catch (_) {}
      startMusic(); // Vista previa: se escucha completa mientras se elige.
    } else {
      hudMode = chip.dataset.mode;
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
      pendingTut = false;
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
      gest = { id: e.pointerId, y: e.clientY };
      if (charge >= chargeMax()) {
        pending = true;
        pendingT = 0;
      } // Espera un instante por si es un deslizamiento hacia arriba (salto doble).
    }
  }
}
// Deslizar más de 22 píxeles hacia arriba durante el toque mejora el salto a salto doble.
window.addEventListener('pointermove', e => {
  if (!gest || e.pointerId !== gest.id) {
    return;
  }
  if (gest.y - e.clientY > 22) {
    gest = null;
    if (pending) {
      upgradeToDouble();
    }
    pending = false;
  }
});
const endGest = e => {
  if (gest && e.pointerId === gest.id) {
    gest = null;
    pending = false;
  }
};
window.addEventListener('pointerup', endGest);
window.addEventListener('pointercancel', endGest);
window.addEventListener('pointerdown', press, { passive: false });
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
