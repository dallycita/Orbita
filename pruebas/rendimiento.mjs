// Rendimiento: juega escenas fijas (mismo azar, mismo recorrido) y mide cuánto tarda cada cuadro.
//   node pruebas/rendimiento.mjs [carpeta-salida] [index.html]
// Por cada escena guarda: ms por cuadro (lógica / dibujo / total, mediana y percentil 95), pausas del recolector de
// basura (GC) y las funciones donde se va el tiempo (profiler de Chrome). Sirve para comparar un cambio contra otro
// en esta misma máquina: los números absolutos no son los de un celular (aquí no hay tarjeta gráfica real).
import { testHook } from './nombres.mjs';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(process.argv[2] || 'rendimiento'), SRC = resolve(process.argv[3] || join(ROOT, 'index.html'));
mkdirSync(OUT, {recursive: true});
let html = readFileSync(SRC, 'utf8');
const HOOK = 'requestAnimationFrame(frame);\n})();';
html = html.replace(HOOK, () => testHook() + '\n})();');
const TMP = join(OUT, '_juego.html'); writeFileSync(TMP, html);
const BOT = readFileSync(join(ROOT, 'pruebas', 'bot.js'), 'utf8');

// igual que la huella (azar con semilla, reloj del juego falso), pero guardamos el reloj real para medir
const INIT = `(() => {
  window.__real = performance.now.bind(performance);
  let s = 1234567; Math.random = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; };
  window.__now = 0; const T0 = Date.UTC(2026, 10, 19, 20, 0, 0); performance.now = () => window.__now;
  const RD = Date; class FD extends RD { constructor(...a){ if (a.length) super(...a); else super(T0 + window.__now); } static now(){ return T0 + window.__now; } } window.Date = FD;
  let id = 0, q = [];
  window.setTimeout = (f, ms, ...a) => { id++; q.push({id, at: window.__now + (ms || 0), f, a}); return id; };
  window.setInterval = (f, ms, ...a) => { id++; q.push({id, at: window.__now + ms, f, a, iv: Math.max(1, ms)}); return id; };
  window.clearTimeout = window.clearInterval = x => { q = q.filter(e => e.id !== x); };
  window.__adv = ms => { const end = window.__now + ms; let g = 0; for (;;){ if (++g > 20000) break; q.sort((a, b) => a.at - b.at || a.id - b.id); const n = q[0]; if (!n || n.at > end) break; window.__now = n.at; if (n.iv) n.at += n.iv; else q.shift(); try{ typeof n.f === 'function' ? n.f(...n.a) : 0; }catch(e){} } window.__now = end; };
  window.requestAnimationFrame = () => 0; window.cancelAnimationFrame = () => {};
  window.AudioContext = undefined; window.webkitAudioContext = undefined;
  try{ navigator.vibrate = () => true; }catch(e){}
  localStorage.clear(); localStorage.setItem('orbita_p1_historia', '1'); localStorage.setItem('orbita_p1_sonido', '0');
})();`;
// mide lógica (update) y dibujo (render) por separado, cuadro a cuadro
const MEASURE = `window.__M = {upd: [], ren: [], tot: []}; window.__O = {update, render};
  update = function(dt){ const a = __real(); __O.update(dt); __M.upd.push(__real() - a); };
  render = function(){ const a = __real(); __O.render(); __M.ren.push(__real() - a); };`;
const PLAY = (warm, n, extra = '') => `(() => { const DT = 1/60; let nx = null;
  for (let f = 0; f < ${warm + n}; f++){
    if (f === ${warm}){ __M.upd = []; __M.ren = []; __M.tot = []; }
    ${extra}
    if (state === 'play' && !jumping){ if (nx === null){ for (let i = 0; i < 240; i++) if (__safe(i*DT) && __safe((i + 4)*DT)){ nx = t + (i + 4)*DT; break; } if (nx === null) nx = t + .1; } if (t >= nx){ jump(); nx = null; } }
    if (state === 'dead' && deadT > 1.2){ start(); nx = null; }
    __adv(1000/60); const a = __real(); frame(performance.now()); if (f >= ${warm}) __M.tot.push(__real() - a);
  } return particles.length; })()`;
const SCENES = [
  ['sistema-solar', "lvl = 0; tutorial = false; curPlanet = 'tierra'; seenTypes = {}; start()", ''],
  ['marte-poderes', "lvl = 0; tutorial = false; curPlanet = 'marte'; seenTypes = {}; start()", "if (f % 90 === 30 && state === 'play'){ charge = chargeMax(); powerKey(); }"],
  ['magallanes-supernovas', "lvl = 1; tutorial = false; curPlanet = 'tierra'; seenTypes = {}; start()", ''],
  ['m87', "lvl = 6; tutorial = false; curPlanet = 'tierra'; seenTypes = {}; start()", ''],
  ['sagitario', "lvl = 7; tutorial = false; curPlanet = 'tierra'; seenTypes = {}; start()", ''],
];
const WARM = +process.env.WARM || 90, N = +process.env.N || 420;
const st = a => { const s = [...a].sort((x, y) => x - y), q = p => s[Math.min(s.length - 1, Math.floor(p*s.length))]; return {med: +q(.5).toFixed(2), p95: +q(.95).toFixed(2), max: +s[s.length - 1].toFixed(2), prom: +(a.reduce((x, y) => x + y, 0)/a.length).toFixed(2)}; };

const { chromium } = require('playwright');
const b = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const report = {};
const only = process.env.SOLO ? new RegExp(process.env.SOLO) : null;
for (const [name, setup, extra] of SCENES){
  if (only && !only.test(name)) continue;
  const pg = await b.newPage({viewport: {width: 390, height: 844}, deviceScaleFactor: 1});
  await pg.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await pg.addInitScript(INIT); await pg.goto('file://' + TMP);
  await pg.evaluate(s => window.__ev(s), BOT); await pg.evaluate(s => window.__ev(s), MEASURE);
  await pg.evaluate(s => window.__ev(s), setup);
  const cdp = await pg.context().newCDPSession(pg);
  if (+process.env.LENTO > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: +process.env.LENTO});   // simular un procesador de celular
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {interval: 200});
  await b.startTracing(pg, {categories: ['disabled-by-default-v8.gc', 'v8']});
  await cdp.send('HeapProfiler.enable'); await cdp.send('HeapProfiler.startSampling', {samplingInterval: 2048});
  await cdp.send('Profiler.start');
  const parts = await pg.evaluate(s => window.__ev(s), PLAY(WARM, N, extra));
  const {profile} = await cdp.send('Profiler.stop');
  const {profile: heap} = await cdp.send('HeapProfiler.getSamplingProfile'); await cdp.send('HeapProfiler.stopSampling');
  const trace = JSON.parse((await b.stopTracing()).toString());
  const M = await pg.evaluate(() => window.__ev('__M'));
  // tiempo propio por función (sin contar lo que llama), en % del total
  const byId = new Map(profile.nodes.map(n => [n.id, n])), self = new Map(); let total = 0;
  const dts = profile.timeDeltas; profile.samples.forEach((id, i) => { const n = byId.get(id), k = (n.callFrame.functionName || '(anónima)') + (n.callFrame.url.includes('_juego') ? '' : ' [' + (n.callFrame.url.split('/').pop() || 'nativo') + ']'); const d = dts[i] || 0; self.set(k, (self.get(k) || 0) + d); total += d; });
  // lo que tarda la tarjeta gráfica (aquí, por software) aparece como espera dentro de drawImage/getImageData: se separa
  const GPU = /^(drawImage|getImageData|readPixels|\(idle\)|\(program\)|texImage2D|finish) \[/;
  let js = 0; for (const [k, v] of self) if (!GPU.test(k)) js += v;
  const frames = M.tot.length;
  const top = [...self.entries()].filter(([k]) => !GPU.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => [k, +(v/1000/frames).toFixed(3), +(100*v/js).toFixed(1) + '%']);
  // basura: quién crea más memoria nueva (muestreo)
  const alloc = new Map(); let allocT = 0;
  const walk = n => { const k = (n.callFrame.functionName || '(anónima)'); alloc.set(k, (alloc.get(k) || 0) + n.selfSize); allocT += n.selfSize; (n.children || []).forEach(walk); }; walk(heap.head);
  // pausas del recolector de basura
  const gc = trace.traceEvents.filter(e => e.ph === 'X' && /^(MinorGC|MajorGC|V8\.GC_SCAVENGER|V8\.GC_MARK_COMPACTOR|V8\.GCScavenger|V8\.GCFinalizeMC|ScavengeGC)$/.test(e.name)).map(e => ({n: e.name, ms: e.dur/1000}));
  const gcBy = {}; for (const g of gc){ gcBy[g.n] = gcBy[g.n] || {veces: 0, ms: 0, max: 0}; gcBy[g.n].veces++; gcBy[g.n].ms = +(gcBy[g.n].ms + g.ms).toFixed(2); gcBy[g.n].max = Math.max(gcBy[g.n].max, +g.ms.toFixed(2)); }
  report[name] = {cuadros: frames, particulas_al_final: parts, total_ms: st(M.tot), logica_ms: st(M.upd), dibujo_ms: st(M.ren), js_propio_ms_por_cuadro: +(js/1000/frames).toFixed(3), gc: gcBy, funciones_mas_costosas_ms_por_cuadro: top, basura_kb_por_cuadro: +(allocT/1024/frames).toFixed(1), quien_crea_basura: [...alloc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => [k, +(v/1024/frames).toFixed(1) + ' KB'])};
  writeFileSync(join(OUT, name + '.cpuprofile'), JSON.stringify(profile));
  console.log('· ' + name + ': nuestro JS ' + report[name].js_propio_ms_por_cuadro + ' ms/cuadro · lógica med ' + report[name].logica_ms.med + ' ms · basura ' + report[name].basura_kb_por_cuadro + ' KB/cuadro · GC ' + JSON.stringify(gcBy));
  await pg.close();
}
await b.close();
writeFileSync(join(OUT, 'rendimiento.json'), JSON.stringify(report, null, 1));
console.log('✓ ' + join(OUT, 'rendimiento.json'));
