// ┌─ 23-intro.js
// │ da:     doblesHechos, easeIO, endIntro, introDrone, introFade, MENU_HTML, noteDouble, renderIntro, startIntro,
// │        updateIntro
// │ lo usan: 12-poderes, 16-partida, 19-controles, 20-logica, 21-dibujo, 22-viaje-sistema-solar, 25-selector-niveles,
// │        26-pantalla-inicio, 27-inicio-animacion, 35-bucle-principal
// │ usa 01-pantalla-y-utilidades: BONE, buzz, chipsHTML, clamp, ctx, CX, CY, elHud, elPanel, H, PR, reduceMotion,
// │        rgba, S, stars, SUN, W, ZONES
// │ usa 02-audio: AC, master, noise, noiseHit, suck, thump
// │ usa 06-record-y-estado: appear, lvl, state
// │ usa 08-partida-estado: flash, holeFlare, pulse, shake, sunLevel, t, tutorial
// │ usa 16-partida: rr
// │ usa 21-dibujo: drawEarth
// │ usa 24-presentacion: bhDiskK
// │ usa 25-selector-niveles: LEVELS, openLevels, storySeen, tutAfterStory
// │ usa 26-pantalla-inicio: openHome, storyReturn
// │ usa 27-inicio-animacion: homeAmbience
// │ usa 29-planetas-hd: drawBigPlanet, PLGL
// │ usa 34-misiones: misEvent
// │ cambia 06-record-y-estado: appear, lvl, state
// │ cambia 08-partida-estado: flash, holeFlare, pulse, shake, t
// │ cambia 25-selector-niveles: storySeen, tutAfterStory
// │ cambia 26-pantalla-inicio: storyReturn
// └─ generado por `node build.mjs --deps`; no se edita a mano
// ---------- intro: un agujero negro errante entra al sistema solar ----------
const PLANETS = [
  {n:'Mercurio', r:38,  s:3.5, c:'#a9a6a0'},
  {n:'Venus',    r:60,  s:5.5, c:'#e3c27a'},
  {n:'Tierra',   r:84,  s:6.5, earth:true},
  {n:'Marte',    r:106, s:4.5, c:'#c1543a'},
  {n:'Júpiter',  r:134, s:11,  c:'#d7a86e', bands:true},
  {n:'Saturno',  r:162, s:9,   c:'#e6cf8f', ring:true},
  {n:'Urano',    r:186, s:7,   c:'#8fd3e0'},
  {n:'Neptuno',  r:208, s:7,   c:'#3f6fd6'},
];
const EAT_AT = {'Mercurio':6.6, 'Venus':7.3, 'Marte':8.0, 'Júpiter':8.7, 'Saturno':9.4, 'Urano':10.1, 'Neptuno':10.8};
const INTRO_END = 15.9, T_ZOOM = 13.9, ZOOM_DUR = 1.8, T_ENTER = 2.2, T_ARRIVE = 4.1, T_SUN_END = 5.8, T_DISK_END = 6.2, T_EARTH = 6.6;
const SUN_COLS = ['#fff3cf','#ffd36b','#ff9a3d','#ff5a1f'];
let introT = 0, ip = [], iparts = [], introFade = 0, SI = 1, droneNodes = null, cues = {};
function introSetup(){
  introT = 0; iparts = []; cues = {};
  ip = PLANETS.map((p, i) => Object.assign({}, p, {a: i*2.1 + .4, eatAt: p.earth ? null : EAT_AT[p.n], done:false, ph:0, rr:p.r, sounded:false}));
}
introSetup();
const once = k => cues[k] ? false : (cues[k] = true);
const easeIO = x => x < .5 ? 2*x*x : 1 - Math.pow(-2*x + 2, 2)/2;
// trayectoria del agujero negro: llega desde afuera y se instala donde estaba el Sol
function bhPos(){
  if (introT < T_ARRIVE){
    const u = easeIO(clamp((introT - T_ENTER)/(T_ARRIVE - T_ENTER), 0, 1));
    const a = (1-u)*(1-u), b = 2*(1-u)*u, c = u*u;
    return {x: a*320 + b*240 + c*42, y: a*-360 + b*40 + c*-14};
  }
  const u = easeIO(clamp((introT - T_ARRIVE)/(T_SUN_END - T_ARRIVE), 0, 1));
  return {x: 42*(1 - u), y: -14*(1 - u)};
}
const bhRadius = () => 8 + 12*clamp((introT - T_ARRIVE)/(T_DISK_END - T_ARRIVE), 0, 1);  // crece al alimentarse
const diskK = () => clamp((introT - 4.8)/(T_DISK_END - 4.8), 0, 1);
const sunK = () => clamp((introT - T_ARRIVE)/(T_SUN_END - T_ARRIVE), 0, 1);

// antes de jugar: solo dónde estás y "toca para escapar"; la ayuda con íconos aparece hasta que dominas el salto doble
let doblesHechos = 0; try{ doblesHechos = parseInt(localStorage.getItem('orbita_p1_dobles') || '0', 10) || 0; }catch(e){}
function noteDouble(){ if (tutorial) return; misEvent('power'); doblesHechos++; try{ localStorage.setItem('orbita_p1_dobles', String(doblesHechos)); }catch(e){} }
const HINT_TAP = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4.2" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".55"/><path d="M12 7v10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7" r="1.8" fill="currentColor"/></svg>';
const HINT_UP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6.5 10.5 12 5l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const MENU_HTML = () => {
  const L = LEVELS[lvl] || LEVELS[0];
  return '<div class="mlv">Nivel ' + ((LEVELS.indexOf(L)) + 1) + ' · ' + L.name + '</div><div class="cta mgo">Toca para escapar</div>' + chipsHTML();
};
function startIntro(){ homeAmbience(false); state = 'intro'; introSetup(); elPanel.classList.add('hide'); elHud.style.opacity = 0; introDrone(true); }
const introZoomK = () => easeIO(clamp((introT - T_ZOOM)/ZOOM_DUR, 0, 1));
const EARTH_W = .9*Math.pow(60/84, 1.5);
const holeGameR = () => Math.max(rr(sunLevel), SUN)*S;
const zoomZ = () => holeGameR()/(20*SI);
const earthEndR = () => rr(0)*S/(zoomZ()*SI);
const zoomF = () => 1 + (zoomZ() - 1)*introZoomK();
function endIntro(skipped){
  storySeen = true; try{ localStorage.setItem('orbita_p1_historia', '1'); }catch(e){}
  introDrone(false); appear = 0; introFade = skipped ? .6 : 0;
  if (storyReturn && !tutAfterStory){ const r = storyReturn; storyReturn = null; if (r === 'levels') openLevels(); else openHome(); return; }
  storyReturn = null;
  tutAfterStory = false; lvl = 0;
  state = 'menu';
  elPanel.innerHTML = MENU_HTML(); elPanel.classList.add('top'); elPanel.classList.remove('hide');
}
function introDrone(on){
  if (!AC) return; try{
    const n = AC.currentTime;
    if (on){
      const o = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(), lp = AC.createBiquadFilter();
      o.type = 'sine'; o.frequency.value = 55; o2.type = 'sawtooth'; o2.frequency.value = 55.6;
      lp.type = 'lowpass'; lp.frequency.value = 220;
      g.gain.setValueAtTime(.0001, n); g.gain.exponentialRampToValueAtTime(.22, n + 2.5);
      o.connect(g); o2.connect(lp); lp.connect(g); g.connect(master); o.start(n); o2.start(n);
      droneNodes = {o, o2, g};
    } else if (droneNodes){
      const d = droneNodes; droneNodes = null;
      d.g.gain.cancelScheduledValues(n); d.g.gain.setValueAtTime(Math.max(d.g.gain.value, .0001), n);
      d.g.gain.exponentialRampToValueAtTime(.0001, n + .6); d.o.stop(n + .7); d.o2.stop(n + .7);
    }
  }catch(e){}
}
function eatSound(){
  if (!AC) return; try{
    const t0 = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(320, t0); o.frequency.exponentialRampToValueAtTime(45, t0 + 1.2);
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.3, t0 + .3); g.gain.exponentialRampToValueAtTime(.0001, t0 + 1.3);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + 1.35);
    noiseHit(t0, 1.1, 'lowpass', 2200, .3, master, 80);
  }catch(e){}
}

function updateIntro(dt){
  if (state === 'intro') introT += dt;
  t += dt;
  flash = Math.max(0, flash - dt*2.2); holeFlare = Math.max(0, holeFlare - dt*1.4); pulse = Math.max(0, pulse - dt*3.5); shake = Math.max(0, shake - dt*25);
  SI = Math.max(.4, Math.min(W/2/224, (CY - 80)/224));
  if (introT >= T_ENTER && once('enter')){ noise(1.9, 80, 700, .3, 'lowpass'); buzz([10,60,10,60]); }
  if (introT >= T_ARRIVE && once('arrive')){ suck(); shake = reduceMotion ? 0 : 6; buzz([30,30,30,30,60]); }
  if (introT >= T_SUN_END && once('disk')){ holeFlare = 1; pulse = 1; flash = .5; thump(); noise(.7, 5000, 120, .45, 'lowpass'); buzz(50); }
  const b = bhPos(), sk = sunK(), holeR = bhRadius();
  // el Sol se deshace en una espiral de fuego alrededor del agujero negro
  if (state === 'intro' && sk > 0 && sk < 1){
    const sR = 20*Math.pow(1 - sk, .7), sx = b.x*sk*.5, sy = b.y*sk*.5;
    for (let i=0;i<6;i++){
      const a = Math.random()*Math.PI*2, px = sx + Math.cos(a)*sR, py = sy + Math.sin(a)*sR;
      const dx = px - b.x, dy = py - b.y, l = Math.hypot(dx, dy) || 1, v = 90 + Math.random()*80;
      iparts.push({x:px, y:py, vx:-dy/l*v, vy:dx/l*v, life:1.2 + Math.random(), col:SUN_COLS[i%4], s:1.5 + Math.random()*2.5});
    }
  }
  for (const p of ip){
    if (p.done) continue;
    const w = .9*Math.pow(60/p.r, 1.5);
    if (p.eatAt != null && introT >= p.eatAt){
      if (!p.sounded){ p.sounded = true; eatSound(); buzz(20); }
      p.ph = Math.min(1, (introT - p.eatAt)/1.3);
      p.rr = p.r + (holeR*.85 - p.r)*Math.pow(p.ph, 2.2);
      p.a += (w + 1.2 + 9*p.ph*p.ph)*dt;
      if (Math.random() < .25 + p.ph){
        const ex = Math.cos(p.a)*p.rr, ey = Math.sin(p.a)*p.rr, v = 40 + Math.random()*60;
        iparts.push({x:ex, y:ey, vx:-Math.sin(p.a)*v, vy:Math.cos(p.a)*v, life:.8 + Math.random()*.5, col:p.c, s:1.5 + Math.random()*2});
      }
      if (p.ph >= 1){ p.done = true; holeFlare = Math.max(holeFlare, .7); pulse = 1; thump(); }
    } else {
      p.a = p.earth ? -Math.PI/2 + EARTH_W*Math.min(0, introT - T_ZOOM) : p.a + w*dt;   // la Tierra llega arriba justo en "Escapa"
      if (p.earth && introT > T_EARTH){ const k = easeIO(Math.min((introT - T_EARTH)/6, 1)); p.rr = p.r - (p.r - earthEndR())*k; }
    }
  }
  const pull = introT >= T_ARRIVE ? 260 : 0;
  for (const q of iparts){
    const dx = q.x - b.x, dy = q.y - b.y, l = Math.hypot(dx, dy) || 1;
    q.vx -= dx/l*pull*dt; q.vy -= dy/l*pull*dt; q.vx *= Math.pow(.6, dt); q.vy *= Math.pow(.6, dt);
    q.x += q.vx*dt; q.y += q.vy*dt; q.life -= dt*(l < holeR ? 4 : .6);
  }
  iparts = iparts.filter(q => q.life > 0);
  if (state === 'intro' && introT > INTRO_END) endIntro(false);
}

const INTRO_ID = {'Mercurio':'mercurio', 'Venus':'venus', 'Marte':'marte', 'Júpiter':'jupiter', 'Saturno':'saturno', 'Urano':'urano', 'Neptuno':'neptuno'};
function drawPlanet(p, x, y, rad, ph){
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(CY - y, CX - x) - Math.PI/2);
  if (ph > 0){ ctx.translate(0, rad*1.4*ph*ph); ctx.scale(1 - .6*ph, 1 + 2.8*ph*ph); ctx.globalAlpha = 1 - clamp((ph - .82)/.18, 0, 1); }
  const glId = INTRO_ID[p.n];
  if (p.earth){ drawEarth(0, 0, rad); }
  else if (glId && PLGL.ok()){ drawBigPlanet(glId, 0, 0, rad, t*.3, false, 'below'); }
  else {
    if (p.ring){ ctx.strokeStyle = p.c; ctx.lineWidth = Math.max(1, rad*.25); ctx.beginPath(); ctx.ellipse(0, 0, rad*2, rad*.55, .35, Math.PI, Math.PI*2); ctx.stroke(); }
    ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI*2); ctx.fill();
    if (p.bands){ ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(120,70,30,.45)'; ctx.fillRect(-rad, -rad*.35, rad*2, rad*.18); ctx.fillRect(-rad, rad*.15, rad*2, rad*.22); ctx.restore(); }
    const sh = ctx.createLinearGradient(0, rad, 0, -rad);
    sh.addColorStop(0, 'rgba(10,14,30,0)'); sh.addColorStop(.5, 'rgba(10,14,30,.15)'); sh.addColorStop(1, 'rgba(10,14,30,.75)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI*2); ctx.fill();
    if (p.ring){ ctx.strokeStyle = p.c; ctx.lineWidth = Math.max(1, rad*.25); ctx.beginPath(); ctx.ellipse(0, 0, rad*2, rad*.55, .35, 0, Math.PI); ctx.stroke(); }
  }
  if (ph > 0){ ctx.globalAlpha = (1 - clamp((ph - .82)/.18, 0, 1))*.85*ph*ph; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI*2); ctx.fill(); }
  ctx.restore(); ctx.globalAlpha = 1;
}
function caption(txt, t0, t1, size, y){
  if (introT < t0 || introT > t1) return;
  const a = Math.min(1, (introT - t0)/.4, (t1 - introT)/.4), lines = txt.split('\n');
  ctx.globalAlpha = a; ctx.fillStyle = BONE; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let fs = size;
  ctx.font = '500 ' + fs + 'px Unbounded, system-ui, sans-serif';
  for (const l of lines){ const m = ctx.measureText ? ctx.measureText(l) : null, w = (m && m.width) || 0; if (w > W - 40) fs = Math.min(fs, size*(W - 40)/w); }
  ctx.font = '500 ' + fs + 'px Unbounded, system-ui, sans-serif';
  lines.forEach((l, i) => ctx.fillText(l, CX, y + (i - (lines.length - 1)/2)*fs*1.4));
  ctx.globalAlpha = 1;
}
function renderIntro(){
  const z = ZONES[0], b = bhPos(), sk = sunK(), dk = diskK();
  ctx.save();
  ctx.fillStyle = z.bg; ctx.fillRect(0, 0, W, H);
  if (shake > 0) ctx.translate((Math.random()-.5)*shake, (Math.random()-.5)*shake);
  const sr = Math.max(W, H)*.62;
  for (const s of stars){
    const zw = introZoomK(), warp = Math.sin(Math.PI*zw);
    const a = s.a + t*.015, rad = s.r*sr*(1 + zw*.6), x = CX + Math.cos(a)*rad, y = CY + Math.sin(a)*rad;
    if (warp > .05){ const r2 = rad*(1 - .12*warp); ctx.globalAlpha = .35*warp; ctx.strokeStyle = BONE; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(CX + Math.cos(a)*r2, CY + Math.sin(a)*r2); ctx.lineTo(x, y); ctx.stroke(); }
    ctx.globalAlpha = .12 + .22*(.5 + .5*Math.sin(t*1.3 + s.tw)); ctx.fillStyle = BONE; ctx.fillRect(x, y, s.s*.8, s.s*.8);
  }
  ctx.strokeStyle = BONE; ctx.lineWidth = 1;
  for (const p of ip){
    if (p.done) continue;
    if (p.earth){
      ctx.globalAlpha = .18 + (.82 - .18)*introZoomK(); ctx.lineWidth = 1 + introZoomK();
      ctx.beginPath(); ctx.arc(CX, CY, p.rr*SI*zoomF(), 0, Math.PI*2); ctx.stroke(); ctx.lineWidth = 1;
      continue;
    }
    ctx.globalAlpha = .09*(p.eatAt != null && introT >= p.eatAt ? 1 - p.ph : 1)*(1 - introZoomK());
    ctx.beginPath(); ctx.arc(CX, CY, p.r*SI, 0, Math.PI*2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // el Sol: intacto, y luego estirado hacia el agujero negro
  if (sk < 1){
    const sR = 20*Math.pow(1 - sk, .7)*SI, sx = CX + b.x*sk*.5*SI, sy = CY + b.y*sk*.5*SI;
    ctx.save(); ctx.translate(sx, sy);
    if (sk > 0){ ctx.rotate(Math.atan2(CY + b.y*SI - sy, CX + b.x*SI - sx)); ctx.scale(1 + 1.4*sk, 1 - .45*sk); }
    const g = ctx.createRadialGradient(0, 0, sR*.3, 0, 0, sR*3);
    g.addColorStop(0, 'rgba(255,200,90,.5)'); g.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, sR*3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.arc(0, 0, sR, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff3cf'; ctx.beginPath(); ctx.arc(0, 0, sR*.55, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
  // el agujero negro (solo se ve por cómo dobla la luz, hasta que se alimenta y aparece su disco)
  if (introT >= T_ENTER){
    const zf = zoomF(), hx = CX + b.x*SI*zf, hy = CY + b.y*SI*zf, hR = bhRadius()*SI*zf*(1 + pulse*.06);
    if (dk > 0){
      ctx.globalAlpha = dk;
      const g = ctx.createRadialGradient(hx, hy, hR*.9, hx, hy, hR*2.6);
      g.addColorStop(0, rgba(z.s2,.42)); g.addColorStop(.35, rgba(z.s2,.1)); g.addColorStop(1, rgba(z.s2,0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, hR*2.6, 0, Math.PI*2); ctx.fill();
      bhDiskK(hx, hy, hR, .96, 1.06, 1.6, 0, Math.PI*2, dk);
    }
    ctx.globalAlpha = .18*(1 - dk); ctx.strokeStyle = BONE; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(hx, hy, hR*1.8, 0, Math.PI*2); ctx.stroke();
    ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(hx, hy, hR, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = dk > .5 ? z.s1 : BONE; ctx.globalAlpha = .55 + .45*dk; ctx.lineWidth = 1.4 + holeFlare*6;
    ctx.shadowColor = z.s2; ctx.shadowBlur = dk*(16 + holeFlare*40);
    ctx.beginPath(); ctx.arc(hx, hy, hR*1.01, 0, Math.PI*2); ctx.stroke(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }
  const zk2 = introZoomK();
  if (zk2 > 0){
    const ra = [.9, .47, .08, .04, .02];
    for (let k=1;k<5;k++){ ctx.globalAlpha = zk2*ra[k]; ctx.strokeStyle = BONE; ctx.lineWidth = k === 0 ? 2 : 1; ctx.beginPath(); ctx.arc(CX, CY, rr(k)*S, 0, Math.PI*2); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  for (const p of ip){
    if (p.done) continue;
    let pa = p.a, pr = p.rr*SI, ps = Math.max(2, p.s*SI);
    if (p.earth){ pr *= zoomF(); ps = ps + (PR*S*1.15 - ps)*zk2; }
    const x = CX + Math.cos(pa)*pr, y = CY + Math.sin(pa)*pr;
    let jx = 0, jy = 0;
    if (p.earth && introT > T_EARTH && !reduceMotion){ const k = Math.min((introT - T_EARTH)/6, 1)*(1 - zk2); jx = (Math.random() - .5)*2.5*k; jy = (Math.random() - .5)*2.5*k; }
    drawPlanet(p, x + jx, y + jy, ps, p.ph);
    if (p.ph > 0 && p.ph < .85){
      ctx.globalAlpha = 1 - p.ph/.85; ctx.fillStyle = BONE; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '500 12px Unbounded, system-ui, sans-serif';
      ctx.fillText(p.n, CX + Math.cos(p.a)*p.r*SI, CY + Math.sin(p.a)*p.r*SI - p.s*SI - 14);
      ctx.globalAlpha = 1;
    }
  }
  for (const q of iparts){
    ctx.globalAlpha = clamp(q.life, 0, 1)*(1 - zk2); ctx.fillStyle = q.col;
    ctx.fillRect(CX + q.x*SI - q.s/2, CY + q.y*SI - q.s/2, q.s, q.s);
  }
  ctx.globalAlpha = 1;
  const ty = Math.max(70, CY - 236*SI);
  caption('Nuestro sistema solar.', .4, 2.2, 16, ty);
  caption('Un agujero negro errante\nentró al sistema solar.', 2.3, 4.3, 15, ty);
  caption('Se tragó al Sol.', 4.4, 6.1, 16, ty);
  caption('Luego vino por los planetas.', 6.3, 8.0, 15, ty);
  caption('Solo queda la Tierra.', 12.2, 13.7, 16, ty);
  caption('Escapa.', 13.7, 15.0, 30, ty);
  if (state === 'intro' && zk2 === 0){
    ctx.globalAlpha = .45; ctx.fillStyle = BONE; ctx.font = '300 12px Unbounded, system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('Toca para saltar la intro', CX, H - 34); ctx.globalAlpha = 1;
  }
  ctx.restore();
  if (flash > 0){ ctx.globalAlpha = flash*.45; ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}

