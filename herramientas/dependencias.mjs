// Qué usa cada archivo de src/js de los demás, y qué deja usar.
//
// Los archivos del juego se unen en un solo bloque (ver build.mjs), así que técnicamente cualquiera podría usar
// cualquier cosa de otro. Para que eso no pase sin querer, cada archivo empieza con una cabecera que declara:
//   da:      lo que otros archivos usan de él (todo lo demás es privado del archivo)
//   usa:     lo que toma de otros archivos, agrupado por archivo
//   cambia:  las variables de otros archivos que modifica (lo más delicado: es estado compartido)
// La cabecera la escribe `node build.mjs --deps`. `node build.mjs --check` falla si el código ya no coincide con su
// cabecera: así, usar algo de otro archivo (o dejar de hacerlo) siempre es una decisión a la vista, como un import.
import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

export const HEAD_START = '// ┌─', HEAD_END = '// └─';

function parse(code, file){
  const espree = require('espree'), scope = require('eslint-scope');
  let ast;
  try{ ast = espree.parse(code, {ecmaVersion: 'latest', sourceType: 'script', range: true}); }
  catch(e){ throw new Error(file + ': ' + e.message); }
  const sm = scope.analyze(ast, {ecmaVersion: 2022, sourceType: 'script'}), g = sm.globalScope;
  const own = new Set(g.variables.map(v => v.name));
  const refs = [];   // [nombre, escribe]
  for (const r of g.through) if (!own.has(r.identifier.name)) refs.push([r.identifier.name, r.isWrite()]);
  return {own, refs};
}

export function stripHead(code){
  if (!code.startsWith(HEAD_START)) return code;
  const i = code.indexOf('\n', code.indexOf(HEAD_END)); return code.slice(i + 1);
}

// lista ordenada de archivos: primero los de fuera/ (viven fuera del bloque), luego los del juego
export function jsFiles(src){
  const d = join(src, 'js'), f = join(d, 'fuera');
  return [...readdirSync(f).filter(x => x.endsWith('.js')).sort().map(x => join(f, x)), ...readdirSync(d).filter(x => x.endsWith('.js')).sort().map(x => join(d, x))];
}

export function analyze(src){
  const files = jsFiles(src), info = new Map(), owner = new Map(), dup = [];
  for (const f of files){
    const code = stripHead(readFileSync(f, 'utf8')), {own, refs} = parse(code, basename(f));
    info.set(f, {own, refs, uses: new Map(), writes: new Map(), usedBy: new Map()});
    for (const n of own){ if (owner.has(n)) dup.push(n + ' (' + basename(owner.get(n)) + ' y ' + basename(f) + ')'); else owner.set(n, f); }
  }
  if (dup.length) throw new Error('nombres definidos en dos archivos: ' + dup.join(', '));
  for (const [f, I] of info){
    for (const [n, w] of I.refs){
      const o = owner.get(n); if (!o || o === f) continue;   // lo que no es de ningún archivo es del navegador (document, Math…)
      const add = (m, k) => { if (!m.has(k)) m.set(k, new Set()); m.get(k).add(n); };
      add(I.uses, o); if (w) add(I.writes, o); add(info.get(o).usedBy, f);
    }
  }
  return {files, info};
}

const name = f => basename(f, '.js');
function wrap(prefix, items, width = 118){
  const lines = []; let cur = prefix;
  for (const it of items){
    const piece = (cur.endsWith(prefix) || cur === prefix ? '' : ', ') + it;
    if (cur.length + piece.length > width && cur !== prefix){ lines.push(cur + ','); cur = '// │        ' + it; }
    else cur += piece;
  }
  lines.push(cur); return lines;
}
const sortN = s => [...s].sort((a, b) => a.localeCompare(b, 'es'));

export function header(f, A){
  const I = A.info.get(f), out = [HEAD_START + ' ' + basename(f)];
  const exported = new Set(); for (const s of I.usedBy.values()) for (const n of s) exported.add(n);
  out.push(...(exported.size ? wrap('// │ da:     ', sortN(exported)) : ['// │ da:     (nada: todo es privado de este archivo)']));
  if (I.usedBy.size) out.push(...wrap('// │ lo usan: ', A.files.filter(x => I.usedBy.has(x)).map(name)));
  if (!I.uses.size) out.push('// │ usa:    (nada de otros archivos)');
  for (const o of A.files) if (I.uses.has(o)) out.push(...wrap('// │ usa ' + name(o) + ': ', sortN(I.uses.get(o))));
  for (const o of A.files) if (I.writes.has(o)) out.push(...wrap('// │ cambia ' + name(o) + ': ', sortN(I.writes.get(o))));
  out.push(HEAD_END + ' generado por `node build.mjs --deps`; no se edita a mano');
  return out.join('\n') + '\n';
}

// resumen para docs/dependencias.md
export function summary(A){
  const rows = ['| Archivo | Usa de | Lo usan | Cambia estado de |', '|---|---|---|---|'];
  for (const f of A.files){
    const I = A.info.get(f), l = m => A.files.filter(x => m.has(x)).map(x => name(x) + ' (' + m.get(x).size + ')').join(', ') || '—';
    rows.push('| `' + name(f) + '` | ' + l(I.uses) + ' | ' + (A.files.filter(x => I.usedBy.has(x)).map(name).join(', ') || '—') + ' | ' + l(I.writes) + ' |');
  }
  return '# Dependencias entre archivos\n\nGenerado por `node build.mjs --deps` a partir del código (no se edita a mano). El número entre paréntesis es cuántos nombres usa o cambia de ese archivo. Cada archivo tiene arriba su cabecera con el detalle.\n\n' + rows.join('\n') + '\n';
}
