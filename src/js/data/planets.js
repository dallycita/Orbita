/**
 * El dibujo en miniatura de cada planeta (SVG).
 */

// Íconos SVG de respaldo para la pantalla de planetas (sin WebGL).
const PLANET_SVG = {
  tierra:
    '<circle cx="50" cy="50" r="26" fill="#3d8bff"/><path d="M34 40 Q42 30 52 38 Q48 48 38 47 Z M56 56 Q66 50 70 60 Q62 70 55 64 Z" fill="#5ccf6b"/><path d="M30 46 Q50 42 70 47" stroke="#fff" stroke-opacity=".7" stroke-width="2" fill="none"/>',
  saturno:
    '<ellipse cx="50" cy="50" rx="44" ry="12" transform="rotate(-18 50 50)" fill="none" stroke="#f3e2b0" stroke-width="5" stroke-opacity=".9"/><circle cx="50" cy="50" r="22" fill="#e6cf8f"/><rect x="28" y="44" width="44" height="4" fill="#c9a86a" opacity=".6"/><rect x="28" y="53" width="44" height="5" fill="#c9a86a" opacity=".5"/><path d="M8 58 A44 12 -18 0 0 92 42" transform="rotate(0)" fill="none" stroke="#f3e2b0" stroke-width="5" stroke-opacity=".9"/>',
  urano:
    '<ellipse cx="50" cy="50" rx="9" ry="40" transform="rotate(8 50 50)" fill="none" stroke="#c8f0fa" stroke-width="3" stroke-opacity=".6"/><circle cx="50" cy="50" r="23" fill="#8fd3e0"/>',
  neptuno:
    '<circle cx="50" cy="50" r="24" fill="#3f6fd6"/><rect x="26" y="42" width="48" height="5" fill="#2b4fa8" opacity=".6"/><ellipse cx="58" cy="57" rx="6" ry="3.5" fill="#1f3f8f" opacity=".8"/>',
  pluton:
    '<circle cx="50" cy="50" r="17" fill="#d9c7b4"/><path d="M52 62 C44 57 45 49 52 52 C59 49 60 57 52 62 Z" fill="#f4ebe0"/>',
};

// detalles de superficie: [longitud, latitud, ancho, alto, color]
const PFEAT = {
  tierra: [
    [0, -0.35, 0.5, 0.25, '#5ccf6b'],
    [1.4, 0.15, 0.35, 0.45, '#5ccf6b'],
    [2.6, -0.05, 0.45, 0.3, '#5ccf6b'],
    [3.9, 0.5, 0.3, 0.15, '#5ccf6b'],
    [4.9, -0.2, 0.4, 0.35, '#5ccf6b'],
    [0.8, -0.6, 0.6, 0.06, 'rgba(255,255,255,.85)'],
    [2.2, 0.35, 0.7, 0.06, 'rgba(255,255,255,.8)'],
    [4.2, -0.4, 0.6, 0.05, 'rgba(255,255,255,.8)'],
  ],
  luna: [
    [0.4, -0.25, 0.35, 0.28, '#9a9a9a'],
    [1.6, 0.2, 0.25, 0.2, '#a3a3a3'],
    [2.9, -0.1, 0.4, 0.3, '#959595'],
    [4.3, 0.35, 0.18, 0.14, '#8d8d8d'],
    [5.4, -0.4, 0.14, 0.12, '#b0b0b0'],
  ],
  mercurio: [
    [0.3, 0.2, 0.16, 0.14, '#867a6d'],
    [1.3, -0.35, 0.2, 0.17, '#8e8275'],
    [2.4, 0.05, 0.12, 0.1, '#7d7266'],
    [3.5, 0.4, 0.22, 0.16, '#8a7e71'],
    [4.7, -0.15, 0.15, 0.13, '#7f7367'],
    [5.6, 0.3, 0.1, 0.09, '#867a6d'],
  ],
  venus: [
    [1, 0.1, 0.7, 0.1, 'rgba(255,245,220,.45)'],
    [3.2, -0.25, 0.8, 0.08, 'rgba(255,240,205,.4)'],
    [5, 0.3, 0.6, 0.07, 'rgba(255,245,220,.35)'],
  ],
  marte: [
    [0.5, 0.1, 0.45, 0.25, '#8a3a26'],
    [2.1, -0.2, 0.3, 0.3, '#94402a'],
    [3.7, 0.25, 0.4, 0.18, '#7e3422'],
    [5.1, -0.05, 0.25, 0.2, '#8a3a26'],
    [0, -0.88, 1, 0.14, 'rgba(255,255,255,.9)'],
  ],
  jupiter: [
    [1.8, 0.28, 0.26, 0.13, '#c0533a'],
    [4.5, -0.3, 0.12, 0.06, 'rgba(255,240,220,.6)'],
  ],
  saturno: [
    [1.2, 0.3, 0.25, 0.12, 'rgba(255,245,220,.5)'],
    [3.8, -0.2, 0.2, 0.1, 'rgba(255,245,220,.4)'],
  ],
  urano: [[2, 0, 0.3, 0.15, 'rgba(200,245,250,.35)']],
  neptuno: [
    [1.5, 0.25, 0.32, 0.18, '#1f3f8f'],
    [4, -0.3, 0.18, 0.08, 'rgba(230,240,255,.8)'],
    [5.2, 0.1, 0.14, 0.06, 'rgba(230,240,255,.6)'],
  ],
  pluton: [
    [0, 0.15, 0.55, 0.5, '#f4ebe0'],
    [2.5, -0.3, 0.3, 0.2, '#9a8371'],
    [4.1, 0.35, 0.25, 0.18, '#9a8371'],
    [5.3, -0.1, 0.2, 0.14, '#b9a48f'],
  ],
  sol: [
    [1, 0.2, 0.1, 0.07, 'rgba(160,70,10,.55)'],
    [3.4, -0.15, 0.08, 0.06, 'rgba(160,70,10,.5)'],
    [5, 0.35, 0.07, 0.05, 'rgba(160,70,10,.45)'],
  ],
};

const PBASE = {
  tierra: '#2f6fd8',
  luna: '#bcbcbc',
  mercurio: '#a59a8f',
  venus: '#e3c27a',
  marte: '#c1543a',
  jupiter: '#d7a86e',
  saturno: '#e6cf8f',
  urano: '#8fd3e0',
  neptuno: '#3f6fd6',
  pluton: '#cdb9a4',
  sol: '#ffcf5a',
};

const PBANDS = {
  saturno: ['rgba(170,130,70,.35)', [-0.45, -0.15, 0.2, 0.5]],
  neptuno: ['rgba(25,45,130,.35)', [-0.3, 0.25]],
  urano: ['rgba(120,190,205,.3)', []],
  jupiter: ['rgba(130,80,45,.45)', [-0.7, -0.42, -0.12, 0.1, 0.38, 0.62]],
  venus: ['rgba(200,160,90,.25)', [-0.5, 0.05, 0.45]],
};

export { PBANDS, PBASE, PFEAT, PLANET_SVG };
