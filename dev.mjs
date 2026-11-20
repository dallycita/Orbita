// Servidor para trabajar: abre http://localhost:5173 y cada vez que guardas un archivo de src/
// se vuelve a armar index.html y el navegador se recarga solo.
//   node dev.mjs
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = +process.env.PORT || 5173;
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.json': 'application/json'};
const clients = new Set();

function rebuild(){
  try{ writeFileSync(join(ROOT, 'index.html'), build()); console.log(new Date().toLocaleTimeString() + '  ✓ armado'); for (const c of clients) c.write('data: reload\n\n'); }
  catch(e){ console.error('✗ ' + e.message); }
}

// vigila src/ (revisa las fechas de los archivos cada 300 ms: funciona igual en Windows, Mac y Linux)
const stamp = () => { const all = []; const walk = d => { for (const f of readdirSync(d, {withFileTypes: true})){ const p = join(d, f.name); if (f.isDirectory()) walk(p); else all.push(p + ':' + statSync(p).mtimeMs); } }; walk(join(ROOT, 'src')); return all.join('|'); };
let last = stamp(); rebuild();
setInterval(() => { const s = stamp(); if (s !== last){ last = s; rebuild(); } }, 300);

const RELOAD = '<script>new EventSource("/__recarga").onmessage = () => location.reload();</script>';
createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/__recarga'){ res.writeHead(200, {'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive'}); res.write('\n'); clients.add(res); req.on('close', () => clients.delete(res)); return; }
  const path = normalize(join(ROOT, url === '/' ? 'index.html' : url));
  if (!path.startsWith(ROOT) || !existsSync(path) || statSync(path).isDirectory()){ res.writeHead(404); res.end('No existe'); return; }
  let body = readFileSync(path);
  if (path.endsWith('index.html')) body = body.toString().replace('</body>', RELOAD + '</body>');   // la recarga solo existe aquí, no en el archivo
  res.writeHead(200, {'Content-Type': TYPES[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store'}); res.end(body);
}).listen(PORT, () => console.log('Órbita en http://localhost:' + PORT + '  (Ctrl+C para cerrar)'));
