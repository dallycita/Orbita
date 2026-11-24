// Une los archivos de src/ en un solo index.html (el juego que se publica).
//   node build.mjs          → genera index.html
//   node build.mjs --check  → comprueba que index.html está al día y que no hay ciclos ni imports hacia arriba
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
import { createRequire } from 'node:module';
const esbuild = createRequire(import.meta.url)('esbuild');

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'index.html');

const files = (dir, ext) => readdirSync(dir).filter(f => f.endsWith(ext)).sort().map(f => join(dir, f));
const read = f => readFileSync(f, 'utf8');
const glue = list => list.map(read).join('');

// el juego: módulos ES desde src/js/main.js, unidos por esbuild en una sola función (nada se escapa a la página)
function bundle(){
  const out = esbuild.buildSync({
    entryPoints: [join(SRC, 'js', 'main.js')], bundle: true, format: 'iife', write: false, target: 'esnext',
    treeShaking: false, legalComments: 'none', charset: 'utf8', logLevel: 'silent',
  });
  return out.outputFiles[0].text;
}

export function build(){
  const page = read(join(SRC, 'index.html'));
  const css = glue(files(join(SRC, 'css'), '.css'));
  const js = glue(files(join(SRC, 'js', 'fuera'), '.js')) + bundle();
  for (const mark of ['<!-- @css -->\n', '<!-- @js -->\n']) if (page.split(mark).length !== 2) throw new Error('src/index.html debe tener la marca ' + mark.trim() + ' una sola vez');
  return page.replace('<!-- @css -->\n', () => css).replace('<!-- @js -->\n', () => js);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]){
  const html = build();
  if (process.argv.includes('--check')){
    const same = existsSync(OUT) && read(OUT) === html;
    console.log(same ? '✓ index.html está al día' : '✗ index.html no coincide con src/ — corre: node build.mjs');
    // dependencias en una sola dirección y sin ciclos (herramientas/capas.mjs)
    const { execFileSync } = await import('node:child_process');
    let layersOk = true;
    try { execFileSync(process.execPath, [join(ROOT, 'herramientas', 'capas.mjs'), '--estricto', '--detalle'], { stdio: 'inherit' }); }
    catch (e) { layersOk = false; }
    process.exit(same && layersOk ? 0 : 1);
  }
  writeFileSync(OUT, html);
  console.log('✓ index.html (' + (Buffer.byteLength(html)/1024).toFixed(0) + ' KB)');
}
