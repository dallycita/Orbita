// Cambia el nombre de algo de nivel superior de un módulo (función, constante, variable u objeto) en su dueño y en
// todos los módulos que lo importan: declaración, lista de export, imports y cada uso (resueltos por alcance, así que
// no toca propiedades ni variables locales que se llamen igual). Si tiene función setX, también se renombra.
//   node herramientas/renombrar.mjs <módulo.js> viejo=nuevo [viejo2=nuevo2 …]   (ruta relativa a src/js)
// Comprobar después con: node herramientas/misma-estructura.mjs <index-antes> index.html --renombres
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const espree = require('espree'), eslintScope = require('eslint-scope');
const JS = join(dirname(new URL(import.meta.url).pathname), '..', 'src', 'js');
const [ownerRel, ...pairs] = process.argv.slice(2);
const OWNER = join(JS, ownerRel);
const parse = code => espree.parse(code, { ecmaVersion: 'latest', sourceType: 'module', range: true });
const setterOf = n => 'set' + n[0].toUpperCase() + n.slice(1);
const ren = new Map(pairs.map(p => p.split('=')));
{ const own = readFileSync(OWNER, 'utf8');
  for (const [a, b] of [...ren]) if (new RegExp('function\\s+' + setterOf(a) + '\\s*\\(').test(own)) ren.set(setterOf(a), setterOf(b)); }
const files = [];
(function walk(d){ for (const f of readdirSync(d)){ const p = join(d, f); if (statSync(p).isDirectory()){ if (f !== 'fuera') walk(p); } else if (f.endsWith('.js')) files.push(p); } })(JS);

// nombres que ya existen en un módulo: el nuevo no debe chocar
function moduleNames(ast, sm){ return new Set(sm.scopes.find(s => s.type === 'module').variables.map(v => v.name)); }

for (const f of files){
  let code = readFileSync(f, 'utf8');
  const ast = parse(code), sm = eslintScope.analyze(ast, { ecmaVersion: 2022, sourceType: 'module' });
  const mod = sm.scopes.find(s => s.type === 'module');
  const isOwner = f === OWNER;
  // en los demás, solo si importan algo de lo que se renombra desde el dueño
  const localOf = new Map();   // nombre viejo → binding local en este archivo
  if (isOwner){ for (const old of ren.keys()) if (mod.set.get(old)) localOf.set(old, old); }
  else for (const imp of ast.body.filter(s => s.type === 'ImportDeclaration')){
    if (normalize(join(dirname(f), imp.source.value)) !== OWNER) continue;
    for (const sp of imp.specifiers) if (ren.has(sp.imported.name)) localOf.set(sp.imported.name, sp.local.name);
  }
  if (!localOf.size) continue;
  const names = moduleNames(ast, sm);
  for (const [old] of localOf){ const nu = ren.get(old); if (names.has(nu)) throw new Error(f.slice(JS.length + 1) + ': ya existe ' + nu); }
  const edits = [];
  for (const [old, local] of localOf){
    const v = mod.set.get(local), nu = ren.get(old);
    if (!v) continue;
    for (const id of v.identifiers) edits.push([id.range[0], id.range[1], nu]);
    for (const r of v.references) edits.push([r.identifier.range[0], r.identifier.range[1], nu]);
  }
  // listas de export { … } del dueño y specifiers de import que no son referencias
  for (const st of ast.body){
    if (isOwner && st.type === 'ExportNamedDeclaration' && !st.declaration) for (const sp of st.specifiers){
      if (ren.has(sp.local.name)) edits.push([sp.range[0], sp.range[1], ren.get(sp.local.name)]); }
    if (!isOwner && st.type === 'ImportDeclaration' && normalize(join(dirname(f), st.source.value)) === OWNER) for (const sp of st.specifiers){
      if (ren.has(sp.imported.name)) edits.push([sp.range[0], sp.range[1], ren.get(sp.imported.name)]); }
  }
  const seen = new Set(), uniq = edits.filter(e => { const k = e[0] + ':' + e[1]; if (seen.has(k)) return false; seen.add(k); return true; });
  uniq.sort((a, b) => b[0] - a[0]);
  for (const [a, b, t] of uniq) code = code.slice(0, a) + t + code.slice(b);
  // el nombre también se actualiza dentro de los comentarios del archivo
  const ast2 = espree.parse(code, { ecmaVersion: 'latest', sourceType: 'module', range: true, comment: true });
  for (const c of [...ast2.comments].reverse()){
    let text = code.slice(c.range[0], c.range[1]);
    for (const [old] of localOf) text = text.replace(new RegExp('\\b' + old + '\\b', 'g'), ren.get(old));
    code = code.slice(0, c.range[0]) + text + code.slice(c.range[1]);
  }
  writeFileSync(f, code);
  console.log(f.slice(JS.length + 1) + ': ' + uniq.length + ' cambios');
}
