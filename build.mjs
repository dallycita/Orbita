// Une los archivos de src/ en un solo index.html (el juego que se publica).
//   node build.mjs          → genera index.html
//   node build.mjs --check  → comprueba que index.html está al día
//   node build.mjs --deps   → escribe docs/dependencias.md (reporte de qué usa cada archivo de los demás)
//
// Cómo se arma:
//   src/index.html     la página, con dos marcas: <!-- @css --> y <!-- @js -->
//   src/css/*.css      todo el estilo, en orden (el orden importa: lo de abajo pisa a lo de arriba)
//   src/js/fuera/*.js  lo poco que vive fuera del juego (íconos de las flechas)
//   src/js/*.js        el juego, en orden; se envuelve en (() => { ... })() para que nada se escape a la página
//
// Todos los archivos de js/ comparten el mismo espacio: una función de 09-poderes.js puede usar
// una variable de 05-record-y-estado.js. El número del nombre fija el orden en que se unen.
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'index.html');

const files = (dir, ext) => readdirSync(dir).filter(f => f.endsWith(ext)).sort().map(f => join(dir, f));
const read = f => readFileSync(f, 'utf8');
const glue = list => list.map(read).join('');

export function build(){
  const page = read(join(SRC, 'index.html'));
  const css = glue(files(join(SRC, 'css'), '.css'));
  const js = glue(files(join(SRC, 'js', 'fuera'), '.js')) + '(() => {\n' + glue(files(join(SRC, 'js'), '.js')) + '})();\n';
  for (const mark of ['<!-- @css -->\n', '<!-- @js -->\n']) if (page.split(mark).length !== 2) throw new Error('src/index.html debe tener la marca ' + mark.trim() + ' una sola vez');
  return page.replace('<!-- @css -->\n', () => css).replace('<!-- @js -->\n', () => js);
}

// reporte de dependencias entre archivos (ver herramientas/dependencias.mjs)
export async function deps(){
  const D = await import('./herramientas/dependencias.mjs');
  const doc = join(ROOT, 'docs', 'dependencias.md');
  mkdirSync(dirname(doc), {recursive: true}); writeFileSync(doc, D.summary(D.analyze(SRC)));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]){
  if (process.argv.includes('--deps')){ await deps(); console.log('✓ docs/dependencias.md al día'); }
  const html = build();
  if (process.argv.includes('--check')){
    const same = existsSync(OUT) && read(OUT) === html;
    console.log(same ? '✓ index.html está al día' : '✗ index.html no coincide con src/ — corre: node build.mjs');
    process.exit(same ? 0 : 1);
  }
  writeFileSync(OUT, html);
  console.log('✓ index.html (' + (Buffer.byteLength(html)/1024).toFixed(0) + ' KB)');
}
