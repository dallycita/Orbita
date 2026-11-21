// ---------- medidor de rendimiento (pruebas) ----------
// Se enciende en Ajustes ("Medidor de rendimiento") o agregando ?medir al enlace. Apagado no hace nada.
// Muestra, de los últimos 2 segundos: cuadros por segundo, ms entre cuadros (mediana y peor 5 %), cuánto de cada cuadro
// es nuestro código (lógica y dibujo) y cuántos "tirones" hubo (cuadros de más de 25 ms) en los últimos 10 segundos.
// Si los ms entre cuadros son altos pero nuestro código tarda poco, el que no da abasto es la tarjeta gráfica.
let MEDIR = false;
try {
  MEDIR =
    localStorage.getItem('orbita_medidor') === '1' ||
    /[?&#]medir\b/.test(location.search + location.hash);
} catch (e) {}
let medEl = null,
  medPrev = 0,
  medMid = 0,
  medShow = 0;
const medInt = [],
  medJs = [],
  medUpd = [],
  medJank = [];
function medFrame(now, t0) {
  const t1 = performance.now();
  if (medPrev) {
    medInt.push(now - medPrev);
    if (now - medPrev > 25) medJank.push(now);
  }
  medPrev = now;
  medJs.push(t1 - t0);
  medUpd.push(medMid ? medMid - t0 : -1);
  medMid = 0;
  while (medInt.length > 120) medInt.shift();
  while (medJs.length > 120) {
    medJs.shift();
    medUpd.shift();
  }
  while (medJank.length && now - medJank[0] > 10000) medJank.shift();
  if (now - medShow < 500) return;
  medShow = now;
  if (!medEl) {
    medEl = document.createElement('div');
    medEl.id = 'medidor';
    medEl.setAttribute('aria-hidden', 'true');
    medEl.style.cssText =
      'position:fixed;left:10px;bottom:10px;z-index:50;pointer-events:none;padding:8px 10px;border-radius:10px;background:rgba(5,7,13,.78);border:1px solid rgba(236,230,216,.18);font:400 10px/1.55 "Space Mono",ui-monospace,monospace;color:#ece6d8;white-space:pre;letter-spacing:.02em';
    document.body.appendChild(medEl);
  }
  const srt = a => [...a].sort((x, y) => x - y),
    q = (s, p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0);
  const iv = srt(medInt),
    js = srt(medJs),
    up = medUpd.filter(x => x >= 0),
    med = q(iv, 0.5),
    fps = med ? 1000 / med : 0;
  const upm = up.length ? q(srt(up), 0.5) : -1,
    jsm = q(js, 0.5);
  const col = fps >= 55 ? '#8ff0c0' : fps >= 40 ? '#ffd36b' : '#ff7a6b';
  medEl.innerHTML =
    '<b style="color:' +
    col +
    ';font-weight:400">FPS ' +
    fps.toFixed(0).padStart(3) +
    '</b>   cuadro ' +
    med.toFixed(1) +
    ' ms (peor ' +
    q(iv, 0.95).toFixed(1) +
    ')\n' +
    'código ' +
    jsm.toFixed(1) +
    ' ms' +
    (upm >= 0 ? ' (lógica ' + upm.toFixed(1) + ' · dibujo ' + (jsm - upm).toFixed(1) + ')' : '') +
    '\n' +
    'tirones ' +
    medJank.length +
    ' en 10 s   partículas ' +
    particles.length;
}
