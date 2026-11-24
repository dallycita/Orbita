// En los archivos dados, convierte las asignaciones a variables importadas en llamadas a la función del dueño:
// `x = v` → `setX(v)`, `x += v` → `setX(x + (v))`, `x++` → `setX(x + 1)`. El dueño debe exportar setX.
//   node herramientas/usar-setters.mjs <archivo.js> …   (rutas relativas a src/js)
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const espree = require('espree'), eslintScope = require('eslint-scope');
const JS = join(dirname(new URL(import.meta.url).pathname), '..', 'src', 'js');
const parse = code => espree.parse(code, { ecmaVersion: 'latest', sourceType: 'module', range: true, loc: true });
const setterName = n => 'set' + n[0].toUpperCase() + n.slice(1);

for (const rel of process.argv.slice(2)){
  const file = join(JS, rel);
  let code = readFileSync(file, 'utf8');
  const added = new Map();   // origen → setters
  for (let guard = 0; guard < 3000; guard++){
    const ast = parse(code), sm = eslintScope.analyze(ast, { ecmaVersion: 2022, sourceType: 'module' });
    const mod = sm.scopes.find(s => s.type === 'module');
    const importFrom = new Map();
    for (const imp of ast.body.filter(s => s.type === 'ImportDeclaration')) for (const sp of imp.specifiers) importFrom.set(sp.local.name, imp.source.value);
    const parent = new Map();
    (function walk(n, p){ if (!n || typeof n.type !== 'string') return; parent.set(n, p); for (const k in n){ if (k === 'range' || k === 'loc') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(x => walk(x, n)); else if (v && typeof v.type === 'string') walk(v, n); } })(ast, null);
    const writes = [];
    for (const [name, src] of importFrom){ const v = mod.set.get(name); if (!v) continue; for (const r of v.references) if (r.isWrite()) writes.push({ id: r.identifier, p: parent.get(r.identifier), src }); }
    if (!writes.length) break;
    writes.sort((x, y) => (x.p.range[1] - x.p.range[0]) - (y.p.range[1] - y.p.range[0]));
    const { id, p, src } = writes[0], n = id.name, S = setterName(n), txt = x => code.slice(x.range[0], x.range[1]);
    let out;
    if (p.type === 'AssignmentExpression' && p.left === id){
      const r = txt(p.right), op = p.operator;
      if (op === '=') out = S + '(' + r + ')';
      else if (op === '||=' || op === '&&=' || op === '??=') out = '(' + n + ' ' + op.slice(0, -1) + ' ' + S + '(' + r + '))';
      else out = S + '(' + n + ' ' + op.slice(0, -1) + ' (' + r + '))';
    } else if (p.type === 'UpdateExpression'){
      const gp = parent.get(p), unused = gp.type === 'ExpressionStatement' || (gp.type === 'ForStatement' && gp.update === p);
      if (!p.prefix && !unused) throw new Error(rel + ':' + p.loc.start.line + ': ' + n + p.operator + ' usado como valor; hazlo a mano');
      out = S + '(' + n + ' ' + p.operator[0] + ' 1)';
    } else throw new Error(rel + ':' + id.loc.start.line + ': escritura no soportada de ' + n);
    code = code.slice(0, p.range[0]) + out + code.slice(p.range[1]);
    if (!added.has(src)) added.set(src, new Set()); added.get(src).add(S);
  }
  // importar los setters
  for (const [src, setters] of added){
    const ast = parse(code);
    const imp = ast.body.find(s => s.type === 'ImportDeclaration' && s.source.value === src);
    const names = [...new Set([...imp.specifiers.map(sp => sp.imported.name === sp.local.name ? sp.local.name : sp.imported.name + ' as ' + sp.local.name), ...setters])].sort();
    code = code.slice(0, imp.range[0]) + 'import { ' + names.join(', ') + " } from '" + src + "';" + code.slice(imp.range[1]);
  }
  writeFileSync(file, code);
  if (added.size) console.log(rel + ': ' + [...added.values()].map(s => [...s].join(', ')).join(', '));
}
