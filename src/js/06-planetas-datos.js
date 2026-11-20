// ---------- planetas para rescatar y jugar ----------
// ---------- planetas: estadísticas sacadas de datos reales ----------
// size: diámetro real (escala logarítmica)  ·  vel: velocidad orbital real  ·  res: densidad real (resistencia a la fuerza de marea)  ·  charge: rotación real
const PLANETS_P = [
  {id:'luna', name:'Luna', col:'#cfcfcf', desc:'La única luna de la Tierra. Su gravedad es una sexta parte de la nuestra, y provoca las mareas y los eclipses.',
   how:'Rescátala escapando del Sistema solar', ok:() => bestOf(0) >= GOAL,
   d:'3474 km', v:'1,0 km/s alrededor de la Tierra', rho:'3,34 g/cm³', day:'27,3 días', st:{size:-17, vel:-40, res:-15, charge:3},
   power:['Eclipse', 'Durante 2.5 segundos, todo pasa en cámara lenta.', 'La Luna es la que provoca los eclipses de Sol.']},
  {id:'mercurio', name:'Mercurio', col:'#b3a597', desc:'El planeta más cercano al Sol y el más veloz: da una vuelta completa en solo 88 días.',
   how:'Rescátalo consiguiendo 15 Perfectos en una partida', ok:() => maxPerf >= 15,
   d:'4879 km', v:'47,4 km/s', rho:'5,43 g/cm³', day:'58,6 días', st:{size:-13, vel:7, res:0, charge:3},
   power:['Perihelio', 'Tus dos siguientes saltos son instantáneos.', 'En su perihelio, el punto más cercano al Sol, Mercurio va a casi 59 km/s.']},
  {id:'venus', name:'Venus', col:'#e8cf8f', desc:'Gira al revés que casi todos los planetas, y tan lento que su día dura más que su año.',
   how:'Rescátala completando Andrómeda', ok:() => bestOf(2) >= GOAL,
   d:'12 104 km', v:'35,0 km/s', rho:'5,24 g/cm³', day:'243 días (al revés)', st:{size:-1, vel:2, res:-2, charge:3},
   power:['Efecto invernadero', 'Derrite los dos asteroides más cercanos del anillo de arriba.', 'Venus es el planeta más caliente del Sistema solar: 465 °C, aunque Mercurio está más cerca del Sol.']},
  {id:'tierra', name:'Tierra', col:'#3d8bff', desc:'Nuestro hogar, el único lugar con vida que conocemos, y el planeta más denso del sistema solar.',
   how:'Disponible desde el inicio', ok:() => true,
   d:'12 742 km', v:'29,8 km/s', rho:'5,51 g/cm³', day:'23,9 horas', st:{size:0, vel:0, res:0, charge:3},
   power:['Salto doble', 'Atraviesa un anillo completo de un salto.', 'La Tierra es el punto de equilibrio: todas las estadísticas se comparan con ella.']},
  {id:'marte', name:'Marte', col:'#d0603f', desc:'El planeta rojo, cubierto de óxido de hierro. Tiene el volcán más alto del sistema solar.',
   how:'Rescátalo llegando al anillo 20 del Sistema solar', ok:() => bestRing >= 20,
   d:'6779 km', v:'24,1 km/s', rho:'3,93 g/cm³', day:'24,6 horas', st:{size:-8, vel:-3, res:-11, charge:5},
   power:['Monte Olimpo', 'Un salto triple que sube tres anillos.', 'El Monte Olimpo mide unos 22 km de alto, casi tres veces el Everest.']},
  {id:'jupiter', name:'Júpiter', col:'#d7a86e', desc:'El gigante del sistema solar: tiene más del doble de masa que todos los demás planetas juntos.',
   how:'Rescátalo completando el Remolino', ok:() => bestOf(4) >= GOAL,
   d:'139 820 km', v:'13,1 km/s', rho:'1,33 g/cm³', day:'9,9 horas', st:{size:31, vel:-12, res:-38, charge:3},
   power:['Empujón gravitacional', 'Aleja al agujero negro un anillo.', 'Su gravedad es tan fuerte que desvía cometas y asteroides.']},
  {id:'saturno', name:'Saturno', col:'#e6cf8f', desc:'Sus anillos son de hielo y roca, y es tan poco denso que flotaría en el agua.',
   how:'Rescátalo completando el Sistema solar', ok:() => bestRing >= GOAL,
   d:'116 460 km', v:'9,7 km/s', rho:'0,69 g/cm³', day:'10,7 horas', st:{size:29, vel:-17, res:-50, charge:4},
   power:['Anillos protectores', 'Durante 1.5 segundos, ningún asteroide puede tocarte.', 'Sus anillos miden unos 280 000 km de ancho, pero en muchas partes no superan los 10 metros de grosor.']},
  {id:'urano', name:'Urano', col:'#8fd3e0', desc:'Gira acostado de lado, y tiene la atmósfera más fría que se ha medido en un planeta: unos −224 °C.',
   how:'Rescátalo consiguiendo 10 Perfectos en una partida', ok:() => maxPerf >= 10,
   d:'50 724 km', v:'6,8 km/s', rho:'1,27 g/cm³', day:'17,2 horas', st:{size:18, vel:-22, res:-39, charge:2},
   power:['Congelar', 'Detiene el giro de los dos anillos de arriba durante 3 segundos.', 'Su eje está inclinado unos 98 grados: rueda alrededor del Sol.']},
  {id:'neptuno', name:'Neptuno', col:'#3f6fd6', desc:'El planeta más lejano del Sol, con los vientos más rápidos del sistema solar: unos 2000 km/h.',
   how:'Rescátalo llegando al anillo 30 del Sistema solar', ok:() => bestRing >= 30,
   d:'49 244 km', v:'5,4 km/s', rho:'1,64 g/cm³', day:'16,1 horas', st:{size:18, vel:-26, res:-33, charge:4},
   power:['Predicción', 'Durante 3 segundos ves dónde estarán los asteroides cuando caigas.', 'Fue el primer planeta descubierto con matemáticas: en 1846 calcularon dónde estaba antes de verlo.']},
  {id:'pluton', name:'Plutón', col:'#d9c7b4', desc:'Desde 2006 es un planeta enano, pero no se rinde. Tiene un enorme corazón de hielo en su superficie.',
   how:'Secreto: completa el Sistema solar sin usar tu poder', secret:true, ok:() => plutoOk,
   d:'2377 km', v:'4,7 km/s', rho:'1,85 g/cm³', day:'6,4 días', st:{size:-22, vel:-28, res:-31, charge:9},
   power:['Caronte', 'Cuando está cargado, tu luna Caronte se interpone una vez si algo te iba a destruir.', 'Caronte mide la mitad que Plutón: ambos giran alrededor de un punto entre ellos.']},
  {id:'sol', name:'Sol', col:'#ffb347', desc:'Nuestra estrella. Lo primero que se tragó el agujero negro. Traerlo de vuelta es la meta final.',
   how:'Rescátalo venciendo a Sagitario A*', ok:() => bestOf(7) >= GOAL,
   d:'1 392 700 km', v:'230 km/s alrededor de la galaxia', rho:'1,41 g/cm³', day:'unos 25 días', st:{size:50, vel:31, res:-36, charge:4},
   power:['Arder', 'Durante 1.5 segundos, los asteroides que toques se vuelven plasma.', 'En el Sol cabrían más de un millón de Tierras.']},
];
let curPlanet = 'tierra', maxPerf = 0, plutoOk = false, allPlanets = false, shieldLeft = 0, usedDouble = false;
try{
  curPlanet = localStorage.getItem('orbita_p1_planeta') || 'tierra';
  maxPerf = parseInt(localStorage.getItem('orbita_p1_maxperf') || '0', 10) || 0;
  plutoOk = localStorage.getItem('orbita_p1_pluton') === '1';
  allPlanets = localStorage.getItem('orbita_p1_todos') === '1';
}catch(e){}
if (!PLANETS_P.some(P => P.id === curPlanet)) curPlanet = 'tierra';
const planetOk = P => allPlanets || P.ok();
const curP = () => PLANETS_P.find(P => P.id === curPlanet) || PLANETS_P[3];
const pst = () => curP().st;
const chargeMax = () => pst().charge;                                   // rotación real
const sizeK = () => 1 + pst().size/100*.7;   // de Plutón (×0.85) a Júpiter (×1.22): se ve y se siente, sin ser abismal                              // diámetro real
const jumpDur = () => Math.max(.09, JUMP_DUR*(1 - pst().vel/100*.75));   // los lentos flotan (hasta ~40% más de tiempo en el aire)                  // velocidad orbital real
const catchMargin = () => .18 - pst().res/100*.6;   // los frágiles: el agujero negro los alcanza hasta ~media vuelta de anillo antes                       // densidad real: los menos densos se despedazan antes
const unlockedIds = () => PLANETS_P.filter(planetOk).map(P => P.id);
function planetThumb(id){
  try{ const r = PLGL.render(id, 120, .6, [-.78, .42, .48], [1.12, 1.06, .98], 1); if (r && r.cv.toDataURL) return '<img src="' + r.cv.toDataURL() + '" alt="">'; }catch(e){}
  return PLANET_SVG[id] ? '<svg viewBox="0 0 100 100" aria-hidden="true">' + PLANET_SVG[id] + '</svg>' : '';
}
function markNewPlanets(){ try{ localStorage.setItem('orbita_pl_nuevo', '1'); }catch(e){} }
function rescuedCards(before){
  const now = unlockedIds(), nuevos = PLANETS_P.filter(P => now.includes(P.id) && !before.includes(P.id));
  if (!nuevos.length) return '';
  return '<div class="wres"><div class="wpl">' + nuevos.map(P => '<span class="wp" title="' + P.name + '">' + planetThumb(P.id) + '</span>').join('') + '</div>' +
    '<small>' + (nuevos.length > 1 ? 'Rescatados' : 'Rescatado') + '</small></div>';
}
function rescuedSince(before){
  const now = unlockedIds(), nuevos = PLANETS_P.filter(P => now.includes(P.id) && !before.includes(P.id));
  return nuevos.length ? '<div class="msg rec" style="margin-top:14px">¡Rescataste a ' + (nuevos.length > 1 ? nuevos.slice(0, -1).map(P => P.name).join(', ') + ' y ' + nuevos[nuevos.length - 1].name : nuevos[0].name) + '!</div><div class="sub" style="margin-top:4px;font-size:12px">Elígelo en Planetas, en la pantalla de inicio.</div>' : '';
}
function saveRunStats(){
  if (perfCount > maxPerf){ maxPerf = perfCount; try{ localStorage.setItem('orbita_p1_maxperf', String(maxPerf)); }catch(e){} }
}
// el planeta del jugador, dibujado en el juego (la luz viene de abajo, del disco del agujero negro)
// íconos para la pantalla de planetas
const PLANET_SVG = {
  tierra:'<circle cx="50" cy="50" r="26" fill="#3d8bff"/><path d="M34 40 Q42 30 52 38 Q48 48 38 47 Z M56 56 Q66 50 70 60 Q62 70 55 64 Z" fill="#5ccf6b"/><path d="M30 46 Q50 42 70 47" stroke="#fff" stroke-opacity=".7" stroke-width="2" fill="none"/>',
  saturno:'<ellipse cx="50" cy="50" rx="44" ry="12" transform="rotate(-18 50 50)" fill="none" stroke="#f3e2b0" stroke-width="5" stroke-opacity=".9"/><circle cx="50" cy="50" r="22" fill="#e6cf8f"/><rect x="28" y="44" width="44" height="4" fill="#c9a86a" opacity=".6"/><rect x="28" y="53" width="44" height="5" fill="#c9a86a" opacity=".5"/><path d="M8 58 A44 12 -18 0 0 92 42" transform="rotate(0)" fill="none" stroke="#f3e2b0" stroke-width="5" stroke-opacity=".9"/>',
  urano:'<ellipse cx="50" cy="50" rx="9" ry="40" transform="rotate(8 50 50)" fill="none" stroke="#c8f0fa" stroke-width="3" stroke-opacity=".6"/><circle cx="50" cy="50" r="23" fill="#8fd3e0"/>',
  neptuno:'<circle cx="50" cy="50" r="24" fill="#3f6fd6"/><rect x="26" y="42" width="48" height="5" fill="#2b4fa8" opacity=".6"/><ellipse cx="58" cy="57" rx="6" ry="3.5" fill="#1f3f8f" opacity=".8"/>',
  pluton:'<circle cx="50" cy="50" r="17" fill="#d9c7b4"/><path d="M52 62 C44 57 45 49 52 52 C59 49 60 57 52 62 Z" fill="#f4ebe0"/>',
};
                     // nivel 1: el sistema solar termina en el anillo 50
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
function updateDJ(){}
let swallow = null, holeFlare = 0;
let streak = 0, jumpClear = 999, culprit = null, culpritT = 0, landPop = 0;
const PERFECT = 12;
let t = 0, timeScale = 1, slowTimer = 0, shake = 0, flash = 0, pulse = 0, deadT = 0, canRestart = false;
let particles = [], trail = [], texts = [], burns = [];
let sunLevel = -1.6, lastEaten = -2;
const debris = Array.from({length:60}, () => ({a:Math.random()*Math.PI*2, r:60 + Math.random()*180}));
const JUMP_DUR = .12;

// generador con semilla fija: el recorrido es siempre el mismo, como un nivel de Geometry Dash
const SEED = 20261007;
let rngState = SEED;
function rng(){ rngState |= 0; rngState = rngState + 0x6D2B79F5 | 0; let x = Math.imul(rngState ^ rngState >>> 15, 1 | rngState); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }
// tipos de anillo: se presentan uno por uno y luego se mezclan en bloques de 2 a 4 anillos
const TYPE_INFO = {
  muralla:['Muralla','Espera el hueco'], respiracion:['Respiración','Salta cuando se encojan'],
  contragiro:['Contragiro','Salta cuando se separen'], freno:['Freno','Cambia de dirección'], escalera:['Escalera','Salta seguido'],
  orbita:['Órbita','Toca para cambiar de sentido'], marea:['Fuerzas de marea','Acelera y frena: espera el hueco'], nova:['Nova','Salta cuando estalle'], arrastre:['Arrastre del espacio','Te lleva consigo: salta cuando coincidas'],
};
const COURSE = [[6,'clasico'],[2,'muralla'],[3,'clasico'],[3,'respiracion'],[3,'clasico'],[3,'escalera'],[3,'clasico'],[3,'muralla'],[2,'clasico'],[3,'respiracion'],[2,'clasico'],[3,'escalera'],[2,'clasico'],[3,'muralla'],[2,'clasico'],[3,'respiracion'],[3,'escalera']];   // nivel 1: 49 anillos + la salida
const COURSE2 = [[5,'clasico'],[2,'muralla'],[3,'clasico'],[3,'contragiro'],[3,'clasico'],[3,'respiracion'],[3,'contragiro'],[2,'clasico'],[3,'escalera'],[3,'contragiro'],[2,'clasico'],[3,'muralla'],[3,'contragiro'],[2,'clasico'],[3,'respiracion'],[3,'contragiro'],[3,'escalera']];   // nivel 2: 49 anillos + la salida
const COURSE3 = [[5,'clasico'],[2,'muralla'],[4,'clasico'],[3,'contragiro'],[3,'respiracion'],[5,'clasico'],[3,'escalera'],[2,'clasico'],[3,'contragiro'],[5,'clasico'],[3,'muralla'],[3,'respiracion'],[5,'clasico'],[3,'escalera']];   // nivel 3: 49 anillos + la salida
const courseMap3 = ['clasico'];
for (const [n, ty] of COURSE3) for (let i=0;i<n;i++) courseMap3.push(ty);
while (courseMap3.length < 60) courseMap3.push('clasico');
const courseMap2 = ['clasico'];
for (const [n, ty] of COURSE2) for (let i=0;i<n;i++) courseMap2.push(ty);
while (courseMap2.length < 60) courseMap2.push('clasico');
const courseMap = ['clasico'];
(function buildCourse(){
  for (const [n, ty] of COURSE) for (let i=0;i<n;i++) courseMap.push(ty);
  while (courseMap.length < 60) courseMap.push('clasico');
})();
const ringType = k => tutorial ? (TUT_TYPES[k] || 'vacio') : k === GOAL ? 'muralla' : (lvl >= 3 ? courseMaps[lvl] : lvl === 2 ? courseMap3 : lvl === 1 ? courseMap2 : courseMap)[Math.min(k, 59)];
let seenTypes = {};
try{ seenTypes = JSON.parse(localStorage.getItem('orbita_p1_vistos') || '{}') || {}; }catch(e){ seenTypes = {}; }
