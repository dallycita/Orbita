/**
 * Ajustes del jugador guardados en el navegador: silencio general y volumen de la música y de los efectos.
 * Este módulo es su único dueño; los demás los leen y los cambian con sus funciones.
 */

// Silencio general: true apaga todo el sonido del juego.
const settings = {
  muted: false,
  volMus: 100,
  volSfx: 100,
};

// Volumen de la música y de los efectos (de 0 a 100), guardados en el navegador.

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
function initAudioSettings() {
  try {
    const a = localStorage.getItem('orbita_vol_mus'),
      b = localStorage.getItem('orbita_vol_sfx');
    if (a !== null) {
      settings.volMus = Math.max(0, Math.min(100, +a || 0));
    }
    if (b !== null) {
      settings.volSfx = Math.max(0, Math.min(100, +b || 0));
    }
  } catch (e) {}
}

/**
 * Cambia `volMus` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
function setVolMus(value) {
  settings.volMus = value;
  return value;
}

/**
 * Cambia `volSfx` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
function setVolSfx(value) {
  settings.volSfx = value;
  return value;
}

/** Lee del navegador si el jugador dejó el juego en silencio. */
function loadMute() {
  try {
    settings.muted = localStorage.getItem('orbita_p1_sonido') === '0';
  } catch (e) {}
}

/**
 * Cambia el silencio general (no lo guarda: eso lo hace quien lo cambia).
 *
 * @param {boolean} value true para silenciar.
 * @returns {boolean} El mismo valor.
 */
function setMuted(value) {
  settings.muted = value;
  return value;
}

export { initAudioSettings, loadMute, setMuted, setVolMus, setVolSfx, settings };
