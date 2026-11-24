// Devuelve a constantes normales los datos puros que quedaron asignándose dentro de una función de arranque
// (initX), por ejemplo `COMET_AT = { 5: new Set([...]) }`.
//   node herramientas/restaurar-constantes.mjs <archivo.js> …   (rutas relativas a src/js)
// Solo si el valor es puro (literales, funciones, Math.*, new Set/Map de valores puros y constantes ya declaradas
// arriba en el mismo archivo), la variable no se vuelve a asignar en ningún otro lugar, y su `let X;` está antes de
// la función de arranque. Calcular un valor puro antes o después no cambia nada de lo que hace el juego.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const espree = require('espree'), eslintScope = require('eslint-scope');
const JS = join(dirname(new URL(import.meta.url).pathname), '..', 'src', 'js');
const parse = code => espree.parse(code, { ecmaVersion: 'latest', sourceType: 'module', range: true, loc: true, comment: true });

for (const rel of process.argv.slice(2)){
  const file = join(JS, rel);
  let code = readFileSync(file, 'utf8');
  let changed = [];
  for (let guard = 0; guard < 500; guard++){
    const ast = parse(code), sm = eslintScope.analyze(ast, { ecmaVersion: 2022, sourceType: 'module' });
    const top = sm.scopes.find(s => s.type === 'module');
    const declOrder = new Map();   // nombre → posición de su declaración
    for (const st of ast.body){ const d = st.type === 'ExportNamedDeclaration' && st.declaration ? st.declaration : st;
      if (d.type === 'VariableDeclaration') for (const x of d.declarations) declOrder.set(x.id.name, { pos: st.range[0], st: d, x });
      if (d.type === 'FunctionDeclaration') declOrder.set(d.id.name, { pos: -1, fn: true }); }
    const imported = new Set(ast.body.filter(s => s.type === 'ImportDeclaration').flatMap(s => s.specifiers.map(sp => sp.local.name)));
    const isPure = (n, before) => {
      if (!n) return true;
      switch (n.type){
        case 'Literal': return true;
        case 'Identifier': {
          if (['Math', 'Infinity', 'NaN', 'undefined'].includes(n.name)) return true;
          const d = declOrder.get(n.name);
          if (d && d.fn) return true;
          if (d && d.pos < before && d.st.kind === 'const' && isPure(d.x.init, d.pos)) return true;
          return false;   // lo importado podría no estar listo todavía: no se arriesga
        }
        case 'ArrowFunctionExpression': case 'FunctionExpression': return true;
        case 'TemplateLiteral': return n.expressions.every(e => isPure(e, before));
        case 'ArrayExpression': return n.elements.every(e => !e || (e.type !== 'SpreadElement' && isPure(e, before)));
        case 'ObjectExpression': return n.properties.every(p => p.type === 'Property' && !p.computed && isPure(p.value, before));
        case 'UnaryExpression': return n.operator !== 'delete' && isPure(n.argument, before);
        case 'BinaryExpression': case 'LogicalExpression': return isPure(n.left, before) && isPure(n.right, before);
        case 'ConditionalExpression': return isPure(n.test, before) && isPure(n.consequent, before) && isPure(n.alternate, before);
        case 'MemberExpression': return n.object.type === 'Identifier' && n.object.name === 'Math' && !n.computed;
        case 'NewExpression': return n.callee.type === 'Identifier' && ['Set', 'Map'].includes(n.callee.name) && n.arguments.length <= 1 && n.arguments.every(a => isPure(a, before));
        default: return false;
      }
    };
    let done = false;
    for (const st of ast.body){
      const fn = st.type === 'ExportNamedDeclaration' && st.declaration && st.declaration.type === 'FunctionDeclaration' ? st.declaration : null;
      if (!fn || !/^init[A-Z]/.test(fn.id.name)) continue;
      for (const s of fn.body.body){
        if (s.type !== 'ExpressionStatement' || s.expression.type !== 'AssignmentExpression' || s.expression.operator !== '=' || s.expression.left.type !== 'Identifier') continue;
        const name = s.expression.left.name, d = declOrder.get(name);
        if (!d || d.fn || d.x.init || d.st.declarations.length !== 1 || d.pos > fn.range[0]) continue;
        const v = top.set.get(name); if (!v) continue;
        if (v.references.filter(r => r.isWrite()).length !== 1) continue;   // solo esta asignación
        if (!isPure(s.expression.right, d.pos)) continue;
        // `let X;` → `const X = <valor>;` y se quita la asignación del arranque
        const value = code.slice(s.expression.right.range[0], s.expression.right.range[1]);
        let end = s.range[1]; if (code[end] === '\n') end++;
        let start = s.range[0]; while (start > 0 && (code[start - 1] === ' ' || code[start - 1] === '\t')) start--;
        code = code.slice(0, start) + code.slice(end);
        code = code.slice(0, d.st.range[0]) + 'const ' + name + ' = ' + value + ';' + code.slice(d.st.range[1]);
        changed.push(name); done = true; break;
      }
      if (done) break;
    }
    if (!done) break;
  }
  // una función de arranque que quedó vacía se quita (y su llamada en main.js)
  const ast = parse(code);
  for (const st of ast.body){
    const fn = st.type === 'ExportNamedDeclaration' && st.declaration && st.declaration.type === 'FunctionDeclaration' ? st.declaration : null;
    if (fn && /^init[A-Z]/.test(fn.id.name) && fn.body.body.length === 0){
      // el comentario JSDoc pegado justo encima (solo espacios entre los dos)
      let a = st.range[0]; const c = ast.comments.filter(x => x.range[1] <= a).pop();
      if (c && c.type === 'Block' && code.slice(c.range[1], a).trim() === '') a = c.range[0];
      code = code.slice(0, a) + code.slice(st.range[1]);
      const main = join(JS, 'main.js'); let m = readFileSync(main, 'utf8');
      m = m.replace(new RegExp('^' + fn.id.name + '\\(\\);\\n', 'm'), '').replace(new RegExp('import \\{ ' + fn.id.name + " \\} from '(\\./[^']+)';", 'm'), "import '$1';");
      writeFileSync(main, m); changed.push('(sin ' + fn.id.name + ')');
    }
  }
  writeFileSync(file, code);
  console.log(rel + ': ' + (changed.length ? changed.join(', ') : 'nada'));
}
