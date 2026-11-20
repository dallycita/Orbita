// Une los archivos de src/ en un solo index.html (el juego que se publica).
//   node build.mjs          → genera index.html
//   node build.mjs --check  → comprueba que index.html está al día y que cada archivo declara bien lo que usa
//   node build.mjs --deps   → reescribe la cabecera de cada archivo de src/js (qué da, qué usa, qué cambia) y docs/dependencias.md
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
// la cabecera de dependencias de cada archivo es solo para quien lee el código: no entra al juego
const stripHead = code => code.startsWith('// ┌─') ? code.slice(code.indexOf('\n', code.indexOf('// └─')) + 1) : code;
const glue = list => list.map(f => f.endsWith('.js') ? stripHead(read(f)) : read(f)).join('');

export function build(){
  const page = read(join(SRC, 'index.html'));
  const css = glue(files(join(SRC, 'css'), '.css'));
  const js = glue(files(join(SRC, 'js', 'fuera'), '.js')) + '(() => {\n' + glue(files(join(SRC, 'js'), '.js')) + '})();\n';
  for (const mark of ['<!-- @css -->\n', '<!-- @js -->\n']) if (page.split(mark).length !== 2) throw new Error('src/index.html debe tener la marca ' + mark.trim() + ' una sola vez');
  return page.replace('<!-- @css -->\n', () => css).replace('<!-- @js -->\n', () => js);
}

// cabeceras de dependencias (ver herramientas/dependencias.mjs)
export async function deps(write){
  const D = await import('./herramientas/dependencias.mjs');
  const A = D.analyze(SRC), wrong = [];
  for (const f of A.files){
    const cur = read(f), want = D.header(f, A) + D.stripHead(cur);
    if (cur !== want){ if (write) writeFileSync(f, want); else wrong.push(f.slice(SRC.length + 1)); }
  }
  const doc = join(ROOT, 'docs', 'dependencias.md'), sum = D.summary(A);
  if (!existsSync(doc) || read(doc) !== sum){ if (write){ mkdirSync(dirname(doc), {recursive: true}); writeFileSync(doc, sum); } else wrong.push('docs/dependencias.md'); }
  return wrong;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]){
  if (process.argv.includes('--deps')){ await deps(true); console.log('✓ cabeceras de dependencias al día'); }
  const html = build();
  if (process.argv.includes('--check')){
    const same = existsSync(OUT) && read(OUT) === html;
    console.log(same ? '✓ index.html está al día' : '✗ index.html no coincide con src/ — corre: node build.mjs');
    let wrong = [];
    try{ wrong = await deps(false); }catch(e){ console.log('✗ ' + e.message); process.exit(1); }
    console.log(wrong.length ? '✗ el código ya no coincide con lo que declara su cabecera: ' + wrong.join(', ') + '\n  Si el cambio es a propósito, corre: node build.mjs --deps' : '✓ cada archivo declara lo que usa de los demás');
    process.exit(same && !wrong.length ? 0 : 1);
  }
  writeFileSync(OUT, html);
  console.log('✓ index.html (' + (Buffer.byteLength(html)/1024).toFixed(0) + ' KB)');
}
