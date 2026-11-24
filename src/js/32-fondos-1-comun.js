/**
 * Código GLSL que comparten todos los fondos en WebGL: uniformes, ruido, estrellas y la luz
 * doblada por el agujero negro. Se dibuja con la tarjeta gráfica a resolución reducida (el gas
 * es suave) y se copia al lienzo del juego.
 * Es solo texto GLSL: cambiar algo dentro de las plantillas cambia todos los fondos.
 */
// Shader de vértices: un triángulo que cubre toda la pantalla.
const BG_VS = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }';
const BG_COMMON = `
precision highp float;
uniform vec2 uRes; uniform float uT, uFlow, uBeat, uJour; uniform vec3 uBH; uniform vec4 uWH; // xy: centro (px), z: radio de Einstein (px)
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
vec2 h22(vec2 p){ float n = h21(p); return vec2(n, h21(p + n)); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 5; i++){ s += a*vn(p); p = m*p; a *= .5; } return s; }
// lente gravitacional de una masa puntual: lo que ves en x viene de la posición b = x·(1 − θE²/|x|²)
vec2 lens(vec2 q, out float amp){ amp = 1.; return q; }   // sin deformación del fondo
// estrellas en una rejilla: cada celda tiene una estrella con brillo y color propios
vec3 stars(vec2 q, float sc, float dens){
  vec2 g = q/sc, id = floor(g), f = fract(g); vec3 c = vec3(0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
    vec2 o = vec2(x, y), cid = id + o; float n = h21(cid); if (n > dens) continue;
    vec2 sp = o + h22(cid*1.7); float dd = length(f - sp)*sc;
    float b = pow(h21(cid + 7.1), 6.)*1.4 + .15, tw = .75 + .25*sin(uT*(1. + 3.*n) + n*40.);
    vec3 col = mix(vec3(1., .82, .65), vec3(.7, .82, 1.), h21(cid + 3.3));
    c += col*b*tw*exp(-dd*dd*1.6);
  }
  return c;
}
`;
