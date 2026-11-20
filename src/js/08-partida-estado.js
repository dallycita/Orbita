// ┌─ 08-partida-estado.js
// │ da:     attempts, burns, canRestart, chargeFlash, culprit, culpritT, curGoal, deadT, debris, flash, gest,
// │        hintsShown, hintT, holeFlare, JUMP_DUR, jumpClear, landPop, lastEaten, particles, pending, pendingT,
// │        perfCount, PERFECT, pipFlash, pulse, readyHintDone, readyT, shake, showHint, slowTimer, streak, sunLevel,
// │        swallow, t, texts, timeScale, trail, TUT_TIPS, TUT_TYPES, tutorial, tutorialDone, winT
// │ lo usan: 01-pantalla-y-utilidades, 03-musica-ritmos, 05-musica-reproductor, 06-record-y-estado, 07-planetas,
// │        09-recorridos, 10-ritmo-y-objetos, 12-poderes, 13-agujero-de-gusano, 14-lente-gravitacional, 15-peligros,
// │        16-partida, 17-tutorial, 18-pausa, 19-controles, 20-logica, 21-dibujo, 22-viaje-sistema-solar, 23-intro,
// │        24-presentacion, 25-selector-niveles, 26-pantalla-inicio, 27-inicio-animacion, 29-planetas-hd,
// │        31-fondos-2d, 32-fondos-9-motor, 33-tarjetas-niveles, 34-misiones, 35-bucle-principal
// │ usa 06-record-y-estado: GOAL
// └─ generado por `node build.mjs --deps`; no se edita a mano
// ---------- estado de la partida: contadores, tutorial, efectos en pantalla ----------
let winT = 0, perfCount = 0, attempts = 0;
try{ attempts = parseInt(localStorage.getItem('orbita_p1_intentos')||'0',10) || 0; }catch(e){ attempts = 0; }
const veterano = attempts > 0;
// ---- tutorial: los primeros 10 anillos de la huida, una cosa a la vez ----
const TUT_GOAL = 10;
const TUT_TYPES = ['vacio','vacio','vacio','uno','uno','muralla','respiracion','escalera','escalera','barrera','vacio'];
const TUT_TIPS = [
  'Toca para saltar al anillo de arriba.',
  '¡Eso! Una vez más.',
  'Espera a que el hueco pase sobre ti y salta.',
  'Bien. El agujero negro no espera: no te quedes quieto.',
  'Muralla: espera uno de sus huecos.',
  'Respiración: salta cuando se encojan.',
  'Escalera: los huecos están alineados. Salta seguido.',
  '¡Sigue!',
  'Una barrera sin huecos. Desliza hacia arriba para el salto doble.',
];
let tutorial = false, tutorialDone = true;   // ya no hay tutorial: se aprende jugando
const curGoal = () => tutorial ? TUT_GOAL : GOAL;
const pipFlash = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let readyT = 0, chargeFlash = 0, readyHintDone = false;
try{ readyHintDone = localStorage.getItem('orbita_p1_poderlisto') === '1'; }catch(e){}
let gest = null, pending = false, pendingT = 0;
let hintsShown = 0;
try{ hintsShown = parseInt(localStorage.getItem('orbita_p1_pista')||'0',10) || 0; }catch(e){ hintsShown = 0; }
let showHint = false, hintT = 0;
let swallow = null, holeFlare = 0;
let streak = 0, jumpClear = 999, culprit = null, culpritT = 0, landPop = 0;
const PERFECT = 12;
let t = 0, timeScale = 1, slowTimer = 0, shake = 0, flash = 0, pulse = 0, deadT = 0, canRestart = false;
let particles = [], trail = [], texts = [], burns = [];
let sunLevel = -1.6, lastEaten = -2;
const debris = Array.from({length:60}, () => ({a:Math.random()*Math.PI*2, r:60 + Math.random()*180}));
const JUMP_DUR = .12;

