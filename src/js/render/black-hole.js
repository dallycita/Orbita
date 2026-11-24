/**
 * (encabezado pendiente)
 */
import { BONE, clamp, ctx } from '../01-pantalla-y-utilidades.js';
import { t } from '../08-partida-estado.js';

// true cuando la letra Unbounded ya cargó; antes, el logo se dibuja con la letra del sistema
let splashFont = false;

/**
 * Marca si la letra del logo ya está lista.
 *
 * @param {boolean} value true cuando la letra cargó.
 * @returns {boolean} El mismo valor.
 */
function setSplashFont(value) {
  splashFont = value;
  return value;
}

/**
 * Dibuja el agujero negro de la marca visto casi desde arriba (como en el juego).
 *
 * @param {number} cx Centro horizontal, en píxeles de pantalla.
 * @param {number} cy Centro vertical, en píxeles de pantalla.
 * @param {number} R Radio del horizonte, en píxeles de pantalla.
 * @param {number} alpha Opacidad, de 0 a 1.
 * @param {number} flare Destello del borde, de 0 a 1.
 */
function brandHole(cx, cy, R, alpha, flare) {
  bhDiskK(cx, cy, R, 0.96, 1.06, 1.6, 0, Math.PI * 2, alpha);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = bcol(0.95, 0.9);
  ctx.lineWidth = Math.max(1.2, R * 0.03) + flare * 5;
  ctx.shadowColor = '#ff5a1f';
  ctx.shadowBlur = 10 + flare * 36;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.015, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

/**
 * Dibuja el logotipo ÓRBITA centrado, con su animación de entrada.
 *
 * @param {number} midX Centro horizontal del logotipo, en píxeles de pantalla.
 * @param {number} cy Línea central vertical, en píxeles de pantalla.
 * @param {number} fs Tamaño de letra, en píxeles de pantalla.
 * @param {number} [p] Tiempo de la animación, en segundos (sin él, el logotipo completo).
 */
function drawLogo(midX, cy, fs, p) {
  if (p === undefined) {
    p = 99;
  }
  ctx.save();
  const pO = easeIO2(clamp(p / 1.0, 0, 1)),
    Rf0 = fs * LOGO.r,
    word = 'RBITA',
    ls = fs * LOGO.track;
  ctx.font =
    LOGO.weight + ' ' + fs + 'px ' + (splashFont ? 'Unbounded' : 'system-ui') + ', sans-serif';
  const mw = s => {
    const m = ctx.measureText(s);
    return (m && m.width) || s.length * fs * 0.75;
  };
  const tw = mw(word) + ls * (word.length - 1),
    cx = midX - (Rf0 * LOGO.disk + Rf0 * LOGO.txt + tw) / 2 + Rf0 * LOGO.disk;
  const Rf = Rf0 * (0.55 + 0.45 * pO);
  ctx.globalAlpha = pO;
  const g = ctx.createRadialGradient(cx, cy, Rf, cx, cy, Rf * 4);
  g.addColorStop(0, 'rgba(255,100,28,.16)');
  g.addColorStop(1, 'rgba(255,100,28,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, Rf * 4, 0, Math.PI * 2);
  ctx.fill();
  bhDisk(cx, cy, Rf, Math.PI - 0.03, Math.PI * 2 + 0.03, pO, LOGO.disk);
  bhCore(cx, cy, Rf, pO);
  bhDisk(cx, cy, Rf, 0, Math.PI, pO, LOGO.disk);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = BONE;
  // letras una por una, subiendo suavemente (como en la presentación)
  for (let i = 0; i < word.length; i++) {
    const la = clamp((p - (0.7 + i * 0.16)) / 0.5, 0, 1);
    if (la <= 0) {
      continue;
    }
    ctx.globalAlpha = easeIO2(la);
    ctx.fillText(
      word[i],
      cx + Rf0 * LOGO.txt + mw(word.slice(0, i)) + ls * i,
      cy + fs * 0.36 + (1 - easeIO2(la)) * 8,
    );
  }
  ctx.globalAlpha = 1;
  // la Tierra sale disparada del agujero negro y se queda como el acento
  if (p > 1.6) {
    drawAccent(cx, cy, Rf, 1 - Math.pow(1 - clamp((p - 1.6) / 0.55, 0, 1), 3));
  }
  ctx.restore();
}

const BR0 = 1.35;

const BR1 = 2.05;

const SK = Math.sin((37 * Math.PI) / 180);

/** Aceleración y frenado suaves (cuadrática): de 0 a 1 en v de 0 a 1. */
const easeIO2 = v => (v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2);

/**
 * Color del disco para un brillo dado, interpolado en la paleta `BST`.
 *
 * @param {number} b Brillo, de 0 a 1.
 * @param {number} a Opacidad, de 0 a 1.
 * @returns {string} Color CSS rgba.
 */
function bcol(b, a) {
  b = Math.max(0, Math.min(1, b));
  for (let i = 1; i < BST.length; i++) {
    if (b <= BST[i][0]) {
      const [p0, c0] = BST[i - 1],
        [p1, c1] = BST[i],
        u = (b - p0) / (p1 - p0);
      return 'rgba(' + c0.map((v, j) => Math.round(v + (c1[j] - v) * u)).join(',') + ',' + a + ')';
    }
  }
  return 'rgba(255,246,222,' + a + ')';
}

/**
 * Dibuja media parte del disco inclinado a 37° (la de atrás si `from` > 1, si no la de delante),
 * en WebGL o, si no hay, con anillos 2D.
 *
 * @param {number} cx Centro horizontal, en píxeles de pantalla.
 * @param {number} cy Centro vertical, en píxeles de pantalla.
 * @param {number} R Radio del horizonte, en píxeles de pantalla.
 * @param {number} from Ángulo inicial del arco, en radianes.
 * @param {number} to Ángulo final del arco, en radianes.
 * @param {number} alpha Opacidad, de 0 a 1.
 * @param {number} [f1] Radio exterior del disco, en radios del horizonte (BR1 si se omite).
 */
function bhDisk(cx, cy, R, from, to, alpha, f1) {
  if (BHGL.draw(from > 1 ? 0 : 1, cx, cy, R, SK, BR0, f1 || BR1, alpha)) {
    return;
  }
  const r0 = R * BR0,
    r1 = R * (f1 || BR1),
    step = Math.max(1, R * 0.02),
    n = R > 30 ? 56 : 28;
  for (let r = r1; r >= r0; r -= step) {
    const fade = Math.min(1, (r1 - r) / (R * 0.4) + 0.15) * alpha;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * SK, 0, from, to);
    ctx.strokeStyle = bstyle(cx, cy, r, SK, r0, r1, fade, false, n);
    ctx.lineWidth = step * 1.8;
    ctx.stroke();
  }
}

/**
 * Dibuja el disco con cualquier inclinación y radios; un arco completo (de 0 a 2π) dibuja las dos
 * mitades.
 *
 * @param {number} cx Centro horizontal, en píxeles de pantalla.
 * @param {number} cy Centro vertical, en píxeles de pantalla.
 * @param {number} R Radio del horizonte, en píxeles de pantalla.
 * @param {number} k Aplastamiento vertical del disco (1: visto de frente).
 * @param {number} f0 Radio interior del disco, en radios del horizonte.
 * @param {number} f1 Radio exterior del disco, en radios del horizonte.
 * @param {number} from Ángulo inicial del arco, en radianes.
 * @param {number} to Ángulo final del arco, en radianes.
 * @param {number} alpha Opacidad, de 0 a 1.
 */
function bhDiskK(cx, cy, R, k, f0, f1, from, to, alpha) {
  if (from === 0 && to > 6) {
    if (BHGL.draw(0, cx, cy, R, k, f0, f1, alpha)) {
      BHGL.draw(1, cx, cy, R, k, f0, f1, alpha);
      return;
    }
  } else if (BHGL.draw(from > 1 ? 0 : 1, cx, cy, R, k, f0, f1, alpha)) {
    return;
  }
  const r0 = R * f0,
    r1 = R * f1,
    step = Math.max(1.6, R * 0.035);
  for (let r = r1; r >= r0; r -= step) {
    const fade = Math.min(1, (r1 - r) / (R * 0.35) + 0.15) * alpha;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * k, 0, from, to);
    ctx.strokeStyle = bstyle(cx, cy, r, k, r0, r1, fade, false);
    ctx.lineWidth = step * 1.3;
    ctx.stroke();
  }
}

// Agujero negro en alta calidad: el mismo diseño (mismos colores, misma forma, mismo giro),
// dibujado píxel a píxel en la GPU en un canvas aparte y copiado al lienzo principal.
const BHGL = (() => {
  let cv = null,
    gl = null,
    pr = null,
    U = {},
    ok = null;
  const FS = `precision highp float;
    uniform vec2 uSize; uniform float uR, uK, uR0, uR1, uT, uAlpha, uPart, uScale;
    vec3 bcol(float b){ b = clamp(b, 0., 1.);
      vec3 c0 = vec3(50.,10.,4.)/255., c1 = vec3(150.,38.,8.)/255., c2 = vec3(255.,100.,28.)/255., c3 = vec3(255.,196.,96.)/255., c4 = vec3(255.,246.,222.)/255.;
      if (b < .35) return mix(c0, c1, b/.35); if (b < .6) return mix(c1, c2, (b - .35)/.25); if (b < .82) return mix(c2, c3, (b - .6)/.22); return mix(c3, c4, (b - .82)/.18); }
    float bbright(float th, float r, float r0, float r1){ float rad = 1. - (r - r0)/(r1 - r0), dop = .5 - .5*cos(th), s = .89 + .11*sin(th*5. + r/uR*7. - uT*2.4*pow(r0/r, 1.5));   // el dibujo del disco escala con su tamaño: no se vuelve un disco de vinilo al crecer
      return (.25 + .75*pow(max(rad, 0.), .8))*(.4 + .6*dop)*s; }
    void main(){
      vec2 p = (gl_FragCoord.xy - .5*uSize); p.y = -p.y;           // y hacia abajo, como el lienzo 2D
      vec4 o = vec4(0.);
      if (uPart < 1.5){                                             // disco: 0 = mitad de atrás (arriba), 1 = mitad de delante (abajo)
        float hm = uPart < .5 ? 1. - smoothstep(-.5, .5, p.y) : smoothstep(-1.5, -.5, p.y);   // mitades complementarias: sin costura
        float r = length(vec2(p.x, p.y/uK)), th = atan(p.y/uK, p.x);
        float r0 = uR*uR0, r1 = uR*uR1;
        if (r >= r0 - 1. && r <= r1 + 1.){
          float fade = min(1., (r1 - r)/(uR*.35) + .15)*uAlpha;
          float a = 1. - pow(1. - clamp(fade, 0., 1.), 2.2);
          a *= smoothstep(r0 - 1., r0 + 1., r)*smoothstep(r1 + 1., r1 - 1., r)*hm;
          vec3 c = bcol(bbright(th, r, r0, r1)); c = clamp(mix(vec3(dot(c, vec3(.299,.587,.114))), c, 1.12), 0., 1.);
          o = vec4(c*a, a);
        }
      } else {                                                      // la luz curvada alrededor de la esfera
        float rho = length(p), ph = atan(p.y, p.x), up = .5 - .5*sin(ph);
        float q = (rho/uR - 1.03)/(.08 + .16*up);
        if (q >= -.05 && q <= 1.05){
          float rd = uR*1.35 + clamp(q, 0., 1.)*uR*(2.05 - 1.35);
          float a = uAlpha*(1. - clamp(q, 0., 1.)*.6)*(.45 + .45*up);
          a = 1. - pow(1. - clamp(a, 0., 1.), .75/(.08 + .16*up));   // tantas capas como el dibujo original
          a *= smoothstep(-.05, .02, q)*smoothstep(1.05, .97, q);
          vec3 c = bcol(bbright(ph, rd, uR*1.35, uR*2.05)); c = clamp(mix(vec3(dot(c, vec3(.299,.587,.114))), c, 1.12), 0., 1.);
          o = vec4(c*a, a);
        }
      }
      gl_FragColor = o;
    }`;
  function init() {
    if (ok !== null) {
      return ok;
    }
    try {
      cv = document.createElement('canvas');
      gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
      if (!gl) {
        ok = false;
        return ok;
      }
      const sh = (t, src) => {
        const o = gl.createShader(t);
        gl.shaderSource(o, src);
        gl.compileShader(o);
        if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) {
          throw new Error(gl.getShaderInfoLog(o));
        }
        return o;
      };
      pr = gl.createProgram();
      gl.attachShader(
        pr,
        sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'),
      );
      gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
        throw new Error('link');
      }
      gl.useProgram(pr);
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const l = gl.getAttribLocation(pr, 'p');
      gl.enableVertexAttribArray(l);
      gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
      ['uSize', 'uR', 'uK', 'uR0', 'uR1', 'uT', 'uAlpha', 'uPart', 'uScale'].forEach(
        n => (U[n] = gl.getUniformLocation(pr, n)),
      );
      ok = true;
    } catch (e) {
      ok = false;
      try {
        console.warn('BHGL', e && e.message);
      } catch (_) {}
    }
    return ok;
  }
  /**
   * Dibuja una parte del agujero negro centrada en (cx, cy) del lienzo principal, a la resolución
   * real de la pantalla.
   *
   * @param {number} part 0: mitad de atrás del disco; 1: mitad de delante; 2: anillo de luz.
   * @param {number} cx Centro horizontal, en píxeles de pantalla.
   * @param {number} cy Centro vertical, en píxeles de pantalla.
   * @param {number} R Radio del horizonte, en píxeles de pantalla.
   * @param {number} k Aplastamiento vertical del disco (1: visto de frente).
   * @param {number} f0 Radio interior del disco, en radios del horizonte.
   * @param {number} f1 Radio exterior del disco, en radios del horizonte.
   * @param {number} alpha Opacidad, de 0 a 1.
   * @returns {boolean} Falso si no hay WebGL (quien llama dibuja el respaldo 2D).
   */
  function draw(part, cx, cy, R, k, f0, f1, alpha) {
    if (!init() || !(R > 2)) {
      return false;
    }
    let sc = 1;
    try {
      const m = ctx.getTransform && ctx.getTransform();
      sc = m ? Math.hypot(m.a, m.b) : window.devicePixelRatio || 1;
    } catch (e) {}
    const ext = part === 2 ? R * 1.3 : R * f1 + 2,
      w = Math.min(4096, Math.ceil(ext * 2 * sc) + 4),
      h = part === 2 ? w : Math.min(4096, Math.ceil((R * f1 * k + 2) * 2 * sc) + 4);
    if (cv.width !== w || cv.height !== h) {
      cv.width = w;
      cv.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.uSize, w, h);
    gl.uniform1f(U.uR, R * sc);
    gl.uniform1f(U.uK, k);
    gl.uniform1f(U.uR0, f0);
    gl.uniform1f(U.uR1, f1);
    gl.uniform1f(U.uT, t);
    gl.uniform1f(U.uAlpha, alpha);
    gl.uniform1f(U.uPart, part);
    gl.uniform1f(U.uScale, sc);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    const ga = ctx.globalAlpha;
    ctx.globalAlpha = 1;
    ctx.drawImage(cv, cx - w / sc / 2, cy - h / sc / 2, w / sc, h / sc);
    ctx.globalAlpha = ga;
    return true;
  }
  return { draw };
})();

// ---- El logotipo: la Ó es el agujero negro a 37° y su acento es la Tierra ----
// Proporciones del logotipo, en tamaños de letra (r) y en radios del agujero (disk, txt).
const LOGO = { r: 0.42, disk: 1.8, txt: 1.55, track: 0.2, weight: 400 };

/**
 * Dibuja el acento de la Ó: la Tierra escapando, con una estela inclinada como un acento agudo.
 *
 * @param {number} cx Centro horizontal de la Ó, en píxeles de pantalla.
 * @param {number} cy Centro vertical de la Ó, en píxeles de pantalla.
 * @param {number} R Radio del agujero de la Ó, en píxeles de pantalla.
 * @param {number} p Avance del vuelo de la Tierra, de 0 (en el agujero) a 1 (en su lugar).
 */
function drawAccent(cx, cy, R, p) {
  const dx = 0.574,
    dy = -0.819,
    ex = cx + R * 0.55 - dx * (1 - p) * R * 3,
    ey = cy - R * 1.62 - dy * (1 - p) * R * 3;
  const re = Math.max(3, R * 0.19),
    L = R * (0.55 + 0.25 * p),
    tx = ex - dx * L,
    ty = ey - dy * L,
    px = -dy * re * 0.85,
    py = dx * re * 0.85;
  const g = ctx.createLinearGradient(tx, ty, ex, ey);
  if (g && g.addColorStop) {
    g.addColorStop(0, 'rgba(143,208,255,0)');
    g.addColorStop(1, 'rgba(143,208,255,.75)');
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = 'rgba(143,208,255,.5)';
  }
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(ex + px, ey + py);
  ctx.lineTo(ex - px, ey - py);
  ctx.closePath();
  ctx.fill();
  splashEarth(ex, ey, re);
}

/**
 * Dibuja el horizonte negro y el anillo de luz curvada a su alrededor; va entre las dos mitades
 * del disco.
 *
 * @param {number} cx Centro horizontal, en píxeles de pantalla.
 * @param {number} cy Centro vertical, en píxeles de pantalla.
 * @param {number} R Radio del horizonte, en píxeles de pantalla.
 * @param {number} alpha Opacidad del anillo, de 0 a 1.
 */
function bhCore(cx, cy, R, alpha) {
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  // la luz curvada alrededor de la esfera: un solo anillo continuo, más grueso arriba y más fino
  // abajo
  const dq = R > 30 ? 0.04 : 0.1,
    N = 120,
    ns = R > 30 ? 48 : 28;
  if (BHGL.draw(2, cx, cy, R, 1, 1, 1, alpha)) {
    /* Con WebGL el anillo ya está dibujado. */
  } else {
    for (let q = 0; q <= 1.0001; q += dq) {
      const rd = R * BR0 + q * R * (BR1 - BR0),
        g = ctx.createConicGradient ? ctx.createConicGradient(0, cx, cy) : null;
      if (g) {
        for (let i = 0; i <= ns; i++) {
          const ph = (i / ns) * Math.PI * 2,
            up = 0.5 - 0.5 * Math.sin(ph);
          g.addColorStop(
            i / ns,
            bcol(bbright(ph, rd, R * BR0, R * BR1), alpha * (1 - q * 0.6) * (0.45 + 0.45 * up)),
          );
        }
      }
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const ph = (i / N) * Math.PI * 2,
          up = 0.5 - 0.5 * Math.sin(ph),
          rr2 = R * (1.03 + (0.08 + 0.16 * up) * q);
        const px = cx + Math.cos(ph) * rr2,
          py = cy + Math.sin(ph) * rr2;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = g || bcol(0.6, alpha * 0.45 * (1 - q * 0.6));
      ctx.lineWidth = Math.max(1.8, R * 0.03);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = bcol(0.95, 0.85);
  ctx.lineWidth = Math.max(1.2, R * 0.022) + sfl * 5;
  ctx.shadowColor = '#ff5a1f';
  ctx.shadowBlur = sfl * 40;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.015, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

// Colores del disco según su brillo (de 0 a 1): de rojo oscuro a blanco cálido.
const BST = [
  [0, [50, 10, 4]],
  [0.35, [150, 38, 8]],
  [0.6, [255, 100, 28]],
  [0.82, [255, 196, 96]],
  [1, [255, 246, 222]],
];

let sfl = 0;

/**
 * Brillo del disco en un punto: más brillante por dentro, más del lado que se acerca (efecto
 * Doppler) y con vetas que giran más rápido cerca del centro (como una órbita de Kepler).
 *
 * @param {number} th Ángulo en el disco, en radianes.
 * @param {number} r Distancia al centro, en píxeles de pantalla.
 * @param {number} r0 Radio interior del disco, en píxeles de pantalla.
 * @param {number} r1 Radio exterior del disco, en píxeles de pantalla.
 * @returns {number} Brillo, de 0 a 1 aproximadamente.
 */
function bbright(th, r, r0, r1) {
  const rad = 1 - (r - r0) / (r1 - r0),
    dop = 0.5 - 0.5 * Math.cos(th),
    s = 0.82 + 0.18 * Math.sin(th * 5 + (r / r0) * 10 - t * 2.4 * Math.pow(r0 / r, 1.5));
  return (0.25 + 0.75 * Math.pow(rad, 0.8)) * (0.4 + 0.6 * dop) * s;
}

/**
 * Degradado cónico con el brillo del disco alrededor de un anillo; sin degradados cónicos en el
 * navegador, un solo color.
 *
 * @param {number} cx Centro horizontal, en píxeles de pantalla.
 * @param {number} cy Centro vertical, en píxeles de pantalla.
 * @param {number} r Radio del anillo, en píxeles de pantalla.
 * @param {number} k Aplastamiento vertical del disco (1: visto de frente).
 * @param {number} r0 Radio interior del disco, en píxeles de pantalla.
 * @param {number} r1 Radio exterior del disco, en píxeles de pantalla.
 * @param {number} a Opacidad, de 0 a 1.
 * @param {boolean} lensMode Verdadero para usar el ángulo de pantalla sin corregir la inclinación.
 * @param {number} [nStops] Cantidad de paradas de color (28 si se omite).
 * @returns {CanvasGradient|string} Estilo de trazo.
 */
function bstyle(cx, cy, r, k, r0, r1, a, lensMode, nStops) {
  const g = ctx.createConicGradient ? ctx.createConicGradient(0, cx, cy) : null;
  if (!g) {
    return bcol(bbright(Math.PI, r, r0, r1), a);
  }
  const n = nStops || 28;
  for (let i = 0; i <= n; i++) {
    const ph = (i / n) * Math.PI * 2,
      th = lensMode ? ph : Math.atan2(Math.sin(ph) / k, Math.cos(ph));
    g.addColorStop(i / n, bcol(bbright(th, r, r0, r1), a));
  }
  return g;
}

/**
 * Dibuja la Tierra pequeña del acento: océano, un continente y su lado de noche.
 *
 * @param {number} ex Centro horizontal, en píxeles de pantalla.
 * @param {number} ey Centro vertical, en píxeles de pantalla.
 * @param {number} r Radio, en píxeles de pantalla.
 */
function splashEarth(ex, ey, r) {
  ctx.fillStyle = '#3d8bff';
  ctx.beginPath();
  ctx.arc(ex, ey, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(ex, ey, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#5ccf6b';
  ctx.beginPath();
  ctx.ellipse(ex - r * 0.25, ey - r * 0.15, r * 0.45, r * 0.3, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(10,14,30,.55)';
  ctx.beginPath();
  ctx.arc(ex + r * 0.5, ey - r * 0.5, r * 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Cambia `sfl` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
function setSfl(value) {
  sfl = value;
  return value;
}

export {
  BR0,
  BR1,
  LOGO,
  SK,
  bcol,
  bhCore,
  bhDisk,
  bhDiskK,
  brandHole,
  drawAccent,
  drawLogo,
  easeIO2,
  setSfl,
  setSplashFont,
  sfl,
  splashFont,
};
