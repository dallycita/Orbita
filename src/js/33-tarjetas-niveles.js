// ---------- tarjetas vivas: cada galaxia se dibuja en movimiento, en tiempo real (WebGL) ----------
// Una sola escena a pantalla completa detrás de las tarjetas: al deslizar, cada galaxia se mueve con su tarjeta.
const LVGL = (() => {
  let gl = null,
    cv = null,
    prog = null,
    U = {},
    failed = false,
    buf = null;
  const FS = `
precision highp float;
uniform vec2 uRes; uniform float uT, uKA, uKB, uMix; uniform vec2 uCA, uCB; uniform float uS;
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
vec2 h22(vec2 p){ float n = h21(p); return vec2(n, h21(p + n)); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 5; i++){ s += a*vn(p); p = m*p; a *= .5; } return s; }
mat2 R2(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a)); }
vec3 stars(vec2 q, float sc, float dens, float bright){
  vec2 g = q/sc, id = floor(g), f = fract(g); vec3 c = vec3(0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
    vec2 o = vec2(x, y), cid = id + o; float n = h21(cid); if (n > dens) continue;
    vec2 sp = o + h22(cid*1.7); float dd = length(f - sp)*sc;
    float b = pow(h21(cid + 7.1), 6.)*1.6 + .12, tw = .7 + .3*sin(uT*(1. + 3.*n) + n*40.);
    vec3 col = mix(vec3(1., .82, .65), vec3(.72, .83, 1.), h21(cid + 3.3));
    c += col*b*tw*exp(-dd*dd*1.4)*bright;
  }
  return c;
}
// un disco iluminado por una fuente (para los planetas)
vec3 planet(vec2 p, vec2 c, float r, vec3 col, vec2 light){
  vec2 d = (p - c)/r; float l2 = dot(d, d); if (l2 > 1.) return vec3(-1.);
  vec3 n = vec3(d, sqrt(1. - l2)); float lam = clamp(dot(n, normalize(vec3(light, .35))), 0., 1.);
  return col*(.06 + .94*lam);
}
// ---- 0 · el Sistema solar: el Sol vivo y sus planetas en órbita ----
vec3 kSolar(vec2 p){
  float r = length(p), Rs = .15;
  float cor = exp(-max(r - Rs, 0.)*12.)*(.75 + .3*fbm(vec2(atan(p.y, p.x)*3., r*8. - uT*.25)));
  vec3 col = vec3(1., .62, .25)*cor*.9 + vec3(1., .5, .2)*exp(-r*4.)*.35;
  float ba = length(p/vec2(1., .36)); col += vec3(.55, .5, .45)*exp(-pow((ba - .715)/.025, 2.))*.06*(.5 + fbm(p*40.));   // cinturón de asteroides, como polvo
  return col;
}
// ---- 1 · las Nubes de Magallanes: irregulares, con la Tarántula y la Pequeña Nube ----
vec3 kMag(vec2 p){
  vec2 w = p + .06*vec2(fbm(p*3. + uT*.03), fbm(p*3. - uT*.03));
  vec2 b = R2(.45)*(w - vec2(-.1, .05)); float bar = exp(-pow(abs(b.x)/.42, 2.) - pow(abs(b.y)/.09, 2.));
  float cloud = smoothstep(.35, .9, fbm(w*3.2 + 2.))*exp(-length(w - vec2(-.05, .02))/.5);
  vec3 col = vec3(1., .86, .65)*bar*.9 + vec3(.6, .72, 1.)*cloud*1.2;
  // la nebulosa de la Tarántula: filamentos rosados y su cúmulo central
  vec2 tq = w - vec2(.28, -.16); float tr = length(tq), fil = fbm(vec2(atan(tq.y, tq.x)*2.5, tr*14. - uT*.08));
  col += vec3(1., .35, .6)*smoothstep(.28, 0., tr)*(.4 + .9*fil)*1.1 + vec3(.9, .95, 1.)*exp(-tr*tr/.0004)*1.2;
  // la Pequeña Nube, más lejos, y el puente de estrellas
  float smc = exp(-length((w - vec2(.85, .62))*vec2(1., 1.6))/.16)*(.6 + .6*fbm(w*6.));
  col += vec3(.75, .82, 1.)*smc*.8;
  float bridge = exp(-pow(abs(dot(w - vec2(.3, .3), normalize(vec2(-.62, .78)))), 2.)/.006)*smoothstep(1.1, .3, length(w - vec2(.4, .35)));
  col += vec3(.6, .7, 1.)*bridge*fbm(w*9.)*.25;
  col *= 1. - .55*smoothstep(.62, .8, fbm(w*5. + 9.))*exp(-length(w)/.6);          // polvo oscuro
  return col;
}
// ---- 2 · Andrómeda: espiral muy inclinada, núcleo dorado, brazos azules, polvo, M32 y M110 ----
vec3 kAnd(vec2 p){
  vec2 d = R2(-.62)*p; d.y /= .3; float r0 = length(d); d = R2(-uT*(.05 + .02/(r0 + .3)))*d;
  float r = length(d), ph = atan(d.y, d.x), tw = fbm(d*2.2 + 5.)*1.6, arm = 2.*(ph - log(r + .02)/.32) + tw, arms = .5 + .5*cos(arm);
  float clump = .55 + .9*fbm(d*9. + 1.3), disk = exp(-r/.4)*(.25 + .75*pow(arms, 2.2))*clump;
  float bulge = exp(-pow(r/.06, .65))*1.9 + exp(-r/.14)*.35;
  float lane = smoothstep(.45, .92, .5 + .5*cos(arm - .7)), dust = lane*smoothstep(.05, .16, r)*exp(-r/1.1)*(.5 + .9*fbm(d*11. + 7.));
  float hii = smoothstep(.7, .86, fbm(d*26. + 3.))*pow(arms, 3.)*smoothstep(.15, .3, r)*(1. - smoothstep(.55, .85, r));
  vec3 col = vec3(.5, .62, 1.)*disk + vec3(1., .86, .62)*bulge + vec3(1., .38, .62)*hii*2.4;
  col *= 1. - .85*clamp(dust, 0., 1.);
  vec2 m32 = p - vec2(.13, .1); col += vec3(1., .9, .75)*exp(-dot(m32, m32)/.0006)*.9;
  vec2 m110 = R2(.5)*(p - vec2(-.5, -.42)); m110.y /= .5; col += vec3(1., .9, .78)*exp(-dot(m110, m110)/.008)*.35;
  return col;
}
// ---- 3 · Centaurus A: elíptica gigante, franja de polvo torcida y chorros que salen disparados ----
vec3 kCen(vec2 p){
  float r = length(p); vec3 col = vec3(1., .88, .7)*(exp(-pow(r/.1, .7))*1.2 + exp(-r/.35)*.45);
  vec2 q = R2(.38)*p; float yl = q.y - .07*sin(q.x*3.4 + .4) - .02*sin(q.x*9.);
  float lane = exp(-yl*yl/.0035)*smoothstep(.85, .25, abs(q.x))*(.6 + .7*fbm(q*14. + vec2(uT*.03, 0.)));
  col *= 1. - .92*clamp(lane, 0., 1.);
  col += vec3(1., .4, .62)*lane*smoothstep(.6, .85, fbm(q*30. + 2.))*1.2;
  // chorros perpendiculares: nudos de energía que viajan hacia afuera
  vec2 j = R2(.38 + 1.5708)*p; float s = abs(j.x), perp = j.y;
  float knots = .35 + .65*pow(.5 + .5*sin(s*22. - uT*2.6), 3.);
  float jet = exp(-perp*perp/(.00012 + s*s*.004))*smoothstep(.02, .08, s)*(1. - smoothstep(.55, 1.2, s))*knots;
  col += vec3(.55, .78, 1.)*jet*.9;
  for (int k = 0; k < 2; k++){ float sg = k == 0 ? 1. : -1.; vec2 lc = R2(.38 + 1.5708)*vec2(1.25*sg, .06); float lb = exp(-length((p - vec2(lc.x, -lc.y)))/.2);
    col += vec3(1., .5, .25)*lb*(.25 + .2*fbm(p*5. + uT*.05)); }
  return col;
}
// ---- 4 · el Remolino: espiral perfecta vista de frente y su vecina al final de un brazo ----
vec3 kRem(vec2 p){
  vec2 c = p + vec2(.1, -.05); float r0 = length(c); vec2 d = R2(-uT*(.06 + .02/(r0 + .25)))*c;
  float r = length(d), ph = atan(d.y, d.x), arm = 2.*(ph - log(r + .02)/.28) + fbm(d*3.)*.8, arms = .5 + .5*cos(arm);
  float disk = exp(-r/.33)*(.15 + .85*pow(arms, 3.))*(.55 + .9*fbm(d*10.));
  float lane = smoothstep(.55, .95, .5 + .5*cos(arm - .55))*exp(-r/.9)*smoothstep(.04, .12, r);
  float hii = smoothstep(.68, .84, fbm(d*24. + 2.))*pow(arms, 3.)*smoothstep(.1, .25, r)*(1. - smoothstep(.45, .7, r));
  vec3 col = vec3(.52, .64, 1.)*disk*1.2 + vec3(1., .86, .62)*exp(-pow(r/.05, .7))*1.6 + vec3(1., .36, .6)*hii*2.4;
  col *= 1. - .8*lane;
  vec2 nc = p - vec2(.58, .52); float nb = exp(-length(nc)/.07);
  col += vec3(1., .85, .6)*nb*1.2*(1. - .5*exp(-pow(nc.y + .2*nc.x, 2.)/.0004)*smoothstep(.09, .02, length(nc)));
  col += vec3(.6, .7, 1.)*exp(-pow(length(p - vec2(.42, .35)) - .0, 2.)/.02)*.06;
  return col;
}
// ---- 5 · el Sombrero: casi de lado, núcleo enorme y su franja oscura con borde brillante ----
vec3 kSom(vec2 p){
  vec2 q = R2(-.08)*p; float bulge = exp(-length(q*vec2(1., 1.4))/.2)*1.3 + exp(-length(q*vec2(.8, 1.2))/.55)*.25;
  vec3 col = vec3(1., .9, .72)*bulge;
  float re = length(q*vec2(1., 1./.16));
  float disk = exp(-pow((re - .62)/.28, 2.))*.5;
  col += vec3(1., .88, .72)*disk*(q.y > -.01 ? .6 : .35);
  float lane = exp(-pow((re - .66)/.07, 2.))*step(-.002, q.y)*(.6 + .6*fbm(vec2(q.x*12. + uT*.08, q.y*30.)));
  col *= 1. - .93*clamp(lane, 0., 1.);
  col += vec3(1., .8, .6)*exp(-pow((re - .78)/.03, 2.))*step(0., q.y)*.35;
  return col;
}
// ---- 6 · M87: elíptica gigante, el chorro con nudos y el anillo de la primera foto de un agujero negro ----
vec3 kM87(vec2 p){
  float r = length(p); vec3 col = vec3(1., .86, .66)*(exp(-pow(r/.06, .6))*1.1 + exp(-r/.5)*.4);
  vec2 j = R2(.55)*p; float s = j.x, perp = j.y;
  float knots = .3 + .7*pow(.5 + .5*sin(s*30. - uT*3.), 4.);
  col += vec3(.6, .8, 1.)*exp(-perp*perp/(.00006 + s*s*.0016))*step(0., s)*(1. - smoothstep(.5, .95, s))*knots*1.2;
  return col;
}
// ---- 7 · Sagitario A*: el agujero negro de nuestra galaxia y las estrellas S que lo orbitan (S2 con su órbita real, e≈0,88) ----
vec3 kSgr(vec2 p){
  float r = length(p), an = atan(p.y, p.x);
  float sw = fbm(vec2(an*2. + uT*.6 + 3./(r + .1), r*6.));
  vec3 col = vec3(1., .42, .18)*exp(-pow((r - .3)/.18, 2.))*sw*.4 + vec3(.5, .2, .12)*exp(-r/.9)*.12;
  col *= 1. - .6*smoothstep(.55, .75, fbm(p*3. + 4.));
  return col;
}
vec3 kind(float k, vec2 p){
  if (k < .5) return kSolar(p); if (k < 1.5) return kMag(p); if (k < 2.5) return kAnd(p); if (k < 3.5) return kCen(p);
  if (k < 4.5) return kRem(p); if (k < 5.5) return kSom(p); if (k < 6.5) return kM87(p); return kSgr(p);
}
void main(){
  vec2 q = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 drift = vec2(sin(uT*.05), cos(uT*.04))*uRes.y*.006;
  vec3 col = vec3(.006, .007, .02) + vec3(.012, .01, .03)*(1. - q.y/uRes.y);
  vec2 pa = (q - uCA + drift)/uS, pb = (q - uCB + drift)/uS;
  if (uMix < .999){ float fa = smoothstep(2.4, .9, length(pa)); if (fa > 0.) col += kind(uKA, pa)*fa*(1. - uMix); }
  if (uMix > .001){ float fb = smoothstep(2.4, .9, length(pb)); if (fb > 0.) col += kind(uKB, pb)*fb*uMix; }
  col = 1. - exp(-col*1.3);
  col = mix(col, col*col*(3. - 2.*col), .3);
  vec2 uv = q/uRes; col *= .5 + .5*smoothstep(1.2, .35, length((uv - .5)*vec2(1.1, .9)));
  gl_FragColor = vec4(max(col, 0.), 1.);
}`;
  function init() {
    if (gl || failed) {
      return !!gl;
    }
    try {
      cv = document.createElement('canvas');
      gl =
        cv.getContext && cv.getContext('webgl', { preserveDrawingBuffer: true, antialias: false });
      if (!gl || !gl.createShader) {
        gl = null;
        failed = true;
        return false;
      }
      const sh = (ty, src) => {
        const s = gl.createShader(ty);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.warn(gl.getShaderInfoLog(s));
          return null;
        }
        return s;
      };
      const v = sh(
          gl.VERTEX_SHADER,
          'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }',
        ),
        f = sh(gl.FRAGMENT_SHADER, FS);
      if (!v || !f) {
        gl = null;
        failed = true;
        return false;
      }
      prog = gl.createProgram();
      gl.attachShader(prog, v);
      gl.attachShader(prog, f);
      gl.bindAttribLocation(prog, 0, 'p');
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl = null;
        failed = true;
        return false;
      }
      ['uRes', 'uT', 'uKA', 'uKB', 'uMix', 'uCA', 'uCB', 'uS'].forEach(
        k => (U[k] = gl.getUniformLocation(prog, k)),
      );
      buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      return true;
    } catch (e) {
      gl = null;
      failed = true;
      return false;
    }
  }
  function soft(w, h, ka, kb, mix, ca, cb, scale) {
    if (!init()) {
      return null;
    }
    const q = Math.min(1, 520 / Math.max(w, h)),
      cw = Math.max(2, Math.round(w * q)),
      ch = Math.max(2, Math.round(h * q));
    if (cv.width !== cw || cv.height !== ch) {
      cv.width = cw;
      cv.height = ch;
    }
    gl.viewport(0, 0, cw, ch);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(U.uRes, cw, ch);
    gl.uniform1f(U.uT, t);
    gl.uniform1f(U.uKA, ka);
    gl.uniform1f(U.uKB, kb);
    gl.uniform1f(U.uMix, mix);
    gl.uniform2f(U.uCA, ca[0] * q, ca[1] * q);
    gl.uniform2f(U.uCB, cb[0] * q, cb[1] * q);
    gl.uniform1f(U.uS, scale * q);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return cv;
  }
  return { soft, ok: () => init() };
})();
let lvCanvas = null,
  lvArts = [];
// ---------- tarjetas: todo lo nítido se dibuja a resolución completa (estrellas, planetas, el Sol, los agujeros negros) ----------
let lvStars = null,
  lvSets = null;
function lvRand(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
function lvPrep() {
  if (lvStars) {
    return;
  }
  const R = lvRand(9123);
  lvStars = [];
  for (let i = 0; i < 520; i++) {
    lvStars.push({
      x: R(),
      y: R(),
      s: R() < 0.92 ? 0.5 + R() * 0.8 : 1.2 + R() * 1.1,
      tw: R() * 6.28,
      sp: 0.5 + R() * 2,
      d: R() < 0.7 ? 0.3 : 1,
      c: R() < 0.5 ? '#ffffff' : R() < 0.5 ? '#cfe0ff' : '#ffe8cc',
    });
  }
  const g = () => (R() + R() + R() - 1.5) / 1.5;
  lvSets = {
    1: Array.from({ length: 320 }, (_, i) =>
      i < 220
        ? { x: -0.08 + g() * 0.55, y: 0.03 + g() * 0.22, b: R() }
        : i < 290
          ? { x: 0.85 + g() * 0.18, y: 0.62 + g() * 0.1, b: R() * 0.7 }
          : { x: 0.28 + g() * 0.05, y: -0.16 + g() * 0.05, b: 1 },
    ),
    5: Array.from({ length: 150 }, () => {
      const a = R() * 6.28,
        r = Math.abs(g()) * 1.1 + 0.1;
      return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.8, b: R() };
    }),
    6: Array.from({ length: 260 }, () => {
      const a = R() * 6.28,
        r = Math.abs(g()) * 0.9 + 0.02;
      return { x: Math.cos(a) * r, y: Math.sin(a) * r, b: R() };
    }),
    2: Array.from({ length: 120 }, () => {
      const a = R() * 6.28,
        r = Math.sqrt(R()) * 0.75;
      const x = Math.cos(a) * r,
        y = Math.sin(a) * r * 0.3,
        c = Math.cos(-0.62),
        s = Math.sin(-0.62);
      return { x: x * c - y * s, y: x * s + y * c, b: R() };
    }),
  };
}
function lvGlow(x, y, r, col, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = a;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function lvPoints(list, cx, cy, S, col, size) {
  for (const p of list) {
    const tw = 0.6 + 0.4 * Math.sin(t * 2 + p.b * 40);
    ctx.globalAlpha = (0.35 + 0.65 * p.b) * tw * lvA;
    ctx.fillStyle = col;
    const s = size * (0.6 + p.b);
    ctx.fillRect(cx + p.x * S - s / 2, cy + p.y * S - s / 2, s, s);
  }
}
function lvSpike(x, y, r, a) {
  // estrella brillante con destellos que se desvanecen (como en las fotos de los telescopios)
  ctx.globalAlpha = a * lvA;
  ctx.lineWidth = 1;
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const g = ctx.createLinearGradient(x, y, x + dx * r * 1.6, y + dy * r * 1.6);
    g.addColorStop(0, 'rgba(235,242,255,.95)');
    g.addColorStop(1, 'rgba(235,242,255,0)');
    ctx.strokeStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx * r * 1.6, y + dy * r * 1.6);
    ctx.stroke();
  }
  lvGlow(x, y, r * 0.7, 'rgba(200,220,255,.55)', a * lvA);
  lvGlow(x, y, r * 0.22, 'rgba(255,255,255,1)', a * lvA);
}
function lvKepler(a, e, w, P, M0) {
  const M = (2 * Math.PI * t) / P + M0;
  let E = M;
  for (let i = 0; i < 6; i++) {
    E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }
  const r = a * (1 - e * Math.cos(E)),
    nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  return [Math.cos(nu + w) * r, Math.sin(nu + w) * r];
}
let lvA = 1;
const LV_PL = [
  ['mercurio', 0.022],
  ['venus', 0.036],
  ['tierra', 0.04],
  ['marte', 0.03],
  ['jupiter', 0.085],
  ['saturno', 0.07],
];
function lvCrisp(k, cx, cy, S, alpha) {
  lvA = alpha;
  if (alpha < 0.01) {
    return;
  }
  ctx.save();
  if (k === 0) {
    // órbitas
    ctx.globalAlpha = 0.16 * alpha;
    ctx.strokeStyle = '#b8c4e6';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = (0.3 + i * 0.17) * S;
      ctx.beginPath();
      ctx.ellipse(cx, cy, a, a * 0.36, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    const pls = LV_PL.map(([id, r], i) => {
      const a = 0.3 + i * 0.17,
        ang = t * (0.9 / Math.pow(a / 0.3, 1.5)) * 0.35 + i * 1.9;
      return {
        id,
        r: r * S,
        x: cx + Math.cos(ang) * a * S,
        y: cy + Math.sin(ang) * a * 0.36 * S,
        front: Math.sin(ang) > 0,
      };
    });
    const drawPl = p => {
      const dx = cx - p.x,
        dy = cy - p.y,
        L = Math.hypot(dx, dy) || 1;
      ctx.globalAlpha = alpha;
      drawBigPlanet(p.id, p.x, p.y, Math.max(2, p.r), t * 0.6, false, { x: dx / L, y: dy / L });
    };
    pls.filter(p => !p.front).forEach(drawPl);
    // el Sol: disco nítido con borde más oscuro y manchas que hierven
    const Rs = 0.15 * S,
      sg = ctx.createRadialGradient(cx - Rs * 0.15, cy - Rs * 0.15, Rs * 0.05, cx, cy, Rs);
    sg.addColorStop(0, '#fffdf2');
    sg.addColorStop(0.45, '#ffeab0');
    sg.addColorStop(0.8, '#ffc061');
    sg.addColorStop(1, '#f08a2c');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(cx, cy, Rs, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, Rs, 0, Math.PI * 2);
    ctx.clip();
    for (let i = 0; i < 26; i++) {
      const a = i * 2.39996 + t * 0.05 * ((i % 3) - 1),
        rr = Math.sqrt((i + 0.5) / 26) * Rs * 0.95,
        x = cx + Math.cos(a) * rr,
        y = cy + Math.sin(a) * rr,
        p = 0.5 + 0.5 * Math.sin(t * 1.5 + i * 1.7);
      lvGlow(
        x,
        y,
        Rs * (0.08 + 0.06 * p),
        i % 2 ? 'rgba(255,255,240,.4)' : 'rgba(240,150,50,.18)',
        alpha * 0.45,
      );
    }
    ctx.restore();
    pls.filter(p => p.front).forEach(drawPl);
  } else if (k === 1) {
    lvPoints(lvSets[1], cx, cy, S, '#e8f0ff', 1.4);
    for (let i = 0; i < 9; i++) {
      const a = i * 0.7 + t * 0.1,
        r = (i % 3) * 0.012 * S;
      lvSpike(
        cx + 0.28 * S + Math.cos(a) * r,
        cy - 0.16 * S + Math.sin(a) * r,
        5 + (i === 0 ? 5 : 0),
        0.9,
      );
    }
  } else if (k === 2) {
    lvPoints(lvSets[2], cx, cy, S, '#dfe6ff', 1.2);
    lvGlow(cx + 0.13 * S, cy + 0.1 * S, 0.02 * S, 'rgba(255,240,215,.95)', alpha);
    lvGlow(cx, cy, 0.025 * S, 'rgba(255,250,235,1)', alpha);
  } else if (k === 3) {
    lvGlow(cx, cy, 0.03 * S, 'rgba(255,245,225,.9)', alpha);
    lvSpike(cx - 0.55 * S, cy - 0.4 * S, 9, 0.8);
    lvSpike(cx + 0.62 * S, cy + 0.3 * S, 7, 0.7);
  } else if (k === 4) {
    lvGlow(cx - 0.1 * S, cy + 0.05 * S, 0.03 * S, 'rgba(255,248,230,1)', alpha);
    lvGlow(cx + 0.58 * S, cy - 0.52 * S, 0.022 * S, 'rgba(255,236,200,1)', alpha);
    lvSpike(cx - 0.6 * S, cy + 0.5 * S, 8, 0.7);
  } else if (k === 5) {
    lvPoints(lvSets[5], cx, cy, S, '#fff0d8', 1.3);
  } else if (k === 6) {
    lvPoints(lvSets[6], cx, cy, S, '#ffe9cc', 1.2);
    // el anillo de la primera foto de un agujero negro (más brillante abajo)
    const r = 0.065 * S;
    for (let i = 0; i < 48; i++) {
      const a0 = (i / 48) * Math.PI * 2,
        a1 = a0 + (Math.PI * 2) / 48 + 0.01,
        br = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(a0)) + 0.1 * Math.sin(t * 1.3 + a0 * 2);
      ctx.globalAlpha = alpha * Math.min(1, br);
      ctx.strokeStyle =
        'rgb(255,' + Math.round(110 + 90 * br) + ',' + Math.round(40 + 60 * br) + ')';
      ctx.lineWidth = r * 0.32;
      ctx.beginPath();
      ctx.arc(cx, cy, r, a0, a1);
      ctx.stroke();
    }
    lvGlow(cx, cy, r * 2.2, 'rgba(255,120,40,.35)', alpha);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
    ctx.fill();
  } else if (k === 7) {
    // Sagitario A*: el mismo agujero negro de la introducción, con las estrellas S que lo orbitan
    const R = 0.19 * S;
    const orb = [
      [0.6, 0.88, 0.4, 16, 0],
      [0.72, 0.42, 2.1, 23, 2],
      [0.84, 0.55, 3.8, 30, 4],
      [0.96, 0.3, 5.2, 37, 1],
    ];
    ctx.globalAlpha = 0.13 * alpha;
    ctx.strokeStyle = '#aebfff';
    ctx.lineWidth = 1;
    for (const [a, e, w] of orb) {
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const E = (i / 80) * Math.PI * 2,
          rr = a * (1 - e * Math.cos(E)),
          nu =
            2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
        const x = cx + Math.cos(nu + w) * rr * S,
          y = cy + Math.sin(nu + w) * rr * S * 0.55;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    const sp = orb.map(([a, e, w, P, M0]) => {
      const [x, y] = lvKepler(a, e, w, P, M0);
      return [cx + x * S, cy + y * S * 0.55, y];
    });
    sp.filter(s => s[2] < 0).forEach(s => lvSpike(s[0], s[1], 8, 1));
    ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(cx, cy, R, cx, cy, R * 4.2);
    g.addColorStop(0, 'rgba(255,100,28,.24)');
    g.addColorStop(1, 'rgba(255,100,28,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - R * 4.2, cy - R * 4.2, R * 8.4, R * 8.4);
    bhDiskK(cx, cy, R, SK, BR0, BR1, Math.PI - 0.03, Math.PI * 2 + 0.03, alpha);
    bhCore(cx, cy, R, alpha);
    bhDiskK(cx, cy, R, SK, BR0, BR1, 0, Math.PI, alpha);
    sp.filter(s => s[2] >= 0).forEach(s => lvSpike(s[0], s[1], 8, 1));
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
// escala de cada galaxia dentro de su zona: Sistema solar, Magallanes, Andrómeda, Centaurus A, Remolino, Sombrero, M87, Sagitario A*
const LV_SCALE = [1.0, 0.9, 1.22, 0.95, 0.88, 1.12, 1.6, 1.02];
function drawLevelsBG() {
  if (!elLv || !elLv.querySelector) {
    return;
  }
  const track = elLv.querySelector('.track');
  if (!track) {
    return;
  }
  lvPrep();
  const pos = track.scrollLeft / Math.max(1, track.clientWidth);
  const ka = Math.max(0, Math.min(LEVELS.length - 1, Math.floor(pos))),
    kb = Math.min(LEVELS.length - 1, ka + 1),
    mix = Math.min(1, Math.max(0, pos - ka));
  const cen = i => {
    const a = lvArts[i];
    if (!a || !a.getBoundingClientRect) {
      return [W / 2 - (i - pos) * 0, H * 0.3];
    }
    const r = a.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };
  const art = lvArts[ka],
    ar = art && art.getBoundingClientRect ? art.getBoundingClientRect() : null;
  const sz = (ar ? Math.min(ar.width, ar.height) : Math.min(W, H) * 0.46) * 0.95;
  // cada destino con el mismo peso visual: los objetos chicos (M87, Sombrero…) se agrandan, sin salirse de la pantalla
  const scl = k => Math.min(sz * (LV_SCALE[k] || 1), W * 0.92, (ar ? ar.height : H) * 1.25);
  const zA = 1,
    zB = 1;
  const A = cen(ka),
    B = cen(kb);
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#05060c';
  ctx.fillRect(0, 0, W, H);
  const soft = LVGL.soft(W, H, ka, kb, mix, A, B, scl(ka) * zA * (1 - mix) + scl(kb) * zB * mix);
  if (soft) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(soft, 0, 0, W, H);
  }
  // estrellas nítidas, en dos profundidades
  // paralaje: al deslizar, las estrellas lejanas se mueven poco y las cercanas más (profundidad, sin efectos bruscos)
  for (const s of lvStars) {
    const x = (((s.x * W - t * (s.d < 0.5 ? 2 : 5) - pos * W * (0.05 + 0.22 * s.d)) % W) + W) % W,
      y = s.y * H;
    ctx.globalAlpha = (0.25 + 0.5 * s.d) * (0.65 + 0.35 * Math.sin(t * s.sp + s.tw));
    ctx.fillStyle = s.c;
    ctx.fillRect(x, y, s.s, s.s);
  }
  if (mix < 0.999) {
    lvCrisp(ka, A[0], A[1], scl(ka) * zA, 1 - mix);
  }
  if (mix > 0.001) {
    lvCrisp(kb, B[0], B[1], scl(kb) * zB, mix);
  }
  ctx.restore();
  elLv.classList.toggle('live', !!soft);
}
