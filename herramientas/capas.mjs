// Revisa la dirección de las dependencias entre módulos de src/js:
//   data → core → audio → game → render → screens → main
// Cada módulo solo puede importar de su capa o de las de su izquierda, y no puede haber ciclos.
//   node herramientas/capas.mjs           informe
//   node herramientas/capas.mjs --estricto  falla (código 1) si hay imports hacia arriba o ciclos
// La capa de un módulo sale de su carpeta (src/js/data/, src/js/core/…); main.js y loop.js son el arranque.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, normalize } from 'node:path';

const JS = join(dirname(new URL(import.meta.url).pathname), '..', 'src', 'js');
const LAYERS = ['data', 'core', 'audio', 'game', 'render', 'screens', 'main'];
const files = [];
(function walk(d){ for (const f of readdirSync(d)){ const p = join(d, f); if (statSync(p).isDirectory()){ if (f !== 'fuera') walk(p); } else if (f.endsWith('.js')) files.push(p); } })(JS);
const rel = f => relative(JS, f);
function layerOf(f){
  const r = rel(f);
  if (r === 'main.js' || r === 'loop.js') return 'main';
  const top = r.split('/')[0];
  if (LAYERS.includes(top)) return top;
  throw new Error('no sé en qué capa va ' + r + ' (debe estar en una carpeta de capa)');
}
const graph = new Map(), up = [];
for (const f of files){
  const code = readFileSync(f, 'utf8'), deps = [];
  for (const m of code.matchAll(/^import\s+(?:\{([^}]*)\}\s+from\s+)?'([^']+)';/gm)){
    if (!m[2].startsWith('.')) continue;
    const t = normalize(join(dirname(f), m[2])); deps.push(t);
    const a = LAYERS.indexOf(layerOf(f)), b = LAYERS.indexOf(layerOf(t));
    if (b > a && layerOf(f) !== 'main') up.push(rel(f) + ' → ' + rel(t) + (m[1] ? ' (' + m[1].replace(/\s+/g, ' ').trim() + ')' : ''));
  }
  graph.set(f, deps);
}
// ciclos: componentes fuertemente conexos (Tarjan)
let idx = 0; const st = [], on = new Set(), I = new Map(), L = new Map(), cycles = [];
function scc(v){ I.set(v, idx); L.set(v, idx); idx++; st.push(v); on.add(v);
  for (const w of graph.get(v) || []){ if (!graph.has(w)) continue; if (!I.has(w)){ scc(w); L.set(v, Math.min(L.get(v), L.get(w))); } else if (on.has(w)) L.set(v, Math.min(L.get(v), I.get(w))); }
  if (L.get(v) === I.get(v)){ const c = []; let w; do { w = st.pop(); on.delete(w); c.push(w); } while (w !== v); if (c.length > 1) cycles.push(c); } }
for (const f of graph.keys()) if (!I.has(f)) scc(f);
console.log('imports hacia arriba: ' + up.length + ' · ciclos: ' + cycles.length + (cycles.length ? ' (' + cycles.map(c => c.length + ' módulos').join(', ') + ')' : ''));
if (process.argv.includes('--detalle')){ up.forEach(u => console.log('  ↑ ' + u)); cycles.forEach(c => console.log('  ⟲ ' + c.map(rel).sort().join(' '))); }
if (process.argv.includes('--estricto') && (up.length || cycles.length)) process.exit(1);
