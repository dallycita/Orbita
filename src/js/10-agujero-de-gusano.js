// ---- dentro del agujero de gusano: modo ÓRBITA (anillos 30–41) ----
// La corriente del gusano te lanza sola al siguiente anillo cada dos golpes de la música.
// Tú ya no saltas: tocas para cambiar el sentido en que la Tierra gira sobre su anillo y te colocas bajo el hueco.
// Entrada y salida: un portal corto (menos de un segundo), como en Geometry Dash, pero hecho con la lente real:
// el mundo de afuera se estira y se abre en un círculo de luz con los colores separados (aberración cromática).
const whGap = () => level + 1 < 34 ? 4 : 3;   // los primeros cuatro, cada cuatro golpes (para aprender); luego cada tres
const ORB_W = 1.75, WH_IN = .78, WH_OUT = .7;
let wh = null, whShock = null, gapC = {}, viewInside = false, hideEarth = false;
const easeC3 = x => x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3)/2;
function whPull(dur){   // tirón grave que sube, con el aire que se arrastra hacia la boca
  if (!AC || muted) return; try{
    const n = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(), o2 = AC.createOscillator(), g2 = AC.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(48, n); o.frequency.exponentialRampToValueAtTime(190, n + dur);
    g.gain.setValueAtTime(.0001, n); g.gain.exponentialRampToValueAtTime(.5, n + dur*.85); g.gain.exponentialRampToValueAtTime(.0001, n + dur + .25);
    o2.type = 'triangle'; o2.frequency.setValueAtTime(ROOT/2, n); o2.frequency.exponentialRampToValueAtTime(ROOT*2, n + dur);
    g2.gain.setValueAtTime(.0001, n); g2.gain.exponentialRampToValueAtTime(.06, n + dur*.9); g2.gain.exponentialRampToValueAtTime(.0001, n + dur + .15);
    o.connect(g); g.connect(master); o2.connect(g2); g2.connect(master); o.start(n); o2.start(n); o.stop(n + dur + .3); o2.stop(n + dur + .2);
    noiseHit(n, dur + .1, 'bandpass', 300, .32, master, 7000);
  }catch(e){}
}
function whBoom(){   // golpe con eco al salir
  if (!AC || muted) return; try{
    const n = AC.currentTime; dKick(n); noiseHit(n, 1.1, 'lowpass', 5000, .45, master, 120);
    const e = echoBus(); [12, 7, 0].forEach((sm, i) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = ROOT*Math.pow(2, sm/12);
      g.gain.setValueAtTime(.0001, n + i*.06); g.gain.exponentialRampToValueAtTime(.07, n + i*.06 + .01); g.gain.exponentialRampToValueAtTime(.0001, n + i*.06 + .9); o.connect(g); g.connect(e); g.connect(master); o.start(n + i*.06); o.stop(n + i*.06 + 1); });
  }catch(e){}
}
const WH_G = 46;   // cuánto crece la boca al entrar (hasta cubrir toda la pantalla)
function whEnter(){
  const [wx, wy] = bendW(), pr = rr(pLevel);
  wh = {ph: 'in', t: 0, dir: 1, ex: Math.cos(pAng)*pr, ey: Math.sin(pAng)*pr, wx, wy, nextB: 0};
  jumping = false; pending = false; texts = texts.filter(x => !x.tip);
  bend.fixed = true; bend.str = 1; bend.grow = 1;
  shake = reduceMotion ? 0 : 3; buzz([20,30,50]); whPull(WH_IN*.85);
}
function whInDone(){
  wh.ph = 'orb'; bend = {str: 0, a: -Math.PI/2, L: 0, on: false, grow: 1, fixed: false};
  level = WH_K; pLevel = WH_K; pAng = -Math.PI/2; jumpTarget = 1; trail = [];   // del otro lado apareces sobre el anillo 29
  score += 1; if (!tutorial){ misEvent('ring'); misEvent('reach', level); } updateRingHUD(); ensureRings();
  appear = 0; pulse = 1; flash = .25; shake = reduceMotion ? 0 : 6;
  const bi = Math.floor(beatTime()/TB); wh.gapB = 4; wh.nextB = bi + 3 + (bi % 2);
  try{ if (AC) impact(AC.currentTime); }catch(e){} buzz(30); thump();
  hazardTip('orbVisto', 'Órbita', 'Toca para cambiar de sentido', WORM_COL);
}
function whStartOut(){
  wh.ph = 'out'; wh.t = 0;
  // la otra boca queda justo detrás de ti y te escupe hacia afuera
  bend = {str: 1, a: pAng, L: level - .55, on: true, grow: WH_G, fixed: true};
  shake = reduceMotion ? 0 : 6; buzz([30,40,60]); whBoom();
}
function whOutDone(){
  const [wx, wy] = bendW(); wh = null;
  bend = {str: 0, a: -Math.PI/2, L: 0, on: false, grow: 1, fixed: false};
  whRip = {t: 0, x: wx, y: wy}; whShock = {t: 0, cx: CX + wx*S, cy: CY + wy*S};
  sunLevel = Math.min(sunLevel, level - 2.2); lastEaten = Math.floor(sunLevel); burns = [];
  pulse = 1; shake = reduceMotion ? 0 : 7; thump(); buzz([40,60]);
  for (let i = 0; i < 40; i++){ const a = Math.random()*Math.PI*2, v = 50 + Math.random()*200; particles.push({x: wx, y: wy, vx: Math.cos(a)*v, vy: Math.sin(a)*v, life: .6 + Math.random()*.6, col: ['#ffffff', WORM_COL, '#9fd8ff', '#ffb3e6'][i % 4], s: 1.5 + Math.random()*2}); }
  texts.push({txt: '¡Saliste del gusano!', x: 0, y: -R0-72, life: 1.6, size: 20, col: WORM_COL, center: true});
  if (!seenTypes.whDato){ seenTypes.whDato = 1; try{ localStorage.setItem('orbita_p1_vistos', JSON.stringify(seenTypes)); }catch(e){}
    texts.push({txt: 'Dato real: la relatividad los permite,', x: 0, y: -R0-140, life: 3.8, size: 11, col: BONE, center: true});
    texts.push({txt: 'pero nadie ha visto uno todavía', x: 0, y: -R0-126, life: 3.8, size: 11, col: BONE, center: true}); }
}
function whTap(){ if (!wh || wh.ph !== 'orb') return; wh.dir *= -1; wh.flipT = 1; noise(.06, 2500, 7000, .07, 'highpass'); buzz(8); }
function whTrans(dt){
  wh.t += dt; GLBG.advance(dt, 1.5 + 3*clamp(wh.t/WH_IN, 0, 1), Math.min(1, level/GOAL)); camLevel += (level - camLevel)*Math.min(1, dt*6);
  if (wh.ph === 'in'){
    const p = clamp(wh.t/WH_IN, 0, 1), q = clamp(p/.5, 0, 1), qe = q*q;
    bend.grow = 1 + (WH_G - 1)*Math.pow(p, 2.6);           // la boca crece hacia ti hasta cubrir la pantalla
    const x = wh.ex + (wh.wx - wh.ex)*qe, y = wh.ey + (wh.wy - wh.ey)*qe;   // la Tierra cae hacia su centro (y la lente la estira en arco)
    pAng = Math.atan2(y, x); pLevel = (Math.hypot(x, y) - R0)/GAP + camLevel;
    if (Math.random() < .6){ const [lx, ly] = lensP(x, y); particles.push({x: lx, y: ly, vx: (wh.wx - lx)*2, vy: (wh.wy - ly)*2, life: .35, col: Math.random() < .5 ? '#ffffff' : WORM_COL, s: 1.4}); }
    if (p >= 1) whInDone();
  } else {
    const p = clamp(wh.t/WH_OUT, 0, 1), e = 1 - Math.pow(1 - p, 3);
    bend.grow = 1 + (WH_G - 1)*Math.pow(1 - e, 2.2); bend.str = 1 - clamp((p - .7)/.3, 0, 1);   // la boca se encoge detrás de ti y se apaga
    if (p >= 1) whOutDone();
  }
}
// el anillo de luz del portal, con los colores separados como en una lente real
function chromaRing(x, y, R, al, w){
  if (R < 1 || al <= .01) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = al*.25; ctx.strokeStyle = WORM_COL; ctx.lineWidth = w*7; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI*2); ctx.stroke();
  const sp = w*1.3;
  [['#ff6fb5', -sp], ['#7fd6ff', sp], ['#ffffff', 0]].forEach(([c, o]) => { ctx.globalAlpha = al*(o ? .75 : .95); ctx.strokeStyle = c; ctx.lineWidth = w*(o ? 1.1 : .9); ctx.beginPath(); ctx.arc(x, y, Math.max(1, R + o), 0, Math.PI*2); ctx.stroke(); });
  ctx.restore();
}
// cómo se ve todo estando dentro: el mismo cielo y los mismos anillos, vistos a través de la garganta del gusano
function drawInside(al){
  if (al <= .01) return;
  const bt = beatTime(), bk = beatKick(), D = Math.hypot(W, H)*.5, r0 = D*(.8 + .015*Math.sin(t*1.3)) + bk*4;
  ctx.save();
  ctx.globalAlpha = al*.1; ctx.fillStyle = '#5a46d6'; ctx.fillRect(0, 0, W, H);
  // la corriente: luz que fluye hacia afuera, más rápida en cada golpe
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (let i = 0; i < 44; i++){
    const a = i*2.399 + .4, u = frac(t*.55 + frac(Math.sin(i*12.9898)*43758.5453) + bk*.02), r = (R0*.8 + u*(D - R0*.8))*S/1.6*1.6;
    ctx.globalAlpha = al*Math.sin(Math.PI*u)*.22; ctx.strokeStyle = i % 3 ? WORM_COL : '#ffffff'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(CX + Math.cos(a)*r, CY + Math.sin(a)*r); ctx.lineTo(CX + Math.cos(a)*(r + 26 + 30*u), CY + Math.sin(a)*(r + 26 + 30*u)); ctx.stroke();
  }
  // luz de afuera que da vueltas en el borde de la garganta (la misma imagen, repetida)
  for (let i = 0; i < 18; i++){
    const a = i/18*Math.PI*2 + t*.35*(i % 2 ? 1 : -1);
    ctx.globalAlpha = al*.16; ctx.strokeStyle = i % 2 ? '#9fd8ff' : '#ffb3e6'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(CX, CY, r0*(.97 + .02*(i % 3)), a, a + .22); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
  const g = ctx.createRadialGradient(CX, CY, r0*.86, CX, CY, r0*1.12);
  if (g && g.addColorStop){ g.addColorStop(0, 'rgba(6,4,22,0)'); g.addColorStop(.45, 'rgba(10,6,34,' + (.55*al) + ')'); g.addColorStop(1, 'rgba(4,3,14,' + (.92*al) + ')'); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
  chromaRing(CX, CY, r0*.9, al*.55, 1.6);
  if (!wh || wh.ph !== 'orb' || state !== 'play') return;
  // hacia dónde giras: tres flechitas delante de la Tierra, sobre tu anillo
  const R = rr(pLevel)*S, fl = wh.flipT || 0;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = WORM_COL; ctx.lineWidth = 2.2;
  for (let i = 0; i < 3; i++){
    const a = pAng + wh.dir*(.2 + i*.1), x = CX + Math.cos(a)*R, y = CY + Math.sin(a)*R, tx = -Math.sin(a)*wh.dir, ty = Math.cos(a)*wh.dir, nx = Math.cos(a), ny = Math.sin(a), h = 4.5;
    ctx.globalAlpha = (.75 - i*.22)*(1 + fl*.3);
    ctx.beginPath(); ctx.moveTo(x - tx*h + nx*h, y - ty*h + ny*h); ctx.lineTo(x, y); ctx.lineTo(x - tx*h - nx*h, y - ty*h - ny*h); ctx.stroke();
  }
  // cuánto falta para que la corriente te lance: un arco alrededor de la Tierra que se llena con la música
  const gB = wh.gapB || 2, ph = clamp((bt/TB - (wh.nextB - gB))/gB, 0, 1), ex = CX + Math.cos(pAng)*R, ey = CY + Math.sin(pAng)*R, rr3 = PR*S*1.15*sizeK() + 6;
  ctx.globalAlpha = .9; ctx.strokeStyle = WORM_COL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(ex, ey, rr3, -Math.PI/2, -Math.PI/2 + ph*Math.PI*2); ctx.stroke();
  ctx.globalAlpha = .25; ctx.beginPath(); ctx.arc(ex, ey, rr3, 0, Math.PI*2); ctx.stroke();
  ctx.restore();
}
function render(){
  hideEarth = false; viewInside = false;
  if (!wh){ renderScene(); if (whShock) drawShock(); return; }
  if (wh.ph === 'orb'){ viewInside = true; renderScene(); drawInside(1); viewInside = false; return; }
  if (wh.ph === 'in'){
    const p = clamp(wh.t/WH_IN, 0, 1), z = 1 + .18*p*p, cx = CX + wh.wx*S, cy = CY + wh.wy*S;
    hideEarth = p > .62;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(.12*p*p); ctx.scale(z, z); ctx.translate(-cx, -cy); renderScene(); ctx.restore();
    hideEarth = false;
    // ya adentro: el mismo cielo a través de la garganta
    if (p > .8){ ctx.save(); ctx.globalAlpha = (p - .8)/.2; viewInside = true; hideEarth = true; renderScene(); drawInside(1); viewInside = false; hideEarth = false; ctx.restore(); }
    return;
  }
  // salida
  const p = clamp(wh.t/WH_OUT, 0, 1);
  renderScene();
  if (p < .3){ ctx.save(); ctx.globalAlpha = 1 - p/.3; drawInside(1); ctx.restore(); }
}
// al salir: ondas que recorren los anillos
function drawShock(){
  const s = whShock; if (!s) return;
  const u = clamp(s.t/1.1, 0, 1), R = 300*s.t*S;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(s.cx, s.cy, Math.max(0, R - 40*S), s.cx, s.cy, R + 40*S);
  if (g && g.addColorStop){ g.addColorStop(0, 'rgba(200,190,255,0)'); g.addColorStop(.5, 'rgba(200,190,255,' + (.16*(1 - u)) + ')'); g.addColorStop(1, 'rgba(200,190,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}

// ---- espacio doblado (nivel 1, anillos 27–33): un agujero de gusano flota delante de ti y dobla el espacio.
// Es una lente gravitacional de verdad: todo lo que pasa cerca (anillos, asteroides y tu planeta) se ve empujado
// hacia afuera de la esfera, se estira en arcos y corre más rápido alrededor de su borde. Dentro se ve el cielo del otro lado.
// Dato real: la gravedad dobla la luz (Einstein, 1915); así se calculó la imagen del agujero de gusano de Interstellar.
const BEND_AT = {3: [26, 28]}, BEND_R = 23, WORM_COL = '#d4c8ff', WH_K = 29, WH_EXIT = 41;
let bend = {str: 0, a: -Math.PI/2, L: 0, on: false, grow: 1, fixed: false}, whRip = null;
const bendRad = () => BEND_R*bend.str*(bend.grow || 1);
function bendUpdate(d){
  if (bend.fixed) return;   // durante la entrada y la salida la mueve el portal
  const z = BEND_AT[lvl], want = !tutorial && z && level >= z[0] && level <= z[1] && state === 'play' ? 1 : 0;
  if (want && !bend.on){ bend.on = true; bend.L = level + 1.5; bend.a = -Math.PI/2 + .9; hazardTip('whVisto', 'Agujero de gusano', 'Salta dentro: es un portal', WORM_COL); }
  if (!want && bend.on && bend.str < .02) bend.on = false;
  bend.str += (want - bend.str)*Math.min(1, d*(want ? 1.2 : 2.2));
  const lock = want && level === WH_K - 1;   // en el último anillo se pone justo en tu camino
  bend.L += ((want ? level + (lock ? .8 : 1.55) : level + 4) - bend.L)*Math.min(1, d*2.5);
  const aT = lock ? -Math.PI/2 : -Math.PI/2 + .8*Math.sin(t*.42) + .2*Math.sin(t*1.1);
  bend.a += Math.atan2(Math.sin(aT - bend.a), Math.cos(aT - bend.a))*Math.min(1, d*(lock ? 4 : 2));
}
function bendW(){ const R = rr(bend.L); return [Math.cos(bend.a)*R, Math.sin(bend.a)*R]; }
// lente: un punto a distancia r del centro de la esfera se ve a (r + √(r² + 4θ²))/2
function lensP(x, y){
  if (whRip && !viewInside){   // onda gravitacional: estira y encoge el espacio al pasar
    const dx = x - whRip.x, dy = y - whRip.y, d = Math.hypot(dx, dy) || .001, u = d - 300*whRip.t, A = 7*(1 - whRip.t/1.1)*Math.exp(-u*u/(2*38*38));
    if (A > .05){ const k = 1 + A*Math.sin(u/11)/d; x = whRip.x + dx*k; y = whRip.y + dy*k; }
  }
  if (bend.str < .01 || viewInside) return [x, y];
  const [wx, wy] = bendW(), dx = x - wx, dy = y - wy, r = Math.hypot(dx, dy) || .001, te = bendRad(), r2 = (r + Math.sqrt(r*r + 4*te*te))/2;
  return [wx + dx*r2/r, wy + dy*r2/r];
}
function lensJ(x, y){   // cuánto se estira: a lo largo del borde (tangencial) y hacia el centro (radial)
  if (bend.str < .01 || viewInside) return [1, 1, 0];
  const [wx, wy] = bendW(), dx = x - wx, dy = y - wy, r = Math.hypot(dx, dy) || .001, te = bendRad(), q = Math.sqrt(r*r + 4*te*te);
  return [(r + q)/(2*r), .5*(1 + r/q), Math.atan2(dy, dx)];
}
function drawBendSphere(){
  if (bend.str < .01 || viewInside) return;
  const [wx, wy] = bendW(), x = CX + wx*S, y = CY + wy*S, R = bendRad()*S*.92, cv = GLBG.canvas && GLBG.canvas();
  ctx.save();
  // la esfera tapa los anillos que pasan detrás: dentro se ve el otro lado (el mismo cielo calculado en la GPU)
  ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI*2); ctx.clip();
  if (cv && cv.width > 2) ctx.drawImage(cv, 0, 0, W, H);
  else { const g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, '#e9e4ff'); g.addColorStop(.6, '#5b46c9'); g.addColorStop(1, '#0b0820'); ctx.fillStyle = g; ctx.fillRect(x - R, y - R, 2*R, 2*R); }
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = bend.str*.45; ctx.strokeStyle = '#eef0ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI*2); ctx.stroke();
  const g2 = ctx.createRadialGradient(x, y, R, x, y, R*1.9); g2.addColorStop(0, 'rgba(200,205,255,' + (.28*bend.str) + ')'); g2.addColorStop(1, 'rgba(200,205,255,0)');
  ctx.globalAlpha = 1; ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(x, y, R*1.9, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

const NOVA_AT = {2: {6: {sp: 52, per: 8, gaps: 3, gw: .62, n: 3}, 15: {sp: 58, per: 8, gaps: 3, gw: .52, n: 4}, 24: {sp: 64, per: 6, gaps: 2, gw: .5, n: 5}, 33: {sp: 70, per: 6, gaps: 2, gw: .44, n: 5}, 43: {sp: 40, per: 99, gaps: 1, gw: .55, n: 1, big: 1}}};
const NOVA_LIFE = 5.2;
function novaBurst(s){
  shake = Math.max(shake, reduceMotion ? 0 : (s.big ? 9 : 3)); buzz(s.big ? [30, 30, 80] : 18);
  if (AC && !muted){ try{ const n = AC.currentTime; noise(s.big ? 1.2 : .5, 7000, 900, s.big ? .26 : .14, 'highpass'); [12, 19, 24].forEach((sm, i) => uiTone(ROOT*2*Math.pow(2, (sm + (s.big ? -12 : 0))/12), n + i*.03, s.big ? 1.6 : .8, .035)); }catch(e){} }
}
function novaSpawn(L, cfg){
  const side = Math.random() < .5 ? -1 : 1, bt = beatTime(), P = cfg.per*TB;
  const b0 = Math.ceil((bt + 1.1)/TB)*TB;                       // el primer estallido cae en un golpe
  novaSrc.push({k: L + (cfg.big ? 4 : 2), ang: -Math.PI/2 + side*(cfg.big ? 1.25 : .95 + Math.random()*.3), b0, P, n: cfg.n, sp: cfg.sp, gaps: cfg.gaps, gw: cfg.gw, big: !!cfg.big, rot: Math.random()*6.28, done: false, lastB: -1});
}
