/**
 * El viaje por el fondo: cuánto ha avanzado, a qué velocidad y en qué tramo de luz de la canción está.
 * El juego lo avanza en cada cuadro y el dibujo del fondo (GLBG) lo lee; este módulo es su único dueño.
 */

// Cuánto se avanza por el fondo: lento siempre, más rápido al saltar y en la recta final.
// flow: cuánto ha fluido el fondo (crece siempre); jour: avance del viaje (de 0 a 1); spd: velocidad suavizada; bandE: tramo de luz de la canción.
let flow = 0;
let jour = 0;
let spd = 0;
let band = 0;
let bandE = 0;
/**
 * Avanza el fondo un cuadro.
 *
 * @param {number} d Tiempo del cuadro, en segundos.
 * @param {number} speed Velocidad de avance (0 detiene el flujo).
 * @param {number} [target] Avance del viaje hacia el que se acerca `jour`, de 0 a 1.
 */
function advanceJourney(d, speed, target) {
  flow += d * speed;
  spd += (Math.min(speed, 3) / 3 - spd) * Math.min(1, d * 4);
  if (target !== undefined) {
    jour += (target - jour) * Math.min(1, d * 1.5);
  }
}
/**
 * Cambia la luz del fondo al ritmo de la canción, con un paso suave entre tramos (en el
 * anillo 15 entran los platillos, en el 28 el bombo, y luego el ritmo acelerado).
 *
 * @param {number} target Tramo de luz al que ir (0, 1, 2, 3).
 * @param {number} d Tiempo del cuadro, en segundos.
 */
function setJourneyBand(target, d) {
  const st = d / 6;
  band = band < target ? Math.min(target, band + st) : Math.max(target, band - st);
  const x = band - Math.floor(band),
    e = x * x * (3 - 2 * x);
  bandE = Math.floor(band) + e;
}
/**
 * Vuelve el viaje y la luz al principio, para una partida nueva.
 */
function resetJourney() {
  jour = 0;
  band = bandE = 0;
}

export { advanceJourney, bandE, flow, jour, resetJourney, setJourneyBand, spd };
