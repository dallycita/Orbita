// ┌─ 21-dibujo.js
// │ da:     astPrebake, drawAst, drawCharge, drawEarth, drawPowerAura, powerReadySound, render
// │ lo usan: 16-partida, 22-viaje-sistema-solar, 23-intro, 29-planetas-hd, 36-bucle-principal
// │ usa 01-pantalla-y-utilidades: BONE, clamp, ctx, CX, CY, DPR, frac, H, PR, S, W
// │ usa 02-audio: AC, ROOT
// │ usa 06-record-y-estado: charge
// │ usa 07-planetas: chargeMax, sizeK
// │ usa 08-partida-estado: chargeFlash, hintT, particles, pipFlash, readyT, t, tutorial
// │ usa 13-agujero-de-gusano: drawInside, hideEarth, viewInside, wh, WH_IN, WH_OUT, whShock
// │ usa 14-lente-gravitacional: bend
// │ usa 22-viaje-sistema-solar: renderScene
// │ usa 23-intro: doblesHechos
// │ usa 26-pantalla-inicio: muted
// │ usa 28-sonidos-interfaz: uiOut, uiTone
// │ usa 29-planetas-hd: drawBigPlanet, PLGL
// │ cambia 13-agujero-de-gusano: hideEarth, viewInside
// └─ generado por `node build.mjs --deps`; no se edita a mano
// ---------- dibujo ----------
// asteroides con volumen: roca sombreada iluminada por el disco del agujero negro (borde naranja hacia el centro) y con cráteres.
// Se dibujan una vez en pequeñas imágenes (8 formas × 12 giros × tamaño) y luego solo se copian: rápido incluso en celulares.

// ---- asteroides en 3D (GPU), con la misma luz que los planetas ----
// Cada roca es un cuerpo irregular de verdad: un elipsoide deformado con ruido, con cráteres hundidos y su borde levantado.
// Se calcula con trazado de rayos, iluminada por el disco del agujero negro (la misma luz cálida que los planetas),
// y se guarda en pequeñas imágenes (8 formas × 12 giros en 3D × tamaño) para que en el juego solo se copien.
const ASTGL = (() => {
  let cv = null, gl = null, pr = null, U = {}, ok = null;
  const FS = `precision highp float;
  uniform vec2 uRes; uniform float uSeed, uAng; uniform vec3 uAx, uE, uLC;
  float h31(vec3 p){ p = fract(p*vec3(.1031, .11369, .13787)); p += dot(p, p.yzx + 19.19); return fract((p.x + p.y)*p.z); }
  float n3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
    return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
  float fbm(vec3 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a*n3(p); p = p*2.03 + vec3(1.7, 9.2, 3.1); a *= .5; } return s; }
  mat3 rotA(vec3 ax, float a){ ax = normalize(ax); float c = cos(a), s = sin(a), C = 1. - c;
    return mat3(c + ax.x*ax.x*C, ax.y*ax.x*C + ax.z*s, ax.z*ax.x*C - ax.y*s,
                ax.x*ax.y*C - ax.z*s, c + ax.y*ax.y*C, ax.z*ax.y*C + ax.x*s,
                ax.x*ax.z*C + ax.y*s, ax.y*ax.z*C - ax.x*s, c + ax.z*ax.z*C); }
  float craters(vec3 p){
    vec3 q = normalize(p); float h = 0.;
    for (int i = 0; i < 16; i++){ float fi = float(i);
      vec3 c = normalize(vec3(h31(vec3(fi, uSeed, 1.)) - .5, h31(vec3(fi, uSeed, 2.)) - .5, h31(vec3(fi, uSeed, 3.)) - .5));
      float r = i < 5 ? .2 + .26*h31(vec3(fi, uSeed, 4.)) : .06 + .1*h31(vec3(fi, uSeed, 4.)), d = length(q - c)/r;
      h += (d < 1. ? (d*d - 1.)*r*.55 : 0.) + r*.22*exp(-pow((d - 1.)*3.2, 2.)); }   // cuenco hundido y borde levantado
    return h;
  }
  float sdf(vec3 p){ return (length(p/uE) - 1.)*.75 - .26*(fbm(p*1.1 + uSeed) - .5) - .06*(fbm(p*4.5 + uSeed*2.) - .5) - .018*(n3(p*16. + uSeed) - .5) - craters(p)*.34; }
  vec3 nrm(vec3 p){ vec2 e = vec2(.004, -.004);
    return normalize(e.xyy*sdf(p + e.xyy) + e.yyx*sdf(p + e.yyx) + e.yxy*sdf(p + e.yxy) + e.xxx*sdf(p + e.xxx)); }
  void main(){
    vec2 uv = (gl_FragCoord.xy/uRes*2. - 1.)*1.45;
    mat3 R = rotA(uAx, uAng), Ri = rotA(uAx, -uAng);
    vec3 ro = Ri*vec3(uv, 2.5), rd = Ri*vec3(0., 0., -1.);
    float t = 0., d = 1.; bool hit = false;
    for (int i = 0; i < 64; i++){ d = sdf(ro + rd*t); if (d < .0015){ hit = true; break; } t += d*.85; if (t > 5.) break; }
    if (!hit){ gl_FragColor = vec4(0.); return; }
    vec3 p = ro + rd*t, n = R*nrm(p);                       // normal en el espacio de la pantalla
    vec3 L = normalize(vec3(0., -1., .55)), V = vec3(0., 0., 1.);   // la luz viene de abajo: hacia el agujero negro
    float crd = clamp(-craters(p)*2.2, 0., 1.);
    float tone = fbm(p*3.1 + uSeed*3.), fine = fbm(p*11. + uSeed);
    vec3 alb = mix(vec3(.34, .33, .32), vec3(.62, .6, .57), tone)*(.8 + .38*fine)*(1. - .3*crd);   // regolito gris, más oscuro dentro de los cráteres
    alb = mix(alb, alb*vec3(1.08, .98, .86), smoothstep(.55, .75, fbm(p*1.8 + 7.)));                  // manchas un poco más cálidas
    float dif = max(dot(n, L), 0.), wrap = max(dot(n, L)*.6 + .4, 0.);
    float soft = max(dot(n, L)*.5 + .5, 0.);                                                        // luz que envuelve: la sombra no queda negra
    vec3 col = alb*(uLC*pow(dif, 1.05)*1.15 + uLC*soft*soft*.28 + vec3(.2, .21, .27)*(.65 + .35*n.z));                     // luz del disco + un poco de cielo
    col += vec3(1., .5, .2)*pow(1. - max(dot(n, V), 0.), 3.)*wrap*.55;                               // borde encendido por el disco
    col = col/(1. + col*.35); col = pow(col, vec3(.92));
    gl_FragColor = vec4(col, 1.);
  }`;
  function init(){
    if (ok !== null) return ok; ok = false;
    try{
      cv = document.createElement('canvas'); gl = cv.getContext('webgl', {premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false}); if (!gl) return false;
      const sh = (ty, src) => { const o = gl.createShader(ty); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)){ console.warn('ASTGL', gl.getShaderInfoLog(o)); return null; } return o; };
      const v = sh(gl.VERTEX_SHADER, 'attribute vec2 aP; void main(){ gl_Position = vec4(aP, 0., 1.); }'), f = sh(gl.FRAGMENT_SHADER, FS); if (!v || !f) return false;
      pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.bindAttribLocation(pr, 0, 'aP'); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return false;
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
      ['uRes', 'uSeed', 'uAng', 'uAx', 'uE', 'uLC'].forEach(k => U[k] = gl.getUniformLocation(pr, k));
      ok = true;
    }catch(e){ ok = false; }
    return ok;
  }
  // dibuja una roca (forma, giro) en una imagen de sz×sz píxeles, a doble resolución y luego reducida (bordes suaves)
  function bake(shape, frame, sz){
    if (!init()) return null;
    const big = sz*2; if (cv.width !== big || cv.height !== big){ cv.width = big; cv.height = big; }
    gl.viewport(0, 0, big, big); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.useProgram(pr);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const sd = shape*7.31 + 1.7, fr = x => x - Math.floor(x), rnd = k => fr(Math.sin(sd*91.7 + k*12.9898)*43758.5453);
    gl.uniform2f(U.uRes, big, big); gl.uniform1f(U.uSeed, sd); gl.uniform1f(U.uAng, frame/12*Math.PI*2 + shape);
    gl.uniform3f(U.uAx, .3 + rnd(1), 1, .2 + rnd(2)*.6); gl.uniform3f(U.uE, 1.18 + .14*rnd(5), .74 + .14*rnd(3), .8 + .12*rnd(4)); gl.uniform3f(U.uLC, 1.25, .98, .82);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const out = document.createElement('canvas'); out.width = out.height = sz; const g = out.getContext('2d'); if (!g) return null;
    // sombra suave detrás, para que la roca siempre se despegue del cielo (como el halo de los planetas)
    const hg = g.createRadialGradient(sz/2, sz/2, sz*.26, sz/2, sz/2, sz*.44); hg.addColorStop(0, 'rgba(3,4,10,.22)'); hg.addColorStop(1, 'rgba(3,4,10,0)'); g.fillStyle = hg; g.fillRect(0, 0, sz, sz);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(cv, 0, 0, sz, sz);
    return out;
  }
  return {bake, ok: () => init()};
})();
const AST_SPR = {}, AST_B = [8, 12, 16, 22, 30, 40, 54, 72];   // tamaños fijos: la memoria no crece
function astSprite(shape, frame, rp){
  const key = shape + '_' + frame + '_' + rp; if (AST_SPR[key]) return AST_SPR[key];
  { const g3 = ASTGL.bake(shape, frame, Math.ceil(rp*2.9) + 2); if (g3) return (AST_SPR[key] = g3); }   // con GPU: roca en 3D; sin GPU, el dibujo de abajo
  const sz = Math.ceil(rp*2.9) + 2, c = document.createElement('canvas'); c.width = c.height = sz; const g = c.getContext('2d'); if (!g) return null;
  const cx = sz/2, cy = sz/2, rot = frame/12*Math.PI*2, seed = shape*7.31 + 1.7, N = 13, pts = [];
  const rnd = k => frac(Math.sin(seed*91.7 + k*12.9898)*43758.5453);
  const el = .8 + .14*rnd(99);                                   // roca alargada tipo papa, no bola
  for (let i = 0; i < N; i++){ const a = i/N*Math.PI*2, k = rp*(.92 + .2*rnd(i) + .08*Math.sin(a*3 + seed)), lx = Math.cos(a)*k, ly = Math.sin(a)*k*el;
    pts.push([cx + lx*Math.cos(rot) - ly*Math.sin(rot), cy + lx*Math.sin(rot) + ly*Math.cos(rot)]); }
  const shapePath = () => { g.beginPath(); for (let i = 0; i <= N; i++){ const p0 = pts[i % N], p1 = pts[(i + 1) % N], mx = (p0[0] + p1[0])/2, my = (p0[1] + p1[1])/2; i ? g.quadraticCurveTo(p0[0], p0[1], mx, my) : g.moveTo(mx, my); } g.closePath(); };
  // cuerpo: hueso cálido, la luz llega desde abajo (el disco del agujero negro)
  shapePath(); const body = g.createLinearGradient(0, cy - rp, 0, cy + rp);
  body.addColorStop(0, '#887f71'); body.addColorStop(.42, '#c6bca8'); body.addColorStop(.8, '#ece3d0'); body.addColorStop(1, '#f7efdf'); g.fillStyle = body; g.fill();
  g.save(); shapePath(); g.clip();
  // volumen: oscurece los bordes para que se lea redondeada
  const vol = g.createRadialGradient(cx, cy + rp*.2, rp*.3, cx, cy, rp*1.1); vol.addColorStop(0, 'rgba(40,34,28,0)'); vol.addColorStop(1, 'rgba(40,34,28,.45)'); g.fillStyle = vol; g.fillRect(0, 0, sz, sz);
  // grano de roca (gira con ella)
  for (let j = 0; j < 46; j++){ const a = rot + rnd(200 + j)*6.283, d = rp*Math.sqrt(rnd(300 + j)), x = cx + Math.cos(a)*d, y = cy + Math.sin(a)*d*el, s2 = Math.max(.6, rp*(.025 + .04*rnd(400 + j)));
    g.fillStyle = rnd(500 + j) < .55 ? 'rgba(60,52,44,.22)' : 'rgba(255,250,236,.18)'; g.beginPath(); g.arc(x, y, s2, 0, 6.283); g.fill(); }
  // cráteres de tamaños distintos: sombra dentro del lado de la luz, borde iluminado del lado contrario
  const nc = 3 + Math.floor(rnd(7)*3);
  for (let j = 0; j < nc; j++){ const a = rot + rnd(30 + j)*6.283, d = rp*(.15 + .55*rnd(40 + j)), cr = rp*(j ? .08 + .13*rnd(50 + j) : .2 + .08*rnd(50)), x = cx + Math.cos(a)*d, y = cy + Math.sin(a)*d*el;
    g.fillStyle = 'rgba(60,52,44,.22)'; g.beginPath(); g.ellipse(x, y, cr, cr*.85, 0, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(42,36,30,.35)'; g.beginPath(); g.ellipse(x, y + cr*.25, cr*.85, cr*.6, 0, 0, Math.PI); g.fill();
    g.strokeStyle = 'rgba(255,248,232,.5)'; g.lineWidth = Math.max(.7, cr*.22); g.beginPath(); g.ellipse(x, y, cr, cr*.85, 0, Math.PI*1.12, Math.PI*1.88); g.stroke(); }
  // borde naranja del lado que mira al agujero negro
  const rim = g.createLinearGradient(0, cy + rp, 0, cy + rp*.2); rim.addColorStop(0, 'rgba(255,140,60,.8)'); rim.addColorStop(.45, 'rgba(255,120,50,.22)'); rim.addColorStop(1, 'rgba(255,120,50,0)');
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = rim; g.fillRect(0, 0, sz, sz); g.globalCompositeOperation = 'source-over';
  g.restore();
  // contorno: claro abajo (luz), casi invisible arriba
  shapePath(); const ol = g.createLinearGradient(0, cy - rp, 0, cy + rp); ol.addColorStop(0, 'rgba(255,240,220,.12)'); ol.addColorStop(1, 'rgba(255,200,150,.7)'); g.strokeStyle = ol; g.lineWidth = Math.max(.8, rp*.05); g.stroke();
  return (AST_SPR[key] = c);
}
// rocas por adelantado: las que la partida va a usar se fabrican en los menús y en "Toca para escapar", poco a poco
// (unas pocas por cuadro), para no fabricarlas en pleno juego, donde cada una era un tirón. Son exactamente las mismas.
let astPre = null, astPreK = '';
function astPrebake(){
  const k = S + '_' + DPR; if (k !== astPreK){ astPreK = k; astPre = null; }
  if (!astPre){
    // tamaño en pantalla: los asteroides comunes miden 9 a 10.5 y aparecen desde el 40 %; primero esos.
    // Después los de "Respiración" (24, se encogen hasta el 30 %), que llegan más tarde; al derretirse crecen hasta 115 %
    const bk = r => AST_B.find(v => v >= r) || AST_B[AST_B.length - 1], full0 = bk(9*S*DPR), full1 = bk(10.5*S*DPR), top = bk(24*S*DPR*1.15);
    const sizes = AST_B.filter(v => v >= full0 && v <= full1).concat(AST_B.filter(v => v < full0).reverse(), AST_B.filter(v => v > full1 && v <= top));
    astPre = []; for (const rp of sizes) for (let f = 0; f < 12; f++) for (let s = 0; s < 8; s++) astPre.push([s, f, rp]);
  }
  if (!astPre.length || !ASTGL.ok()) return;
  const t0 = performance.now();
  for (let n = 0; n < 4 && astPre.length && performance.now() - t0 < 3; n++){ const [s, f, rp] = astPre.shift(); if (!AST_SPR[s + '_' + f + '_' + rp]) astSprite(s, f, rp); else n--; }
}
function drawAst(x, y, r, seed, rot, col, alpha){
  let sc = 1; try{ const m = ctx.getTransform && ctx.getTransform(); sc = m ? Math.hypot(m.a, m.b) : (window.devicePixelRatio || 1); }catch(e){}
  const rp = AST_B.find(v => v >= r*sc) || AST_B[AST_B.length - 1], shape = Math.floor(frac(Math.abs(seed)*.137)*8), fr = Math.floor(((rot % (Math.PI*2)) + Math.PI*2) % (Math.PI*2)/(Math.PI*2)*12) % 12;
  const spr = astSprite(shape, fr, rp);
  if (!spr){ ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill(); ctx.restore(); return; }
  const aC = Math.atan2(CY - y, CX - x), w = spr.width/sc*(r*sc/rp);
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(aC - Math.PI/2); ctx.drawImage(spr, -w/2, -w/2, w, w); ctx.restore();
}
const CONT = [{x:.1,y:-.35,w:.42,h:.22},{x:.45,y:.15,w:.3,h:.38},{x:.8,y:-.05,w:.35,h:.25},{x:.62,y:.55,w:.22,h:.12}];
const CLOUD = [{x:.2,y:-.6,w:.5},{x:.55,y:-.1,w:.4},{x:.9,y:.4,w:.45}];
function drawEarth(px, py, rad){
  if (PLGL.ok() && rad > .5){
    drawBigPlanet('tierra', px, py, rad, t*.35, false, 'below');
    ctx.strokeStyle = 'rgba(143,208,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(px, py, rad + 1.2, 0, Math.PI*2); ctx.stroke();
    return;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(120,190,255,.7)'; ctx.shadowBlur = 10;
  ctx.fillStyle = '#2b63c9'; ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI*2); ctx.clip();
  ctx.fillStyle = '#4fa35a';
  for (const c of CONT){ const x = px + (frac(c.x + t*.06)*2.8 - 1.4)*rad; ctx.beginPath(); ctx.ellipse(x, py + c.y*rad, c.w*rad, c.h*rad, .3, 0, Math.PI*2); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,.8)';
  for (const c of CLOUD){ const x = px + (frac(c.x + t*.11)*2.8 - 1.4)*rad; ctx.beginPath(); ctx.ellipse(x, py + c.y*rad, c.w*rad, .09*rad, 0, 0, Math.PI*2); ctx.fill(); }
  const sh = ctx.createLinearGradient(px, py + rad, px, py - rad);
  sh.addColorStop(0, 'rgba(10,14,30,0)'); sh.addColorStop(.5, 'rgba(10,14,30,.15)'); sh.addColorStop(1, 'rgba(10,14,30,.75)');
  ctx.fillStyle = sh; ctx.fillRect(px - rad, py - rad, rad*2, rad*2);
  ctx.restore();
  ctx.strokeStyle = 'rgba(143,208,255,.7)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(px, py, rad + .6, 0, Math.PI*2); ctx.stroke();
}
// poder listo: aura que late detrás del planeta (se nota de reojo sin quitar la vista del anillo de arriba)
function drawPowerAura(px, py){
  if (charge < chargeMax()) return;
  const rad = PR*S*1.15*sizeK(), beat = .5 + .5*Math.sin(readyT*6), R = rad*(2.1 + .35*beat);
  const g = ctx.createRadialGradient(px, py, rad*.8, px, py, R);
  if (g && g.addColorStop){ g.addColorStop(0, 'rgba(255,211,107,' + (.55 + .25*beat) + ')'); g.addColorStop(1, 'rgba(255,160,60,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, R, 0, Math.PI*2); ctx.fill(); }
  if (chargeFlash > 0){ ctx.globalAlpha = chargeFlash*.8; ctx.strokeStyle = '#fff1c4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, rad*(1.3 + (1 - chargeFlash)*2.5), 0, Math.PI*2); ctx.stroke(); ctx.globalAlpha = 1; }
}
// anillo de carga pegado al planeta: un arco por cada Perfecto
function drawCharge(px, py, z){
  const rad = PR*S*1.15*sizeK(), cm = chargeMax(), ready = charge >= cm, R = rad + 5, gap = .22, seg = Math.PI*2/cm;
  ctx.lineCap = 'round';
  if (cm > 6){   // muchos Perfectos (Plutón): un solo arco que se va llenando, en vez de muchas rayitas apretadas
    const fl = Math.max(...pipFlash), a0 = -Math.PI/2, a1 = a0 + Math.PI*2*Math.min(1, charge/cm);
    ctx.globalAlpha = .22; ctx.strokeStyle = BONE; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(px, py, R, 0, Math.PI*2); ctx.stroke();
    if (charge > 0){ ctx.globalAlpha = ready ? .95 : .85; ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 2.6 + fl*2.2; ctx.beginPath(); ctx.arc(px, py, R + fl*1.5, a0, a1); ctx.stroke();
      if (!ready){ ctx.globalAlpha = .9; ctx.fillStyle = '#fff4cf'; ctx.beginPath(); ctx.arc(px + Math.cos(a1)*(R + fl*1.5), py + Math.sin(a1)*(R + fl*1.5), 1.8 + fl*1.5, 0, Math.PI*2); ctx.fill(); } }
  } else for (let i=0;i<cm;i++){
    const a0 = -Math.PI/2 + i*seg + gap/2, a1 = a0 + seg - gap, on = i < charge;
    ctx.globalAlpha = on ? (ready ? .95 : .85) : .22; ctx.strokeStyle = on ? '#ffd36b' : BONE; ctx.lineWidth = 2.6 + pipFlash[i]*2.2;
    ctx.beginPath(); ctx.arc(px, py, R + pipFlash[i]*2, a0, a1); ctx.stroke();
  }
  if (ready && Math.random() < .5){   // estela de chispas doradas que salen del planeta
    const a = Math.random()*Math.PI*2, wx = (px - CX)/S, wy = (py - CY)/S;
    particles.push({x: wx + Math.cos(a)*PR*1.1, y: wy + Math.sin(a)*PR*1.1, vx: Math.cos(a)*25, vy: Math.sin(a)*25 + 20, life: .5 + Math.random()*.4, col: Math.random() < .5 ? '#ffd36b' : '#ffb34d', s: 1 + Math.random()*1.6});
  }
  // salto doble listo: mientras lo aprendes (menos de 3 usados), una flecha que sube sobre el planeta con "desliza"
  const learn = !tutorial && doblesHechos < 3;
  if (ready && (learn || hintT > 0) && !wh && !whShock && !bend.on){
    const a0 = learn ? 1 : Math.min(1, hintT), cyc = (t*1.4) % 1, y0 = py - rad - 12;
    for (let k = 0; k < 2; k++){
      const ph = (cyc + k*.5) % 1, yy = y0 - ph*22, al = Math.sin(Math.PI*ph);
      ctx.globalAlpha = a0*al*.95; ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(px - 6, yy + 3); ctx.lineTo(px, yy - 3); ctx.lineTo(px + 6, yy + 3); ctx.stroke();
    }
    if (learn){
      ctx.globalAlpha = .9; ctx.fillStyle = '#ffd36b'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.font = '500 11px Unbounded, system-ui, sans-serif';
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '2px';
      ctx.fillText('DESLIZA', px, y0 - 30);
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0px';
    }
  }
  ctx.globalAlpha = 1;
}
// sonido propio del poder listo: un arpegio brillante que sube y un destello
function powerReadySound(){
  if (!AC || muted) return;
  try{ const n = AC.currentTime; [0, 7, 12, 16, 19, 24].forEach((sm, i) => uiTone(ROOT*2*Math.pow(2, sm/12), n + i*.045, .9, .05));
    const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(ROOT, n); o.frequency.exponentialRampToValueAtTime(ROOT*4, n + .3);
    g.gain.setValueAtTime(.0001, n); g.gain.exponentialRampToValueAtTime(.08, n + .05); g.gain.exponentialRampToValueAtTime(.0001, n + .4); o.connect(g); g.connect(uiOut()); o.start(n); o.stop(n + .45); }catch(e){}
}
// el cuadro completo: elige qué dibujar (dentro o fuera del agujero de gusano) y la onda al salir
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
function drawShock(){
  const s = whShock; if (!s) return;
  const u = clamp(s.t/1.1, 0, 1), R = 300*s.t*S;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(s.cx, s.cy, Math.max(0, R - 40*S), s.cx, s.cy, R + 40*S);
  if (g && g.addColorStop){ g.addColorStop(0, 'rgba(200,190,255,0)'); g.addColorStop(.5, 'rgba(200,190,255,' + (.16*(1 - u)) + ')'); g.addColorStop(1, 'rgba(200,190,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}
