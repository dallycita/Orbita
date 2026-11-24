/**
 * Los niveles (galaxias) en orden, con su nombre, dificultad, color, ícono y dato real,
 * y los anillos de cada nivel donde hay estrellas para recoger.
 */

/** Los niveles en orden: nombre, dificultad, color, icono, distancia y dato real. */
const LEVELS = [
  {
    name: 'Sistema solar',
    diff: 'Fácil',
    col: '#86c99a',
    ready: true,
    icon: 'solar',
    dist: 'Aquí, en casa',
    fact: 'Nuestro hogar: el Sol y ocho planetas, formados hace unos 4600 millones de años.',
    nuevo: 'Muralla, respiración y escalera',
  },
  {
    name: 'Nubes de Magallanes',
    diff: 'Fácil',
    col: '#86c99a',
    ready: true,
    icon: 'magallanes',
    dist: 'A unos 160 000 años luz',
    fact: 'Dos galaxias enanas que giran una alrededor de la otra mientras orbitan la Vía Láctea. Se ven a simple vista desde el hemisferio sur.',
    nuevo: 'Contragiro',
  },
  {
    name: 'Andrómeda',
    diff: 'Medio',
    col: '#e3bf72',
    ready: true,
    icon: 'andromeda',
    dist: 'A unos 2,5 millones de años luz',
    fact: 'La galaxia grande más cercana a la nuestra. Se acerca: chocará con la Vía Láctea en unos 4500 millones de años.',
    nuevo: 'Nebulosas que te impulsan y púlsares que te empujan',
  },
  {
    name: 'Centaurus A',
    diff: 'Medio',
    col: '#e3bf72',
    ready: true,
    icon: 'centaurus',
    dist: 'A unos 12 millones de años luz',
    fact: 'Nació de la fusión de dos galaxias. Una enorme franja de polvo la cruza, y su agujero negro lanza chorros gigantes.',
    nuevo: 'Freno',
  },
  {
    name: 'Remolino',
    diff: 'Medio',
    col: '#e3bf72',
    ready: true,
    icon: 'remolino',
    dist: 'A unos 23 a 31 millones de años luz',
    fact: 'Una galaxia espiral que está chocando con una galaxia vecina más pequeña, y sus fuerzas de marea la deforman.',
    nuevo: 'Fuerzas de marea',
  },
  {
    name: 'Sombrero',
    diff: 'Medio',
    col: '#e3bf72',
    ready: true,
    icon: 'sombrero',
    dist: 'A unos 30 millones de años luz',
    fact: 'Su núcleo brillante y su franja oscura de polvo, vistos casi de lado, le dan forma de sombrero.',
    nuevo: 'Cometas que recorren tu anillo',
  },
  {
    name: 'M87',
    diff: 'Difícil',
    col: '#e98d63',
    ready: true,
    icon: 'm87',
    dist: 'A unos 54 millones de años luz',
    fact: 'Su agujero negro fue el primero en ser fotografiado, en 2019. Lanza un chorro de energía de miles de años luz.',
    nuevo: 'Rayos de energía',
  },
  {
    name: 'Sagitario A*',
    diff: 'Muy difícil',
    col: '#e9738a',
    ready: true,
    icon: 'sgr',
    dist: 'A unos 26 000 años luz: el regreso a casa',
    fact: 'El agujero negro del centro de nuestra galaxia, unos 4 millones de veces más masivo que el Sol. Vencerlo te devuelve al Sol.',
    nuevo: 'Llamaradas y cometas en pinza',
  },
];

// Estrellas: la moneda del juego. Aparecen en todos los niveles, se ganan en cada partida y se
// guardan. COIN_RINGS[nivel] = los niveles de anillo que tienen estrella.
const COIN_RINGS = [
  new Set([4, 12, 22, 28, 37, 45]),
  new Set([4, 9, 15, 18, 32, 40]),
  new Set([4, 9, 15, 17, 31, 43]),
];

export { COIN_RINGS, LEVELS };
