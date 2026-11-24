// Agrupa variables sueltas de un módulo en un objeto con nombre (por ejemplo `level`, `score` → `run.level`,
// `run.score`), en el dueño y en todos los que las usan. Las funciones setX siguen siendo la única forma de cambiarlas.
//   node herramientas/agrupar-estado.mjs <módulo.js> <objeto> nombre1 nombre2 …   (ruta relativa a src/js)
// El objeto se declara donde estaba la primera de las variables, con sus valores iniciales en el mismo orden.
// Las variables deben tener valor inicial puro (o ninguno): lo que se asigna al arrancar sigue en su lugar.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const espree = require('espree'), eslintScope = require('eslint-scope');
const JS = join(dirname(new URL(import.meta.url).pathname), '..', 'src', 'js');
const [ownerRel, obj, ...names] = process.argv.slice(2);
const OWNER = join(JS, ownerRel), NAMES = new Set(names);
const parse = code => espree.parse(code, { ecmaVersion: 'latest', sourceType: 'module', range: true, loc: true });
const files = [];
(function walk(d){ for (const f of readdirSync(d)){ const p = join(d, f); if (statSync(p).isDirectory()){ if (f !== 'fuera') walk(p); } else if (f.endsWith('.js')) files.push(p); } })(JS);

// reemplaza cada referencia a las variables (resueltas por alcance) por obj.nombre
function rewriteRefs(code, isOwner){
  const ast = parse(code), sm = eslintScope.analyze(ast, { ecmaVersion: 2022, sourceType: 'module' });
  const mod = sm.scopes.find(s => s.type === 'module');
  const parent = new Map();
  (function walk(n, p){ if (!n || typeof n.type !== 'string') return; parent.set(n, p); for (const k in n){ if (k === 'range' || k === 'loc') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(x => walk(x, n)); else if (v && typeof v.type === 'string') walk(v, n); } })(ast, null);
  const edits = [];
  for (const n of NAMES){
    const v = mod.set.get(n); if (!v) continue;
    for (const r of v.references){
      const id = r.identifier, p = parent.get(id);
      if (p && p.type === 'ExportSpecifier') continue;   // la lista de export se arregla aparte
      if (p && p.type === 'Property' && p.shorthand && p.value === id) edits.push([id.range[0], id.range[1], n + ': ' + obj + '.' + n]);
      else edits.push([id.range[0], id.range[1], obj + '.' + n]);
    }
  }
  edits.sort((a, b) => b[0] - a[0]);
  for (const [a, b, t] of edits) code = code.slice(0, a) + t + code.slice(b);
  return { code, n: edits.length };
}

// 1) dueño: declaraciones → un objeto; referencias → obj.nombre
let code = readFileSync(OWNER, 'utf8');
{
  const ast = parse(code);
  const decls = [];
  for (const st of ast.body){
    if (st.type !== 'VariableDeclaration') continue;
    for (const d of st.declarations) if (NAMES.has(d.id.name)){
      if (st.declarations.length !== 1) throw new Error('separa primero la declaración de ' + d.id.name);
      decls.push({ st, name: d.id.name, init: d.init ? code.slice(d.init.range[0], d.init.range[1]) : 'undefined' });
    }
  }
  const missing = names.filter(n => !decls.some(d => d.name === n));
  if (missing.length) throw new Error('no encontré la declaración de ' + missing.join(', '));
  // primero se reescriben las referencias (sin tocar las declaraciones), luego se arman el objeto
  const first = decls[0].st;
  const objText = 'const ' + obj + ' = {\n' + decls.map(d => '  ' + d.name + ': ' + d.init + ',').join('\n') + '\n};';
  // quitar las declaraciones de atrás hacia adelante; la primera se reemplaza por el objeto
  const sorted = [...decls].sort((a, b) => b.st.range[0] - a.st.range[0]);
  for (const d of sorted){
    let a = d.st.range[0], b = d.st.range[1];
    if (d.st === first){ code = code.slice(0, a) + '\u0000OBJ\u0000' + code.slice(b); continue; }
    if (code[b] === '\n') b++;
    code = code.slice(0, a) + code.slice(b);
  }
  // referencias en el dueño: se analizan con las variables declaradas de forma provisional
  const tmp = code.replace('\u0000OBJ\u0000', names.map(n => 'let ' + n + ';').join(' '));
  const r = rewriteRefs(tmp, true);
  // el bloque provisional quedó intacto al principio de su posición: se cambia por el objeto
  code = r.code.replace(names.map(n => 'let ' + n + ';').join(' '), objText);
  // exports: los nombres salen, entra el objeto si alguno se exportaba
  let exportedAny = false;
  code = code.replace(/export \{([^}]*)\};/g, (m, list) => {
    const items = list.split(',').map(x => x.trim()).filter(Boolean);
    const keep = items.filter(x => !NAMES.has(x)); if (keep.length !== items.length) exportedAny = true;
    if (exportedAny && !keep.includes(obj)) keep.push(obj);
    return 'export { ' + keep.sort().join(', ') + ' };';
  });
  writeFileSync(OWNER, code);
  console.log(ownerRel + ': ' + r.n + ' referencias');
}

// 2) los demás: import de los nombres → import del objeto; referencias → obj.nombre
for (const f of files){
  if (f === OWNER) continue;
  let c = readFileSync(f, 'utf8');
  const ast = parse(c);
  let touched = false;
  for (const imp of ast.body.filter(s => s.type === 'ImportDeclaration')){
    if (normalize(join(dirname(f), imp.source.value)) !== OWNER) continue;
    if (!imp.specifiers.some(sp => NAMES.has(sp.imported.name))) continue;
    touched = true;
  }
  if (!touched) continue;
  const r = rewriteRefs(c, false); c = r.code;
  const a2 = parse(c);
  for (const imp of a2.body.filter(s => s.type === 'ImportDeclaration')){
    if (normalize(join(dirname(f), imp.source.value)) !== OWNER) continue;
    const keep = imp.specifiers.filter(sp => !NAMES.has(sp.imported.name)).map(sp => sp.imported.name === sp.local.name ? sp.local.name : sp.imported.name + ' as ' + sp.local.name);
    if (!keep.includes(obj)) keep.push(obj);
    c = c.slice(0, imp.range[0]) + 'import { ' + keep.sort().join(', ') + " } from '" + imp.source.value + "';" + c.slice(imp.range[1]);
    break;
  }
  writeFileSync(f, c);
  console.log('  ' + f.slice(JS.length + 1) + ': ' + r.n);
}
