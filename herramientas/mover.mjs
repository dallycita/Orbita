// Mueve declaraciones de nivel superior (funciones, constantes, variables) de un módulo de src/js a otro y
// arregla los import en todo el proyecto.
//   node herramientas/mover.mjs <origen.js> <destino.js> nombre1 nombre2 …
// Rutas relativas a src/js. Si el destino no existe, se crea. Con cada nombre se mueven su comentario de encima y,
// si existe, su función setX. Lo que el código movido usa del origen se importa desde el origen.
// No mueve nombres que el origen asigna en su función de arranque (initX): cambiaría el orden al cargar.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const espree = require('espree'), eslintScope = require('eslint-scope');
const ROOT = join(dirname(new URL(import.meta.url).pathname), '..'), JS = join(ROOT, 'src', 'js');
const args = process.argv.slice(2), keepInit = args.includes('--con-arranque');
const [fromRel, toRel, ...wanted] = args.filter(a => a !== '--con-arranque');
if (!fromRel || !toRel || !wanted.length) { console.error('uso: node herramientas/mover.mjs <origen.js> <destino.js> nombres…'); process.exit(1); }
const FROM = join(JS, fromRel), TO = join(JS, toRel);
const parse = code => espree.parse(code, { ecmaVersion: 'latest', sourceType: 'module', range: true, loc: true, comment: true });
const allFiles = (d => { const out = []; (function walk(x){ for (const f of readdirSync(x)){ const p = join(x, f); if (statSync(p).isDirectory()){ if (f !== 'fuera') walk(p); } else if (f.endsWith('.js')) out.push(p); } })(d); return out; })(JS);
const spec = (fromFile, toFile) => { let r = relative(dirname(fromFile), toFile); if (!r.startsWith('.')) r = './' + r; return r; };

// --- imports de un archivo: [{names: Map(local→imported), source, range}]
function importsOf(ast){ return ast.body.filter(s => s.type === 'ImportDeclaration'); }
function exportListOf(ast){ return ast.body.filter(s => s.type === 'ExportNamedDeclaration' && !s.declaration && !s.source); }

let src = readFileSync(FROM, 'utf8');
let ast = parse(src);
const setterOf = n => 'set' + n[0].toUpperCase() + n.slice(1);
const names = new Set(wanted);
for (const n of wanted) if (ast.body.some(s => (s.type === 'FunctionDeclaration' || (s.type === 'ExportNamedDeclaration' && s.declaration && s.declaration.type === 'FunctionDeclaration')) && ((s.id || s.declaration.id).name === setterOf(n)))) names.add(setterOf(n));

// no mover lo que la función de arranque asigna
for (const st of ast.body){
  const fn = st.type === 'ExportNamedDeclaration' && st.declaration && st.declaration.type === 'FunctionDeclaration' ? st.declaration : null;
  if (!keepInit && fn && /^init[A-Z]/.test(fn.id.name) && !wanted.includes(fn.id.name)){
    const body = src.slice(fn.body.range[0], fn.body.range[1]);
    for (const n of wanted) if (new RegExp('(^|[^\\w.$])' + n + '\\s*=[^=]').test(body)) { console.error('✗ ' + n + ' se asigna en ' + fn.id.name + ': moverlo cambiaría el orden al cargar'); process.exit(1); }
  }
}

// --- sacar las declaraciones del origen (con su comentario de encima)
const pieces = [];
const cuts = [];
const movedNames = new Set();
const declName = s => { const d = s.type === 'ExportNamedDeclaration' && s.declaration ? s.declaration : s;
  if (d.type === 'FunctionDeclaration') return [d.id.name];
  if (d.type === 'VariableDeclaration') return d.declarations.map(x => x.id.name);
  return []; };
let prevEnd = 0;
for (const st of ast.body){
  const ns = declName(st), lead = src.slice(prevEnd, st.range[0]);
  const hit = ns.filter(n => names.has(n));
  if (hit.length){
    if (hit.length !== ns.length){ console.error('✗ la declaración de ' + ns.join(', ') + ' mezcla nombres que se mueven y que no; sepárala primero'); process.exit(1); }
    // el comentario pegado arriba (sin línea en blanco de por medio) va con la declaración
    const m = lead.match(/((?:[ \t]*\/\/[^\n]*\n|[ \t]*\/\*[\s\S]*?\*\/[ \t]*\n)*)[ \t]*$/);
    const comment = m ? m[1] : '';
    const start = st.range[0] - (lead.length - lead.lastIndexOf(comment) ) + (comment ? 0 : lead.length - lead.length);
    const a = comment ? st.range[0] - (lead.length - lead.lastIndexOf(comment)) : st.range[0];
    let text = src.slice(a, st.range[1]);
    pieces.push(text.replace(/^export\s+/m, ''));
    ns.forEach(n => movedNames.add(n));
    cuts.push([a, st.range[1]]);
  }
  prevEnd = st.range[1];
}
const moved = movedNames;
for (const n of wanted) if (!moved.has(n)){ console.error('✗ no encontré la declaración de ' + n + ' en ' + fromRel); process.exit(1); }
cuts.sort((x, y) => y[0] - x[0]);
for (const [a, b] of cuts){ let e = b; if (src[e] === '\n') e++; src = src.slice(0, a) + src.slice(e); }

// quitar los nombres movidos de la lista de export del origen
src = src.replace(/export \{([^}]*)\};?/g, (m, list) => { const keep = list.split(',').map(x => x.trim()).filter(x => x && !moved.has(x)); return keep.length ? 'export { ' + keep.join(', ') + ' };' : ''; });

// --- qué usa el código movido: nombres que no declara él mismo
const movedCode = pieces.join('\n\n');
const mAst = espree.parse(movedCode, { ecmaVersion: 'latest', sourceType: 'module', range: true });
const sm = eslintScope.analyze(mAst, { ecmaVersion: 2022, sourceType: 'module' });
const free = new Set(sm.globalScope.through.map(r => r.identifier.name).filter(n => !moved.has(n)));
const writesLeft = [...new Set(sm.globalScope.through.filter(r => r.isWrite() && !moved.has(r.identifier.name)).map(r => r.identifier.name))]
  .filter(n => !/^[A-Z]/.test(n) || true).filter(n => parse(readFileSync(FROM, 'utf8')).body.some(st => declName(st).includes(n)));
if (writesLeft.length){ console.error('✗ el código que se muda cambia ' + writesLeft.join(', ') + ', que se queda en el origen: múdalo también'); process.exit(1); }

// lo que el origen importa y el código movido necesita, y lo que el origen declara y el código movido necesita
const srcAst2 = parse(src);
const needFromSource = new Set(), needImports = new Map();   // archivo → nombres
for (const imp of importsOf(srcAst2)) for (const sp of imp.specifiers) if (free.has(sp.local.name)){
  const file = join(dirname(FROM), imp.source.value); if (!needImports.has(file)) needImports.set(file, new Set()); needImports.get(file).add(sp.local.name); free.delete(sp.local.name); }
for (const st of srcAst2.body) for (const n of declName(st)) if (free.has(n)){ needFromSource.add(n); free.delete(n); }
if (needFromSource.size){ if (!needImports.has(FROM)) needImports.set(FROM, new Set()); for (const n of needFromSource) needImports.get(FROM).add(n);
  // el origen debe exportarlos
  const listM = src.match(/export \{([^}]*)\};?/);
  const cur = listM ? listM[1].split(',').map(x => x.trim()).filter(Boolean) : [];
  const all = [...new Set([...cur, ...needFromSource])].sort();
  src = listM ? src.replace(listM[0], 'export { ' + all.join(', ') + ' };') : src.replace(/\s*$/, '\n\nexport { ' + all.join(', ') + ' };\n');
}

// --- destino: agregar imports, el código y los exports
let dst = existsSync(TO) ? readFileSync(TO, 'utf8') : '/**\n * (encabezado pendiente)\n */\n';
needImports.delete(TO);
function addImport(code, file, nameSet, self){
  const p = spec(self, file);
  const re = new RegExp("import \\{([^}]*)\\} from '" + p.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + "';");
  const m = code.match(re);
  if (m){ const all = [...new Set([...m[1].split(',').map(x => x.trim()).filter(Boolean), ...nameSet])].sort(); return code.replace(m[0], 'import { ' + all.join(', ') + " } from '" + p + "';"); }
  const line = 'import { ' + [...nameSet].sort().join(', ') + " } from '" + p + "';\n";
  const a = parse(code), imps = importsOf(a);
  if (imps.length){ const last = imps[imps.length - 1]; return code.slice(0, last.range[1]) + '\n' + line.trimEnd() + code.slice(last.range[1]); }
  const c0 = a.comments[0]; const at = c0 && c0.range[0] === code.search(/\S/) ? c0.range[1] : 0;
  return code.slice(0, at) + (at ? '\n' : '') + line + code.slice(at);
}
// si el destino ya importaba algo de lo que se muda, ese import sobra (ahora se declara aquí)
if (existsSync(TO)){
  const a0 = parse(dst);
  for (const imp of importsOf(a0).reverse()){
    const keep = imp.specifiers.filter(sp => !moved.has(sp.local.name));
    if (keep.length === imp.specifiers.length) continue;
    const text = keep.length ? 'import { ' + keep.map(sp => sp.imported.name === sp.local.name ? sp.local.name : sp.imported.name + ' as ' + sp.local.name).join(', ') + " } from '" + imp.source.value + "';" : '';
    let end = imp.range[1]; if (!keep.length && dst[end] === '\n') end++;
    dst = dst.slice(0, imp.range[0]) + text + dst.slice(end);
  }
}
for (const [file, ns] of needImports) dst = addImport(dst, file, ns, TO);
dst = dst.replace(/\s*(export \{[^}]*\};?\s*)?$/, m => '\n\n' + movedCode.trim() + '\n' + (m.includes('export {') ? '\n' + m.trim() + '\n' : ''));

// --- quién usa los nombres movidos: cambiar el import al destino
const users = new Map();
for (const f of allFiles){
  if (f === TO) continue;
  let code = f === FROM ? src : readFileSync(f, 'utf8');
  const a = parse(code);
  let usesMoved = new Set();
  for (const imp of importsOf(a)){
    if (join(dirname(f), imp.source.value) !== FROM) continue;
    const take = imp.specifiers.filter(sp => moved.has(sp.imported.name)).map(sp => sp.imported.name);
    if (!take.length) continue;
    take.forEach(n => usesMoved.add(n));
    const keep = imp.specifiers.filter(sp => !moved.has(sp.imported.name)).map(sp => sp.imported.name === sp.local.name ? sp.local.name : sp.imported.name + ' as ' + sp.local.name);
    code = code.slice(0, imp.range[0]) + (keep.length ? 'import { ' + keep.join(', ') + " } from '" + imp.source.value + "';" : '') + code.slice(imp.range[1]);
    break;
  }
  if (f === FROM){
    // el origen usa algo de lo movido
    const s2 = eslintScope.analyze(parse(code), { ecmaVersion: 2022, sourceType: 'module' });
    for (const r of s2.globalScope.through) if (moved.has(r.identifier.name)) usesMoved.add(r.identifier.name);
    for (const sc of s2.scopes) for (const r of sc.through) if (sc.upper === null && moved.has(r.identifier.name)) usesMoved.add(r.identifier.name);
  }
  if (usesMoved.size){ code = addImport(code, TO, usesMoved, f); users.set(f, usesMoved); }
  if (f === FROM) src = code; else if (usesMoved.size) writeFileSync(f, code);
}
// el destino exporta lo que otros usan
const exportedNeeded = new Set(); for (const [, ns] of users) for (const n of ns) exportedNeeded.add(n);
if (exportedNeeded.size){
  const m = dst.match(/export \{([^}]*)\};?/);
  const all = [...new Set([...(m ? m[1].split(',').map(x => x.trim()).filter(Boolean) : []), ...exportedNeeded])].sort();
  dst = m ? dst.replace(m[0], 'export { ' + all.join(', ') + ' };') : dst.replace(/\s*$/, '\n\nexport { ' + all.join(', ') + ' };\n');
}
// variables mudadas que se siguen cambiando desde otro archivo: el destino necesita su función setX
{
  const declared = new Map();
  for (const st of parse(dst).body){ const d = st.type === 'ExportNamedDeclaration' && st.declaration ? st.declaration : st;
    if (d.type === 'VariableDeclaration' && d.kind !== 'const') for (const x of d.declarations) declared.set(x.id.name, true);
    if (d.type === 'FunctionDeclaration') declared.set(d.id.name, 'fn'); }
  const writers = [FROM, ...allFiles.filter(f => f !== FROM && f !== TO)];
  const extra = [];
  for (const n of moved){
    if (declared.get(n) !== true || declared.get(setterOf(n)) === 'fn') continue;
    const re = new RegExp('(^|[^\\w.$])' + n + '\\s*(=[^=>]|\\+=|-=|\\*=|/=|\\+\\+|--)');
    const isWritten = writers.some(f => re.test(f === FROM ? src : readFileSync(f, 'utf8')));
    if (!isWritten) continue;
    extra.push('\n/**\n * Cambia `' + n + '` desde otro módulo (este módulo es su dueño).\n *\n * @param {*} value Valor nuevo.\n * @returns {*} El mismo valor, como el de una asignación.\n */\nfunction ' + setterOf(n) + '(value) {\n  ' + n + ' = value;\n  return value;\n}');
    exportedNeeded.add(setterOf(n));
  }
  if (extra.length){
    dst = dst.replace(/(\n*export \{[^}]*\};?\s*)?$/, m => '\n' + extra.join('\n') + '\n' + (m.includes('export {') ? m : ''));
    const m = dst.match(/export \{([^}]*)\};?/);
    const all = [...new Set([...(m ? m[1].split(',').map(x => x.trim()).filter(Boolean) : []), ...exportedNeeded])].sort();
    dst = m ? dst.replace(m[0], 'export { ' + all.join(', ') + ' };') : dst.replace(/\s*$/, '\n\nexport { ' + all.join(', ') + ' };\n');
  }
}
// limpiar imports: en el destino, lo movido ya no se importa; en los dos, se quita lo que quedó sin uso
function pruneImports(code, drop){
  for (let guard = 0; guard < 200; guard++){
    const a = parse(code), s2 = eslintScope.analyze(a, { ecmaVersion: 2022, sourceType: 'module' });
    const mod = s2.scopes.find(x => x.type === 'module');
    let edit = null;
    for (const imp of importsOf(a)){
      const keep = imp.specifiers.filter(sp => !drop.has(sp.local.name) && (mod.set.get(sp.local.name) || { references: [1] }).references.length > 0);
      if (keep.length === imp.specifiers.length) continue;
      const text = keep.length ? 'import { ' + keep.map(sp => sp.imported.name === sp.local.name ? sp.local.name : sp.imported.name + ' as ' + sp.local.name).join(', ') + " } from '" + imp.source.value + "';" : '';
      let end = imp.range[1]; if (!keep.length && code[end] === '\n') end++;
      edit = [imp.range[0], end, text]; break;
    }
    if (!edit) return code;
    code = code.slice(0, edit[0]) + edit[2] + code.slice(edit[1]);
  }
  return code;
}
dst = pruneImports(dst, moved);
src = pruneImports(src, new Set());
mkdirSync(dirname(TO), { recursive: true });
writeFileSync(FROM, src); writeFileSync(TO, dst);
console.log('✓ movidos ' + [...moved].join(', ') + ' de ' + fromRel + ' a ' + toRel + (users.size ? ' · imports arreglados en ' + users.size + ' archivos' : ''));
