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

export { PLANET_SVG };
