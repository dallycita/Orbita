/**
 * (encabezado pendiente)
 */
import { tutorial } from '../08-partida-estado.js';
import { MIS_ACH, MIS_DAILY } from '../data/missions.js';
import { emit } from '../core/events.js';
import { PLANETS_P } from '../07-planetas.js';
import { COIN_RINGS, LEVELS } from '../data/levels.js';
import { doblesHechos, lvStarsGot, setDoblesHechos } from './progress.js';

var MIS = null;

/**
 * Fecha local como texto `AAAA-MM-DD`, que identifica el día de las misiones.
 *
 * @param {number} [off] Días a sumar (por ejemplo -1 para ayer).
 * @returns {string} La fecha.
 */
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

/**
 * Carga el progreso guardado la primera vez (con valores por defecto para campos faltantes) y
 * sortea las misiones del día si cambió la fecha.
 *
 * @returns {object} El progreso `MIS`.
 */
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

/**
 * Sortea las tres misiones del día, una por grupo. El sorteo sale de un hash de la fecha, así que
 * es el mismo durante todo el día aunque se recargue la página.
 */
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

/**
 * Avanza las misiones diarias que esperan este evento y avisa en pantalla si alguna se completa.
 * No cuenta durante el tutorial.
 *
 * @param {string} ev Evento: 'perf', 'streak3', 'reach', 'ring', 'star', 'win', 'onda', 'power'.
 * @param {number} [v] Valor alcanzado, para misiones de mejor marca (`max`); si falta, suma uno.
 */
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
    emit('missionReady');
  }
}

/**
 * Registra que se escapó de un nivel, para los logros (niveles con la Tierra, planetas usados,
 * Andrómeda en un intento, llegar al Sol) y la misión diaria de ganar.
 *
 * @param {number} lv Índice del nivel ganado.
 * @param {string} [planet] Id del planeta usado; por defecto 'tierra'.
 * @param {number} tries Intentos usados en ese nivel.
 */
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

/**
 * Indica si hay algo listo para cobrar (misión, premio del día o logro), para marcar el botón.
 *
 * @returns {boolean} true si hay premios sin cobrar.
 */
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

/**
 * Progreso de un logro.
 *
 * @param {object} a Logro de `MIS_ACH`.
 * @returns {Array} [valor actual, meta, texto de progreso para mostrar].
 */
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

/**
 * Busca el nivel donde se han recogido más estrellas.
 *
 * @returns {number[]} [estrellas recogidas, índice del nivel] (índice -1 si no hay ninguna).
 */
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

/**
 * Cuenta un salto doble hecho (fuera del tutorial) y avanza la misión de poderes.
 */
function noteDouble() {
  if (tutorial) {
    return;
  }
  misEvent('power');
  setDoblesHechos(doblesHechos + 1);
  try {
    localStorage.setItem('orbita_p1_dobles', String(doblesHechos));
  } catch (e) {}
}

export {
  MIS,
  achProg,
  misDef,
  misEvent,
  misLoad,
  misReady,
  misRoll,
  misSave,
  misToday,
  misWin,
  noteDouble,
};
