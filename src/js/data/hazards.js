/**
 * Dónde y cuándo aparecen los peligros y los objetos de cada galaxia: cometas, rayos,
 * llamaradas, supernovas, nebulosas y púlsares.
 */

const COMET_AT = {
  5: new Set([5, 9, 15, 21, 26, 31, 38, 44]),
  6: new Set([9, 13, 17, 22, 26, 30, 34, 38, 42, 46]),
  7: new Set([10, 16, 22, 29, 35, 43, 48]),
};

const COMET_TIME = { 5: 2.4, 6: 1.9, 7: 1.8 };

// Segundos que tarda el cometa en alcanzarte.
const BEAM_AT = {
  6: new Set([7, 11, 15, 19, 24, 28, 32, 36, 40, 44, 47]),
  7: new Set([8, 14, 20, 27, 33, 39, 44]),
};

const FLARE_AT = { 7: new Set([6, 12, 18, 24, 30, 36, 41, 46]) };

// Nubes de Magallanes: onda de supernova (como la 1987A). Sale del centro al ritmo de la música y
// se apaga en un anillo límite (marcado en rosa). Si cruzas ese anillo antes de que llegue, estás a
// salvo. Si te alcanza, tu planeta se sobrecalienta y se queda así el resto del intento; un segundo
// golpe te destruye. Sale justo antes de una muralla o un contragiro: o pasas el primer hueco o te
// alcanza. El valor de cada anillo es a cuántos anillos queda el anillo límite.
const SN_AT = { 1: { 5: 1, 19: 1, 27: 1, 32: 1, 35: 1, 40: 2 } };

// Nebulosas y púlsares (desde el cuarto nivel): no son asteroides; tocarlos mueve al jugador.
// Nebulosas rosadas: nubes de hidrógeno donde nacen estrellas; su energía te impulsa dos anillos
// hacia arriba.
// Púlsares azules: restos de estrellas que explotaron y giran lanzando dos rayos; su radiación te
// empuja un anillo hacia abajo.
const OBJ_NEBULA = new Set([3, 6, 10, 14, 18, 25, 33]);

const OBJ_PULSAR = new Set([22, 23, 26, 30, 34, 41, 42, 45]);

const NEB_AT = {
  3: new Set([2, 9, 16, 23, 42]),
  4: new Set([2, 8, 16, 30, 45]),
  5: new Set([2, 8, 16, 25, 36]),
  6: new Set([2, 9, 18, 28]),
  7: new Set([2, 14, 17, 29]),
};

const PUL_AT = {
  3: new Set([11, 22, 43]),
  4: new Set([9, 17, 22, 31, 46]),
  5: new Set([6, 14, 19, 34, 39]),
  6: new Set([10, 19, 29, 43]),
  7: new Set([5, 15, 38, 47]),
};

export { BEAM_AT, COMET_AT, COMET_TIME, FLARE_AT, NEB_AT, OBJ_NEBULA, OBJ_PULSAR, PUL_AT, SN_AT };
