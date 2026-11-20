// ┌─ 20-logica.js
// │ da:     update
// │ lo usan: 35-bucle-principal
// │ usa 01-pantalla-y-utilidades: BONE, buzz, CX, CY, PR, R0, reduceMotion, S, SUN, zoneOf
// │ usa 02-audio: AC, noise, thump
// │ usa 03-musica-ritmos: alarmTick, andFast, dangerFlash, dangerNow, kickQueue, musicOn, musicStart, switchAt,
// │        switchMsg, TB, tensionSet, tensT
// │ usa 06-record-y-estado: appear, astFade, camLevel, charge, crossed, GOAL, jumping, jumpT, jumpTarget, level, lvl,
// │        pAng, pLevel, rings, state
// │ usa 07-planetas: catchMargin, chargeMax, jumpDur, sizeK
// │ usa 08-partida-estado: burns, chargeFlash, culpritT, deadT, debris, flash, hintT, holeFlare, landPop, particles,
// │        pending, pendingT, pipFlash, pulse, readyT, shake, slowTimer, sunLevel, swallow, t, texts, timeScale,
// │        trail, tutorial, winT
// │ usa 09-recorridos: seenTypes
// │ usa 10-ritmo-y-objetos: beatTime, HOLE_MUL, lastBeatIdx, obsAng, obsRad, pushFrom, pushing, pushT, stretchAt
// │ usa 11-peligros-datos: novaSrc
// │ usa 12-poderes: burnT, caronteSaves, ghostT, lastJT, powerUpdate, ringSpark, shieldT, vaporize
// │ usa 13-agujero-de-gusano: ORB_W, wh, whEnter, whGap, whShock, whTrans
// │ usa 14-lente-gravitacional: bend, BEND_R, bendUpdate, bendW, lensP, WH_EXIT, WH_K, whRip
// │ usa 15-peligros: hazardsUpdate, NOVA_LIFE, novaBurst, novaHit, novaSound
// │ usa 16-partida: die, eatRings, jump, onLand, rr
// │ usa 23-intro: introFade
// │ usa 32-fondos-9-motor: GLBG
// │ cambia 03-musica-ritmos: dangerFlash, switchAt, tensT
// │ cambia 06-record-y-estado: appear, astFade, camLevel, crossed, jumping, jumpT, jumpTarget, level, pAng, pLevel
// │ cambia 08-partida-estado: burns, chargeFlash, culpritT, deadT, flash, hintT, holeFlare, landPop, particles,
// │        pending, pendingT, pulse, readyT, shake, slowTimer, sunLevel, t, texts, timeScale, winT
// │ cambia 10-ritmo-y-objetos: lastBeatIdx, pushing, pushT
// │ cambia 11-peligros-datos: novaSrc
// │ cambia 12-poderes: lastJT
// │ cambia 13-agujero-de-gusano: whShock
// │ cambia 14-lente-gravitacional: whRip
// │ cambia 23-intro: introFade
// └─ generado por `node build.mjs --deps`; no se edita a mano
// ---------- lógica ----------
function update(dt){
  // tiempo real: cámara lenta, sacudida, destello
  if (slowTimer > 0) slowTimer -= dt; else timeScale += (1 - timeScale)*Math.min(1, dt*5);
  culpritT = Math.max(0, culpritT - dt);
  hintT = Math.max(0, hintT - dt);
  if (pending){ pendingT += dt; if (pendingT > .09) pending = false; }
  const bi = (AC && musicOn && musicStart >= 0) ? Math.floor(beatTime()/TB) : -1;
  if (bi !== lastBeatIdx){ lastBeatIdx = bi;
    if (bi >= 0 && bi % 2 === 0 && state === 'play' && !reduceMotion){
      const pr0 = rr(pLevel), x0 = Math.cos(pAng)*pr0, y0 = Math.sin(pAng)*pr0, gold = charge >= chargeMax();
      for (let i=0;i<4;i++){ const a = Math.random()*Math.PI*2, v = 30 + Math.random()*40; particles.push({x: x0, y: y0, vx: Math.cos(a)*v, vy: Math.sin(a)*v, life: .35 + Math.random()*.2, col: gold ? '#ffd36b' : '#cfe6ff', s: 1 + Math.random()*1.2}); }
    } }
  for (let i=0;i<10;i++) pipFlash[i] = Math.max(0, pipFlash[i] - dt*3); chargeFlash = Math.max(0, chargeFlash - dt*1.6); readyT = charge >= chargeMax() && state === 'play' ? readyT + dt : 0; astFade = Math.max(0, astFade - dt*5); appear = Math.min(1, appear + dt*5); landPop = Math.max(0, landPop - dt*6);
  shake = Math.max(0, shake - dt*40); flash = Math.max(0, flash - dt*2.6); pulse = Math.max(0, pulse - dt*3.5);
  if (AC) while (kickQueue.length && AC.currentTime >= kickQueue[0]){
    kickQueue.shift(); pulse = 1;
    if (dangerNow() > .55) buzz(14);
  }
  if (switchAt && AC && AC.currentTime >= switchAt){
    switchAt = 0; flash = .35; pulse = 1; buzz([20,30,40]);
    texts.push({txt:switchMsg, x:0, y:-R0-96, life:1.6, size:20, col:zoneOf(level).s2, center:true});
  }
  tensT += dt; if (tensT > .08){ tensT = 0; tensionSet(dangerNow()); }
  alarmTick(dt); dangerFlash = Math.max(0, dangerFlash - dt*2.2);
  const d = dt*timeScale; t += d;
  powerUpdate(dt, d);
  const curR = rings.get(level), frozen = (state === 'play' && !jumping && curR && curR.type === 'arrastre') ? rings.get(level + 1) : null;
  for (const r of rings.values()){
    if (r.tid !== undefined) r.tid += (r.tv || .5)*d;
    if (r === frozen && !r.sync) continue;
    const ph0 = r.phase, fz = r.frozenT > 0; if (fz) r.frozenT -= dt;   // Urano: el anillo congelado no gira (y al soltarse sigue desde ahí, sin saltos)
    if (r.holdT > 0){ r.holdT -= dt; continue; }       // Neptuno: el viento sostiene el hueco encima de ti un momento
    if (r.type === 'marea'){ r.phase += r.w*(1 + .8*Math.sin(t*1.4 + r.ws))*d; if (fz) r.poff = (r.poff || 0) + r.phase - ph0; continue; }
    if (r.type === 'freno'){
      r.ft += d; r.flash = Math.max(0, r.flash - d*4);
      if (r.ft >= r.fp){ r.ft = 0; r.sgn *= -1; if (rings.get(level + 1) === r && state === 'play'){ r.flash = 1; noise(.06, 3000, 900, .12, 'bandpass'); } }
      r.phase += r.w*r.sgn*d;
    } else if (r.sync) r.phase = r.w*beatTime();
    else r.phase += r.w*d;
    if (fz) r.poff = (r.poff || 0) + r.phase - ph0;
  }

  if (lvl === 2 && !tutorial) novaSound();
  bendUpdate(dt*timeScale);
  if (whShock){ whShock.t += dt; if (whShock.t > 1.1) whShock = null; }
  if (whRip){ whRip.t += dt; if (whRip.t > 1.1) whRip = null; }
  if (wh && wh.flipT) wh.flipT = Math.max(0, wh.flipT - dt*4);
  if (state === 'play' && wh && wh.ph !== 'orb'){ whTrans(dt); }
  else if (state === 'play'){
    GLBG.advance(d, .35 + (jumping ? 1.1 : 0) + (andFast ? .35 : 0), Math.min(1, level/GOAL));
    const bt = andFast ? 3 : level >= 28 ? 2 : level >= 15 ? 1 : 0; GLBG.setBand(bt, d);
    if (false && lvl === 2 && bt > 0 && !seenTypes['luz' + bt]){ seenTypes['luz' + bt] = 1; try{ localStorage.setItem('orbita_p1_vistos', JSON.stringify(seenTypes)); }catch(e){}
      texts.push({txt: ['', 'Ultravioleta: brillan las estrellas jóvenes', 'Infrarrojo: ahora ves el polvo', 'Todas las luces a la vez'][bt], x: 0, y: -R0-130, life: 3.5, size: 11, col: BONE, center: true}); }
    if (wh && wh.ph === 'orb'){   // dentro del gusano: giras tú sobre el anillo, y la corriente te lanza en el golpe
      pAng = Math.atan2(Math.sin(pAng + wh.dir*ORB_W*d), Math.cos(pAng + wh.dir*ORB_W*d));
      const bi = Math.floor(beatTime()/TB);
      if (!jumping && level < WH_EXIT && bi >= wh.nextB){ jump(); wh.gapB = whGap(); wh.nextB = bi + wh.gapB; pulse = 1; }
    } else if (!jumping && !pushing){
      const cr = rings.get(level);
      if (cr && cr.type === 'arrastre') pAng += cr.w*d;
      else { const df = Math.atan2(Math.sin(-Math.PI/2 - pAng), Math.cos(-Math.PI/2 - pAng)); if (Math.abs(df) > .0005) pAng += df*Math.min(1, d*5); }
      pAng = Math.atan2(Math.sin(pAng), Math.cos(pAng));
    }
    if (pushing){ pushT += d; const pp = Math.min(pushT/.32, 1); pLevel = pushFrom + (level - pushFrom)*(1 - Math.pow(1 - pp, 3)); if (pp >= 1){ pushing = false; pLevel = level; } }
    if (jumping){
      const dur = jumpTarget >= 2 ? .24 + (jumpTarget - 2)*.1 : jumpDur();
      jumpT += d; const p = Math.min(jumpT/dur, 1);
      pLevel = level + jumpTarget*(1 - Math.pow(1-p, 3));
      if (jumpTarget >= 2 && ((!crossed && pLevel >= level + 1) || (jumpTarget === 3 && crossed === true && pLevel >= level + 2 && (crossed = 2)))){
        // la Tierra atraviesa el anillo y lo rompe
        crossed = true; shake = reduceMotion ? 0 : 6; pulse = 1;
        const R = rr(level + 1), cx0 = Math.cos(pAng)*R, cy0 = Math.sin(pAng)*R;
        for (let i=0;i<34;i++){
          const a = Math.random()*Math.PI*2, v = 60 + Math.random()*200;
          particles.push({x:cx0, y:cy0, vx:Math.cos(a)*v, vy:Math.sin(a)*v, life:.6 + Math.random()*.6, col: i%2 ? BONE : zoneOf(level).s2, s:2 + Math.random()*3});
        }
        noise(.35, 5000, 200, .4, 'lowpass');
      }
      if (p >= 1){ jumping = false; level += jumpTarget; pLevel = level; lastJT = jumpTarget; onLand(jumpTarget >= 2); jumpTarget = 1; }
    }
    camLevel += (level - camLevel)*Math.min(1, d*6);
    // el sol crece y se come los anillos; si te quedas quieto, te alcanza
    const gap = pLevel - sunLevel;
    let sp = (tutorial ? .1 : .2 + Math.min(level*.006, .26))*(HOLE_MUL[lvl] || 1);   // nivel 1: un punto medio; tutorial: muy lento
    if (gap > 2.4) sp += (gap - 2.4)*1.15;
    if (!(wh && wh.ph === 'orb')) sunLevel += sp*d;   // dentro del gusano el agujero negro no te puede seguir
    eatRings();
    if (sunLevel >= pLevel - catchMargin()){
      const pr0 = rr(pLevel); die(Math.cos(pAng)*pr0, Math.sin(pAng)*pr0, 'sun'); return;
    }
    trail.push({a:pAng, l:pLevel}); if (trail.length > 22) trail.shift();

    const pr = rr(pLevel), [px, py] = lensP(Math.cos(pAng)*pr, Math.sin(pAng)*pr);
    if (!wh && bend.on && jumping && level === WH_K - 1){   // saltas dentro de la boca
      const [bx, by] = bendW(); if (Math.hypot(Math.cos(pAng)*pr - bx, Math.sin(pAng)*pr - by) < BEND_R*.8){ whEnter(); return; }
    }
    const check = jumping && jumpTarget === 1 && !pending ? [level+1] : [];
    for (const k of check){
      const ring = rings.get(k); if (!ring) continue;
      const R = rr(k);
      for (const o of ring.obs){
        if (o.melt) continue;
        const oa = obsAng(ring, o), Rs = R*stretchAt(ring, oa), [ox, oy] = lensP(Math.cos(oa)*Rs, Math.sin(oa)*Rs);
        const dist = Math.hypot(px-ox, py-oy);
        if (dist < PR*sizeK() + obsRad(ring, o)*.66 && shieldT > 0 && !o.shSp){ o.shSp = 1; ringSpark(ox, oy); }
        if (dist < PR*sizeK() + obsRad(ring, o)*.66 && burnT > 0 && ghostT <= 0 && shieldT <= 0){ vaporize(ring, o, CX + ox*S, CY + oy*S); continue; }
        if (dist < PR*sizeK() + obsRad(ring, o)*.66 && ghostT <= 0 && shieldT <= 0){ if (caronteSaves(px, py, ox, oy)) break; die(px, py, k === level ? 'hit' : 'jump', {k, o}); return; }
      }
    }
    if (novaSrc.length){
      const bt = beatTime();
      for (const s of novaSrc){ const b = Math.floor((bt - s.b0)/s.P); if (b >= 0 && b < s.n && b !== s.lastB){ s.lastB = b; novaBurst(s); } }
      novaSrc = novaSrc.filter(s => !(bt > s.b0 + (s.n - 1)*s.P + NOVA_LIFE*(s.big ? 1.6 : 1) + .2));
      if (jumping && jumpTarget === 1 && !pending && novaHit(px, py, bt, camLevel) && ghostT <= 0 && shieldT <= 0){ if (!caronteSaves(px, py)){ die(px, py, 'nova'); return; } }
    }
    const hz = hazardsUpdate(d, px, py);
    if (hz && ghostT <= 0 && shieldT <= 0){ if (!caronteSaves(px, py)){ die(px, py, hz); return; } }
  } else {
    camLevel += (level - camLevel)*Math.min(1, d*6);
    if (state === 'dead' && sunLevel < level + 3 && (!swallow || swallow.done)){ sunLevel += .9*d; eatRings(); }
  }
  if (state === 'dead'){ deadT += d; GLBG.advance(d, 0); }
  if (state === 'win'){
    winT += dt; GLBG.advance(dt, 2 + winT*4, 1); GLBG.setBand(3, dt);
    pLevel += dt*(1.2 + winT*4);
    sunLevel -= dt*(.6 + winT*.8);
    trail.push({a:pAng, l:pLevel}); if (trail.length > 30) trail.shift();
  }
  holeFlare = Math.max(0, holeFlare - dt*1.4);
  introFade = Math.max(0, introFade - dt*1.6);
  if (swallow && !swallow.done){
    swallow.p = Math.min(1, swallow.p + dt/1.8);
    const p = swallow.p, hw = Math.max(rr(sunLevel), SUN);
    swallow.r = swallow.r0 + (hw*.88 - swallow.r0)*Math.pow(p, 2.2);
    swallow.a += (1.1 + 9*p*p)*dt;
    if (Math.random() < .35 + p){
      const a = swallow.a, ex = Math.cos(a)*swallow.r, ey = Math.sin(a)*swallow.r, v = 60 + Math.random()*70;
      particles.push({x:ex, y:ey, vx:-Math.sin(a)*v - Math.cos(a)*30, vy:Math.cos(a)*v - Math.sin(a)*30,
        life:.7 + Math.random()*.6, col:['#2b63c9','#4fa35a','#ffffff','#8fd0ff'][Math.floor(Math.random()*4)], s:1.5 + Math.random()*2});
    }
    if (p >= 1){
      swallow.done = true; flash = .7; pulse = 1; holeFlare = 1;
      shake = reduceMotion ? 0 : 10;
      noise(.6, 6000, 150, .5, 'lowpass'); thump(); buzz(70);
    }
  }

  for (const p of particles){
    const len = Math.hypot(p.x, p.y) || 1;
    p.vx += (-p.x/len*140)*d; p.vy += (-p.y/len*140)*d;
    p.vx *= Math.pow(.6, d); p.vy *= Math.pow(.6, d);
    p.x += p.vx*d; p.y += p.vy*d; p.life -= d*.8;
    if (len < Math.max(rr(sunLevel), SUN)) p.life -= d*3;
  }
  particles = particles.filter(p => p.life > 0);
  for (const tx of texts){ tx.life -= dt; if (!tx.center) tx.y -= dt*22; }
  texts = texts.filter(tx => tx.life > 0);
  for (const b of burns) b.life -= dt*1.6;
  const hw = Math.max(rr(sunLevel), SUN);
  for (const db of debris){
    db.r -= (14 + 1400/Math.max(db.r, 10))*dt; db.a += (.4 + 70/Math.max(db.r, 10))*dt;
    if (db.r < hw){ db.r = hw + 120 + Math.random()*120; db.a = Math.random()*Math.PI*2; }
  }
  burns = burns.filter(b => b.life > 0);
}

