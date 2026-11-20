// ┌─ 36-bucle-principal.js
// │ da:     last
// │ lo usan: 18-pausa
// │ usa 01-pantalla-y-utilidades: ctx
// │ usa 06-record-y-estado: state
// │ usa 08-partida-estado: t
// │ usa 10-ritmo-y-objetos: elWallet
// │ usa 18-pausa: paused
// │ usa 20-logica: update
// │ usa 21-dibujo: render
// │ usa 23-intro: renderIntro, updateIntro
// │ usa 24-presentacion: renderSplash, updateSplash
// │ usa 26-pantalla-inicio: elHome
// │ usa 27-inicio-animacion: HOME_IN, homeT, logoSounds, renderHomeIntro, updateHomeShow
// │ usa 29-planetas-hd: renderPlanetsScene
// │ usa 33-tarjetas-niveles: drawLevelsBG
// │ usa 34-misiones: misOpen, misPlanetDraw
// │ usa 35-medidor: medFrame, MEDIR, medMid
// │ cambia 08-partida-estado: t
// │ cambia 27-inicio-animacion: homeT
// │ cambia 35-medidor: medMid
// └─ generado por `node build.mjs --deps`; no se edita a mano
let last = performance.now();
function frame(now){
  const m0 = MEDIR ? performance.now() : 0;
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
    else { update(dt); if (MEDIR) medMid = performance.now(); render(); }
    if (misOpen) misPlanetDraw();
  }catch(e){ try{ ctx.restore(); }catch(_){} console.error(e); }
  if (MEDIR) medFrame(now, m0);
}
requestAnimationFrame(frame);
