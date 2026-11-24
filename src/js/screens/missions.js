/**
 * Misiones diarias, logros y polvo estelar: progreso guardado, panel de Misiones y sus dibujos.
 * Estrellas = habilidad (desbloquean); polvo estelar = constancia (compra). Hay tres misiones
 * diarias que cambian a medianoche. El progreso vive en `MIS` (localStorage `orbita_mis`).
 */
import { buzz } from '../core/display.js';
import { AC, ROOT, noise } from '../audio/engine.js';
import { PLANETS_P, curPlanet } from '../game/planets.js';
import { t } from '../core/run-state.js';

import { COIN_RINGS } from '../data/levels.js';

import { MIS_ACH, MIS_FACT } from '../data/missions.js';
import { muted } from '../core/settings.js';
import { PLGL, planetThumb } from '../render/planets.js';
import { uiGlass, uiTone } from '../audio/ui-sounds.js';
import { lvStarsGot } from '../game/progress.js';
import { MIS, achProg, misDef, misLoad, misRoll, misSave, misToday } from '../game/missions.js';
import { emit, on } from '../core/events.js';
import { elHome } from '../core/dom.js';
import { misMoons } from '../render/mission-icons.js';

/**
 * Ícono SVG de cristales de polvo estelar. Cada llamada usa un id de degradado distinto para que
 * varios íconos en la misma página no compartan el mismo `<linearGradient>`.
 *
 * @returns {string} Fragmento SVG.
 */
function misCrystal() {
  return (
    '<defs><linearGradient id="mcg' +
    (misCrystal.n = (misCrystal.n || 0) + 1) +
    '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8fffb"/><stop offset="1" stop-color="#3fc7b8"/></linearGradient></defs><path d="M9 3.0 L13.030000000000001 9.5 L9 16.0 L4.97 9.5Z" fill="url(#mcg' +
    misCrystal.n +
    ')"/><path d="M17.5 10.3 L20.104 14.5 L17.5 18.7 L14.896 14.5Z" fill="url(#mcg' +
    misCrystal.n +
    ')"/><path d="M10.5 16.2 L12.236 19 L10.5 21.8 L8.764 19Z" fill="#bff3ec"/>'
  );
}
var misDetail = null;
var misTab = 'diarias';
var misTimer = null;
var misFx = 0;
var misOpen = false;
var misSwitch = 0;
/**
 * Aviso durante la partida: el ícono de las misiones aparece un instante arriba con la nueva
 * estrella encendida, con un tono suave.
 */
function misPing() {
  let el = document.getElementById('misping');
  if (!el) {
    el = document.createElement('div');
    el.id = 'misping';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  el.innerHTML = '<svg viewBox="0 0 100 100">' + misMoons() + '</svg>';
  el.classList.remove('go');
  // Leer el tamaño fuerza un reflujo para que la animación `.go` vuelva a empezar.
  void el.offsetWidth;
  el.classList.add('go');
  if (AC && !muted) {
    try {
      const n = AC.currentTime;
      [19, 24].forEach((sm, i) => uiTone(ROOT * 2 * Math.pow(2, sm / 12), n + i * 0.07, 0.6, 0.03));
    } catch (e) {}
  }
}
/**
 * Racha de días seguidos con el premio diario cobrado; se pierde si se salta un día.
 *
 * @returns {number} Días de racha.
 */
function misStreak() {
  return MIS.lastBonus === misToday() || MIS.lastBonus === misToday(-1) ? MIS.streak : 0;
}
/**
 * Tiempo que falta para medianoche, cuando cambian las misiones.
 *
 * @returns {string} Texto `HH:MM:SS`.
 */
function misLeft() {
  const n = new Date(),
    m = new Date(n);
  m.setHours(24, 0, 0, 0);
  let s = Math.max(0, Math.floor((m - n) / 1000));
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const mi = Math.floor(s / 60);
  return (
    String(h).padStart(2, '0') +
    ':' +
    String(mi).padStart(2, '0') +
    ':' +
    String(s - mi * 60).padStart(2, '0')
  );
}
let elMis;
/**
 * Abre el panel de Misiones sobre el inicio y actualiza cada segundo la cuenta regresiva (y las
 * misiones si pasa la medianoche con el panel abierto).
 */
function openMissions() {
  misLoad();
  misOpen = true;
  misFx = 0;
  misCount.v = null;
  misWhoosh(true);
  if (elMis) {
    elMis.classList.remove('still');
    clearTimeout(openMissions.st);
    openMissions.st = setTimeout(() => {
      if (misOpen) {
        elMis.classList.add('still');
      }
    }, 520);
  }
  if (elHome) {
    elHome.classList.add('off');
  }
  if (elMis) {
    elMis.classList.remove('off', 'out');
  }
  renderMissions();
  clearInterval(misTimer);
  misTimer = setInterval(() => {
    const e = elMis && elMis.querySelector && elMis.querySelector('.mtime');
    if (e) {
      e.textContent = misLeft();
    }
    if (MIS.day !== misToday()) {
      misRoll();
      renderMissions();
    }
  }, 1000);
}
/**
 * Sonido de abrir o cerrar el panel: un soplo filtrado que sube o baja, con un tono.
 *
 * @param {boolean} up true al abrir, false al cerrar.
 */
function misWhoosh(up) {
  if (!AC || muted) {
    return;
  }
  try {
    noise(0.4, up ? 500 : 2600, up ? 2600 : 500, 0.1, 'bandpass');
    uiTone(
      ROOT * 2 * Math.pow(2, (up ? 19 : 12) / 12),
      AC.currentTime + (up ? 0.12 : 0),
      0.7,
      0.025,
    );
  } catch (e) {}
}
function closeMissions() {
  if (!misOpen) {
    return;
  }
  clearInterval(misTimer);
  misOpen = false;
  misWhoosh(false);
  if (elMis) {
    elMis.classList.add('out');
  }
  setTimeout(() => {
    if (!misOpen && elMis) {
      elMis.classList.add('off');
    }
  }, 320);
  emit('homeChanged');
  if (elHome) {
    elHome.classList.remove('off');
  }
}
/**
 * Arpegio de cobrar un premio.
 *
 * @param {boolean} big true para el arpegio largo (logros y premio del día).
 */
function misClaimSound(big) {
  if (!AC || muted) {
    return;
  }
  try {
    const n = AC.currentTime;
    (big ? [12, 16, 19, 24, 28] : [19, 24, 28]).forEach((sm, i) =>
      uiTone(ROOT * Math.pow(2, sm / 12), n + i * 0.06, 1.2, 0.045),
    );
  } catch (e) {}
}
const MIS_DICO = {
  perf10: 'perf',
  streak3: 'streak',
  reach30: 'reach',
  ring100: 'rings',
  star2: 'star',
  win1: 'flag',
  onda3: 'onda',
  power3: 'power',
};
const MIS_AICO = {
  andro1: 'one',
  seis: 'star',
  perf100: 'perf',
  ondas20: 'onda',
  todos: 'galaxy',
  sol: 'q',
};
var misThumbs = {};
var misMinis = {};
// Miniaturas con el mismo lenguaje que los dibujos grandes del juego (brillos, colores de cada
// galaxia); se dibujan una vez y se guardan como imagen en `misMinis`.
function misMini(kind) {
  if (misMinis[kind]) {
    return misMinis[kind];
  }
  const S2 = 88,
    c = document.createElement('canvas');
  c.width = c.height = S2;
  const g = c.getContext && c.getContext('2d');
  if (!g) {
    return '';
  }
  const cx = S2 / 2,
    cy = S2 / 2;
  const glow = (x, y, r, col, a) => {
    const gg = g.createRadialGradient(x, y, 0, x, y, r);
    gg.addColorStop(0, col.replace('A', a));
    gg.addColorStop(1, col.replace('A', 0));
    g.fillStyle = gg;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  };
  const star5 = (x, y, r, col) => {
    g.fillStyle = col;
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const an = -Math.PI / 2 + (i * Math.PI) / 5,
        q = i % 2 ? r * 0.45 : r;
      g.lineTo(x + Math.cos(an) * q, y + Math.sin(an) * q);
    }
    g.closePath();
    g.fill();
  };
  const star4 = (x, y, r, col) => {
    g.fillStyle = col;
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const an = -Math.PI / 2 + (i * Math.PI) / 4,
        q = i % 2 ? r * 0.28 : r;
      g.lineTo(x + Math.cos(an) * q, y + Math.sin(an) * q);
    }
    g.closePath();
    g.fill();
  };
  const ring = (r, col, w) => {
    g.strokeStyle = col;
    g.lineWidth = w;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.stroke();
  };
  const spiral = (col, core) => {
    glow(cx, cy, 34, col, 0.3);
    g.save();
    g.translate(cx, cy);
    g.scale(1, 0.6);
    g.rotate(-0.4);
    for (let arm = 0; arm < 2; arm++) {
      for (let i = 0; i < 44; i++) {
        const k = i / 44,
          an = arm * Math.PI + k * 4.2,
          q = 4 + k * 30;
        g.globalAlpha = (1 - k) * 0.9;
        g.fillStyle = i % 3 ? '#eef2ff' : col.replace('A', 1);
        g.beginPath();
        g.arc(Math.cos(an) * q, Math.sin(an) * q, 1.4 + (1 - k) * 1.6, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();
    g.globalAlpha = 1;
    glow(cx, cy, 9, core, 0.95);
  };
  switch (kind) {
    case 'perf':
      glow(cx, cy, 30, 'rgba(255,211,107,A)', 0.45);
      ring(24, 'rgba(255,211,107,.35)', 2);
      star4(cx, cy, 17, '#ffd36b');
      star4(cx, cy, 7, '#fff4d6');
      break;
    case 'streak':
      [
        [-18, 8],
        [0, -6],
        [18, 8],
      ].forEach(([dx, dy], i) => {
        glow(cx + dx, cy + dy, 13, 'rgba(255,211,107,A)', 0.4);
        star5(cx + dx, cy + dy, i === 1 ? 11 : 8, '#ffd36b');
      });
      break;
    case 'star':
      glow(cx, cy, 30, 'rgba(255,211,107,A)', 0.5);
      star5(cx, cy, 20, '#ffd36b');
      star5(cx - 3, cy - 3, 7, '#fff4d6');
      break;
    case 'reach':
    case 'rings':
      ring(30, 'rgba(236,230,216,.28)', 1.5);
      ring(21, 'rgba(236,230,216,.45)', 1.5);
      ring(12, 'rgba(236,230,216,.7)', 2);
      g.fillStyle = '#05060c';
      g.beginPath();
      g.arc(cx, cy, 6, 0, Math.PI * 2);
      g.fill();
      glow(cx, cy, 10, 'rgba(255,90,31,A)', 0.55);
      if (kind === 'rings') {
        [
          [0.6, 21],
          [2.4, 21],
          [4.1, 30],
          [5.3, 30],
          [1.4, 30],
        ].forEach(([a, q]) => {
          g.fillStyle = '#c9c2b2';
          g.beginPath();
          g.arc(cx + Math.cos(a) * q, cy + Math.sin(a) * q, 2.6, 0, Math.PI * 2);
          g.fill();
        });
      }
      glow(cx, cy - 30, 8, 'rgba(143,208,255,A)', 0.7);
      g.fillStyle = '#3d8bff';
      g.beginPath();
      g.arc(cx, cy - 30, 4, 0, Math.PI * 2);
      g.fill();
      break;
    case 'flag':
      glow(cx, cy, 30, 'rgba(255,100,28,A)', 0.4);
      g.strokeStyle = 'rgba(255,138,61,.9)';
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(cx, cy, 22, 9, 0, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = '#000';
      g.beginPath();
      g.arc(cx, cy, 11, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(255,220,170,.9)';
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(cx, cy, 11.5, 0, Math.PI * 2);
      g.stroke();
      g.strokeStyle = 'rgba(143,208,255,.7)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(cx + 8, cy - 8);
      g.lineTo(cx + 22, cy - 24);
      g.stroke();
      g.fillStyle = '#3d8bff';
      g.beginPath();
      g.arc(cx + 24, cy - 26, 4.5, 0, Math.PI * 2);
      g.fill();
      break;
    case 'onda':
      for (let j = 0; j < 4; j++) {
        const u = j / 4;
        g.strokeStyle = 'rgba(255,111,168,' + (1 - u) * 0.9 + ')';
        g.lineWidth = 3 * (1 - u) + 0.8;
        g.beginPath();
        g.arc(cx, cy, 8 + u * 26, 0, Math.PI * 2);
        g.stroke();
      }
      glow(cx, cy, 12, 'rgba(255,194,218,A)', 0.95);
      break;
    case 'power': {
      let res = null;
      try {
        res = PLGL.render('tierra', 40, 0.9, [-0.55, 0.45, 0.35], [1.1, 1.04, 0.96], 1);
      } catch (e) {}
      glow(cx, cy, 34, 'rgba(255,211,107,A)', 0.35);
      g.strokeStyle = '#ffd36b';
      g.lineWidth = 3;
      g.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const a0 = -Math.PI / 2 + i * 2.094 + 0.25;
        g.beginPath();
        g.arc(cx, cy, 25, a0, a0 + 2.094 - 0.5);
        g.stroke();
      }
      if (res) {
        const hh = 18 * res.pad;
        g.drawImage(res.cv, cx - hh, cy - hh, 2 * hh, 2 * hh);
      } else {
        g.fillStyle = '#3d8bff';
        g.beginPath();
        g.arc(cx, cy, 18, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case 'one':
      spiral('rgba(156,192,255,A)', 'rgba(255,248,230,A)');
      break;
    case 'galaxy':
      spiral('rgba(255,211,138,A)', 'rgba(255,248,230,A)');
      break;
    case 'q':
      g.strokeStyle = 'rgba(236,230,216,.18)';
      g.setLineDash([2, 5]);
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(cx, cy, 24, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = 'rgba(236,230,216,.12)';
      g.beginPath();
      g.arc(cx, cy, 6, 0, Math.PI * 2);
      g.fill();
      break;
  }
  return (misMinis[kind] = '<img src="' + c.toDataURL() + '" alt="">');
}
/**
 * Miniatura de un planeta para el panel. Solo se guarda cuando ya es imagen; mientras el planeta
 * en alta definición no está listo, se devuelve el respaldo sin guardarlo.
 *
 * @param {string} id Id del planeta.
 * @returns {string} HTML de la miniatura.
 */
function misThumb(id) {
  if (!misThumbs[id]) {
    const h = planetThumb(id);
    if (h.indexOf('<img') === 0) {
      misThumbs[id] = h;
    } else {
      return h;
    }
  }
  return misThumbs[id];
}
const GAL_COL = {
  'Sistema solar': '#ffd38a',
  'Nubes de Magallanes': '#ff8fbf',
  Andrómeda: '#9cc0ff',
  'Centaurus A': '#ffb27a',
  Remolino: '#9fd8ff',
  Sombrero: '#e9d4a2',
  M87: '#ffcf8a',
  'Sagitario A*': '#ff9a6b',
};
// Colorea los nombres de galaxias dentro de un texto con el color de cada una.
const misTint = txt =>
  txt.replace(
    /Sistema solar|Nubes de Magallanes|Andrómeda|Centaurus A|Remolino|Sombrero|M87|Sagitario A\*/g,
    m => '<span style="color:' + GAL_COL[m] + '">' + m + '</span>',
  );
const MIS_COL = {
  onda3: '#ff8fbf',
  ondas20: '#ff8fbf',
  andro1: '#9cc0ff',
  seis: '#ffd36b',
  perf100: '#ffd36b',
  todos: '#ffd38a',
  sol: '#ffb347',
};
/**
 * Logro destacado: el más cercano a completarse, o uno listo para cobrar. Los secretos no se
 * muestran hasta completarse.
 *
 * @returns {number} Índice en `MIS_ACH`.
 */
function misFeatured() {
  let best = 0,
    bs = -1;
  MIS_ACH.forEach((a, i) => {
    if (MIS.ach[a.id]) {
      return;
    }
    const [c, n] = achProg(a);
    if (a.secret && c < n) {
      return;
    }
    const sc = c >= n ? 9 : c / n;
    if (sc > bs) {
      bs = sc;
      best = i;
    }
  });
  return best;
}
/**
 * Redibuja todo el panel de Misiones (pestaña activa, tarjetas, contador de polvo) y conecta sus
 * botones.
 */
function renderMissions() {
  if (!elMis) {
    return;
  }
  misLoad();
  let got = 0,
    all = 0;
  COIN_RINGS.forEach((set, i) => {
    if (!set) {
      return;
    }
    all += set.size;
    const g = lvStarsGot(i);
    set.forEach(k => {
      if (g.includes(k)) {
        got++;
      }
    });
  });
  const CRY = '<svg class="cr" viewBox="0 0 24 24" aria-hidden="true">' + misCrystal() + '</svg>';
  const STR =
    '<svg class="st" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>';
  const btn = k => '<button type="button" class="claim" data-k="' + k + '">Reclamar</button>';
  const icon = (kind, planet, col) =>
    '<div class="mic"' +
    (col ? ' style="--mc:' + col + '"' : '') +
    '>' +
    (planet ? misThumb(planet) : misMini(kind)) +
    '</div>';
  const bar = (c, n) =>
    '<div class="mbar"><i><u style="width:' +
    Math.round((c / n) * 100) +
    '%"></u></i><small>' +
    c +
    '/' +
    n +
    '</small></div>';
  const rw = (n, done) =>
    '<div class="rw"><span>+' +
    n +
    ' ' +
    CRY +
    '</span>' +
    (done ? '<small>hecho</small>' : '') +
    '</div>';
  const card = (k, ic, t, d, right, cls, prog, extra) =>
    '<div class="mc' +
    (cls ? ' ' + cls : '') +
    '" data-r="' +
    k +
    '">' +
    ic +
    '<div class="bd"><h3>' +
    t +
    '</h3>' +
    (d ? '<p>' + misTint(d) + '</p>' : '') +
    (extra || '') +
    (prog ? bar(prog[0], prog[1]) : '') +
    '</div>' +
    right +
    '</div>';
  let body = '';
  if (misTab === 'diarias') {
    const nC = MIS.daily.filter(m => m.c).length,
      nD = MIS.daily.filter(m => m.c || m.p >= (misDef(m.id) || { n: 1 }).n).length,
      allC = nC === 3;
    // Tarjeta de vidrio: tu planeta con sus tres lunas (una por misión) y el premio del día.
    body +=
      '<div class="mhero" data-r="bonus" style="--hc:#9ff0e4"><canvas class="mplanet" data-kind="moons" data-n="' +
      nD +
      '" aria-hidden="true"></canvas><div class="hb">' +
      '<div class="hk">Premio del día</div><div class="ha">' +
      CRY +
      '+100</div><div class="hn">Nuevas en <span class="mtime">' +
      misLeft() +
      '</span></div></div>' +
      (allC && !MIS.bonus
        ? btn('bonus')
        : MIS.bonus
          ? '<div class="rw"><span>✓</span><small>hecho</small></div>'
          : '<div class="hseg">' +
            [0, 1, 2].map(i => '<b class="' + (i < nC ? 'on' : '') + '"></b>').join('') +
            '</div>') +
      '</div>';
    body +=
      '<div class="mhead"><span>Misiones de hoy</span><span>' +
      nC +
      ' / 3</span></div><div class="mcards">';
    MIS.daily
      .map((m, i) => [m, i])
      .sort((x, y) => (x[0].c ? 1 : 0) - (y[0].c ? 1 : 0))
      .forEach(([m, i]) => {
        const D = misDef(m.id);
        if (!D) {
          return;
        }
        const done = m.p >= D.n;
        body += card(
          'd' + i,
          icon(MIS_DICO[D.id], null, MIS_COL[D.id]),
          D.t,
          D.d,
          m.c ? rw(D.rw, true) : done ? btn('d' + i) : rw(D.rw),
          m.c ? 'got' : done ? 'go' : '',
          D.n > 1 && !m.c ? [m.p, D.n] : null,
        );
      });
    const sk = misStreak();
    body +=
      '</div><div class="mstreak"><span>Racha · <b>' +
      sk +
      (sk === 1 ? ' día' : ' días') +
      '</b></span><span class="days">' +
      [0, 1, 2, 3, 4, 5, 6].map(i => '<b class="' + (i < sk ? 'on' : '') + '"></b>').join('') +
      '</span><span class="sev">+250 ' +
      CRY +
      '</span></div>';
  } else {
    const achDone = MIS_ACH.filter(a => MIS.ach[a.id]).length,
      fi = misFeatured(),
      F = MIS_ACH[fi],
      [fc, fn] = achProg(F),
      fcol = MIS_COL[F.id] || '#8fd0ff';
    body +=
      '<div class="mhero" data-open="' +
      fi +
      '" data-r="a' +
      fi +
      '" style="--hc:' +
      fcol +
      '"><canvas class="mplanet" data-kind="' +
      F.id +
      '" aria-hidden="true"></canvas><div class="hb">' +
      '<div class="hk">Más cerca</div><div class="ht">' +
      F.t +
      '</div>' +
      (fc < fn ? bar(fc, fn) : '') +
      '</div>' +
      (fc >= fn ? btn('a' + fi) : rw(F.rw)) +
      '</div>';
    const achCard = (a, j, ic, extra) => {
      const [c, n, d] = achProg(a),
        done = c >= n,
        cl = MIS.ach[a.id],
        hid = a.secret && !done;
      return (
        (hid ? '' : '<div data-open="' + j + '">') +
        card(
          'a' + j,
          ic,
          hid ? '???' : a.t,
          hid ? 'Un logro secreto' : a.d && n > 1 ? a.d : d,
          cl
            ? rw(a.rw, true)
            : done
              ? btn('a' + j)
              : hid
                ? '<div class="rw dim">???</div>'
                : rw(a.rw),
          cl ? 'got' : done ? 'go' : '',
          !hid && !cl && n > 1 ? [c, n] : null,
          extra,
        ) +
        (hid ? '' : '</div>')
      );
    };
    const nextP = (PLANETS_P.find(P => !MIS.planetsWon.includes(P.id) && !P.secret) || PLANETS_P[0])
      .id;
    const row =
      '<div class="mpl">' +
      PLANETS_P.map(
        P =>
          '<span class="' +
          (MIS.planetsWon.includes(P.id) ? 'on' : '') +
          '">' +
          misThumb(P.id) +
          '</span>',
      ).join('') +
      '</div>';
    const done1 = j => (MIS.ach[MIS_ACH[j].id] ? 1 : 0);
    const plan = [
      [0, 'tierra'],
      [1, nextP],
    ]
      .filter(([j]) => j !== fi)
      .sort((x, y) => done1(x[0]) - done1(y[0]));
    const skill = MIS_ACH.map((a, j) => j)
      .filter(j => j > 1 && j !== fi)
      .sort((x, y) => done1(x) - done1(y));
    if (plan.length) {
      body +=
        '<div class="mhead"><span>Planetas</span><span>' +
        achDone +
        ' de ' +
        MIS_ACH.length +
        '</span></div><div class="mcards">' +
        plan
          .map(([j, pid]) => achCard(MIS_ACH[j], j, icon(null, pid), j === 1 ? row : ''))
          .join('') +
        '</div>';
    }
    body +=
      '<div class="mhead"><span>Habilidad</span><span>' +
      (plan.length ? '' : achDone + ' de ' + MIS_ACH.length) +
      '</span></div><div class="mcards">' +
      skill
        .map(j =>
          achCard(MIS_ACH[j], j, icon(MIS_AICO[MIS_ACH[j].id], null, MIS_COL[MIS_ACH[j].id])),
        )
        .join('') +
      '</div>';
  }
  const dotL =
    misTab === 'diarias' &&
    MIS_ACH.some(a => {
      const [c, n] = achProg(a);
      return c >= n && !MIS.ach[a.id];
    });
  const dotD =
    misTab === 'logros' &&
    (MIS.daily.some(m => !m.c && m.p >= misDef(m.id).n) ||
      (!MIS.bonus && MIS.daily.every(m => m.c)));
  const shown = misCount.v !== null ? misCount.v : MIS.polvo;
  elMis.innerHTML =
    '<button type="button" class="back" aria-label="Volver al inicio">' +
    ARC_L +
    CHEV_L +
    '</button><div class="mtop">MISIONES</div>' +
    '<div class="mwal"><span class="s">' +
    STR +
    '<b>' +
    got +
    '</b><i>/ ' +
    all +
    '</i></span><span class="c">' +
    CRY +
    '<b class="mpv">' +
    shown +
    '</b></span></div>' +
    '<div class="mpanel"><div class="mgrab" aria-hidden="true"></div><div class="mwrap"><div class="mtabs"><button type="button" class="' +
    (misTab === 'diarias' ? 'on' : '') +
    '" data-t="diarias">Diarias' +
    (dotD ? '<i></i>' : '') +
    '</button><button type="button" class="' +
    (misTab === 'logros' ? 'on' : '') +
    '" data-t="logros">Logros' +
    (dotL ? '<i></i>' : '') +
    '</button></div>' +
    body +
    '</div></div>' +
    (misDetail !== null && misTab === 'logros' ? misDetailHTML(CRY) : '') +
    (MIS.showFact
      ? '<div class="mfact"><b>Polvo estelar</b>Los granos de polvo que dejan las estrellas al morir son cristales diminutos, algunos más antiguos que el Sol.</div>'
      : '');
  if (!elMis.querySelectorAll) {
    return;
  }
  const bk = elMis.querySelector('.back');
  if (bk) {
    bk.addEventListener('click', closeMissions);
  }
  elMis.querySelectorAll('.mtabs button').forEach(b =>
    b.addEventListener('click', () => {
      if (misTab === b.dataset.t) {
        return;
      }
      const dir = b.dataset.t === 'logros' ? 1 : -1;
      misTab = b.dataset.t;
      uiGlass(dir);
      misSwitch = dir;
      renderMissions();
    }),
  );
  if (misSwitch) {
    elMis.classList.add('still');
    const w = elMis.querySelector('.mwrap');
    if (w) {
      w.style.setProperty('--sd', misSwitch * 14 + 'px');
      w.classList.add('swap');
    }
    misSwitch = 0;
  }
  misSwipe();
  elMis.querySelectorAll('[data-open]').forEach(el =>
    el.addEventListener('click', e => {
      if (e.target.closest && e.target.closest('.claim')) {
        return;
      }
      misDetail = +el.dataset.open;
      uiGlass(1);
      renderMissions();
    }),
  );
  const dt = elMis.querySelector('.mdet');
  if (dt) {
    const close = () => {
      const d2 = elMis.querySelector('.mdet');
      if (d2) {
        d2.classList.add('out');
      }
      setTimeout(() => {
        misDetail = null;
        renderMissions();
      }, 240);
      uiGlass(-1);
    };
    const bg = dt.querySelector('.mdbg');
    if (bg) {
      bg.addEventListener('click', close);
    }
    const xb = dt.querySelector('.mdx');
    if (xb) {
      xb.addEventListener('click', close);
    }
    const cd = dt.querySelector('.mdcard');
    let y0 = null,
      dy = 0;
    if (cd) {
      cd.addEventListener('pointerdown', e => {
        if (e.target.closest && e.target.closest('button')) {
          return;
        }
        y0 = e.clientY;
        dy = 0;
      });
      cd.addEventListener('pointermove', e => {
        if (y0 === null) {
          return;
        }
        dy = Math.max(0, e.clientY - y0);
        cd.style.transition = 'none';
        cd.style.transform = 'translateY(' + dy + 'px)';
      });
      const up = () => {
        if (y0 === null) {
          return;
        }
        y0 = null;
        cd.style.transition = 'transform .2s ease-out';
        if (dy > 90) {
          close();
        } else {
          cd.style.transform = '';
        }
      };
      cd.addEventListener('pointerup', up);
      cd.addEventListener('pointercancel', up);
    }
  }
  elMis.querySelectorAll('.claim').forEach(b =>
    b.addEventListener('click', () => {
      const k = b.dataset.k;
      let amt = 0,
        big = false;
      if (k === 'bonus') {
        if (MIS.bonus) {
          return;
        }
        MIS.bonus = true;
        amt = 100;
        big = true;
        MIS.streak = MIS.lastBonus === misToday(-1) && MIS.streak < 7 ? MIS.streak + 1 : 1;
        MIS.lastBonus = misToday();
        if (MIS.streak === 7) {
          amt += 250;
        }
      } else if (k[0] === 'd') {
        const m = MIS.daily[+k.slice(1)],
          D = m && misDef(m.id);
        if (!m || m.c || m.p < D.n) {
          return;
        }
        m.c = true;
        amt = D.rw;
      } else {
        const a = MIS_ACH[+k.slice(1)];
        if (!a || MIS.ach[a.id]) {
          return;
        }
        MIS.ach[a.id] = 1;
        amt = a.rw;
        big = true;
      }
      if (!MIS.factSeen) {
        MIS.factSeen = true;
        MIS.showFact = true;
        setTimeout(() => {
          if (MIS) {
            MIS.showFact = false;
            const f = elMis.querySelector && elMis.querySelector('.mfact');
            if (f) {
              f.classList.add('out');
            }
          }
        }, 6500);
      }
      const from = b.getBoundingClientRect ? b.getBoundingClientRect() : null,
        old = misCount.v !== null ? misCount.v : MIS.polvo;
      MIS.polvo += amt;
      misSave();
      buzz(big ? [20, 40, 20, 40, 60] : [15, 30, 15]);
      misCount.v = old;
      renderMissions();
      const r = elMis.querySelector('[data-r="' + k + '"]');
      if (r) {
        r.classList.add('flash');
      }
      misBurst(from, amt, big);
    }),
  );
}
/**
 * Vista ampliada del logro abierto (`misDetail`), con su dibujo grande y su dato científico.
 *
 * @param {string} CRY Ícono SVG de cristal para el premio.
 * @returns {string} HTML de la vista, o '' si no hay logro abierto.
 */
function misDetailHTML(CRY) {
  const a = MIS_ACH[misDetail];
  if (!a) {
    return '';
  }
  const [c, n, d] = achProg(a),
    done = c >= n,
    cl = MIS.ach[a.id],
    col = MIS_COL[a.id] || '#8fd0ff';
  const right = cl
    ? '<div class="mdok">✓ Conseguido</div>'
    : done
      ? '<button type="button" class="claim big" data-k="a' +
        misDetail +
        '">Reclamar<em>+' +
        a.rw +
        '</em></button>'
      : '<div class="mdprog"><span>' +
        c +
        ' / ' +
        n +
        '</span><i><u style="width:' +
        Math.round((c / n) * 100) +
        '%"></u></i><b>+' +
        a.rw +
        ' ' +
        CRY +
        '</b></div>';
  return (
    '<div class="mdet" style="--hc:' +
    col +
    '"><div class="mdbg"></div><div class="mdcard" data-r="a' +
    misDetail +
    '"><div class="mgrab"></div><button type="button" class="mdx" aria-label="Cerrar">×</button>' +
    '<canvas class="mplanet mbig" data-kind="' +
    a.id +
    '" data-big="1" aria-hidden="true"></canvas>' +
    '<div class="mdt">' +
    a.t +
    '</div><div class="mdd">' +
    misTint(a.d || d) +
    '</div>' +
    right +
    (MIS_FACT[a.id]
      ? '<div class="mdf"><div class="mdk">Dato real</div><p>' + MIS_FACT[a.id] + '</p></div>'
      : '') +
    '</div></div>'
  );
}
// Número que muestra el contador durante la animación de cobro (null: el valor real).
var misCount = { v: null, raf: 0 };
/**
 * Animación de cobro: la fila destella, salen cristales volando al contador y el número sube de
 * uno en uno con una escala de cristal.
 *
 * @param {Element} from Elemento desde donde salen los cristales.
 * @param {number} amt Polvo estelar ganado.
 * @param {boolean} big true para premios grandes (más cristales).
 */
function misBurst(from, amt, big) {
  const to = elMis.querySelector && elMis.querySelector('.mwal .c');
  if (!from || !to || !to.getBoundingClientRect) {
    misCount.v = null;
    renderMissions();
    return;
  }
  const host = elMis.getBoundingClientRect(),
    tr = to.getBoundingClientRect(),
    tx = tr.left - host.left + 8,
    ty = tr.top - host.top + 8;
  const n = big ? 14 : 9,
    fx = from.left - host.left + from.width / 2,
    fy = from.top - host.top + from.height / 2;
  for (let i = 0; i < n; i++) {
    const e = document.createElement('div');
    e.className = 'mfly';
    e.innerHTML = '<svg viewBox="0 0 24 24">' + misCrystal() + '</svg>';
    const sx = fx + (Math.random() - 0.5) * 60,
      sy = fy + (Math.random() - 0.5) * 30,
      mx = (sx + tx) / 2 + (Math.random() - 0.5) * 120,
      my = Math.min(sy, ty) - 40 - Math.random() * 80;
    e.style.left = sx + 'px';
    e.style.top = sy + 'px';
    elMis.appendChild(e);
    const dl = i * 45,
      dur = 620 + Math.random() * 160;
    if (e.animate) {
      e.animate(
        [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          {
            transform: 'translate(' + (mx - sx) * 0.5 + 'px,' + (my - sy) + 'px) scale(1.2)',
            opacity: 1,
            offset: 0.35,
          },
          {
            transform: 'translate(' + (tx - sx) + 'px,' + (ty - sy) + 'px) scale(.5)',
            opacity: 0.9,
          },
        ],
        { duration: dur, delay: dl, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'forwards' },
      );
    }
    setTimeout(() => e.remove(), dur + dl + 40);
  }
  const start = misCount.v,
    end = MIS.polvo,
    steps = Math.min(end - start, 24),
    t0 = performance.now() + 520,
    D = 700 + steps * 25;
  let lastStep = -1;
  const tick = now => {
    const k = Math.max(0, Math.min(1, (now - t0) / D)),
      v = Math.round(start + (end - start) * k),
      st = Math.floor(k * steps);
    const el = elMis.querySelector && elMis.querySelector('.mpv');
    if (el) {
      el.textContent = v;
    }
    if (st !== lastStep && k > 0) {
      lastStep = st;
      if (AC && !muted) {
        try {
          uiTone(
            ROOT * 2 * Math.pow(2, [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24][st % 11] / 12),
            AC.currentTime,
            0.25,
            0.03,
          );
        } catch (e) {}
      }
    }
    if (k < 1) {
      misCount.raf = requestAnimationFrame(tick);
    } else {
      misCount.v = null;
      const w = elMis.querySelector && elMis.querySelector('.mwal .c');
      if (w) {
        w.classList.remove('pop');
        void w.offsetWidth;
        w.classList.add('pop');
      }
      if (AC && !muted) {
        try {
          const n2 = AC.currentTime;
          (big ? [12, 16, 19, 24, 28] : [19, 24, 28]).forEach((sm, i) =>
            uiTone(ROOT * Math.pow(2, sm / 12), n2 + i * 0.06, 1.2, 0.045),
          );
        } catch (e) {}
      }
    }
  };
  cancelAnimationFrame(misCount.raf);
  misCount.raf = requestAnimationFrame(tick);
}
/**
 * Permite cerrar el panel deslizándolo hacia abajo (más de 110 píxeles), solo si está desplazado
 * hasta arriba y el gesto no empieza en un botón.
 */
function misSwipe() {
  const pn = elMis.querySelector && elMis.querySelector('.mpanel');
  if (!pn || !pn.addEventListener) {
    return;
  }
  let y0 = null,
    dy = 0;
  pn.addEventListener('pointerdown', e => {
    if (pn.scrollTop > 2 || (e.target.closest && e.target.closest('button'))) {
      return;
    }
    y0 = e.clientY;
    dy = 0;
  });
  pn.addEventListener('pointermove', e => {
    if (y0 === null) {
      return;
    }
    dy = Math.max(0, e.clientY - y0);
    if (dy > 4) {
      pn.style.transition = 'none';
      pn.style.transform = 'translateY(' + dy + 'px)';
    }
  });
  const end = () => {
    if (y0 === null) {
      return;
    }
    y0 = null;
    pn.style.transition = 'transform .25s ease-out';
    if (dy > 110) {
      closeMissions();
    } else {
      pn.style.transform = '';
    }
  };
  pn.addEventListener('pointerup', end);
  pn.addEventListener('pointercancel', end);
}
/**
 * Redibuja los lienzos animados del panel; se llama cada cuadro mientras el panel está abierto.
 */
function misPlanetDraw() {
  if (!misOpen || !elMis || !elMis.querySelectorAll) {
    return;
  }
  elMis.querySelectorAll('.mplanet').forEach(misCanvasDraw);
}
/**
 * Dibuja la ilustración animada de un lienzo del panel según su `data-kind` (planeta con lunas,
 * galaxia espiral, estrellas, onda de supernova…).
 *
 * @param {HTMLCanvasElement} c Lienzo a dibujar.
 */
function misCanvasDraw(c) {
  if (!c || !c.getContext) {
    return;
  }
  const dpr = Math.min(2, window.devicePixelRatio || 1),
    w = c.clientWidth,
    h = c.clientHeight;
  if (!w || !h) {
    return;
  }
  if (c.width !== Math.round(w * dpr)) {
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
  }
  const g = c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  const cx = w / 2,
    cy = h / 2 + Math.sin(t * 0.8) * 1.5,
    R = Math.min(w, h) * 0.3,
    RA = Math.max(w, 600) * 1.4,
    acy = cy + RA;
  const kind = c.dataset ? c.dataset.kind : 'tierra8';
  if (c.dataset && c.dataset.big && (kind === 'tierra8' || kind === 'cada' || kind === 'sol')) {
    // En la vista grande, el planeta va sobre su órbita.
    g.strokeStyle = 'rgba(236,230,216,.18)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(cx, acy, RA, -Math.PI / 2 - 0.9, -Math.PI / 2 + 0.9);
    g.stroke();
    const gl = g.createLinearGradient(cx - R * 1.4, 0, cx + R * 1.4, 0);
    gl.addColorStop(0, 'rgba(255,161,85,0)');
    gl.addColorStop(0.5, 'rgba(255,161,85,.85)');
    gl.addColorStop(1, 'rgba(255,161,85,0)');
    g.strokeStyle = gl;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(cx, acy, RA, -Math.PI / 2 - (R * 1.4) / RA, -Math.PI / 2 + (R * 1.4) / RA);
    g.stroke();
  }
  const star4 = (x, y, r, col, a) => {
    g.save();
    g.globalAlpha = a;
    g.fillStyle = col;
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const an = -Math.PI / 2 + (i * Math.PI) / 5,
        rr2 = i % 2 ? r * 0.45 : r;
      g.lineTo(x + Math.cos(an) * rr2, y + Math.sin(an) * rr2);
    }
    g.closePath();
    g.fill();
    g.restore();
  };
  const glow = (x, y, r, col, a) => {
    const gg = g.createRadialGradient(x, y, 0, x, y, r);
    gg.addColorStop(0, col.replace('A', a));
    gg.addColorStop(1, col.replace('A', 0));
    g.fillStyle = gg;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  };
  if (kind === 'moons') {
    // Tu planeta con tres lunas: se encienden con cada misión completada.
    const n = +(c.dataset.n || 0),
      id = curPlanet || 'tierra',
      Rp = R * 0.82,
      ox = R * 1.5,
      oy = R * 0.5;
    const moon = (i, front) => {
      const an = t * 0.5 + i * 2.094,
        s2 = Math.sin(an);
      if (s2 > 0 !== front) {
        return;
      }
      const x = cx + Math.cos(an) * ox,
        y = cy + s2 * oy,
        lit = i < n;
      if (lit) {
        glow(x, y, 9, 'rgba(255,138,61,A)', 0.7);
      }
      g.fillStyle = lit ? '#ff8a3d' : '#2a3150';
      g.beginPath();
      g.arc(x, y, 3.6, 0, Math.PI * 2);
      g.fill();
      if (!lit) {
        g.strokeStyle = 'rgba(143,208,255,.6)';
        g.lineWidth = 1.2;
        g.stroke();
      }
    };
    g.strokeStyle = 'rgba(236,230,216,.22)';
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(cx, cy, ox, oy, 0, Math.PI, Math.PI * 2);
    g.stroke();
    for (let i = 0; i < 3; i++) {
      moon(i, false);
    }
    let res = null;
    try {
      res = PLGL.render(id, 2 * Rp * dpr, t * 0.35, [-0.55, 0.45, 0.35], [1.1, 1.04, 0.96], t);
    } catch (e) {}
    if (res) {
      const hh = Rp * res.pad;
      g.drawImage(res.cv, cx - hh, cy - hh, 2 * hh, 2 * hh);
    }
    g.strokeStyle = 'rgba(236,230,216,.22)';
    g.beginPath();
    g.ellipse(cx, cy, ox, oy, 0, 0, Math.PI);
    g.stroke();
    for (let i = 0; i < 3; i++) {
      moon(i, true);
    }
    return;
  }
  if (kind === 'tierra8' || kind === 'cada' || kind === 'sol') {
    let id = kind === 'sol' ? 'sol' : 'tierra';
    if (kind === 'cada') {
      const nx = PLANETS_P.find(P => !MIS.planetsWon.includes(P.id) && !P.secret);
      if (nx) {
        id = nx.id;
      }
    }
    let res = null;
    try {
      res = PLGL.render(id, 2 * R * dpr, t * 0.35, [-0.55, 0.45, 0.35], [1.1, 1.04, 0.96], t);
    } catch (e) {}
    if (res) {
      const hh = R * res.pad;
      g.drawImage(res.cv, cx - hh, cy - hh, 2 * hh, 2 * hh);
    } else {
      g.fillStyle = '#2b63c9';
      g.beginPath();
      g.arc(cx, cy, R, 0, Math.PI * 2);
      g.fill();
    }
  } else if (kind === 'andro1' || kind === 'todos') {
    // Galaxia espiral que gira.
    const col = kind === 'andro1' ? 'rgba(156,192,255,A)' : 'rgba(255,211,138,A)';
    glow(cx, cy, R * 1.3, col, 0.35);
    g.save();
    g.translate(cx, cy);
    g.scale(1, 0.55);
    g.rotate(t * 0.15);
    for (let arm = 0; arm < 2; arm++) {
      for (let i = 0; i < 70; i++) {
        const k = i / 70,
          an = arm * Math.PI + k * 4.2,
          rr2 = R * (0.12 + k * 1.05);
        g.globalAlpha = (1 - k) * 0.8;
        g.fillStyle = i % 3 ? '#e8eeff' : col.replace('A', 1);
        g.beginPath();
        g.arc(Math.cos(an) * rr2, Math.sin(an) * rr2, 1.6 + (1 - k) * 1.8, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();
    glow(cx, cy, R * 0.35, 'rgba(255,248,230,A)', 0.95);
  } else if (kind === 'seis') {
    // Seis estrellas en ronda.
    for (let i = 0; i < 6; i++) {
      const an = -Math.PI / 2 + (i * Math.PI) / 3 + t * 0.2,
        x = cx + Math.cos(an) * R * 0.85,
        y = cy + Math.sin(an) * R * 0.85 * 0.8;
      glow(x, y, 16, 'rgba(255,211,107,A)', 0.5);
      star4(x, y, 10, '#ffd36b', 1);
    }
  } else if (kind === 'perf100') {
    const pl = 0.5 + 0.5 * Math.sin(t * 2.4);
    for (let j = 0; j < 3; j++) {
      g.strokeStyle = 'rgba(255,211,107,' + (0.35 - j * 0.1) + ')';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(cx, cy, R * (0.55 + j * 0.22 + pl * 0.05), 0, Math.PI * 2);
      g.stroke();
    }
    glow(cx, cy, R * 0.9, 'rgba(255,211,107,A)', 0.45);
    star4(cx, cy, R * 0.45, '#ffd36b', 1);
  } else if (kind === 'ondas20') {
    // La onda de la supernova 1987A, en la Gran Nube de Magallanes.
    for (let j = 0; j < 4; j++) {
      const u = (t * 0.35 + j / 4) % 1;
      g.strokeStyle = 'rgba(255,111,168,' + (1 - u) * 0.8 + ')';
      g.lineWidth = 3 * (1 - u) + 0.5;
      g.beginPath();
      g.arc(cx, cy, R * (0.2 + u * 1.1), 0, Math.PI * 2);
      g.stroke();
    }
    glow(cx, cy, R * 0.4, 'rgba(255,194,218,A)', 0.9);
  }
}

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initMissions() {
  elMis = document.getElementById('missions');
  // la lógica de misiones avisa cuando una se completa; aquí se muestra
  on('missionReady', misPing);
}

export { misOpen, misPlanetDraw, openMissions };
