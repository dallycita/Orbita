// ---------- el tutorial: reaparecer sin perder, terminarlo y empezarlo ----------
function tutRespawn(x, y){
  state = 'dead'; flash = .4; shake = reduceMotion ? 0 : 6; buzz(30); noise(.35, 3000, 200, .35, 'lowpass');
  for (let i=0;i<24;i++){ const a = Math.random()*Math.PI*2, v = 40 + Math.random()*120; particles.push({x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v, life:.6 + Math.random()*.4, col:['#2b63c9','#4fa35a','#ffffff','#8fd0ff'][i%4], s:2 + Math.random()*2}); }
  texts.push({txt:'Otra vez', x:0, y:-R0-70, life:1.2, size:18, col:BONE, center:true});
  setTimeout(() => {
    state = 'play'; jumping = false; jumpTarget = 1; pLevel = level; pending = false; gest = null;
    sunLevel = Math.min(sunLevel, level - 1.6); lastEaten = Math.floor(sunLevel); swallow = null; culprit = null; culpritT = 0;
    if (level >= 8) charge = 3;
  }, 700);
}
function tutorialWin(){
  state = 'win'; winT = 0; canRestart = false; flash = .5; pulse = 1;
  tutorialDone = true; try{ localStorage.setItem('orbita_p1_tutorial', '1'); }catch(e){}
  stopMusic(); winSound(); buzz([30,50,90]); elHud.style.opacity = 0;
  setTimeout(() => {
    elPanel.classList.remove('top');
    elPanel.innerHTML = '<div class="title" style="font-size:clamp(28px,8vw,50px);line-height:1.1">Ganaste tiempo…</div>' +
      '<div class="sub" style="margin-top:12px;font-size:17px;color:var(--fg)">…pero sigue tras de ti.</div>' +
      '<div class="msg" style="margin-top:22px;color:var(--muted);font-weight:400;font-size:13px;letter-spacing:.08em">TUTORIAL COMPLETADO</div>' +
      '<div class="sub" style="margin-top:10px">¿A dónde quieres escapar?</div>' +
      '<button type="button" class="chip act" data-act="lvl1" style="margin-top:22px;background:var(--sun);border-color:var(--sun);color:#fff;padding:12px 22px">Jugar el Sistema solar</button>' +
      '<button type="button" class="chip act" data-act="levels" style="margin-top:12px">Ver todos los niveles</button>';
    elPanel.classList.remove('hide');
    setTimeout(() => { canRestart = true; }, 600);
  }, 2200);
}
function startTutorial(){
  homeAmbience(false);
  if (elLv) elLv.classList.add('off');
  tutorial = true; setup(); state = 'play'; winT = 0; perfCount = 0;
  runRecord = 0; newRec = false; updateRingHUD();
  elHud.style.opacity = 1; elPanel.classList.add('hide');
  charge = 0; jumpTarget = 1; pending = false; gest = null; showHint = false; shieldLeft = 1; usedDouble = false;
  startMusic();
}
