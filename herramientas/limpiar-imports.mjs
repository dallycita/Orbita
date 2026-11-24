// Quita de los archivos de src/js los nombres importados que no se usan.
//   node herramientas/limpiar-imports.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const espree = require('espree'), eslintScope = require('eslint-scope');
const JS = join(dirname(new URL(import.meta.url).pathname), '..', 'src', 'js');
const files = [];
(function walk(d){ for (const f of readdirSync(d)){ const p = join(d, f); if (statSync(p).isDirectory()){ if (f !== 'fuera') walk(p); } else if (f.endsWith('.js')) files.push(p); } })(JS);
for (const f of files){
  let code = readFileSync(f, 'utf8'), removed = [];
  const ast = espree.parse(code, { ecmaVersion: 'latest', sourceType: 'module', range: true });
  const mod = eslintScope.analyze(ast, { ecmaVersion: 2022, sourceType: 'module' }).scopes.find(s => s.type === 'module');
  for (const imp of ast.body.filter(s => s.type === 'ImportDeclaration').reverse()){
    if (!imp.specifiers.length) continue;   // import solo por sus efectos
    const keep = imp.specifiers.filter(sp => mod.set.get(sp.local.name).references.length > 0);
    if (keep.length === imp.specifiers.length) continue;
    imp.specifiers.filter(sp => !keep.includes(sp)).forEach(sp => removed.push(sp.local.name));
    const text = keep.length ? 'import { ' + keep.map(sp => sp.imported.name === sp.local.name ? sp.local.name : sp.imported.name + ' as ' + sp.local.name).join(', ') + " } from '" + imp.source.value + "';" : '';
    let end = imp.range[1]; if (!keep.length && code[end] === '\n') end++;
    code = code.slice(0, imp.range[0]) + text + code.slice(end);
  }
  if (removed.length){ writeFileSync(f, code); console.log(relative(JS, f) + ': ' + removed.join(', ')); }
}
