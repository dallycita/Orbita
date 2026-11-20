function frame(now){
  const dt = Math.min((now - last)/1000, .05); last = now;
  requestAnimationFrame(frame);
  { const pl = state === 'play' || state === 'dead'; if (pl !== frame.pl){ frame.pl = pl; if (document.body && document.body.classList) document.body.classList.toggle('playing', pl); } }
  try{
    if (elWallet) elWallet.style.opacity = (state === 'splash' || state === 'pretitle' || state === 'intro' || (state === 'home' && homeT < HOME_IN + .9) || misOpen) ? "0" : "1";
    if (state === 'splash' || state === 'pretitle'){ updateSplash(dt); renderSplash(); }
    else if (state === 'intro'){ updateIntro(dt); renderIntro(); }
    else if (state === 'planets'){ renderPlanetsScene(dt); }
    else if (state === 'levels'){ t += dt; drawLevelsBG(); }
    else if (state === 'home' && homeT >= HOME_IN && homeT < HOME_IN + 2.5){ homeT += dt; logoSounds(); if (homeT >= HOME_IN + .9 && elHome && elHome.classList.contains && elHome.classList.contains('off')) elHome.classList.remove('off'); update(dt); render(); }
    else if (state === 'home' && homeT < HOME_IN){
      homeT += dt; update(dt); updateHomeShow(dt); renderHomeIntro();
    }
    else if (paused){ /* congelado: el lienzo conserva el último cuadro */ }
    else { update(dt); render(); }
    if (misOpen) misPlanetDraw();
  }catch(e){ try{ ctx.restore(); }catch(_){} console.error(e); }
}
requestAnimationFrame(frame);
