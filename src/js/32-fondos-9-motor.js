/**
 * Motor de fondos en WebGL: compila el shader de cada galaxia, le pasa el estado del juego como
 * uniformes y copia el resultado al lienzo 2D del juego.
 * Usa un lienzo WebGL propio y fuera de pantalla; si WebGL falla, `draw` devuelve false y el juego
 * usa el fondo 2D. La interfaz pública es el objeto `GLBG`.
 */
import { CX, CY, H, S, SUN, W, ctx } from './01-pantalla-y-utilidades.js';
import { sunLevel, t } from './08-partida-estado.js';
import { rr } from './16-partida.js';
import { BG_VS } from './32-fondos-1-comun.js';
import { FS_AND, FS_AND2 } from './32-fondos-2-andromeda.js';
import { FS_MW } from './32-fondos-3-via-lactea.js';
import { FS_LMC } from './32-fondos-4-magallanes.js';
import { FS_GX } from './32-fondos-56-final.js';
import { FS_PHOTO } from './32-fondos-6-foto.js';

let GLBG;

// Fotografía real para el fondo del Remolino; vacía, se usa el fondo dibujado.
let REMOLINO_PHOTO = '';
/**
 * Fuente de la fotografía del Remolino.
 *
 * @returns {?string} La dirección de la foto, o null para usar el fondo dibujado.
 */
function remolinoSource() {
  return REMOLINO_PHOTO || null;
}

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initBackgroundEngine() {
  GLBG = (() => {
    let cv = null,
      gl = null,
      progs = {},
      buf = null,
      failed = false,
      flow = 0,
      photoTex = {};
    /**
     * Crea el contexto WebGL y el triángulo que cubre la pantalla, una sola vez.
     *
     * @returns {boolean} true si WebGL está disponible.
     */
    function init() {
      if (gl || failed) {
        return !!gl;
      }
      try {
        if (!document.createElement) {
          failed = true;
          return false;
        }
        cv = document.createElement('canvas');
        gl =
          cv &&
          cv.getContext &&
          (cv.getContext('webgl', { preserveDrawingBuffer: true, antialias: false }) ||
            cv.getContext('experimental-webgl', { preserveDrawingBuffer: true }));
        if (!gl || !gl.createShader) {
          gl = null;
          failed = true;
          return false;
        }
        buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        return true;
      } catch (e) {
        gl = null;
        failed = true;
        return false;
      }
    }
    /**
     * Compila y enlaza (una vez) el programa de un fondo y guarda sus uniformes.
     *
     * @param {string} name Nombre del programa en la caché.
     * @param {string} fs Código GLSL del shader de fragmentos.
     * @returns {?{p: WebGLProgram, U: object}} El programa, o null si no compila.
     */
    function prog(name, fs) {
      if (progs[name] !== undefined) {
        return progs[name];
      }
      const sh = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.warn(gl.getShaderInfoLog(s));
          return null;
        }
        return s;
      };
      const v = sh(gl.VERTEX_SHADER, BG_VS),
        f = sh(gl.FRAGMENT_SHADER, fs);
      if (!v || !f) {
        progs[name] = null;
        return null;
      }
      const p = gl.createProgram();
      gl.attachShader(p, v);
      gl.attachShader(p, f);
      gl.bindAttribLocation(p, 0, 'p');
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        progs[name] = null;
        return null;
      }
      const U = {};
      [
        'uRes',
        'uT',
        'uFlow',
        'uBeat',
        'uJour',
        'uSpd',
        'uBand',
        'uBH',
        'uWH',
        'uScale',
        'uImg',
        'uImgSize',
        'uFit',
        'uKind',
      ].forEach(k => (U[k] = gl.getUniformLocation(p, k)));
      return (progs[name] = { p, U });
    }
    /**
     * Carga una fotografía como textura, una vez por nombre. Un lienzo se sube al momento; una
     * dirección se carga en segundo plano y queda lista (`ready`) al llegar.
     *
     * @param {string} name Nombre de la textura en la caché.
     * @param {string|HTMLCanvasElement} src Dirección (url o data:) o lienzo.
     * @returns {object} Registro de la textura: `{ready, w, h, tex}`.
     */
    function photo(name, src) {
      if (photoTex[name]) {
        return photoTex[name];
      }
      const rec = (photoTex[name] = { ready: false, w: 1, h: 1, tex: null });
      if (src && src.getContext) {
        try {
          rec.tex = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, rec.tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          rec.w = src.width;
          rec.h = src.height;
          rec.ready = true;
        } catch (e) {}
        return rec;
      }
      try {
        const img = new Image();
        img.onload = () => {
          if (!gl) {
            return;
          }
          rec.tex = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, rec.tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          rec.w = img.width;
          rec.h = img.height;
          rec.ready = true;
        };
        img.src = src;
      } catch (e) {}
      return rec;
    }
    /**
     * Dibuja el fondo del nivel. Las galaxias detalladas se calculan a la resolución del
     * dispositivo (hasta 1,6×); las demás, a 900 píxeles como máximo.
     *
     * @param {string} kind Fondo: 'mw', 'lmc', 'and2', 'and', 'gx' o 'photo'.
     * @param {object} opts beat (golpe de música, de 0 a 1), wh (agujero de gusano: x, y, radio en
     *   píxeles de pantalla y fuerza), kind (nivel, para 'gx'); para 'photo': name, src, fx, fy,
     *   zoom.
     * @returns {boolean} false si no se pudo dibujar; el juego usa entonces el fondo 2D.
     */
    function draw(kind, opts) {
      if (!init()) {
        return false;
      }
      const p =
        kind === 'photo'
          ? prog('photo', FS_PHOTO)
          : kind === 'mw'
            ? prog('mw', FS_MW)
            : kind === 'lmc'
              ? prog('lmc', FS_LMC)
              : kind === 'and2'
                ? prog('and2', FS_AND2)
                : kind === 'gx'
                  ? prog('gx', FS_GX)
                  : prog('and', FS_AND);
      if (!p) {
        return false;
      }
      let rec = null;
      if (kind === 'photo') {
        rec = photo(opts.name, opts.src);
        if (!rec.ready) {
          return false;
        }
      }
      const sc =
          kind === 'mw' || kind === 'lmc' || kind === 'and2' || kind === 'gx'
            ? Math.min(window.devicePixelRatio || 1, 1.6, 2400 / Math.max(W, H))
            : Math.min(1, 900 / Math.max(W, H)),
        w = Math.max(2, Math.round(W * sc)),
        h = Math.max(2, Math.round(H * sc));
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.useProgram(p.p);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      // El agujero negro y su anillo de Einstein (la luz se dobla más cerca de él).
      const Rg = Math.max(rr(sunLevel), SUN) * S;
      gl.uniform2f(p.U.uRes, w, h);
      gl.uniform1f(p.U.uT, t);
      gl.uniform1f(p.U.uFlow, flow);
      gl.uniform1f(p.U.uBeat, opts.beat || 0);
      if (p.U.uJour) {
        gl.uniform1f(p.U.uJour, jour);
      }
      if (p.U.uSpd) {
        gl.uniform1f(p.U.uSpd, spd);
      }
      if (p.U.uBand) {
        gl.uniform1f(p.U.uBand, bandE);
      }
      gl.uniform3f(p.U.uBH, CX * sc, CY * sc, Rg * 1.9 * sc);
      // WebGL cuenta la altura desde abajo, por eso se invierte la y.
      if (p.U.uWH) {
        const wh = opts.wh;
        if (wh) {
          gl.uniform4f(p.U.uWH, wh[0] * sc, (H - wh[1]) * sc, wh[2] * sc, wh[3]);
        } else {
          gl.uniform4f(p.U.uWH, 0, 0, 1, 0);
        }
      }
      if (p.U.uScale) {
        gl.uniform1f(p.U.uScale, Math.max(W, H) * sc * 0.9);
      }
      if (p.U.uKind) {
        gl.uniform1f(p.U.uKind, opts.kind || 0);
      }
      if (rec) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, rec.tex);
        gl.uniform1i(p.U.uImg, 0);
        gl.uniform2f(p.U.uImgSize, rec.w, rec.h);
        gl.uniform4f(p.U.uFit, opts.fx || 0.5, opts.fy || 0.4, opts.zoom || 1.15, 0);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(cv, 0, 0, W, H);
      ctx.restore();
      return true;
    }
    // Cuánto se avanza por el fondo: lento siempre, más rápido al saltar y en la recta final.
    // jour: avance del viaje (de 0 a 1); spd: velocidad suavizada; bandE: tramo de luz de la canción.
    let jour = 0,
      spd = 0,
      band = 0,
      bandE = 0;
    /**
     * Avanza el fondo un cuadro.
     *
     * @param {number} d Tiempo del cuadro, en segundos.
     * @param {number} speed Velocidad de avance (0 detiene el flujo).
     * @param {number} [target] Avance del viaje hacia el que se acerca `jour`, de 0 a 1.
     */
    function advance(d, speed, target) {
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
    function setBand(target, d) {
      const st = d / 6;
      band = band < target ? Math.min(target, band + st) : Math.max(target, band - st);
      const x = band - Math.floor(band),
        e = x * x * (3 - 2 * x);
      bandE = Math.floor(band) + e;
    }
    /**
     * Vuelve el viaje y la luz al principio, para una partida nueva.
     */
    function reset() {
      jour = 0;
      band = bandE = 0;
    }
    return { draw, advance, reset, setBand, ok: () => init(), canvas: () => cv };
  })();
}

export { GLBG, REMOLINO_PHOTO, remolinoSource };
