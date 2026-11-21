// Comprueba que dos versiones de index.html tienen exactamente el mismo programa (JavaScript), aunque cambien
// los espacios, los saltos de línea, las comillas o los comentarios.
//   node herramientas/misma-estructura.mjs <index-a.html> <index-b.html>
// Compara el árbol de sintaxis de cada <script>: tipo de cada nodo, nombres, operadores y el valor de cada
// literal (no cómo está escrito: '.5' y '0.5' son el mismo número). Si sale "idéntica", el juego hace lo mismo.
// Sirve para los cambios mecánicos (formato, comentarios); lo demás se comprueba con la huella.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const espree = require('espree');

const scripts = file => [...readFileSync(file, 'utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const SKIP = new Set(['loc', 'range', 'start', 'end', 'raw', 'comments', 'tokens']);

// convierte el árbol en texto sin posiciones ni forma de escribir
function canon(node){
  if (Array.isArray(node)) return '[' + node.map(canon).join(',') + ']';
  if (node === null || typeof node !== 'object') return JSON.stringify(node);
  if (node.type === 'TemplateElement') return 'T' + JSON.stringify(node.value.cooked) + node.tail;
  if (node.type === 'Literal' && node.regex) return 'R' + node.regex.pattern + '/' + node.regex.flags;
  if (node.type === 'Literal' && typeof node.value === 'bigint') return 'B' + String(node.value);
  // una clave de objeto sin calcular es la misma escrita con o sin comillas ({'a': 1} y {a: 1})
  if ((node.type === 'Property' || node.type === 'MethodDefinition' || node.type === 'PropertyDefinition') && !node.computed && node.key.type !== 'Key'){
    const k = node.key.type === 'Identifier' ? node.key.name : String(node.key.value);
    return canon({...node, key: {type: 'Key', name: k}});
  }
  const keys = Object.keys(node).filter(k => !SKIP.has(k)).sort();
  return '{' + keys.map(k => k + ':' + canon(node[k])).join(',') + '}';
}
function program(file){
  return scripts(file).map((s, i) => {
    try{ return canon(espree.parse(s, {ecmaVersion: 'latest', sourceType: 'script'})); }
    catch(e){ throw new Error(file + ', script ' + (i + 1) + ': ' + e.message); }
  });
}

const [A, B] = process.argv.slice(2);
const a = program(A), b = program(B);
if (a.length !== b.length){ console.log('✗ distinto número de <script>: ' + a.length + ' y ' + b.length); process.exit(1); }
let bad = 0;
a.forEach((x, i) => {
  if (x === b[i]) return;
  bad++; let k = 0; while (k < x.length && x[k] === b[i][k]) k++;
  console.log('✗ script ' + (i + 1) + ': la estructura cambia cerca de …' + x.slice(Math.max(0, k - 120), k + 80) + '…');
});
console.log(bad ? bad + ' script(s) con estructura distinta' : '✓ idéntica: ' + a.length + ' script(s), mismo programa');
process.exit(bad ? 1 : 0);
