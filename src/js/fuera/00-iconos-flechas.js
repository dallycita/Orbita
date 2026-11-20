// ┌─ 00-iconos-flechas.js
// │ da:     ARC_L, ARC_R, CHEV_L, CHEV_R
// │ lo usan: 25-selector-niveles, 29-planetas-hd, 34-misiones
// │ usa:    (nada de otros archivos)
// └─ generado por `node build.mjs --deps`; no se edita a mano
const CHEV_L = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
// arco de gravedad para las flechas: medio anillo que se abre hacia donde vas, con una pincelada naranja
const ARC_L = '<svg class="arc" viewBox="0 0 52 52" aria-hidden="true"><path class="base" d="M34 6 A22 22 0 1 0 34 46"/><path class="hot" d="M34 6 A22 22 0 0 0 9 18"/></svg>';
const ARC_R = '<svg class="arc" viewBox="0 0 52 52" aria-hidden="true"><path class="base" d="M18 6 A22 22 0 1 1 18 46"/><path class="hot" d="M18 6 A22 22 0 0 1 43 18"/></svg>';
// al tocar una flecha, el arco naranja da una vuelta, como algo que entra en órbita
document.addEventListener('click', e => { const b = e.target && e.target.closest && e.target.closest('.arrow, .back'); if (!b || !b.classList) return; b.classList.remove('go'); void b.offsetWidth; b.classList.add('go'); }, true);
document.addEventListener('animationend', e => { const b = e.target && e.target.closest && e.target.closest('.arrow, .back'); if (b && b.classList) b.classList.remove('go'); }, true);
const CHEV_R = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9.5 5.5 16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

