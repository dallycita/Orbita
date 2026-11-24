/**
 * Dibujo de los planetas: en 3D con WebGL (con su respaldo en 2D), el planeta del jugador en la partida,
 * Caronte, la Tierra y las miniaturas.
 */
import { CX, CY, H, PR, S, W, ctx, frac, rgba } from '../core/display.js';
import { run, state } from '../core/state.js';
import { PLANETS_P, curPlanet, sizeK } from '../game/planets.js';
import { effects, time, tutorialState } from '../core/run-state.js';
import { hot, hotT } from '../game/hazard-state.js';
import {
  caronteOn,
  caronteXY,
  hsh,
  ringBoostNow,
  setRingBoostNow,
  shieldT,
} from '../game/powers.js';
import { waveProx } from '../game/hazards.js';

import { PBANDS, PBASE, PFEAT, PLANET_SVG } from '../data/planets.js';
import { CLOUD, CONT } from './sprites.js';

/**
 * Motor WebGL de planetas: hornea una vez la textura procedural de cada planeta (mapa de
 * longitud y latitud) y luego dibuja una esfera iluminada que la usa.
 * Devuelve `render`, `ok` (hay WebGL) y `warm` (prepara una textura por adelantado).
 */
const PLGL = (() => {
  let gl = null,
    cv = null,
    empty = null,
    failed = false,
    buf = null,
    bakeP = null,
    sphP = null,
    UB = {},
    US = {},
    deriv = false;
  const KIND = {
    tierra: 0,
    luna: 1,
    mercurio: 2,
    venus: 3,
    marte: 4,
    jupiter: 5,
    saturno: 6,
    urano: 7,
    neptuno: 8,
    pluton: 9,
    sol: 10,
  };
  // inclinación en pantalla (como ctx.rotate), inclinación hacia la cámara, atmósfera
  // [r,g,b,fuerza], relieve, brillo especular
  const LOOK = {
    tierra: { tilt: -0.41, tip: 0.22, atmo: [0.35, 0.62, 1.0, 1.0], bump: 0.4, spec: 1 },
    luna: { tilt: -0.05, tip: 0.08, atmo: [0, 0, 0, 0], bump: 1.0, spec: 0 },
    mercurio: { tilt: 0, tip: 0.05, atmo: [0, 0, 0, 0], bump: 1.1, spec: 0 },
    venus: { tilt: -0.05, tip: 0.1, atmo: [1.0, 0.85, 0.55, 0.9], bump: 0, spec: 0 },
    marte: { tilt: -0.44, tip: 0.18, atmo: [1.0, 0.62, 0.45, 0.45], bump: 0.7, spec: 0 },
    jupiter: { tilt: -0.05, tip: 0.1, atmo: [0.95, 0.85, 0.7, 0.35], bump: 0, spec: 0 },
    saturno: { tilt: -0.32, tip: 0.25, atmo: [1.0, 0.9, 0.65, 0.3], bump: 0, spec: 0 },
    urano: { tilt: 0.14 + Math.PI / 2, tip: 0.75, atmo: [0.6, 0.95, 1.0, 0.6], bump: 0, spec: 0 },
    neptuno: { tilt: -0.49, tip: 0.12, atmo: [0.45, 0.65, 1.0, 0.7], bump: 0, spec: 0 },
    pluton: { tilt: -0.3, tip: 0.2, atmo: [0.7, 0.8, 1.0, 0.18], bump: 0.7, spec: 0 },
    sol: { tilt: -0.12, tip: 0.05, atmo: [1, 0.7, 0.3, 0], bump: 0, spec: 0 },
  };
  const VS =
    'attribute vec2 aP; varying vec2 vUv; void main(){ vUv = aP*.5 + .5; gl_Position = vec4(aP, 0., 1.); }';
  const NOISE = `
  float h31(vec3 p){ p = fract(p*vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y)*p.z); }
  vec3 h33(vec3 p){ p = fract(p*vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx)*p.zyx); }
  float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*f*(f*(f*6. - 15.) + 10.);
    return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
  float fbm(vec3 p, int o){ float s = 0., a = .5, n = 0.; for (int i = 0; i < 9; i++){ if (i >= o) break; s += a*vn(p); n += a; p = p*2.03 + vec3(1.7, -3.1, 2.3); a *= .5; } return s/n; }
  float ridge(vec3 p, int o){ float s = 0., a = .5, n = 0.; for (int i = 0; i < 8; i++){ if (i >= o) break; float v = 1. - abs(vn(p)*2. - 1.); s += a*v*v; n += a; p = p*2.07 + vec3(5.1, 1.3, -2.2); a *= .5; } return s/n; }
  // campo de cráteres: altura (cuenco + borde) y brillo del material expulsado
  vec2 craters(vec3 p, float sc, float dens){
    p *= sc; vec3 id = floor(p); vec2 r = vec2(0.);
    for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
      vec3 c = id + vec3(x, y, z); if (h31(c + 11.7) > dens) continue;
      vec3 o = c + .15 + .7*h33(c); float rad = .18 + .32*pow(h31(c + 3.9), 2.);
      float d = length(p - o)/rad;
      if (d < 2.6){
        float bowl = d < 1. ? (d*d - 1.)*.9 : 0.;
        float rim = exp(-pow((d - 1.)*4., 2.))*.45;
        float ej = d > 1. ? exp(-(d - 1.)*2.2)*.35 : 0.;
        r += vec2(bowl + rim, ej*(.5 + .5*h31(c + 1.1)));
      }
    }
    return r;
  }
  float sat(float x){ return clamp(x, 0., 1.); }
  `;
  // horneado: cada píxel de la textura es un punto de la esfera (longitud, latitud)
  const FS_BAKE = `
  precision highp float;
  varying vec2 vUv; uniform int uK; uniform int uL;
  ${NOISE}
  vec3 belts(float y, vec3 a, vec3 b, float seed, float f){
    float t = vn(vec3(0., y*f, seed))*.65 + vn(vec3(0., y*f*2.3, seed + 4.))*.35;
    return mix(a, b, smoothstep(.47, .57, t));
  }
  void main(){
    float lon = vUv.x*6.2831853, lat = (vUv.y - .5)*3.1415927;
    vec3 p = vec3(cos(lat)*sin(lon), sin(lat), cos(lat)*cos(lon));
    float alat = abs(p.y);
    vec3 col = vec3(.5); float A = 0.;
    if (uK == 0){ // Tierra
      vec3 w = p*1.4 + .35*vec3(fbm(p*2.1 + 3., 5), fbm(p*2.1 + 9., 5), fbm(p*2.1 + 17., 5));
      float h = fbm(w, 6) + .03*ridge(p*5., 3);
      float sea = .515;
      if (uL == 1){ // nubes (r) y luces de ciudades (g)
        vec3 q = p*2.1; q += .9*vec3(fbm(q*1.4 + 1., 6), fbm(q*1.4 + 5., 6), fbm(q*1.4 + 8., 6)) - .45;
        q += .32*vec3(fbm(q*4.2 + 2., 5), fbm(q*4.2 + 7., 5), fbm(q*4.2 + 3., 5)) - .16;
        float band = .62 + .22*exp(-pow(p.y/.1, 2.)) + .3*exp(-pow((alat - .6)/.15, 2.)) - .22*exp(-pow((alat - .3)/.12, 2.));
        float c = fbm(q*vec3(1.7, 2.8, 1.7), 6)*band;
        c = smoothstep(.39, .47, c)*.95;
        c *= .8 + .2*smoothstep(.35, .6, fbm(q*6. + 4., 4));
        float land = smoothstep(sea, sea + .01, h);
        float city = land*smoothstep(.62, .8, fbm(p*22., 6))*smoothstep(.9, .3, alat)*smoothstep(.55, .7, fbm(p*5. + 2., 4));
        gl_FragColor = vec4(sat(c), city, 1. - land, 1.); return;
      }
      if (h < sea){
        float dpt = sat((sea - h)/.12);
        col = mix(vec3(.10, .40, .62), vec3(.05, .20, .48), smoothstep(.0, .5, dpt));
        col = mix(col, vec3(.22, .62, .70), smoothstep(.9, .93, 1. - dpt)*.7);
        A = 0.;
      } else {
        float e = sat((h - sea)/.2), moist = fbm(p*3.3 + 21., 6) + (fbm(p*16., 5) - .5)*.25;
        float dry = smoothstep(.27, .02, abs(alat - .36))*smoothstep(.56, .36, moist);
        vec3 forest = mix(vec3(.13, .30, .12), vec3(.18, .34, .14), fbm(p*9., 3));
        vec3 grass = vec3(.42, .48, .22);
        vec3 desert = mix(vec3(.88, .72, .46), vec3(.80, .60, .38), fbm(p*7., 3));
        vec3 tundra = vec3(.38, .36, .30), rock = vec3(.40, .35, .30);
        col = mix(forest, grass, smoothstep(.42, .72, moist + alat*.35));
        col = mix(col, desert, smoothstep(.35, .55, dry*1.5));
        col = mix(col, tundra, smoothstep(.56, .74, alat));
        col = mix(col, rock, smoothstep(.4, .75, e)*.7);
        col = mix(col, vec3(.9), smoothstep(.7, .9, e)*.6);
        A = .5*e;
      }
      float ice = smoothstep(.88, .92, alat + .04*fbm(p*9., 5) + (h > sea ? .06 : 0.));
      col = mix(col, vec3(.93, .96, 1.), ice);
    } else if (uK == 1 || uK == 2){ // Luna y Mercurio
      bool moon = uK == 1;
      vec2 c1 = craters(p, 4., .55), c2 = craters(p, 9., .55), c3 = craters(p, 18., .35), c4 = vec2(0.);
      float ht = c1.x*1. + c2.x*.55 + c3.x*.25;
      float ej = c1.y + c2.y*.7 + c3.y*.4;
      float base = .58 + (fbm(p*4., 3) - .5)*.12;
      float mare = moon ? smoothstep(.535, .555, fbm(p*1.7 + 4., 5)) : smoothstep(.56, .62, fbm(p*2.2 + 9., 5))*.5;
      float g = mix(base, moon ? .34 : .42, mare);
      g -= smoothstep(-.2, -.6, c1.x + c2.x*.8)*.07;
      g += ej*(moon ? .16 : .12)*(1. - mare*.5);
      col = moon ? vec3(g)*vec3(1., .99, .96) : vec3(g)*vec3(1.05, .98, .90);
      A = sat(.5 + ht*.25*(1. - mare*.6));
    } else if (uK == 3){ // Venus: nubes densas en forma de Y
      vec3 q = p*vec3(1.6, 4.2, 1.6); q += 1.3*vec3(fbm(q + 2., 6), fbm(q + 6., 6), fbm(q + 12., 6));
      float v = fbm(q*1.3, 5);
      float chev = sin(lon*2. + abs(p.y)*7. + v*4.)*.5 + .5;
      col = mix(vec3(.80, .64, .40), vec3(.98, .91, .72), sat(v*1.3 - .1 + chev*.18));
      col = mix(col, vec3(.95, .90, .80), smoothstep(.7, .95, alat)*.5);
    } else if (uK == 4){ // Marte
      vec3 w = p*1.8 + .6*vec3(fbm(p*2. + 1., 5), fbm(p*2. + 4., 5), fbm(p*2. + 8., 5));
      float dark = smoothstep(.56, .6, fbm(w, 5));
      vec2 c1 = craters(p, 5., .4), c2 = craters(p, 11., .4), c3 = vec2(0.);
      float ht = c1.x*.8 + c2.x*.45;
      // Valles Marineris: un cañón largo cerca del ecuador
      float vlon = mod(lon - 4.4 + 3.14159, 6.28318) - 3.14159;
      float canyon = exp(-pow((p.y + .14 + .03*sin(vlon*6.) + .03*(fbm(p*18., 5) - .5))/.03, 2.))*smoothstep(1.0, .5, abs(vlon))*smoothstep(.3, .6, fbm(p*10. + 3., 5));
      ht -= canyon*.9;
      vec3 rust = mix(vec3(.84, .44, .25), vec3(.92, .58, .34), smoothstep(.45, .6, fbm(p*4., 4)));
      col = mix(rust, vec3(.56, .27, .17), dark*.85);
      col = mix(col, vec3(.50, .27, .16), canyon*.45);
      col *= .9 + .2*(c1.y + c2.y);
      float cap = smoothstep(.935, .955, alat + .05*fbm(p*12., 5) - (p.y < 0. ? .04 : 0.));
      col = mix(col, vec3(.96, .94, .92), cap);
      A = sat(.5 + ht*.25);
    } else if (uK == 5 || uK == 6){ // Júpiter y Saturno
      bool jup = uK == 5;
      vec3 q = p + .07*(vec3(fbm(p*5., 5), fbm(p*5. + 3., 5), fbm(p*5. + 7., 5)) - .5);
      float y = q.y + (jup ? .035 : .02)*(fbm(vec3(p.x*4., p.y*26., p.z*4.), 6) - .5);
      vec3 zone = jup ? vec3(.92, .88, .80) : vec3(.94, .87, .68), belt = jup ? vec3(.64, .46, .34) : vec3(.80, .66, .44);
      col = belts(y, zone, belt, jup ? 1. : 7., jup ? 7. : 10.);
      col = mix(col, jup ? vec3(.76, .60, .46) : vec3(.88, .78, .58), smoothstep(.4, .7, vn(vec3(0., y*23., 9.)))*.35);
      col = mix(col, belt*.82, smoothstep(.62, .8, vn(vec3(0., y*41., 3.)))*.3);
      col = mix(col, jup ? vec3(.80, .56, .36) : vec3(.86, .74, .52), (1. - smoothstep(.0, .12, abs(y)))*.5);
      float streak = fbm(vec3(q.x*5., y*60., q.z*5.), 4);
      col *= .95 + .1*streak;
      float sw = fbm(q*14. + vec3(0., y*20., 0.), 6);
      col = mix(col, jup ? vec3(.98, .95, .9) : vec3(.97, .92, .8), smoothstep(.66, .72, sw)*(jup ? .3 : .12));
      col = mix(col, jup ? vec3(.48, .42, .40) : vec3(.62, .62, .62), smoothstep(.7, .95, alat)*(jup ? .7 : .45));
      if (jup){ // la Gran Mancha Roja
        float dl = mod(lon - 1.1 + 3.14159, 6.28318) - 3.14159;
        vec2 e = vec2(dl*cos(lat)/.15, (lat + .39)/.075); float r = length(e);
        float ang = atan(e.y, e.x) + r*2.5;
        float sp = 1. - smoothstep(.85, 1.05, r);
        vec3 red = mix(vec3(.72, .32, .20), vec3(.88, .52, .36), .5 + .5*sin(ang*3. + r*9.));
        col = mix(col, vec3(.95, .9, .82), exp(-pow((r - 1.15)/.12, 2.))*.6);
        col = mix(col, red, sp);
      }
    } else if (uK == 7){ // Urano
      float b = vn(vec3(0., p.y*9., 2.))*.5 + .5;
      col = mix(vec3(.62, .84, .88), vec3(.72, .90, .93), b*.5 + .1*fbm(p*8., 4));
      col = mix(col, vec3(.80, .94, .96), smoothstep(.5, .9, p.y)*.5);
    } else if (uK == 8){ // Neptuno
      vec3 q = p + .05*vec3(fbm(p*5., 5), fbm(p*5. + 2., 5), fbm(p*5. + 6., 5));
      col = belts(q.y, vec3(.23, .42, .86), vec3(.14, .26, .66), 3., 6.);
      float dl = mod(lon - 2.2 + 3.14159, 6.28318) - 3.14159;
      vec2 e = vec2(dl*cos(lat)/.17, (lat + .38)/.08); float r = length(e);
      col = mix(col, vec3(.07, .13, .38), 1. - smoothstep(.75, 1., r));
      float wc = smoothstep(.62, .68, fbm(vec3(q.x*2.5, q.y*30., q.z*2.5), 5))*smoothstep(.5, .6, fbm(q*3. + 3., 3))*.85;
      wc += exp(-pow(length(e - vec2(.3, -1.25))/.4, 2.))*.9;
      col = mix(col, vec3(.92, .95, 1.), sat(wc));
    } else if (uK == 9){ // Plutón con su corazón de hielo
      float dl = mod(lon - .6 + 3.14159, 6.28318) - 3.14159;
      vec2 h = vec2(dl*cos(lat)/.62, (lat - .12)/.55)*1.15; h.y += .25;
      float hx = abs(h.x), hy = h.y; float heart = pow(hx*hx + hy*hy - 1., 3.) - hx*hx*hy*hy*hy;
      float inH = 1. - smoothstep(-.03, .03, heart + (fbm(p*14., 5) - .5)*.07);
      float cth = smoothstep(.22, .05, abs(p.y + .12 + .05*sin(lon*3.)))*smoothstep(.3, 1.1, abs(dl))*smoothstep(.45, .55, fbm(p*4., 5) + .1);
      vec2 c1 = craters(p, 6., .25), c2 = craters(p, 14., .3);
      float ht = c1.x*.5 + c2.x*.3 + (fbm(p*24., 5) - .5)*.3;
      vec3 base = mix(vec3(.80, .66, .52), vec3(.88, .78, .66), smoothstep(.45, .6, fbm(p*4., 4)));
      col = mix(base, vec3(.32, .19, .14), cth);
      col = mix(col, vec3(.97, .94, .90), inH);
      A = sat(.5 + ht*.25*(1. - inH));
    } else { // el Sol: granulación, manchas y fáculas
      vec2 g1 = craters(p, 60., 1.), g2 = craters(p, 130., 1.);
      float gran = fbm(p*30., 4)*.5 + g1.x*.05;
      col = mix(vec3(1., .62, .20), vec3(1., .90, .55), sat(.55 + gran));
      float spots = 0.;
      for (int i = 0; i < 5; i++){
        float fi = float(i);
        vec3 sc = normalize(vec3(sin(fi*2.4 + .5), (mod(fi, 2.) < .5 ? 1. : -1.)*(.22 + .1*h31(vec3(fi))), cos(fi*2.4 + .5)));
        float d = length(p - sc)/(.035 + .03*h31(vec3(fi, 2., 1.)));
        spots = max(spots, 1. - smoothstep(.4, 1., d));
        col = mix(col, vec3(.55, .25, .06), (1. - smoothstep(.9, 1.6, d))*.6);
      }
      col = mix(col, vec3(.18, .06, .02), spots*.9);
      A = 1.;
    }
    gl_FragColor = vec4(col, A);
  }`;
  // la esfera: rota, se inclina y la ilumina una fuente (el Sol o el disco del agujero negro)
  const FS_SPH = `
  #ifdef GL_OES_standard_derivatives
  #extension GL_OES_standard_derivatives : enable
  #endif
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uT0, uT1; uniform vec2 uTex; uniform float uPad, uRot, uCRot, uTilt, uTip, uBump, uSpec, uTime, uAA, uSun, uLay;
  uniform vec3 uL, uLC; uniform vec4 uAtm; uniform int uK; uniform bool uDer;
  vec2 uvOf(vec3 n, float rot){
    float lon = atan(n.x, n.z) - rot, lat = asin(clamp(n.y, -1., 1.));
    float u = lon/6.2831853;
    vec2 a = vec2(fract(u), lat/3.1415927 + .5);
  #ifdef GL_OES_standard_derivatives
    if (uDer){ vec2 b = vec2(fract(u + .5) - .5, a.y); return fwidth(a.x) < fwidth(b.x) - .001 ? a : b; }
  #endif
    return a;
  }
  void main(){
    vec2 q = (vUv*2. - 1.)*uPad; float r = length(q);
    vec3 L = normalize(uL);
    float ct = cos(uTilt), st = sin(uTilt), cp = cos(uTip), sp = sin(uTip);
    vec4 halo;
    { float rr = max(r, 1.);
      if (uSun > .5){ float g = exp(-(rr - 1.)*7.)*(1. - smoothstep(uPad*.8, uPad, rr))*.75; halo = vec4(vec3(1., .72, .32)*g, g); }
      else { float lt = smoothstep(-.35, .7, dot(normalize(vec3(q, 0.) + 1e-5), L)); float g = uAtm.w*exp(-(rr - 1.)*28.)*lt*.85; halo = vec4(uAtm.rgb*uLC*g, g); } }
    if (r > 1.){ gl_FragColor = halo; return; }
    vec3 n = vec3(q, sqrt(max(0., 1. - r*r)));
    // vista → planeta: quitar la inclinación en pantalla y luego la que mira a la cámara
    vec3 m = vec3(ct*n.x + st*n.y, -st*n.x + ct*n.y, n.z);
    m = vec3(m.x, cp*m.y + sp*m.z, -sp*m.y + cp*m.z);
    vec2 uv = uvOf(m, uRot);
    vec4 s0 = texture2D(uT0, uv);
    vec3 alb = s0.rgb;
    if (uSun < .5){ float lu = dot(alb, vec3(.3, .55, .15)); alb = clamp(mix(vec3(lu), alb, 1.22), 0., 1.); } // colores un poco más vivos
    float edge = 1. - smoothstep(1. - uAA*2., 1., r);
    if (uSun > .5){
      vec4 s1 = texture2D(uT0, uvOf(m, uRot*1.7 + .3));
      float mu = n.z;
      vec3 c = mix(alb, s1.rgb, .35 + .15*sin(uTime*.7))*(.42 + .58*pow(mu, .45));
      c = mix(c*vec3(1., .78, .55), c, pow(mu, .3));
      c *= 1.35;
      gl_FragColor = vec4(c*edge, edge) + halo*(1. - edge); return;
    }
    // relieve: normal perturbada con la altura guardada en alfa
    vec3 N = n;
    if (uBump > 0.){
      vec2 d = 1.5/uTex;
      float h0 = s0.a, hx = texture2D(uT0, uv + vec2(d.x, 0.)).a, hy = texture2D(uT0, uv + vec2(0., d.y)).a;
      vec3 ax = vec3(-st*cp, ct*cp, sp); // eje del planeta en la vista (aprox.)
      vec3 east = normalize(cross(ax, n) + 1e-5), north = cross(n, east);
      N = normalize(n - uBump*((hx - h0)*east + (hy - h0)*north)*3.5);
    }
    float dif = dot(N, L), dn = dot(n, L);
    // estilo del juego: realista pero caricaturesco → terminador limpio en dos tonos, una banda de luz y bordes con brillo
    float dl = uAtm.w > .5 ? mix(dif, dn, .5) : dif;
    float day = smoothstep(-.05, .1, dl), lit = day;
    float hi = smoothstep(.48, .6, dl);
    vec3 night = alb*vec3(.11, .12, .24)*.65 + vec3(.016, .018, .045);
    vec3 c = mix(night, alb*uLC*(.72 + .38*hi)*(.9 + .1*smoothstep(-.1, 1., dl)), day);
    if (uK == 0){
      float sea = texture2D(uT1, uv).b;
      vec3 H = normalize(L + vec3(0., 0., 1.));
      float spc = (smoothstep(.988, .992, dot(n, H))*.45 + smoothstep(.86, .97, dot(n, H))*.1)*sea*day;
      vec4 cl = texture2D(uT1, uvOf(m, uRot + uCRot));
      float shadowC = texture2D(uT1, uvOf(m, uRot + uCRot + .006)).r;
      c *= 1. - shadowC*.3*lit;
      c += uLC*vec3(1., .95, .85)*spc*(1. - cl.r);
      c = mix(c, vec3(.96, .97, 1.)*uLC*(lit*.95 + .03), cl.r);
      float night = smoothstep(.1, -.2, dn);
      c += vec3(1., .72, .38)*cl.g*night*(1. - cl.r)*.9;
    }
    if (uSpec > 0. && uK != 0){ }
    // atmósfera: borde azulado que crece hacia el contorno del lado iluminado
    float rim = pow(1. - n.z, 2.6);
    float rl = smoothstep(-.3, .6, dn);
    vec3 rc = uAtm.w > 0. ? uAtm.rgb : vec3(.95, .9, .82);
    c += uAtm.rgb*uLC*uAtm.w*(rim*1.0 + .04)*rl;
    c = mix(c, uAtm.rgb*uLC*rl*.6, uAtm.w*(.04 + .22*rim));
    // borde de luz nítido del lado iluminado y un contraluz tenue del lado oscuro (se lee contra el espacio)
    c += rc*uLC*smoothstep(.91, .975, r)*smoothstep(-.05, .4, dn)*.42;
    c += rc*smoothstep(.92, .99, r)*smoothstep(.15, -.45, dn)*.22;
    c = c/(1. + c*.12);
    gl_FragColor = vec4(c*edge, edge) + halo*(1. - edge);
  }`;
  function mk(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('PLGL', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  function prog(fs) {
    const v = mk(gl.VERTEX_SHADER, VS),
      f = mk(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) {
      return null;
    }
    const p = gl.createProgram();
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.bindAttribLocation(p, 0, 'aP');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn('PLGL link', gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  }
  function init() {
    if (gl || failed) {
      return !!gl;
    }
    try {
      cv = document.createElement('canvas');
      cv.width = cv.height = 64;
      gl =
        cv.getContext &&
        (cv.getContext('webgl', {
          preserveDrawingBuffer: true,
          antialias: false,
          premultipliedAlpha: true,
          alpha: true,
        }) ||
          cv.getContext('experimental-webgl', { preserveDrawingBuffer: true }));
      if (!gl) {
        failed = true;
        return false;
      }
      deriv = !!gl.getExtension('OES_standard_derivatives');
      bakeP = prog(FS_BAKE);
      sphP = prog(FS_SPH);
      if (!bakeP || !sphP) {
        failed = true;
        gl = null;
        return false;
      }
      empty = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, empty);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 0, 0]),
      );
      buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      for (const n of ['uK', 'uL']) {
        UB[n] = gl.getUniformLocation(bakeP, n);
      }
      for (const n of [
        'uT0',
        'uT1',
        'uTex',
        'uPad',
        'uRot',
        'uCRot',
        'uTilt',
        'uTip',
        'uBump',
        'uSpec',
        'uTime',
        'uAA',
        'uSun',
        'uL',
        'uLC',
        'uAtm',
        'uK',
        'uDer',
        'uLay',
      ]) {
        US[n] = gl.getUniformLocation(sphP, n);
      }
      return true;
    } catch (e) {
      failed = true;
      gl = null;
      return false;
    }
  }
  // texturas: chicas (512×256) para todos y grandes (2048×1024) solo para el que se ve de cerca
  const cache = {},
    bigOrder = [];
  function bake(id, layer, w, h) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.useProgram(bakeP);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(UB.uK, KIND[id]);
    gl.uniform1i(UB.uL, layer);
    gl.disable(gl.BLEND);
    gl.enable(gl.SCISSOR_TEST);
    const strips = w > 1024 ? 8 : 1;
    for (let i = 0; i < strips; i++) {
      gl.scissor(0, Math.floor((i * h) / strips), w, Math.ceil(h / strips));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    gl.disable(gl.SCISSOR_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    try {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        deriv ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR,
      );
    } catch (e) {}
    return tex;
  }
  function texFor(id, big) {
    const key = id + (big ? ':b' : ':s');
    if (cache[key]) {
      if (big) {
        const i = bigOrder.indexOf(key);
        if (i >= 0) {
          bigOrder.splice(i, 1);
        }
        bigOrder.push(key);
      }
      return cache[key];
    }
    const w = big ? 2048 : 512,
      h = w / 2;
    const e = { t0: bake(id, 0, w, h), t1: id === 'tierra' ? bake(id, 1, w, h) : null, w, h };
    cache[key] = e;
    if (big) {
      bigOrder.push(key);
      while (bigOrder.length > 3) {
        const k = bigOrder.shift(),
          o = cache[k];
        if (o) {
          gl.deleteTexture(o.t0);
          if (o.t1) {
            gl.deleteTexture(o.t1);
          }
        }
        delete cache[k];
      }
    }
    return e;
  }
  /**
   * Dibuja el planeta en el lienzo WebGL propio y lo devuelve para copiarlo al lienzo 2D.
   *
   * @param {string} id Planeta (tierra, luna, ..., sol).
   * @param {number} px Diámetro del planeta, en píxeles del dispositivo.
   * @param {number} rot Giro sobre su eje, en radianes.
   * @param {number[]} light Dirección de la luz [x, y, z].
   * @param {number[]} lightCol Color de la luz [r, g, b], cerca de 1.
   * @param {number} time Tiempo del juego, en segundos (anima nubes y el Sol).
   * @returns {{cv: HTMLCanvasElement, pad: number}|null} Lienzo cuadrado de lado 2·R·pad, o null
   *   si no hay WebGL o el planeta no existe.
   */
  function render(id, px, rot, light, lightCol, time) {
    if (!init() || KIND[id] === undefined) {
      return null;
    }
    const pad = id === 'sol' ? 1.35 : 1.12;
    const N = Math.max(8, Math.min(1400, Math.ceil(px * pad)));
    const T = texFor(id, px > 260);
    if (cv.width !== N) {
      cv.width = cv.height = N;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, N, N);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(sphP);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, T.t0);
    gl.uniform1i(US.uT0, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, T.t1 || empty);
    gl.uniform1i(US.uT1, 1);
    gl.activeTexture(gl.TEXTURE0);
    const Lk = LOOK[id];
    gl.uniform2f(US.uTex, T.w, T.h);
    gl.uniform1f(US.uPad, pad);
    gl.uniform1f(US.uRot, rot);
    gl.uniform1f(US.uCRot, rot * 0.25 + time * 0.01);
    gl.uniform1f(US.uTilt, -Lk.tilt);
    gl.uniform1f(US.uTip, Lk.tip);
    gl.uniform1f(US.uBump, Lk.bump);
    gl.uniform1f(US.uSpec, Lk.spec);
    gl.uniform1f(US.uTime, time);
    gl.uniform1f(US.uAA, (pad * 1.5) / N);
    gl.uniform1f(US.uSun, id === 'sol' ? 1 : 0);
    gl.uniform1f(US.uLay, 0);
    gl.uniform3f(US.uL, light[0], light[1], light[2]);
    gl.uniform3f(US.uLC, lightCol[0], lightCol[1], lightCol[2]);
    gl.uniform4f(US.uAtm, Lk.atmo[0], Lk.atmo[1], Lk.atmo[2], Lk.atmo[3]);
    gl.uniform1i(US.uK, KIND[id]);
    gl.uniform1i(US.uDer, deriv ? 1 : 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return { cv, pad };
  }
  return {
    render,
    ok: () => init(),
    warm: (id, big) => {
      if (init() && KIND[id] !== undefined) {
        texFor(id, !!big);
      }
    },
  };
})();

/**
 * Dibuja un planeta grande en HD con WebGL, con sus anillos detrás y delante.
 * Si está bloqueado o no hay WebGL, usa el dibujo 2D.
 *
 * @param {string} id Planeta (tierra, luna, ..., sol).
 * @param {number} cx Centro horizontal, en píxeles de pantalla.
 * @param {number} cy Centro vertical, en píxeles de pantalla.
 * @param {number} R Radio, en píxeles de pantalla.
 * @param {number} rot Giro sobre su eje, en radianes.
 * @param {boolean} locked Planeta bloqueado (silueta oscura).
 * @param {string|{x: number, y: number}} light 'left' (pantalla de planetas, luz del Sol),
 *   'below' (en el juego, luz del disco del agujero negro) o una dirección {x, y}.
 */
function drawBigPlanet(id, cx, cy, R, rot, locked, light) {
  if (locked || !(R > 0.5)) {
    return drawBigPlanet2D(id, cx, cy, R, rot, locked, light);
  }
  let sc = 1;
  try {
    const m = ctx.getTransform && ctx.getTransform();
    sc = m ? Math.hypot(m.a, m.b) : window.devicePixelRatio || 1;
  } catch (e) {}
  let Lv, LC;
  if (light === 'below') {
    Lv = [0, -0.78, 0.55];
    LC = [1.18, 1.0, 0.84];
  } else if (light && light.x !== undefined) {
    Lv = [light.x, -light.y, 0.35];
    LC = [1.1, 1.04, 0.96];
  } else {
    Lv = [-0.78, 0.42, 0.48];
    LC = [1.12, 1.06, 0.98];
  }
  const res = PLGL.render(id, 2 * R * sc, rot, Lv, LC, time.t);
  if (!res) {
    return drawBigPlanet2D(id, cx, cy, R, rot, locked, light);
  }
  if (id === 'sol') {
    const ag = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 2.6);
    if (ag && ag.addColorStop) {
      ag.addColorStop(0, 'rgba(255,170,70,.45)');
      ag.addColorStop(0.4, 'rgba(255,120,40,.12)');
      ag.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  planetRing(id, cx, cy, R, 'back', false);
  const h = R * res.pad;
  ctx.drawImage(res.cv, cx - h, cy - h, 2 * h, 2 * h);
  planetRing(id, cx, cy, R, 'front', false);
}

/**
 * Dibuja el planeta del jugador en la partida, con sus efectos (escudo, Caronte, aviso de onda,
 * sobrecalentamiento). Su tamaño real, en escala, cambia cómo se ve.
 *
 * @param {number} px Posición horizontal, en píxeles de pantalla.
 * @param {number} py Posición vertical, en píxeles de pantalla.
 * @param {number} rad Radio base, en píxeles de pantalla (se multiplica por sizeK()).
 */
function drawPlayer(px, py, rad) {
  if (!tutorialState.tutorial) {
    // un halo oscuro detrás de tu planeta para que siempre se despegue del fondo
    const r0 = rad * sizeK(),
      g = ctx.createRadialGradient(px, py, r0 * 0.8, px, py, r0 * 2.6);
    if (g && g.addColorStop) {
      g.addColorStop(0, 'rgba(3,4,10,.75)');
      g.addColorStop(1, 'rgba(3,4,10,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, r0 * 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const r = rad * sizeK();
  if (curPlanet === 'pluton' && !tutorialState.tutorial) {
    drawCaronteBack(px, py);
  } // Caronte, cuando pasa por detrás
  setRingBoostNow(
    curPlanet === 'saturno' && shieldT > 0 && !tutorialState.tutorial
      ? Math.min(1 - Math.pow(1 - Math.min(1, (1.5 - shieldT) / 0.28), 3), shieldT / 0.35)
      : 0,
  );
  if (curPlanet === 'tierra' || !curPlanet) {
    drawEarth(px, py, r);
  } else {
    drawBigPlanet(curPlanet, px, py, r, time.t * 0.6, false, 'below');
  }
  setRingBoostNow(0);
  if (waveProx > 0.05 && !tutorialState.tutorial && state === 'play') {
    // aviso: la onda está por alcanzarte
    const k = waveProx,
      pl = 0.5 + 0.5 * Math.sin(time.t * 18);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = k * (0.55 + 0.45 * pl);
    ctx.strokeStyle = '#ff6fa8';
    ctx.lineWidth = 2 + 2.5 * k;
    ctx.beginPath();
    ctx.arc(px, py, r + 3 + 6 * k * pl, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    const vg = ctx.createRadialGradient(
      CX,
      CY,
      Math.min(W, H) * 0.35,
      CX,
      CY,
      Math.max(W, H) * 0.75,
    );
    if (vg && vg.addColorStop) {
      vg.addColorStop(0, 'rgba(255,60,140,0)');
      vg.addColorStop(1, 'rgba(255,60,140,' + (0.32 * k * (0.6 + 0.4 * pl)).toFixed(3) + ')');
      ctx.save();
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }
  if (hot && !tutorialState.tutorial) {
    drawHot(px, py, r);
  }
}

/**
 * Dibuja media capa de los anillos de Saturno o Urano, con sus divisiones reales (anillos C, B,
 * división de Cassini, A y división de Encke). Se llama dos veces, detrás y delante del planeta.
 * Con el poder de anillos activo (ringBoostNow) el disco se abre y gira.
 *
 * @param {string} id Planeta; solo hace algo con 'saturno' y 'urano'.
 * @param {number} cx Centro horizontal, en píxeles de pantalla.
 * @param {number} cy Centro vertical, en píxeles de pantalla.
 * @param {number} R Radio del planeta, en píxeles de pantalla.
 * @param {string} half 'back' (mitad de atrás) o 'front' (mitad de adelante).
 * @param {boolean} locked Planeta bloqueado: dibuja solo un anillo gris.
 */
function planetRing(id, cx, cy, R, half, locked) {
  if (id !== 'saturno' && id !== 'urano') {
    return;
  }
  ctx.save();
  ctx.translate(cx, cy);
  const bst = id === 'saturno' ? ringBoostNow : 0;
  if (id === 'saturno') {
    ctx.rotate(-0.32 * (1 - bst * 0.55));
    ctx.scale(1 + 0.75 * bst, 0.245 + 0.4 * bst);
  } else {
    ctx.rotate(0.14 + Math.PI / 2);
    ctx.scale(1, 0.68);
  }
  ctx.beginPath();
  if (half === 'back') {
    ctx.rect(-R * 3, -R * 12, R * 6, R * 12);
  } else {
    ctx.rect(-R * 3, 0, R * 6, R * 12);
  }
  ctx.clip();
  if (locked) {
    ctx.strokeStyle = '#2a2f42';
    ctx.lineWidth = R * 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.75, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const stops =
    id === 'saturno'
      ? [
          [1.2, 'rgba(120,105,85,0)'],
          [1.24, 'rgba(120,105,85,.18)'],
          [1.45, 'rgba(150,130,100,.32)'],
          [1.5, 'rgba(205,185,150,.75)'],
          [1.62, 'rgba(232,214,176,.92)'],
          [1.78, 'rgba(240,224,188,.95)'],
          [1.84, 'rgba(222,200,160,.88)'],
          [1.86, 'rgba(40,34,30,.12)'],
          [1.92, 'rgba(40,34,30,.08)'],
          [1.94, 'rgba(196,176,140,.72)'],
          [2.04, 'rgba(206,186,150,.78)'],
          [2.06, 'rgba(60,50,40,.2)'],
          [2.075, 'rgba(196,176,140,.66)'],
          [2.12, 'rgba(180,160,128,.5)'],
          [2.13, 'rgba(180,160,128,0)'],
        ]
      : [
          [1.5, 'rgba(160,200,210,0)'],
          [1.54, 'rgba(160,200,210,.16)'],
          [1.58, 'rgba(160,200,210,0)'],
          [1.66, 'rgba(170,210,220,0)'],
          [1.69, 'rgba(190,225,235,.3)'],
          [1.72, 'rgba(190,225,235,0)'],
        ];
  const r0 = stops[0][0],
    r1 = stops[stops.length - 1][0];
  const g = ctx.createRadialGradient(0, 0, R * r0, 0, 0, R * r1);
  if (g && g.addColorStop) {
    for (const [r, c] of stops) {
      g.addColorStop((r - r0) / (r1 - r0), c);
    }
    ctx.fillStyle = g;
  }
  ctx.beginPath();
  ctx.arc(0, 0, R * r1, 0, Math.PI * 2);
  ctx.arc(0, 0, R * r0, 0, Math.PI * 2, true);
  ctx.fill('evenodd');
  if (bst > 0) {
    // Anillos protectores: el disco de hielo se abre y gira; los de adentro van más rápido, como
    // en el Saturno real (ley de Kepler: velocidad angular proporcional a r^-1.5).
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.16 * bst;
    ctx.strokeStyle = '#fff0cc';
    ctx.lineWidth = R * 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.78, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 110; i++) {
      const rq = 1.48 + 0.62 * hsh(i, 1),
        w = 4.2 * Math.pow(1.5 / rq, 1.5),
        a = hsh(i, 2) * Math.PI * 2 + time.t * w,
        sz = R * (0.025 + 0.04 * hsh(i, 3));
      ctx.globalAlpha = (0.35 + 0.55 * hsh(i, 4)) * bst;
      ctx.fillStyle = i % 4 ? '#fff6e2' : '#d9ecff';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * R * rq, Math.sin(a) * R * rq, sz, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const a = i * 1.7 + time.t * 4.2 * Math.pow(1.5 / 1.75, 1.5);
      ctx.globalAlpha = 0.22 * bst;
      ctx.strokeStyle = '#3c3228';
      ctx.lineWidth = R * 0.1; // los "rayos" oscuros que Voyager y Cassini vieron en los anillos
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * R * 1.55, Math.sin(a) * R * 1.55);
      ctx.lineTo(Math.cos(a + 0.05) * R * 1.95, Math.sin(a + 0.05) * R * 1.95);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'lighter';
    const ga = time.t * 2.4;
    ctx.globalAlpha = 0.7 * bst;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = R * 0.05;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.7, ga, ga + 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, R * 2.0, ga * 0.8 + 2, ga * 0.8 + 2.35);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Versión 2D de drawBigPlanet, sin WebGL: color base, bandas y manchas que giran con `rot`.
 * Recibe los mismos parámetros que drawBigPlanet.
 */
function drawBigPlanet2D(id, cx, cy, R, rot, locked, light) {
  const ring = (from, to) => {
    if (id === 'saturno') {
      ctx.strokeStyle = locked ? '#3a3f52' : 'rgba(243,226,176,.85)';
      ctx.lineWidth = R * 0.16;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 2.05, R * 0.5, -0.32, from, to);
      ctx.stroke();
      ctx.strokeStyle = locked ? '#2a2f42' : 'rgba(200,170,110,.6)';
      ctx.lineWidth = R * 0.06;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 1.7, R * 0.41, -0.32, from, to);
      ctx.stroke();
    }
    if (id === 'urano') {
      ctx.strokeStyle = locked ? '#2a2f42' : 'rgba(200,240,250,.45)';
      ctx.lineWidth = R * 0.05;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 0.42, R * 1.75, 0.14, from, to);
      ctx.stroke();
    }
  };
  const col = (PLANETS_P.find(P => P.id === id) || { col: '#ffffff' }).col;
  ring(Math.PI, Math.PI * 2);
  if (!locked) {
    const big = id === 'sol' ? 2.2 : 1.35,
      ag = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * big);
    ag.addColorStop(0, rgba(col, id === 'sol' ? 0.6 : 0.35));
    ag.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(cx, cy, R * big, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = locked ? '#1b2033' : PBASE[id];
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  if (!locked) {
    const bands = PBANDS[id];
    if (bands) {
      ctx.fillStyle = bands[0];
      for (const y of bands[1]) {
        if (id === 'urano') {
          ctx.fillRect(cx + y * R, cy - R, R * 0.14, R * 2);
        } else {
          ctx.fillRect(cx - R, cy + y * R, R * 2, R * 0.16);
        }
      }
    }
    for (const [lon, lat, w, h, c2] of PFEAT[id] || []) {
      const a = lon - rot,
        c = Math.cos(a);
      if (c <= 0.02) {
        continue;
      }
      const fx = cx + Math.sin(a) * R * Math.cos(lat),
        fy = cy + Math.sin(lat) * R;
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.ellipse(fx, fy, Math.max(0.5, w * R * c), h * R, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (id !== 'sol' || locked) {
    const sh =
      light === 'below'
        ? ctx.createLinearGradient(cx, cy + R, cx, cy - R)
        : light && light.x !== undefined
          ? ctx.createRadialGradient(
              cx + light.x * R * 0.5,
              cy + light.y * R * 0.5,
              R * 0.1,
              cx,
              cy,
              R * 1.05,
            )
          : ctx.createRadialGradient(cx - R * 0.45, cy - R * 0.35, R * 0.1, cx, cy, R * 1.05);
    if (sh && sh.addColorStop) {
      if (light === 'below') {
        sh.addColorStop(0, 'rgba(10,14,30,0)');
        sh.addColorStop(0.5, 'rgba(10,14,30,.15)');
        sh.addColorStop(1, 'rgba(10,14,30,.72)');
      } else {
        sh.addColorStop(0, 'rgba(255,255,255,.18)');
        sh.addColorStop(0.5, 'rgba(0,0,0,0)');
        sh.addColorStop(1, 'rgba(5,6,12,.75)');
      }
      ctx.fillStyle = sh;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    }
  } else {
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    if (core && core.addColorStop) {
      core.addColorStop(0, 'rgba(255,250,225,.75)');
      core.addColorStop(1, 'rgba(255,140,40,.25)');
      ctx.fillStyle = core;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    }
  }
  ctx.restore();
  if (locked) {
    ctx.strokeStyle = '#3a3f52';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
  }
  ring(0, Math.PI);
}

/**
 * Planeta sobrecalentado: brilla al rojo vivo, la atmósfera chisporrotea y sale humo.
 * Se queda así el resto del intento.
 *
 * @param {number} px Posición horizontal, en píxeles de pantalla.
 * @param {number} py Posición vertical, en píxeles de pantalla.
 * @param {number} r Radio, en píxeles de pantalla.
 */
function drawHot(px, py, r) {
  const k = Math.min(1, hotT / 0.4),
    pl = 0.5 + 0.5 * Math.sin(time.t * 6);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(px, py, r * 0.1, px, py, r * 3.4);
  if (g && g.addColorStop) {
    g.addColorStop(0, 'rgba(255,130,50,' + ((0.55 + 0.15 * pl) * k).toFixed(3) + ')');
    g.addColorStop(0.32, 'rgba(255,80,20,' + ((0.38 + 0.15 * pl) * k).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(255,40,10,0)');
    ctx.fillStyle = g;
  }
  ctx.beginPath();
  ctx.arc(px, py, r * 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = (0.7 + 0.3 * pl) * k;
  ctx.strokeStyle = '#ffcf6b';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(px, py, r + 1.5, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = time.t * (1.5 + i * 0.3) + i * 1.7;
    if (Math.sin(time.t * 9 + i * 3) < 0.6) {
      continue;
    } // chispas en la atmósfera
    ctx.globalAlpha = 0.9 * k;
    ctx.fillStyle = '#fff1c4';
    ctx.beginPath();
    ctx.arc(px + Math.cos(a) * (r + 2), py + Math.sin(a) * (r + 2), 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  if (Math.random() < 0.35 && state === 'play') {
    // humo que se aleja del agujero negro
    const ox = (px - CX) / S,
      oy = (py - CY) / S,
      L = Math.hypot(ox, oy) || 1;
    effects.particles.push({
      x: ox + (Math.random() - 0.5) * 4,
      y: oy + (Math.random() - 0.5) * 4,
      vx: (ox / L) * 18 + (Math.random() - 0.5) * 10,
      vy: (oy / L) * 18 + (Math.random() - 0.5) * 10,
      life: 0.6 + Math.random() * 0.4,
      col: Math.random() < 0.5 ? '#ff7a3d' : '#6a5a55',
      s: 1.2 + Math.random() * 1.8,
    });
  }
}

/**
 * Miniatura de un planeta para la interfaz: imagen 3D si hay WebGL, si no su ícono SVG.
 *
 * @param {string} id Identificador del planeta.
 * @returns {string} HTML de la miniatura (vacío si no hay ícono).
 */
function planetThumb(id) {
  try {
    const r = PLGL.render(id, 120, 0.6, [-0.78, 0.42, 0.48], [1.12, 1.06, 0.98], 1);
    if (r && r.cv.toDataURL) {
      return '<img src="' + r.cv.toDataURL() + '" alt="">';
    }
  } catch (e) {}
  return PLANET_SVG[id]
    ? '<svg viewBox="0 0 100 100" aria-hidden="true">' + PLANET_SVG[id] + '</svg>'
    : '';
}

/**
 * Dibuja la órbita de Caronte y, si está en la mitad que pasa detrás de Plutón, la luna. Se
 * llama antes de dibujar el planeta; la mitad de delante la dibuja `drawPowerFx`.
 *
 * @param {number} px Centro horizontal de Plutón, en píxeles de pantalla.
 * @param {number} py Centro vertical de Plutón, en píxeles de pantalla.
 */
function drawCaronteBack(px, py) {
  if (!caronteOn()) {
    return;
  }
  const r = PR * S * 1.15 * sizeK(),
    [cx, cy, z] = caronteXY(px, py, r);
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = '#d9c7b4';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(px, py, r * 2.4, r * 0.7, 0.25, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  if (z < 0) {
    drawCaronte(cx, cy, r * 0.62, 1);
  }
}

/**
 * Dibuja la Tierra: en 3D con WebGL o, si no, un círculo con continentes y nubes que se mueven.
 *
 * @param {number} px Posición horizontal, en píxeles de pantalla.
 * @param {number} py Posición vertical, en píxeles de pantalla.
 * @param {number} rad Radio, en píxeles de pantalla.
 */
function drawEarth(px, py, rad) {
  if (PLGL.ok() && rad > 0.5) {
    drawBigPlanet('tierra', px, py, rad, time.t * 0.35, false, 'below');
    ctx.strokeStyle = 'rgba(143,208,255,.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py, rad + 1.2, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(120,190,255,.7)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#2b63c9';
  ctx.beginPath();
  ctx.arc(px, py, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(px, py, rad, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#4fa35a';
  for (const c of CONT) {
    const x = px + (frac(c.x + time.t * 0.06) * 2.8 - 1.4) * rad;
    ctx.beginPath();
    ctx.ellipse(x, py + c.y * rad, c.w * rad, c.h * rad, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,.8)';
  for (const c of CLOUD) {
    const x = px + (frac(c.x + time.t * 0.11) * 2.8 - 1.4) * rad;
    ctx.beginPath();
    ctx.ellipse(x, py + c.y * rad, c.w * rad, 0.09 * rad, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const sh = ctx.createLinearGradient(px, py + rad, px, py - rad);
  sh.addColorStop(0, 'rgba(10,14,30,0)');
  sh.addColorStop(0.5, 'rgba(10,14,30,.15)');
  sh.addColorStop(1, 'rgba(10,14,30,.75)');
  ctx.fillStyle = sh;
  ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  ctx.restore();
  ctx.strokeStyle = 'rgba(143,208,255,.7)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(px, py, rad + 0.6, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Dibuja Caronte con el planeta en WebGL (textura de la Luna) o un círculo si no hay WebGL, y le
 * pinta encima su polo rojizo.
 *
 * @param {number} cx Centro horizontal, en píxeles de pantalla.
 * @param {number} cy Centro vertical, en píxeles de pantalla.
 * @param {number} cr Radio, en píxeles de pantalla.
 * @param {number} al Opacidad, de 0 a 1.
 */
function drawCaronte(cx, cy, cr, al) {
  ctx.save();
  ctx.globalAlpha = al;
  let res = null;
  try {
    if (PLGL.ok()) {
      res = PLGL.render(
        'luna',
        2 * cr * 2,
        time.t * 0.3,
        [-Math.cos(run.pAng) * 0.8, Math.sin(run.pAng) * 0.8, 0.6],
        [1.3, 1.18, 1.08],
        time.t,
      );
    }
  } catch (e) {
    res = null;
  }
  if (res) {
    const h = cr * res.pad;
    ctx.drawImage(res.cv, cx - h, cy - h, 2 * h, 2 * h);
  } else {
    ctx.fillStyle = '#a99a8c';
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, cr * 0.98, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createRadialGradient(cx, cy - cr * 0.85, 0, cx, cy - cr * 0.85, cr * 0.75);
  g.addColorStop(0, 'rgba(120,52,36,.65)');
  g.addColorStop(1, 'rgba(120,52,36,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
  ctx.fillStyle = 'rgba(150,150,160,.12)';
  ctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
  ctx.restore();
}

export { PLGL, drawBigPlanet, drawCaronte, drawEarth, drawPlayer, planetThumb };
