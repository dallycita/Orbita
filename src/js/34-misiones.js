// ---------- misiones y polvo estelar ----------
// estrellas = habilidad (desbloquean) · polvo estelar = constancia (compra). Diarias: tres al día,
// cambian a medianoche.
// el ícono de Misiones en el inicio: una constelación de tres estrellas (una por misión del día)
// dentro de un arco de progreso;
// cada misión cumplida enciende una estrella y llena un tercio del arco; con las tres, la
// constelación se une y el círculo se cierra
function misMoons() {
  misLoad();
  const done = Math.min(
    3,
    MIS.daily.filter(m => m.c || m.p >= (misDef(m.id) || { n: 1 }).n).length,
  );
  const P = [
      [25, 68],
      [50, 32],
      [75, 68],
    ],
    st = (x, y, r) =>
      'M' +
      x +
      ' ' +
      (y - r) +
      ' L' +
      (x + r * 0.26) +
      ' ' +
      (y - r * 0.26) +
      ' L' +
      (x + r) +
      ' ' +
      y +
      ' L' +
      (x + r * 0.26) +
      ' ' +
      (y + r * 0.26) +
      ' L' +
      x +
      ' ' +
      (y + r) +
      ' L' +
      (x - r * 0.26) +
      ' ' +
      (y + r * 0.26) +
      ' L' +
      (x - r) +
      ' ' +
      y +
      ' L' +
      (x - r * 0.26) +
      ' ' +
      (y - r * 0.26) +
      'Z';
  let h =
    '<circle cx="50" cy="50" r="45" fill="none" stroke="#ece6d8" stroke-opacity=".2" stroke-width="5"/>';
  if (done === 3) {
    h +=
      '<circle class="lit" cx="50" cy="50" r="45" fill="none" stroke="#ff8a3d" stroke-width="6"/>';
  } else if (done > 0) {
    const a = -Math.PI / 2 + (Math.PI * 2 * done) / 3;
    h +=
      '<path class="lit" d="M50 5 A45 45 0 ' +
      (done > 1 ? 1 : 0) +
      ' 1 ' +
      (50 + 45 * Math.cos(a)).toFixed(1) +
      ' ' +
      (50 + 45 * Math.sin(a)).toFixed(1) +
      '" fill="none" stroke="#ff8a3d" stroke-width="6" stroke-linecap="round"/>';
  }
  for (let i = 0; i < 2; i++) {
    const [ax, ay] = P[i],
      [bx, by] = P[i + 1],
      L = Math.hypot(bx - ax, by - ay),
      ux = (bx - ax) / L,
      uy = (by - ay) / L,
      g = 15; // la línea se detiene antes de cada estrella, como en un mapa del cielo
    h +=
      '<line x1="' +
      (ax + ux * g).toFixed(1) +
      '" y1="' +
      (ay + uy * g).toFixed(1) +
      '" x2="' +
      (bx - ux * g).toFixed(1) +
      '" y2="' +
      (by - uy * g).toFixed(1) +
      '" stroke="' +
      (done === 3 ? '#ff8a3d' : '#8fd0ff') +
      '" stroke-opacity="' +
      (done === 3 ? 0.85 : 0.6) +
      '" stroke-width="2.6" stroke-linecap="round"' +
      (done === 3 ? '' : ' stroke-dasharray="4 5"') +
      '/>';
  }
  P.forEach(([x, y], i) => {
    h +=
      i < done
        ? '<path class="lit" d="' + st(x, y, 11) + '" fill="#ff8a3d"/>'
        : '<path d="' +
          st(x, y, 10.5) +
          '" fill="none" stroke="#ece6d8" stroke-width="3.2" stroke-linejoin="round"/>';
  });
  return h;
}
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
const MIS_DAILY = [
  { id: 'perf10', g: 0, t: 'Haz 10 Perfectos', d: 'En cualquier nivel', n: 10, ev: 'perf', rw: 40 },
  {
    id: 'streak3',
    g: 0,
    t: 'Haz 3 Perfectos seguidos',
    d: 'Sin fallar entre ellos',
    n: 1,
    ev: 'streak3',
    rw: 50,
  },
  {
    id: 'reach30',
    g: 0,
    t: 'Llega al anillo 30',
    d: 'En un solo intento',
    n: 30,
    ev: 'reach',
    max: true,
    rw: 40,
  },
  {
    id: 'ring100',
    g: 1,
    t: 'Salta 100 anillos',
    d: 'Sumando todos tus intentos',
    n: 100,
    ev: 'ring',
    rw: 40,
  },
  { id: 'star2', g: 1, t: 'Atrapa 2 estrellas', d: 'En cualquier nivel', n: 2, ev: 'star', rw: 50 },
  {
    id: 'win1',
    g: 1,
    t: 'Escapa de un nivel',
    d: 'Llega a la salida de cualquier galaxia',
    n: 1,
    ev: 'win',
    rw: 60,
  },
  { id: 'onda3', g: 2, t: 'Escapa de 3 ondas', d: 'Nubes de Magallanes', n: 3, ev: 'onda', rw: 60 },
  {
    id: 'power3',
    g: 2,
    t: 'Usa tu poder 3 veces',
    d: 'Desliza hacia arriba con el poder listo',
    n: 3,
    ev: 'power',
    rw: 50,
  },
];
const MIS_ACH = [
  {
    id: 'tierra8',
    t: 'Todos los niveles con la Tierra',
    d: 'Escapa de cada galaxia usándola',
    rw: 300,
    feat: true,
  },
  {
    id: 'cada',
    t: 'Un nivel con cada planeta',
    d: 'Escapa de cualquier nivel con cada uno',
    rw: 500,
  },
  { id: 'andro1', t: 'Andrómeda en un intento', d: 'Sin morir ni una vez', rw: 400 },
  { id: 'seis', t: '6 estrellas en un nivel', rw: 200 },
  { id: 'perf100', t: 'Haz 100 Perfectos', d: 'Sumando todos tus intentos', rw: 150 },
  { id: 'ondas20', t: 'Escapa de 20 ondas', d: 'Nubes de Magallanes', rw: 150 },
  { id: 'todos', t: 'Escapa de las 8 galaxias', d: 'Todos los niveles', rw: 500 },
  { id: 'sol', t: 'Llega al Sol', d: 'El final del viaje', rw: 1000, secret: true },
];
const MIS_FACT = {
  tierra8:
    'La Tierra viaja alrededor del Sol a unos 30 km por segundo. Es el único planeta conocido con agua líquida en su superficie.',
  cada: 'El sistema solar tiene 8 planetas y, por ahora, 5 planetas enanos reconocidos, entre ellos Plutón.',
  andro1:
    'Andrómeda tiene cerca de un billón de estrellas y se acerca a nosotros a unos 110 km por segundo.',
  seis: 'Desde un lugar oscuro se pueden ver a simple vista unas 9 000 estrellas en todo el cielo, aunque solo la mitad a la vez.',
  perf100:
    'Las órbitas no son círculos perfectos: en enero la Tierra está unos 5 millones de km más cerca del Sol que en julio.',
  ondas20:
    'La supernova 1987A, en la Gran Nube de Magallanes, fue la más cercana vista desde 1604. Se vio a simple vista.',
  todos: 'Se calcula que en el universo observable hay cientos de miles de millones de galaxias.',
  sol: 'La luz del Sol tarda unos 8 minutos y 20 segundos en llegar a la Tierra.',
};
var misDetail = null;
var MIS = null,
  misTab = 'diarias',
  misTimer = null,
  misFx = 0,
  misOpen = false,
  misSwitch = 0;
function misToday(off) {
  const d = new Date();
  if (off) {
    d.setDate(d.getDate() + off);
  }
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}
function misLoad() {
  if (!MIS) {
    let d = {};
    try {
      d = JSON.parse(localStorage.getItem('orbita_mis') || '{}') || {};
    } catch (e) {
      d = {};
    }
    MIS = Object.assign(
      {
        polvo: 0,
        day: '',
        daily: [],
        bonus: false,
        streak: 0,
        lastBonus: '',
        st: { perf: 0, onda: 0 },
        ach: {},
        tierraLv: [],
        planetsWon: [],
        lvWon: [],
        andro1: false,
        sol: false,
        factSeen: false,
      },
      d,
    );
  }
  misRoll();
  return MIS;
}
function misSave() {
  try {
    localStorage.setItem('orbita_mis', JSON.stringify(MIS));
  } catch (e) {}
}
function misRoll() {
  const day = misToday();
  if (MIS.day === day && MIS.daily.length === 3) {
    return;
  }
  MIS.day = day;
  MIS.bonus = false;
  let h = 7;
  for (const ch of day) {
    h = (h * 31 + ch.charCodeAt(0)) | 0;
  }
  MIS.daily = [0, 1, 2].map(g => {
    const L = MIS_DAILY.filter(m => m.g === g);
    return { id: L[Math.abs(h >> (g * 4)) % L.length].id, p: 0, c: false };
  });
  misSave();
}
const misDef = id => MIS_DAILY.find(m => m.id === id);
function misEvent(ev, v) {
  if (tutorial) {
    return;
  }
  misLoad();
  if (ev === 'perf') {
    MIS.st.perf = (MIS.st.perf || 0) + 1;
  }
  if (ev === 'onda') {
    MIS.st.onda = (MIS.st.onda || 0) + 1;
  }
  let newly = false;
  for (const m of MIS.daily) {
    const D = misDef(m.id);
    if (!D || D.ev !== ev || m.c) {
      continue;
    }
    const was = m.p >= D.n;
    m.p = Math.min(D.n, D.max ? Math.max(m.p, v || 0) : m.p + 1);
    if (!was && m.p >= D.n) {
      newly = true;
    }
  }
  misSave();
  if (newly) {
    misPing();
  }
}
function misWin(lv, planet, tries) {
  if (tutorial) {
    return;
  }
  misLoad();
  const add = (arr, x) => {
    if (!arr.includes(x)) {
      arr.push(x);
    }
  };
  add(MIS.lvWon, lv);
  add(MIS.planetsWon, planet || 'tierra');
  if ((planet || 'tierra') === 'tierra') {
    add(MIS.tierraLv, lv);
  }
  if (lv === 2 && tries === 1) {
    MIS.andro1 = true;
  }
  if (lv === 7) {
    MIS.sol = true;
  }
  misEvent('win');
}
function misPing() {
  // en plena partida: las tres lunas aparecen un instante arriba y se enciende la nueva
  let el = document.getElementById('misping');
  if (!el) {
    el = document.createElement('div');
    el.id = 'misping';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  el.innerHTML = '<svg viewBox="0 0 100 100">' + misMoons() + '</svg>';
  el.classList.remove('go');
  void el.offsetWidth;
  el.classList.add('go');
  if (AC && !muted) {
    try {
      const n = AC.currentTime;
      [19, 24].forEach((sm, i) => uiTone(ROOT * 2 * Math.pow(2, sm / 12), n + i * 0.07, 0.6, 0.03));
    } catch (e) {}
  }
}
function misStarsBest() {
  let best = 0,
    bi = -1;
  COIN_RINGS.forEach((set, i) => {
    if (!set) {
      return;
    }
    const g = lvStarsGot(i);
    let c = 0;
    set.forEach(k => {
      if (g.includes(k)) {
        c++;
      }
    });
    if (c > best) {
      best = c;
      bi = i;
    }
  });
  return [best, bi];
}
function achProg(a) {
  const M = MIS;
  switch (a.id) {
    case 'tierra8':
      return [M.tierraLv.length, 8, M.tierraLv.length + ' / 8 niveles'];
    case 'cada':
      return [
        M.planetsWon.length,
        PLANETS_P.length,
        M.planetsWon.length + ' de ' + PLANETS_P.length + ' planetas',
      ];
    case 'andro1':
      return [M.andro1 ? 1 : 0, 1, a.d];
    case 'seis': {
      const [b, i] = misStarsBest();
      return [
        b >= 6 ? 1 : 0,
        1,
        i >= 0 && LEVELS[i] ? LEVELS[i].name + ' · ' + b + ' de 6' : 'Todas las de un mismo nivel',
      ];
    }
    case 'perf100':
      return [
        Math.min(100, M.st.perf || 0),
        100,
        (M.st.perf || 0) >= 100 ? a.d : Math.min(100, M.st.perf || 0) + ' de 100',
      ];
    case 'ondas20':
      return [Math.min(20, M.st.onda || 0), 20, Math.min(20, M.st.onda || 0) + ' de 20 · ' + a.d];
    case 'todos':
      return [M.lvWon.length, 8, M.lvWon.length + ' de 8 galaxias'];
    case 'sol':
      return [M.sol ? 1 : 0, 1, a.d];
  }
  return [0, 1, ''];
}
function misReady() {
  misLoad();
  if (MIS.daily.some(m => !m.c && m.p >= (misDef(m.id) || { n: 1 }).n)) {
    return true;
  }
  if (!MIS.bonus && MIS.daily.every(m => m.c)) {
    return true;
  }
  return MIS_ACH.some(a => {
    const [c, n] = achProg(a);
    return c >= n && !MIS.ach[a.id];
  });
}
function misStreak() {
  return MIS.lastBonus === misToday() || MIS.lastBonus === misToday(-1) ? MIS.streak : 0;
}
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
const elMis = document.getElementById('missions');
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
  renderHome();
  if (elHome) {
    elHome.classList.remove('off');
  }
}
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
const MIS_ICO = {
  perf: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="3"/>',
  streak: '<path d="M5 15l2-4 2 4M10.5 11l2-4 2 4M16 15l2-4 2 4"/><path d="M4 19h16"/>',
  reach:
    '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="#bfe0ff"/>',
  rings:
    '<ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="5.5" ry="2.2"/><circle cx="12" cy="12" r="1.2" fill="#bfe0ff"/>',
  star: '<path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  flag: '<path d="M6 21V4"/><path d="M6 4.5h11l-2.5 3.5L17 11.5H6"/>',
  onda: '<circle cx="12" cy="12" r="2"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.6 4.6a10.5 10.5 0 0 0 0 14.8M19.4 4.6a10.5 10.5 0 0 1 0 14.8"/>',
  power: '<path d="M6 12.5l6-6 6 6M6 18.5l6-6 6 6"/>',
  one: '<path d="M12 19V5l-3.5 3"/><path d="M8.5 19h7"/>',
  galaxy: '<path d="M12 12c0-3 3-4.5 5-3s1.5 6-3 7.5-9-1.5-9-6 5-8 9.5-7"/>',
  q: '<path d="M9.2 9a2.9 2.9 0 1 1 4.2 2.6c-.9.5-1.4 1.1-1.4 2.1v.6"/><path d="M12 17.6v.1"/>',
};
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
var misThumbs = {},
  misMinis = {};
// miniaturas con el mismo lenguaje que los dibujos grandes del juego (brillos, colores de cada
// galaxia)
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
function misFeatured() {
  // el logro más cercano a completarse (o uno listo para cobrar)
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
    // tarjeta de vidrio: tu planeta con sus tres lunas (una por misión) y el premio del día
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
// el cobro: la fila destella, salen cristales volando al contador y el número sube de uno en uno
// con una escala de cristal
var misCount = { v: null, raf: 0 };
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
// cerrar deslizando el panel hacia abajo
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
function misPlanetDraw() {
  if (!misOpen || !elMis || !elMis.querySelectorAll) {
    return;
  }
  elMis.querySelectorAll('.mplanet').forEach(misCanvasDraw);
}
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
    // en la vista grande, el planeta va sobre su órbita
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
    // tu planeta con tres lunas: se encienden con cada misión completada
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
    // una galaxia espiral que gira
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
    // seis estrellas en ronda
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
    // la onda de supernova de Magallanes
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
