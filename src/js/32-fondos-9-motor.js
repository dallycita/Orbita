// ┌─ 32-fondos-9-motor.js
// │ da:     GLBG, REMOLINO_PHOTO, remolinoSource
// │ lo usan: 13-agujero-de-gusano, 14-lente-gravitacional, 16-partida, 20-logica, 22-viaje-sistema-solar
// │ usa 01-pantalla-y-utilidades: ctx, CX, CY, H, S, SUN, W
// │ usa 08-partida-estado: sunLevel, t
// │ usa 16-partida: rr
// │ usa 32-fondos-1-comun: BG_VS
// │ usa 32-fondos-2-andromeda: FS_AND, FS_AND2
// │ usa 32-fondos-3-via-lactea: FS_MW
// │ usa 32-fondos-4-magallanes: FS_LMC
// │ usa 32-fondos-56-final: FS_GX
// │ usa 32-fondos-6-foto: FS_PHOTO
// └─ generado por `node build.mjs --deps`; no se edita a mano
// ---------- fondos en WebGL: el motor que dibuja el shader de cada galaxia ----------
const GLBG = (() => {
  let cv = null, gl = null, progs = {}, buf = null, failed = false, flow = 0, photoTex = {}, lastKey = '';
  function init(){
    if (gl || failed) return !!gl;
    try{
      if (!document.createElement) { failed = true; return false; }
      cv = document.createElement('canvas');
      gl = cv && cv.getContext && (cv.getContext('webgl', {preserveDrawingBuffer: true, antialias: false}) || cv.getContext('experimental-webgl', {preserveDrawingBuffer: true}));
      if (!gl || !gl.createShader){ gl = null; failed = true; return false; }
      buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      return true;
    }catch(e){ gl = null; failed = true; return false; }
  }
  function prog(name, fs){
    if (progs[name] !== undefined) return progs[name];
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)){ console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
    const v = sh(gl.VERTEX_SHADER, BG_VS), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f){ progs[name] = null; return null; }
    const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)){ progs[name] = null; return null; }
    const U = {}; ['uRes', 'uT', 'uFlow', 'uBeat', 'uJour', 'uSpd', 'uBand', 'uBH', 'uWH', 'uScale', 'uImg', 'uImgSize', 'uFit', 'uKind'].forEach(k => U[k] = gl.getUniformLocation(p, k));
    return progs[name] = {p, U};
  }
  // carga una fotografía (url o data:) como textura
  function photo(name, src){
    if (photoTex[name]) return photoTex[name];
    const rec = photoTex[name] = {ready: false, w: 1, h: 1, tex: null};
    if (src && src.getContext){ try{ rec.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, rec.tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      rec.w = src.width; rec.h = src.height; rec.ready = true; }catch(e){} return rec; }
    try{ const img = new Image(); img.onload = () => { if (!gl) return; rec.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, rec.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        rec.w = img.width; rec.h = img.height; rec.ready = true; }; img.src = src; }catch(e){}
    return rec;
  }
  // dibuja el fondo del nivel; devuelve false si no se pudo (y el juego usa el fondo anterior)
  function draw(kind, opts){
    if (!init()) return false;
    const p = kind === 'photo' ? prog('photo', FS_PHOTO) : kind === 'mw' ? prog('mw', FS_MW) : kind === 'lmc' ? prog('lmc', FS_LMC) : kind === 'and2' ? prog('and2', FS_AND2) : kind === 'gx' ? prog('gx' + (opts.kind || 0), FS_GX.replace('uniform float uKind;', 'const float uKind = ' + (opts.kind || 0) + '.;')) : prog('and', FS_AND); if (!p) return false;
    let rec = null; if (kind === 'photo'){ rec = photo(opts.name, opts.src); if (!rec.ready) return false; }
    const sc = (kind === 'mw' || kind === 'lmc' || kind === 'and2' || kind === 'gx') ? Math.min(window.devicePixelRatio || 1, 1.6, 2400/Math.max(W, H)) : Math.min(1, 900/Math.max(W, H)), w = Math.max(2, Math.round(W*sc)), h = Math.max(2, Math.round(H*sc));
    if (cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
    gl.viewport(0, 0, w, h); gl.useProgram(p.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    // el agujero negro y su anillo de Einstein (la luz se dobla más cerca de él)
    const Rg = Math.max(rr(sunLevel), SUN)*S;
    gl.uniform2f(p.U.uRes, w, h); gl.uniform1f(p.U.uT, t); gl.uniform1f(p.U.uFlow, flow); gl.uniform1f(p.U.uBeat, opts.beat || 0); if (p.U.uJour) gl.uniform1f(p.U.uJour, jour); if (p.U.uSpd) gl.uniform1f(p.U.uSpd, spd); if (p.U.uBand) gl.uniform1f(p.U.uBand, bandE);
    gl.uniform3f(p.U.uBH, CX*sc, CY*sc, Rg*1.9*sc);
    if (p.U.uWH){ const wh = opts.wh; if (wh) gl.uniform4f(p.U.uWH, wh[0]*sc, (H - wh[1])*sc, wh[2]*sc, wh[3]); else gl.uniform4f(p.U.uWH, 0, 0, 1, 0); }
    if (p.U.uScale) gl.uniform1f(p.U.uScale, Math.max(W, H)*sc*.9);
    if (p.U.uKind) gl.uniform1f(p.U.uKind, opts.kind || 0);
    if (rec){ gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, rec.tex); gl.uniform1i(p.U.uImg, 0); gl.uniform2f(p.U.uImgSize, rec.w, rec.h); gl.uniform4f(p.U.uFit, opts.fx || .5, opts.fy || .4, opts.zoom || 1.15, 0); }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(cv, 0, 0, W, H); ctx.restore();
    return true;
  }
  // cuánto "avanzas": lento siempre, más rápido al saltar y en la recta final
  let jour = 0, spd = 0, band = 0, bandE = 0;
  function advance(d, speed, target){ flow += d*speed; spd += (Math.min(speed, 3)/3 - spd)*Math.min(1, d*4); if (target !== undefined) jour += (target - jour)*Math.min(1, d*1.5); }
  // cambia de luz al ritmo de la canción: 15 entran los platillos, 28 el bombo, y el beat acelerado
  function setBand(target, d){ const st = d/6; band = band < target ? Math.min(target, band + st) : Math.max(target, band - st); const x = band - Math.floor(band), e = x*x*(3 - 2*x); bandE = Math.floor(band) + e; }
  function reset(){ jour = 0; band = bandE = 0; }
  return {draw, advance, reset, setBand, ok: () => init(), canvas: () => cv};
})();

// Remolino: método con fotografía real (mientras llega la foto, usa el dibujo actual como base)
let REMOLINO_PHOTO = '';
function remolinoSource(){ return REMOLINO_PHOTO || null; }   // sin foto todavía: se usa el fondo dibujado
