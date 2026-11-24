// Mueve o renombra módulos de src/js (con git mv, para conservar su historia) y reescribe todos los import.
//   node herramientas/renombrar-modulos.mjs viejo.js=nuevo.js …   (rutas relativas a src/js)
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, relative, normalize } from 'node:path';
import { execFileSync } from 'node:child_process';
const ROOT = join(dirname(new URL(import.meta.url).pathname), '..'), JS = join(ROOT, 'src', 'js');
const moves = new Map(process.argv.slice(2).map(a => a.split('=')).map(([a, b]) => [normalize(join(JS, a)), normalize(join(JS, b))]));
for (const [a, b] of moves){
  if (!existsSync(a)) throw new Error('no existe ' + relative(JS, a));
  if (existsSync(b)) throw new Error('ya existe ' + relative(JS, b));
}
const files = [];
(function walk(d){ for (const f of readdirSync(d)){ const p = join(d, f); if (statSync(p).isDirectory()){ if (f !== 'fuera') walk(p); } else if (f.endsWith('.js')) files.push(p); } })(JS);
const spec = (fromFile, toFile) => { let r = relative(dirname(fromFile), toFile); if (!r.startsWith('.')) r = './' + r; return r; };
// reescribir los import de cada archivo según dónde quedan él y sus dependencias
for (const f of files){
  const newF = moves.get(f) || f;
  let code = readFileSync(f, 'utf8');
  code = code.replace(/(\bfrom\s+|^import\s+)'(\.{1,2}\/[^']+)'/gm, (m, pre, s) => {
    const target = normalize(join(dirname(f), s)), newT = moves.get(target) || target;
    return pre + "'" + spec(newF, newT) + "'";
  });
  writeFileSync(f, code);
}
for (const [a, b] of moves){
  mkdirSync(dirname(b), { recursive: true });
  execFileSync('git', ['mv', a, b], { cwd: ROOT });
}
console.log('✓ ' + moves.size + ' módulos movidos');
