// Separa las declaraciones de nivel superior con varias variables (`let a = 1, b = 2;`) en una por línea
// (`let a = 1;` y `let b = 2;`). Mismo orden, mismos valores: el programa no cambia.
//   node herramientas/separar-declaraciones.mjs <archivo.js> …   (rutas relativas a src/js)
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const espree = require('espree');
const JS = join(dirname(new URL(import.meta.url).pathname), '..', 'src', 'js');
for (const rel of process.argv.slice(2)){
  const file = join(JS, rel);
  let code = readFileSync(file, 'utf8');
  const ast = espree.parse(code, { ecmaVersion: 'latest', sourceType: 'module', range: true });
  let n = 0;
  for (const st of [...ast.body].reverse()){
    const exp = st.type === 'ExportNamedDeclaration' && st.declaration ? 'export ' : '';
    const d = exp ? st.declaration : st;
    if (d.type !== 'VariableDeclaration' || d.declarations.length < 2) continue;
    const parts = d.declarations.map(x => exp + d.kind + ' ' + code.slice(x.range[0], x.range[1]) + ';');
    code = code.slice(0, st.range[0]) + parts.join('\n') + code.slice(st.range[1]);
    n++;
  }
  writeFileSync(file, code);
  if (n) console.log(rel + ': ' + n + ' declaraciones separadas');
}
