/**
 * Las misiones diarias, los logros y el dato real que acompaña a cada logro.
 */

// Misiones diarias. g: grupo (se sortea una de cada grupo), n: meta, ev: evento que la avanza,
// max: la meta es el mejor valor alcanzado y no una suma, rw: premio en polvo estelar.
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

// Dato científico real que se muestra al cobrar cada logro.
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

export { MIS_ACH, MIS_DAILY, MIS_FACT };
