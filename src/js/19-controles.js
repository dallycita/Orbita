// ┌─ 19-controles.js
// │ da:     (nada: todo es privado de este archivo)
// │ usa 01-pantalla-y-utilidades: BONE, elPanel, hudMode, musicStyle, R0, refreshChips
// │ usa 02-audio: AC, initAudio
// │ usa 05-musica-reproductor: startMusic, stopMusic
// │ usa 06-record-y-estado: charge, jumping, lvl, state
// │ usa 07-planetas: chargeMax
// │ usa 08-partida-estado: canRestart, gest, pending, pendingT, texts, tutorial
// │ usa 10-ritmo-y-objetos: pushing
// │ usa 13-agujero-de-gusano: wh, whTap
// │ usa 16-partida: doubleJump, jump, sesTries, showTry, start, upgradeToDouble
// │ usa 17-tutorial: startTutorial
// │ usa 18-pausa: paused, pauseGame, pausePress, pzCount, resumeGame
// │ usa 23-intro: endIntro
// │ usa 24-presentacion: skipSplash, splashT
// │ usa 25-selector-niveles: elLv, LEVELS, lvIndex, openLevels, pendingTut, startLevel
// │ usa 26-pantalla-inicio: elHome, openHome
// │ usa 27-inicio-animacion: HOME_IN, homeT, logoT0
// │ usa 28-sonidos-interfaz: showStop
// │ usa 29-planetas-hd: planetStep, uiGlass
// │ cambia 01-pantalla-y-utilidades: hudMode, musicStyle
// │ cambia 06-record-y-estado: state
// │ cambia 08-partida-estado: gest, pending, pendingT
// │ cambia 16-partida: sesTries
// │ cambia 25-selector-niveles: lvIndex, pendingTut
// │ cambia 27-inicio-animacion: homeT, logoT0
// └─ generado por `node build.mjs --deps`; no se edita a mano
// ---------- entrada ----------
function press(e){
  if (paused){ pausePress(e); return; }
  if (e && e.target && e.target.closest && e.target.closest('#quit')){ if (e.cancelable) e.preventDefault(); if (state === 'play'){ pauseGame(); } else if (state === 'dead'){ state = 'menu'; stopMusic(true); openLevels(); } return; }
  if (state === 'home' && homeT < HOME_IN){ homeT = HOME_IN + .6; logoT0 = homeT - 3; showStop(.3); if (elHome) elHome.classList.remove('off'); return; }
  if (state === 'levels' || state === 'home' || state === 'planets' || state === 'missions') return;
  const act = e && e.target && e.target.closest ? e.target.closest('[data-act]') : null;
  if (act && (state === 'dead' || state === 'win')){ if (e.cancelable) e.preventDefault(); if (elPanel.classList) elPanel.classList.remove('wscr'); const A = act.dataset.act; if (A === 'levels') openLevels(); else if (A === 'lvl1') startLevel(0); else if (A === 'next' && LEVELS[lvl + 1]){ lvIndex = lvl + 1; startLevel(lvl + 1); } else if (A === 'again' && canRestart){ start(); sesTries++; showTry(0); } return; }
  const chip = e && e.target && e.target.closest ? e.target.closest('.chip') : null;
  if (chip && state !== 'play'){
    if (e.cancelable) e.preventDefault();
    initAudio(); if (AC && AC.state === 'suspended') AC.resume();
    if (chip.dataset.music){
      musicStyle = chip.dataset.music; refreshChips();
      try{ localStorage.setItem('orbita_p1_musica', musicStyle); }catch(_){}
      startMusic();                       // vista previa: se escucha completa mientras eliges
    } else {
      hudMode = chip.dataset.mode; refreshChips();
      try{ localStorage.setItem('orbita_p1_modo', hudMode); }catch(_){}
    }
    return;
  }
  if (e && e.cancelable) e.preventDefault();
  initAudio(); if (AC && AC.state === 'suspended') AC.resume();
  if (state === 'pretitle'){ openHome(true); return; }
  if (state === 'splash'){ if (splashT > .8) skipSplash(); return; }
  if (state === 'intro'){ endIntro(true); return; }
  if (state === 'menu'){ if (pendingTut){ pendingTut = false; startTutorial(); } else { start(); showTry(0); } return; }
  if (state === 'win' && tutorial) return;
  if (state === 'win') return;
  if (state === 'dead'){ if (canRestart) start(); return; }
  if (state === 'play' && wh){ whTap(); return; }
  if (state === 'play' && !jumping && !pushing){
    jump();
    if (e && e.pointerId !== undefined){
      gest = {id:e.pointerId, y:e.clientY};
      if (charge >= chargeMax()){ pending = true; pendingT = 0; }   // espera un instante por si es un deslizamiento
    }
  }
}
window.addEventListener('pointermove', e => {
  if (!gest || e.pointerId !== gest.id) return;
  if (gest.y - e.clientY > 22){ gest = null; if (pending) upgradeToDouble(); pending = false; }
});
const endGest = e => { if (gest && e.pointerId === gest.id){ gest = null; pending = false; } };
window.addEventListener('pointerup', endGest);
window.addEventListener('pointercancel', endGest);
window.addEventListener('pointerdown', press, {passive:false});
// tecla del poder: funciona antes de saltar y también en pleno salto; si no está cargado, avisa cuánto falta
function powerKey(){
  if (state !== 'play' || wh) return;
  if (charge < chargeMax()){
    const f = chargeMax() - charge;
    if (!texts.some(x => x.key === 'faltan')) texts.push({txt: 'Te ' + (f === 1 ? 'falta 1 Perfecto' : 'faltan ' + f + ' Perfectos'), x: 0, y: -R0-30, life: 1, size: 13, col: BONE, center: true, key: 'faltan'});
    return;
  }
  if (jumping) upgradeToDouble(); else doubleJump();
}
window.addEventListener('keydown', e => {
  if (e.code === 'Escape' || e.code === 'KeyP'){ if (paused){ if (!pzCount) resumeGame(); } else if (state === 'play') pauseGame(); return; }
  if (paused){ if ((e.code === 'Space' || e.code === 'Enter') && !pzCount){ e.preventDefault(); resumeGame(); } return; }
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter'){ e.preventDefault(); if (!e.repeat) press(); }
  else if (state === 'planets' && (e.code === 'ArrowRight' || e.code === 'ArrowLeft')){ uiGlass(e.code === 'ArrowRight' ? 1 : -1); planetStep(e.code === 'ArrowRight' ? 1 : -1); }
  else if (state === 'levels' && (e.code === 'ArrowRight' || e.code === 'ArrowLeft')){ const b = elLv && elLv.querySelector && elLv.querySelector(e.code === 'ArrowRight' ? '.arrow.r' : '.arrow.l'); if (b && b.click) b.click(); }
  else if ((e.code === 'KeyD' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !e.repeat){ e.preventDefault(); powerKey(); }
});

