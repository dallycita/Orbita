// Huella del juego: registra cómo se ve y cómo se comporta, para comprobar que un cambio interno no cambia nada.
//   node pruebas/huella.mjs <carpeta-salida> [index.html]
//   node pruebas/huella.mjs --comparar <carpetaA> <carpetaB>
//
// Todo es determinista: el azar tiene semilla fija, el reloj es falso (avanza solo cuando la prueba lo pide),
// no hay audio (el ritmo usa el tiempo del juego) y las letras de Google no se cargan (ambas corridas usan las mismas).
// Guarda por cada escena: una captura (PNG), el estilo calculado de cada elemento de la página y, en las partidas,
// el estado del juego cuadro a cuadro.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
import { inflateSync } from 'node:zlib';
// lector mínimo de PNG (8 bits, RGB o RGBA, sin entrelazado: lo que guarda Chromium)
function readPng(f){
  const buf = readFileSync(f); let o = 8, w, h, ct, idat = [];
  while (o < buf.length){ const len = buf.readUInt32BE(o), type = buf.toString('ascii', o + 4, o + 8), d = buf.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR'){ w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; } else if (type === 'IDAT') idat.push(d); o += 12 + len; }
  const bpp = ct === 6 ? 4 : 3, raw = inflateSync(Buffer.concat(idat)), out = Buffer.alloc(w*h*bpp), st = w*bpp;
  for (let y = 0; y < h; y++){ const f = raw[y*(st + 1)], src = raw.subarray(y*(st + 1) + 1, (y + 1)*(st + 1));
    for (let x = 0; x < st; x++){ const a = x >= bpp ? out[y*st + x - bpp] : 0, b = y ? out[(y - 1)*st + x] : 0, c = x >= bpp && y ? out[(y - 1)*st + x - bpp] : 0;
      let v = src[x]; if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4){ const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[y*st + x] = v & 255; } }
  return {w, h, bpp, px: out};
}
function pngDiff(fa, fb){ const a = readPng(fa), b = readPng(fb); if (a.w !== b.w || a.h !== b.h) return {n: 1e9, max: 255}; let n = 0, max = 0;
  for (let i = 0; i < a.w*a.h; i++){ let m = 0; for (let c = 0; c < 3; c++) m = Math.max(m, Math.abs(a.px[i*a.bpp + c] - b.px[i*b.bpp + c])); if (m > 0){ n++; if (m > max) max = m; } } return {n, max}; }
const sha = s => createHash('sha1').update(s).digest('hex').slice(0, 16);

if (process.argv[2] === '--comparar'){
  const [A, B] = process.argv.slice(3), a = JSON.parse(readFileSync(join(A, 'huella.json'))), b = JSON.parse(readFileSync(join(B, 'huella.json')));
  let bad = 0; const ruido = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])){
    const x = a[k], y = b[k];
    if (!x || !y){ console.log('✗ ' + k + ': falta en ' + (x ? B : A)); bad++; continue; }
    const diffs = [];
    if (x.png !== y.png){ const d = pngDiff(join(A, k + '.png'), join(B, k + '.png'));
      if (d.n > 60) diffs.push('imagen (' + d.n + ' píxeles distintos, hasta ' + d.max + ')'); else ruido.push(k + ' (' + d.n + ' px, ' + d.max + ')'); }
    if (x.traza !== y.traza) diffs.push('partida');
    if (x.errores !== y.errores) diffs.push('errores');
    const ek = new Set([...Object.keys(x.estilos), ...Object.keys(y.estilos)]), ed = [...ek].filter(e => x.estilos[e] !== y.estilos[e]);
    if (ed.length) diffs.push('estilos (' + ed.length + ': ' + ed.slice(0, 4).join(' | ') + ')');
    if (diffs.length){ bad++; console.log('✗ ' + k + ': ' + diffs.join(', ')); }
  }
  if (ruido.length) console.log('· ruido del dibujo por GPU (unos pocos píxeles con diferencias mínimas, también pasa entre dos corridas del mismo archivo): ' + ruido.join(', '));
  console.log(bad ? '\n' + bad + ' escenas con diferencias' : '✓ idénticas: ' + Object.keys(a).length + ' escenas (imagen, estilos y partidas)');
  process.exit(bad ? 1 : 0);
}

const OUT = resolve(process.argv[2] || 'huella'), SRC = resolve(process.argv[3] || join(ROOT, 'index.html'));
mkdirSync(OUT, {recursive: true});
let html = readFileSync(SRC, 'utf8');
const HOOK = 'requestAnimationFrame(frame);\n})();';
if (html.split(HOOK).length !== 2) throw new Error('no encuentro el final del bucle en ' + SRC);
html = html.replace(HOOK, 'window.__ev = s => eval(s);\n})();');   // la prueba mueve el juego cuadro a cuadro
const TMP = join(OUT, '_juego.html'); writeFileSync(TMP, html);
const BOT = readFileSync(join(ROOT, 'pruebas', 'bot.js'), 'utf8');

const INIT = `(() => {
  let s = 1234567; Math.random = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; };
  window.__now = 0; const T0 = Date.UTC(2026, 10, 19, 20, 0, 0); performance.now = () => window.__now;
  const RD = Date; class FD extends RD { constructor(...a){ if (a.length) super(...a); else super(T0 + window.__now); } static now(){ return T0 + window.__now; } } window.Date = FD;
  let id = 0, q = [];
  window.setTimeout = (f, ms, ...a) => { id++; q.push({id, at: window.__now + (ms || 0), f, a}); return id; };
  window.setInterval = (f, ms, ...a) => { id++; q.push({id, at: window.__now + ms, f, a, iv: Math.max(1, ms)}); return id; };
  window.clearTimeout = window.clearInterval = x => { q = q.filter(e => e.id !== x); };
  window.__adv = ms => { const end = window.__now + ms; let guard = 0; for (;;){ if (++guard > 20000) break; q.sort((a, b) => a.at - b.at || a.id - b.id); const n = q[0]; if (!n || n.at > end) break; window.__now = n.at; if (n.iv) n.at += n.iv; else q.shift(); try{ typeof n.f === 'function' ? n.f(...n.a) : 0; }catch(e){ console.error('timer: ' + e.message); } } window.__now = end; };
  window.requestAnimationFrame = () => 0; window.cancelAnimationFrame = () => {};
  window.AudioContext = undefined; window.webkitAudioContext = undefined;
  try{ navigator.vibrate = () => true; }catch(e){}
  localStorage.clear(); localStorage.setItem('orbita_p1_historia', '1'); localStorage.setItem('orbita_p1_sonido', '0');
})();`;

// avanzar n cuadros con el bucle real del juego; para ir rápido, los cuadros intermedios no se dibujan
// (se dibujan los 3 últimos), igual en las dos versiones que se comparan
const NOR = ['render', 'renderSplash', 'renderIntro', 'renderPlanetsScene', 'drawLevelsBG', 'renderHomeIntro', 'misPlanetDraw'];
const SETUP_FAST = `window.__R = {${NOR.join(', ')}}; window.__dibujo = on => { ${NOR.map(f => `${f} = on ? __R.${f} : (() => {});`).join(' ')} };`;
const FRAMES = n => `__dibujo(false); for (let i = 0; i < ${n}; i++){ if (i === ${n} - 3) __dibujo(true); __adv(1000/60); frame(performance.now()); } __dibujo(true);`;
// una partida con un jugador automático (siempre el mismo); devuelve la traza del estado cuadro a cuadro
const PLAY = (n, extra = '') => `(() => { const DT = 1/60; let nx = null, h = 0, samp = [];
  const H = s => { for (let i = 0; i < s.length; i++){ h = (h ^ s.charCodeAt(i)) >>> 0; h = Math.imul(h, 16777619) >>> 0; } };
  for (let f = 0; f < ${n}; f++){
    ${extra}
    if (state === 'play' && !jumping && !paused){ if (nx === null){ for (let i = 0; i < 240; i++) if (__safe(i*DT) && __safe((i + 4)*DT)){ nx = t + (i + 4)*DT; break; } if (nx === null) nx = t + .1; } if (t >= nx){ jump(); nx = null; } }
    if (state === 'dead' && deadT > 1.2){ start(); nx = null; }
    __dibujo(false); __adv(1000/60); frame(performance.now()); __dibujo(true);
    const st = [state, level, +pLevel.toFixed(5), +pAng.toFixed(5), +sunLevel.toFixed(5), +camLevel.toFixed(5), charge, +t.toFixed(4), jumping, score, particles.length, [...rings.values()].slice(0, 4).map(r => +(r.phase || 0).toFixed(4))].join(',');
    H(st); if (f % 60 === 0) samp.push(st);
  } return [h, samp]; })()`;

const SCENES = [];
const add = (name, steps) => SCENES.push({name, steps});
// pantallas
add('splash_0', [['ev', 'startSplash()'], ['ev', FRAMES(40)]]);
add('splash_1', [['ev', 'startSplash()'], ['ev', FRAMES(260)]]);
add('presentacion', [['ev', 'openHome(true)'], ['ev', FRAMES(200)]]);
add('inicio', [['ev', 'openHome()'], ['ev', FRAMES(60)]]);
add('inicio_ajustes', [['ev', 'openHome()'], ['ev', FRAMES(30)], ['ev', "homeAction('cfg', null)"], ['ev', FRAMES(20)]]);
add('intro_0', [['ev', 'startIntro()'], ['ev', FRAMES(120)]]);
add('intro_1', [['ev', 'startIntro()'], ['ev', FRAMES(420)]]);
for (let i = 0; i < 8; i++) add('niveles_' + i, [['ev', 'openLevels()'], ['ev', FRAMES(5)], ['ev', `{ const tr = elLv.querySelector('.track'); tr.style.scrollBehavior = 'auto'; tr.scrollLeft = ${i}*tr.clientWidth; tr.dispatchEvent(new Event('scroll')); }`], ['ev', FRAMES(90)]]);
add('planetas', [['ev', 'openPlanets()'], ['ev', FRAMES(60)]]);
add('planetas_jupiter', [['ev', "allPlanets = true; openPlanets()"], ['ev', 'planetStep(1); planetStep(1)'], ['ev', FRAMES(90)]]);
add('planetas_escanear', [['ev', "allPlanets = true; openPlanets()"], ['ev', FRAMES(20)], ['ev', "{ const b = elPl.querySelector('.scanbtn'); if (b) b.click(); }"], ['ev', FRAMES(120)]]);
add('misiones', [['ev', 'openMissions()'], ['ev', FRAMES(60)]]);
add('misiones_logros', [['ev', 'openMissions()'], ['ev', FRAMES(10)], ['ev', "{ const b = document.querySelector('#missions [data-t=\"logros\"]'); if (b) b.click(); }"], ['ev', FRAMES(60)]]);
add('antes_de_jugar', [['ev', 'startLevel(0)'], ['ev', FRAMES(40)]]);
add('tutorial', [['ev', 'startTutorial()'], ['ev', FRAMES(200)]]);
// partidas en cada galaxia
for (let i = 0; i < 8; i++){
  add('partida_' + i + '_a', [['ev', `lvl = ${i}; tutorial = false; curPlanet = 'tierra'; seenTypes = {}; start()`], ['play', 700]]);
  add('partida_' + i + '_b', [['ev', `lvl = ${i}; tutorial = false; curPlanet = 'tierra'; seenTypes = {}; start()`], ['play', 1700]]);
}
// el agujero de gusano (nivel 4): saltar directo cerca de la entrada
add('gusano', [['ev', "lvl = 3; tutorial = false; curPlanet = 'tierra'; seenTypes = {}; start()"], ['play', 2600]]);
// cada planeta con su poder
for (const p of ['tierra', 'luna', 'mercurio', 'venus', 'marte', 'jupiter', 'saturno', 'urano', 'neptuno', 'pluton', 'sol'])
  add('poder_' + p, [['ev', `lvl = 0; tutorial = false; curPlanet = '${p}'; seenTypes = {}; start()`], ['play', 400, "if (f === 300 && state === 'play'){ charge = chargeMax(); } if (f === 330 && state === 'play') powerKey();"]]);
// pausa, victoria y derrota
add('pausa', [['ev', "lvl = 0; tutorial = false; curPlanet = 'tierra'; start()"], ['play', 300], ['ev', 'pauseGame()'], ['ev', FRAMES(30)]]);
add('pausa_cuenta', [['ev', "lvl = 0; tutorial = false; curPlanet = 'tierra'; start()"], ['play', 300], ['ev', 'pauseGame()'], ['ev', FRAMES(10)], ['ev', 'resumeGame()'], ['ev', FRAMES(50)]]);
add('victoria', [['ev', "lvl = 0; tutorial = false; curPlanet = 'tierra'; start()"], ['play', 200], ['ev', 'win()'], ['ev', FRAMES(200)]]);
add('derrota', [['ev', "lvl = 1; tutorial = false; curPlanet = 'tierra'; start()"], ['play', 120], ['ev', "die(0, -R0, 'hit')"], ['ev', FRAMES(80)]]);

const { chromium } = require('playwright');
const b = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--font-render-hinting=none'].concat((process.env.FLAGS || '').split(' ').filter(Boolean))});
const result = {};
const only = process.env.SOLO ? new RegExp(process.env.SOLO) : null;
for (const sc of SCENES){
  if (only && !only.test(sc.name)) continue;
  const pg = await b.newPage({viewport: {width: 390, height: 844}, deviceScaleFactor: 1});
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errs.push(m.text()); });
  await pg.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await pg.addInitScript(INIT);
  await pg.goto('file://' + TMP);
  await pg.evaluate(s => window.__ev(s), BOT);
  await pg.evaluate(s => window.__ev(s), SETUP_FAST);
  let traza = '';
  for (const [kind, a, extra] of sc.steps){
    if (kind === 'ev') await pg.evaluate(s => window.__ev(s), a);
    else if (kind === 'play'){ const [h, samp] = await pg.evaluate(s => window.__ev(s), PLAY(a, extra || '')); traza += h + ';'; writeFileSync(join(OUT, sc.name + '.traza.txt'), samp.join('\n')); }
  }
  await pg.evaluate(s => window.__ev(s), FRAMES(3));
  // las animaciones de CSS corren con el reloj real: se congelan en un instante fijo (las que terminan, en su final)
  await pg.evaluate(() => { for (const an of document.getAnimations()){ try{ const tm = an.effect.getComputedTiming(); an.pause(); an.currentTime = isFinite(tm.endTime) ? tm.endTime : 1234; }catch(e){} } });
  const png = await pg.screenshot({path: join(OUT, sc.name + '.png'), caret: 'hide'});
  const estilos = await pg.evaluate(() => {
    const out = {}, key = el => { const p = []; for (let e = el; e && e.nodeType === 1; e = e.parentElement){ let i = 0; for (let s = e; (s = s.previousElementSibling);) i++; p.unshift(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + ':' + i); } return p.join('>'); };
    for (const el of document.querySelectorAll('body *')){ const cs = getComputedStyle(el); let s = ''; const names = []; for (let i = 0; i < cs.length; i++) names.push(cs[i]); names.sort(); for (const n of names) s += n + ':' + cs.getPropertyValue(n) + ';'; out[key(el) + (el.className && el.className.baseVal === undefined ? '.' + el.className : '')] = s; }
    return out; });
  const est = {}; for (const k in estilos) est[k] = createHash('sha1').update(estilos[k]).digest('hex').slice(0, 12);
  writeFileSync(join(OUT, sc.name + '.estilos.json'), JSON.stringify(estilos));
  result[sc.name] = {png: sha(png), traza, estilos: est, errores: errs.join(' | ')};
  process.stdout.write((errs.length ? '!' : '.'));
  await pg.close();
}
await b.close();
writeFileSync(join(OUT, 'huella.json'), JSON.stringify(result, null, 1));
console.log('\n✓ ' + Object.keys(result).length + ' escenas en ' + OUT);
const conErr = Object.entries(result).filter(([, v]) => v.errores); if (conErr.length) console.log('escenas con errores del juego: ' + conErr.map(([k, v]) => k + ' → ' + v.errores.slice(0, 120)).join('\n'));
