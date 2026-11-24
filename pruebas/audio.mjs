// Huella del sonido: genera el audio del juego sin altavoces y guarda una huella (hash) de las muestras,
// para comprobar que un cambio interno no cambia nada de lo que se oye.
//   node pruebas/audio.mjs <carpeta-salida> [index.html]     saca la huella
//   node pruebas/audio.mjs --comparar <carpetaA> <carpetaB>  compara dos huellas
//   node pruebas/audio.mjs --comparar                        saca ../audio-paso con index.html y la compara con ../audio-base
//
// Cómo funciona: cada vez que el juego crea su motor de sonido (AudioContext), recibe un OfflineAudioContext, que fabrica
// las muestras sin reproducirlas. La prueba lo avanza cuadro a cuadro, al mismo paso que el reloj falso del juego
// (1/60 s = 5 bloques de 128 muestras a 38 400 Hz), así la música y los efectos se programan en el mismo instante que en
// el juego real. Si el juego suspende su motor (la pausa), ese motor deja de avanzar hasta que el juego lo reanuda.
// El azar tiene semilla fija y el dibujo corre igual que en la huella visual.
// Por escena guarda: la huella de las muestras de cada motor creado (en orden) y, para ubicar diferencias, el volumen
// cada 100 ms.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Tolerancia por bloque de 128 muestras. Dos corridas del mismo archivo difieren hasta ~1e-5 (redondeo al mezclar);
// un cambio real (otra nota, otro volumen, otro momento) da diferencias de 1e-2 o más.
const TOL = 1e-3;
function compare(A, B){
  const a = JSON.parse(readFileSync(join(A, 'audio.json'))), b = JSON.parse(readFileSync(join(B, 'audio.json')));
  let bad = 0; const ruido = [], variacion = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])){
    const x = a[k], y = b[k];
    if (!x || !y){ console.log('✗ ' + k + ': falta en ' + (x ? B : A)); bad++; continue; }
    const diffs = [];
    const sameEvents = x.eventos && y.eventos && x.eventos.n === y.eventos.n && x.eventos.hash === y.eventos.hash;
    if (x.eventos && y.eventos && !sameEvents) diffs.push('lo que el juego le pide al motor de sonido cambió (' + x.eventos.n + ' → ' + y.eventos.n + ' eventos)');
    if (x.motores.length !== y.motores.length) diffs.push('motores de sonido creados: ' + x.motores.length + ' → ' + y.motores.length);
    for (let i = 0; i < Math.min(x.motores.length, y.motores.length); i++){
      const p = x.motores[i], q = y.motores[i];
      if (p.hash === q.hash) continue;
      const fa = JSON.parse(readFileSync(join(A, k + '.' + (i + 1) + '.firma.json'))), fb = JSON.parse(readFileSync(join(B, k + '.' + (i + 1) + '.firma.json')));
      if (fa.length !== fb.length){ diffs.push('motor ' + (i + 1) + ': duración distinta'); continue; }
      let worst = 0, at = -1; const half = fa.length/2;
      for (let j = 0; j < fa.length; j++){ const d = Math.abs(fa[j] - fb[j]); if (d > worst) worst = d; if (d > TOL && at < 0) at = j; }
      if (at >= 0 && sameEvents) variacion.push(k + ' (desde el segundo ' + (Math.floor((at % half)/3)*128/38400).toFixed(2) + ', ' + worst.toExponential(1) + ')');
      else if (at >= 0) diffs.push('motor ' + (i + 1) + ': suena distinto desde el segundo ' + (Math.floor((at % half)/3)*128/38400).toFixed(2) + ' (diferencia ' + worst.toExponential(1) + ')');
      else ruido.push(k + ' (' + worst.toExponential(1) + ')');
    }
    if (x.errores !== y.errores) diffs.push('errores: ' + (y.errores || 'ninguno'));
    if (diffs.length){ bad++; console.log('✗ ' + k + ': ' + diffs.join(', ')); }
  }
  if (variacion.length) console.log('· variación del motor de sonido del navegador (el juego pidió exactamente lo mismo; el motor a veces lo mezcla distinto según la carga del procesador): ' + variacion.join(', '));
  if (ruido.length) console.log('· ruido de redondeo al mezclar (el navegador suma los sonidos en distinto orden en cada corrida; muy por debajo de lo audible): ' + ruido.join(', '));
  console.log(bad ? '\n' + bad + ' escenas de sonido con diferencias' : '✓ idénticas: ' + Object.keys(a).length + ' escenas de sonido (todas las muestras)');
  return bad;
}

if (process.argv[2] === '--comparar' && process.argv[3]){
  process.exit(compare(resolve(process.argv[3]), resolve(process.argv[4])) ? 1 : 0);
}
const COMPARE_DEFAULT = process.argv[2] === '--comparar';
const OUT = COMPARE_DEFAULT ? resolve(ROOT, '..', 'audio-paso') : resolve(process.argv[2] || 'audio');
const SRC = resolve((!COMPARE_DEFAULT && process.argv[3]) || join(ROOT, 'index.html'));
mkdirSync(OUT, {recursive: true});
let html = readFileSync(SRC, 'utf8');
const HOOK = 'requestAnimationFrame(frame);\n})();';
if (html.split(HOOK).length !== 2) throw new Error('no encuentro el final del bucle en ' + SRC);
html = html.replace(HOOK, 'window.__ev = s => eval(s);\n})();');
const TMP = join(OUT, '_juego.html'); writeFileSync(TMP, html);
const BOT = readFileSync(join(ROOT, 'pruebas', 'bot.js'), 'utf8');

// el mismo mundo falso que la huella visual (azar con semilla, reloj y temporizadores falsos), con sonido encendido
const INIT = `(() => {
  window.__rastro = [];
  // registro de todo lo que el juego le pide al motor de sonido (siempre activo): su huella es la comprobación exacta
  window.__aHash = 2166136261; window.__aN = 0;
  window.__logA = s => { window.__aN++; for (let i = 0; i < s.length; i++) window.__aHash = Math.imul(window.__aHash ^ s.charCodeAt(i), 16777619) >>> 0; if (window.__RASTRO) window.__rastro.push(s); };
  window.__hashArr = a => { const u = new Uint32Array(a.buffer, a.byteOffset, a.length); let h = 2166136261; for (let i = 0; i < u.length; i++) h = Math.imul(h ^ u[i], 16777619) >>> 0; return h.toString(16); };
  let s = 1234567; Math.random = () => { if (window.__RASTRO) window.__rastro.push((new Error().stack.split('\\n')[2] || '').trim().split(' ')[1] + '@' + window.__now); s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; };
  window.__now = 0; const T0 = Date.UTC(2026, 10, 19, 20, 0, 0); performance.now = () => window.__now;
  const RD = Date; class FD extends RD { constructor(...a){ if (a.length) super(...a); else super(T0 + window.__now); } static now(){ return T0 + window.__now; } } window.Date = FD;
  let id = 0, q = [];
  window.setTimeout = (f, ms, ...a) => { id++; q.push({id, at: window.__now + (ms || 0), f, a}); return id; };
  window.setInterval = (f, ms, ...a) => { id++; q.push({id, at: window.__now + ms, f, a, iv: Math.max(1, ms)}); return id; };
  window.clearTimeout = window.clearInterval = x => { q = q.filter(e => e.id !== x); };
  window.__adv = ms => { const end = window.__now + ms; let guard = 0; for (;;){ if (++guard > 20000) break; q.sort((a, b) => a.at - b.at || a.id - b.id); const n = q[0]; if (!n || n.at > end) break; window.__now = n.at; if (n.iv) n.at += n.iv; else q.shift(); try{ typeof n.f === 'function' ? n.f(...n.a) : 0; }catch(e){ console.error('timer: ' + e.message); } } window.__now = end; };
  window.requestAnimationFrame = () => 0; window.cancelAnimationFrame = () => {};
  try{ navigator.vibrate = () => true; }catch(e){}
  localStorage.clear(); localStorage.setItem('orbita_p1_historia', '1'); localStorage.setItem('orbita_p1_sonido', '1');
  // motores de sonido fuera de línea, avanzados a mano
  const SR = 38400, Q = 128, FQ = 5, OAC = window.OfflineAudioContext, LEN = window.__AUDIO_LEN || 12;
  window.__ACs = [];
  window.AudioContext = function(){
    const c = new OAC(2, SR*LEN, SR); c.__v = 'running'; c.__q = 0; c.__started = false; c.__done = false;
    Object.defineProperty(c, 'state', {get: () => c.__v});
    c.resume = () => { c.__v = 'running'; return Promise.resolve(); };
    c.suspend = () => { c.__v = 'suspended'; return Promise.resolve(); };
    c.close = () => { c.__v = 'closed'; return Promise.resolve(); };
    window.__ACs.push(c); return c;
  };
  window.webkitAudioContext = undefined;
  // se guardan todos los nodos de sonido: si el navegador limpiara uno sin referencias (por ejemplo un eco que aún
  // suena), el resultado dependería de cuándo limpia, no del juego
  window.__keep = []; { const C = BaseAudioContext.prototype; for (const m of Object.getOwnPropertyNames(C).filter(m => m.startsWith('create'))){ const o = C[m]; C[m] = function(...a){ const n = o.apply(this, a); window.__keep.push(n); return n; }; } }
  for (const K of [OscillatorNode, AudioBufferSourceNode]){ const st = K.prototype.start; K.prototype.start = function(when, ...a){ window.__logA('sonido:' + K.name + ':' + (+when || 0).toFixed(5) + ':' + (this.frequency ? this.frequency.value.toFixed(3) : (a[0] || 0).toFixed(5)) + '@' + window.__now); return st.call(this, when, ...a); }; }
  { const P = AudioParam.prototype; for (const m of ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'setTargetAtTime', 'cancelScheduledValues']){ const o = P[m]; P[m] = function(...a){ window.__logA('param:' + m + ':' + a.map(x => (+x).toFixed(5)).join(',') + '@' + window.__now); return o.apply(this, a); }; }
    const d = Object.getOwnPropertyDescriptor(P, 'value'); Object.defineProperty(P, 'value', {get(){ return d.get.call(this); }, set(v){ window.__logA('param:value:' + (+v).toFixed(5) + '@' + window.__now); d.set.call(this, v); }}); }
  { let nid = 0; const C = BaseAudioContext.prototype; for (const m of Object.getOwnPropertyNames(C).filter(m => m.startsWith('create'))){ const o = C[m]; C[m] = function(...a){ const n = o.apply(this, a); n.__id = m.slice(6) + (++nid); window.__logA('crear:' + n.__id + '(' + a.map(x => typeof x === 'number' ? +x.toFixed(6) : typeof x).join(',') + ')@' + window.__now); return n; }; }
    const cn = AudioNode.prototype.connect; AudioNode.prototype.connect = function(d, ...a){ window.__logA('conectar:' + this.__id + '>' + (d.__id || (d instanceof AudioParam ? 'param' : d.constructor.name)) + '@' + window.__now); return cn.call(this, d, ...a); };
    for (const [K, props] of [[OscillatorNode, ['type']], [BiquadFilterNode, ['type']], [AudioBufferSourceNode, ['loop', 'buffer']], [WaveShaperNode, ['curve', 'oversample']]]) for (const pr of props){ const d = Object.getOwnPropertyDescriptor(K.prototype, pr); Object.defineProperty(K.prototype, pr, {get(){ return d.get.call(this); }, set(v){ window.__logA('prop:' + this.__id + '.' + pr + '=' + (v instanceof Float32Array ? 'f32:' + v.length + ':' + window.__hashArr(v) : v && v.getChannelData ? 'buffer' + v.length + ':' + Array.from({length: v.numberOfChannels}, (_, c) => window.__hashArr(v.getChannelData(c))).join('/') : v) + '@' + window.__now); d.set.call(this, v); }}); } }
  { for (const K of [OscillatorNode, AudioBufferSourceNode]){ const sp = K.prototype.stop; K.prototype.stop = function(when){ window.__logA('parar:' + this.__id + ':' + (when === undefined ? 'ya' : (+when).toFixed(6)) + '@' + window.__now); return sp.call(this, when); }; }
    const dc = AudioNode.prototype.disconnect; AudioNode.prototype.disconnect = function(...a){ window.__logA('desconectar:' + this.__id + '@' + window.__now); return dc.apply(this, a); }; }
  window.__audStep = async () => {
    for (const c of window.__ACs){
      if (c.__v !== 'running' || c.__done) continue;
      const nq = c.__q + FQ; if ((nq + FQ)*Q >= c.length){ c.__done = true; continue; }
      const p = OAC.prototype.suspend.call(c, nq*Q/SR);
      if (!c.__started){ c.__started = true; c.__render = c.startRendering(); } else OAC.prototype.resume.call(c);
      await p; c.__q = nq;
    }
  };
  window.__audFinish = async () => {
    const out = [];
    for (const c of window.__ACs){
      if (!c.__started){ c.__started = true; c.__render = c.startRendering(); } else OAC.prototype.resume.call(c);
      const buf = await c.__render, n = buf.length, bytes = new Uint8Array(n*8), L = buf.getChannelData(0), R = buf.getChannelData(1);
      bytes.set(new Uint8Array(L.buffer), 0); bytes.set(new Uint8Array(R.buffer), n*4);
      const h = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
      const vol = [], W = SR/10; for (let i = 0; i + W <= n; i += W){ let e = 0; for (let j = i; j < i + W; j++) e += L[j]*L[j] + R[j]*R[j]; vol.push(+Math.sqrt(e/(2*W)).toFixed(5)); }
      // firma por bloque de 128 muestras y canal: suma, energía y suma con peso por posición (sensible al momento exacto)
      const firma = [];
      for (const ch of [L, R]) for (let i = 0; i < n; i += Q){ let a = 0, e = 0, w = 0; for (let j = 0; j < Q && i + j < n; j++){ const x = ch[i + j]; a += x; e += x*x; w += x*j/Q; } firma.push(+a.toFixed(6), +e.toFixed(6), +w.toFixed(6)); }
      out.push(window.__MUESTRAS ? {hash: h, vol, firma, L: Array.from(L), R: Array.from(R)} : {hash: h, vol, firma});
    }
    return out;
  };
})();`;

// avanzar n cuadros: primero el sonido, luego el bucle real del juego; "extra" corre antes de cada cuadro (f = número de cuadro).
// Con noFrame solo corren los temporizadores (el programador de la música), sin el bucle del juego.
const FRAMES = (n, extra = '', bot = false, noFrame = false) => `(async () => { const DT = 1/60; let nx = null;
  for (let f = 0; f < ${n}; f++){
    await __audStep();
    ${extra}
    ${bot ? `if (state === 'play' && !jumping && !paused){ if (nx === null){ for (let i = 0; i < 240; i++) if (__safe(i*DT) && __safe((i + 4)*DT)){ nx = t + (i + 4)*DT; break; } if (nx === null) nx = t + .1; } if (t >= nx){ jump(); nx = null; } }
    if (state === 'dead' && deadT > 1.2){ start(); nx = null; }` : ''}
    __adv(1000/60); ${noFrame ? '' : 'frame(performance.now());'}
  } return 0; })()`;
// llamar sonidos sueltos en cuadros fijos: [[cuadro, código], …]
const AT = list => list.map(([f, code]) => `if (f === ${f}){ ${code} }`).join(' ');
const GAME = (l, p = 'tierra') => `lvl = ${l}; tutorial = false; curPlanet = '${p}'; seenTypes = {}; initAudio(); start()`;

const CLIPS = [];
const add = (name, seconds, steps) => CLIPS.push({name, seconds, steps});

// música de cada galaxia jugando (con saltos, aterrizajes, perfectos y muertes del jugador automático)
for (let i = 0; i < 8; i++) add('partida_' + i, 14, [['ev', GAME(i)], ['frames', 780, '', true]]);
// música de cada galaxia con todas sus capas: anillo 3, anillo 20 y anillo 45 (después del cambio de ritmo)
for (let i = 0; i < 8; i++) for (const L of [3, 20, 45])
  add('musica_' + i + '_anillo' + L, 9, [['ev', `initAudio(); lvl = ${i}; tutorial = false; state = 'play'; level = ${L}; pLevel = ${L}; sunLevel = ${L - 3}; startMusic()`], ['frames', 480, '', false, true]]);
// partidas largas: peligros de cada galaxia (cometas, ondas, novas…)
for (const i of [2, 5, 6, 7]) add('peligros_' + i, 30, [['ev', GAME(i)], ['frames', 1740, '', true]]);
add('gusano', 30, [['ev', GAME(3)], ['frames', 1740, '', true]]);
// quedarse quieto: el agujero negro se acerca, la alarma y la muerte
add('alarma_y_muerte', 12, [['ev', GAME(0)], ['frames', 660, '', false]]);
// cada planeta con su poder
for (const p of ['tierra', 'luna', 'mercurio', 'venus', 'marte', 'jupiter', 'saturno', 'urano', 'neptuno', 'pluton', 'sol'])
  add('poder_' + p, 9, [['ev', GAME(0, p)], ['frames', 480, "if (f === 200 && state === 'play'){ charge = chargeMax(); } if (f === 230 && state === 'play') powerKey(); if (f === 330 && state === 'play'){ charge = chargeMax(); powerKey(); }", true]]);
// ganar un nivel
add('victoria', 9, [['ev', GAME(0)], ['frames', 120, '', true], ['ev', 'win()'], ['frames', 360, '', false]]);
// la pausa: abrir, cuenta 3·2·1, seguir; y sus botones
add('pausa', 10, [['ev', GAME(0)], ['frames', 180, '', true], ['ev', 'pauseGame()'], ['frames', 60], ['ev', 'resumeGame()'], ['frames', 300, '', true]]);
add('pausa_botones', 8, [['ev', GAME(0)], ['frames', 60, '', true], ['ev', 'pauseGame()'],
  ['frames', 420, AT([[10, "pzSnd('go')"], [40, "pzSnd('again')"], [70, "pzSnd('levels')"], [100, "pzSnd('mute')"], [130, "pzSnd('unmute')"],
    [160, "pzSnd('slide', 0)"], [175, "pzSnd('slide', 50)"], [190, "pzSnd('slide', 100)"], [220, "pzSnd('hover')"], [250, "pzSnd('count', 3)"], [270, "pzSnd('count', 2)"],
    [290, "pzSnd('count', 1)"], [310, "pzSnd('launch')"], [340, "volMus = 40; volSfx = 70; applyVolumes()"], [360, "pzSnd('open')"]])]]);
// pantallas: presentación, historia, inicio, niveles, planetas, misiones, tutorial
add('presentacion', 12, [['ev', 'initAudio(); startSplash()'], ['frames', 660]]);
add('historia', 12, [['ev', 'initAudio(); startIntro()'], ['frames', 660]]);
add('inicio_animacion', 12, [['ev', 'initAudio(); openHome(true)'], ['frames', 660]]);
add('inicio', 8, [['ev', 'initAudio(); openHome()'], ['frames', 60], ['ev', "homeAction('cfg', null)"], ['frames', 360]]);
add('niveles', 8, [['ev', 'initAudio(); openLevels()'], ['frames', 60], ['ev', 'startLevel(2)'], ['frames', 360]]);
add('planetas', 8, [['ev', 'initAudio(); allPlanets = true; openPlanets()'], ['frames', 420, AT([[30, 'uiGlass(1); planetStep(1)'], [90, 'uiGlass(-1); planetStep(-1)'],
  [150, "{ const b = elPl.querySelector('.scanbtn'); if (b) b.click(); }"]])]]);
add('misiones', 8, [['ev', 'initAudio(); openMissions()'], ['frames', 420, AT([[60, "{ const b = document.querySelector('#missions [data-t=\"logros\"]'); if (b) b.click(); }"],
  [200, 'closeMissions()']])]]);
add('tutorial', 20, [['ev', 'initAudio(); startTutorial()'], ['frames', 1140, '', true]]);
// sonidos sueltos de todo el juego
add('efectos_sueltos', 26, [['ev', 'initAudio()'], ['frames', 1500, AT([
  [5, 'cowbell(0)'], [20, 'cowbell(7)'], [35, 'cowbell(SCALE[7] + 12)'], [50, 'thump()'], [65, 'suck()'], [190, 'sub()'], [260, "noise(.35, 5000, 200, .4, 'lowpass')"],
  [290, 'impact(AC.currentTime)'], [380, 'riser(AC.currentTime, 1.5)'], [490, 'uiHover()'], [500, "uiClick('play')"], [580, 'uiClick()'], [620, 'uiScan()'],
  [700, 'coinChime()'], [730, 'objChime(true)'], [760, 'objChime(false)'], [790, 'powerReadySound()'], [850, 'winSound()'], [1060, 'eatSound()'],
  [1130, 'misWhoosh(true)'], [1150, 'misWhoosh(false)'], [1170, 'misClaimSound(false)'], [1210, 'misClaimSound(true)'], [1260, 'uiGlass(1)'], [1280, 'uiGlass(-1)'],
  [1300, "hsSound('rock')"], [1330, "hsSound('tear')"], [1400, "hsSound('feed')"]])]]);

const { chromium } = require('playwright');
const b = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--font-render-hinting=none', '--autoplay-policy=no-user-gesture-required']});
const result = {};
const only = process.env.SOLO ? new RegExp(process.env.SOLO) : null;
// varias escenas a la vez (cada una en su propia página y con sus propios motores de sonido); JOBS=1 para una tras otra
async function runClip(c){
  const pg = await b.newPage({viewport: {width: 390, height: 844}, deviceScaleFactor: 1});
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errs.push(m.text()); });
  await pg.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await pg.addInitScript(`window.__AUDIO_LEN = ${c.seconds + 3}; window.__RASTRO = ${process.env.RASTRO ? 'true' : 'false'};`);
  await pg.addInitScript(INIT);
  await pg.goto('file://' + TMP);
  await pg.evaluate(s => window.__ev(s), BOT);
  for (const [kind, a, extra, bot, noFrame] of c.steps){
    if (kind === 'ev') await pg.evaluate(s => window.__ev(s), a);
    else await pg.evaluate(s => window.__ev(s), FRAMES(a, extra || '', !!bot, !!noFrame));
  }
  if (process.env.MUESTRAS) await pg.evaluate(() => { window.__MUESTRAS = true; });
  if (process.env.RASTRO) writeFileSync(join(OUT, c.name + '.rastro.txt'), (await pg.evaluate(() => window.__rastro)).join('\n'));
  const motores = await pg.evaluate(() => window.__audFinish());
  if (process.env.MUESTRAS) motores.forEach((m, i) => { writeFileSync(join(OUT, c.name + '.' + (i + 1) + '.f32'), Buffer.from(new Float32Array(m.L.concat(m.R)).buffer)); delete m.L; delete m.R; });
  motores.forEach((m, i) => { writeFileSync(join(OUT, c.name + '.' + (i + 1) + '.firma.json'), JSON.stringify(m.firma)); delete m.firma; });
  const eventos = await pg.evaluate(() => ({n: window.__aN, hash: window.__aHash.toString(16)}));
  result[c.name] = {motores, eventos, errores: errs.join(' | ')};
  process.stdout.write(errs.length ? '!' : '.');
  await pg.close();
}
const queue = CLIPS.filter(c => !only || only.test(c.name));
const JOBS = Math.max(1, +process.env.JOBS || 4);
await Promise.all(Array.from({length: JOBS}, async () => { while (queue.length) await runClip(queue.shift()); }));
await b.close();
const ordered = {}; for (const c of CLIPS) if (result[c.name]) ordered[c.name] = result[c.name];
writeFileSync(join(OUT, 'audio.json'), JSON.stringify(ordered));
console.log('\n✓ ' + Object.keys(result).length + ' escenas de sonido en ' + OUT);
const conErr = Object.entries(result).filter(([, v]) => v.errores); if (conErr.length) console.log('escenas con errores del juego: ' + conErr.map(([k, v]) => k + ' → ' + v.errores.slice(0, 160)).join('\n'));
const mudas = Object.entries(result).filter(([, v]) => !v.motores.some(m => m.vol.some(x => x > 0))); if (mudas.length) console.log('escenas sin sonido: ' + mudas.map(([k]) => k).join(', '));
if (COMPARE_DEFAULT) process.exit(compare(resolve(ROOT, '..', 'audio-base'), OUT) ? 1 : 0);
