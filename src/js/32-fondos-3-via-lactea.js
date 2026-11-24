/**
 * Shader del fondo WebGL del Sistema solar (nivel 1): la Vía Láctea como en una foto de cielo
 * profundo (muchísimas estrellas, polvo oscuro, nebulosas rojizas) y, al salir del sistema solar,
 * la galaxia vista desde fuera con sus brazos espirales.
 * Todo `FS_MW` es texto GLSL (tras `BG_COMMON`): sus comentarios son parte del programa.
 */
import { BG_COMMON } from './32-fondos-1-comun.js';

const FS_MW =
  BG_COMMON +
  `
uniform float uScale;
float fbm7(vec2 p){ float s = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 7; i++){ s += a*vn(p); p = m*p; a *= .5; } return s; }
float rid(vec2 p){ float s = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 5; i++){ s += a*(1. - abs(vn(p)*2. - 1.)); p = m*p; a *= .5; } return s; }
// campo de estrellas con densidad variable (dentro de la banda hay muchísimas más)
vec3 starsD(vec2 q, float sc, float dens, float bmul){
  vec2 g = q/sc, id = floor(g), f = fract(g); vec3 c = vec3(0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
    vec2 o = vec2(x, y), cid = id + o; float n = h21(cid); if (n > dens) continue;
    vec2 sp = o + h22(cid*1.7); float dd = length(f - sp)*sc;
    float b = (pow(h21(cid + 7.1), 9.)*2.2 + .18)*bmul, tw = .8 + .2*sin(uT*(1. + 3.*n) + n*40.);
    vec3 col = mix(vec3(1., .78, .6), vec3(.72, .84, 1.), h21(cid + 3.3));
    c += col*b*tw*exp(-dd*dd*2.2);
  }
  return c;
}
vec3 band(vec2 q, out float body){
  vec2 d = (q - .5*uRes)/uScale;
  float a = -1.05;                                                       // casi vertical, inclinada como en la foto
  d = mat2(cos(a), -sin(a), sin(a), cos(a))*d;
  d.x += uFlow*.006 + uJour*.6 + uT*.008;
  float u = d.x, v = d.y + .07*sin(u*1.7) + .05*(fbm(vec2(u*1.2, 3.)) - .5);
  float w = .15 + .06*fbm(vec2(u*1.5, 7.));
  body = exp(-pow(v/w, 2.));
  float halo = exp(-pow(v/(w*2.6), 2.));
  float core = exp(-pow((u - .7)/.45, 2.))*exp(-pow(v/(w*1.15), 2.));
  float cl = fbm(vec2(u*5., v*8.) + 2.), cl2 = fbm(vec2(u*16., v*20.) + 9.);
  // paleta que cambia mientras viajas: violeta frío al inicio, azul en medio, dorado-rosa al salir
  vec3 cA = mix(vec3(.55, .48, .78), vec3(.48, .6, .92), smoothstep(.0, .5, uJour));
  cA = mix(cA, vec3(.92, .72, .78), smoothstep(.6, 1., uJour));
  vec3 col = cA*halo*.12 + cA*body*(.15 + 1.25*cl*cl2*1.6);
  col += vec3(1., .78, .55)*core*(.35 + 1.2*cl);
  // polvo oscuro: filamentos que se cruzan sobre el centro de la banda
  float dl = smoothstep(.55, .8, rid(vec2(u*3.6, v*7.5) + 4.))*exp(-pow((v + .03*sin(u*4.))/(w*.6), 2.));
  float dl2 = smoothstep(.62, .85, rid(vec2(u*8., v*12.) + 11.))*body*.7;
  float dust = clamp(dl + dl2, 0., 1.);
  col = mix(col, col*vec3(.28, .14, .1) + vec3(.012, .004, .002), dust);
  // nebulosas de emisión: manchas rosadas y rojas sobre el polvo (como Carina o la Laguna)
  float ne = smoothstep(.66, .82, fbm(vec2(u*6., v*6.) + 23.))*body;
  float ne2 = smoothstep(.78, .9, fbm(vec2(u*14., v*14.) + 31.))*body;
  col += vec3(1., .28, .42)*ne*.32 + vec3(1., .42, .5)*ne2*.5;
  // nubes oscuras tipo "Saco de Carbón"
  float sack = smoothstep(.2, .0, length(vec2(u - .15, v + .04)*vec2(1.6, 2.6)) - .1*fbm(d*9.));
  col *= 1. - .75*sack;
  return col;
}
// restos de supernova (como la Nebulosa del Velo): filamentos finos y retorcidos en magenta, naranja y azul
vec3 veil(vec2 q){
  vec2 d = (q - .5*uRes)/uScale;
  float a = -1.05; d = mat2(cos(a), -sin(a), sin(a), cos(a))*d;
  d.x += uFlow*.008 + uJour*.9 + uT*.01;
  vec2 w = d + .18*vec2(fbm(d*2.3 + 1. + uT*.06), fbm(d*2.3 + 7. - uT*.05)) - .09;
  float env = exp(-pow((w.y + .04*sin(w.x*3.))/.24, 2.))*smoothstep(.3, .55, fbm(vec2(w.x*1.6, 5.)));
  float f1 = pow(rid(w*vec2(4., 7.) + 3.), 4.);
  float f2 = pow(rid(w*vec2(9., 14.) + 21.), 5.);
  float f3 = pow(rid(w*vec2(6., 10.) + 40.), 5.);
  float fine = pow(rid(w*vec2(22., 30.) + 9.), 6.)*(.6 + .8*fbm7(w*40.));
  vec3 col = vec3(1., .22, .6)*f1*2.2 + vec3(1., .5, .28)*f2*2. + vec3(.5, .55, 1.)*f3*1.6;
  col *= .55 + 1.2*fine;
  col += vec3(.55, .14, .2)*smoothstep(.35, .75, fbm(w*5. + 2.))*.6;           // brillo rojizo difuso detrás de los filamentos
  return col*env;
}
// la galaxia vista desde fuera: núcleo con barra dorada, brazos azules con cúmulos rosados
vec3 spiral(vec2 q){
  vec2 c = vec2(.5*uRes.x, .76*uRes.y);
  vec2 d = (q - c)/(uScale*.34);
  float a = .5 + uT*.01; d = mat2(cos(a), -sin(a), sin(a), cos(a))*d; d.y /= .62;
  float r = length(d), ph = atan(d.y, d.x);
  float arms = pow(.5 + .5*cos(2.*(ph - log(r + .02)*3.2) + fbm(d*3.)*1.6), 3.);
  float disk = exp(-r*2.3);
  float clump = fbm(d*9. + 4.);
  vec3 col = vec3(.55, .66, 1.)*arms*disk*(.5 + 1.3*clump)*1.4;
  col += vec3(1., .35, .5)*smoothstep(.72, .86, clump)*arms*disk*1.1;
  float bar = exp(-pow(d.x/.32, 2.) - pow(d.y/.12, 2.));
  col += vec3(1., .85, .55)*(exp(-r*r*18.)*1.4 + bar*.9);
  col *= 1. - .6*smoothstep(.6, .85, rid(d*6. + 2.))*arms*smoothstep(.1, .4, r);
  return col*smoothstep(1.3, .5, r);
}
// ---- escenas del viaje: cada tramo del nivel muestra otra cara de la Vía Láctea ----
vec2 sceneD(vec2 q, float drift){ return (q - .5*uRes)/uScale + vec2(.05*sin(uT*.05 + drift*300.), .07*sin(uFlow*drift*1.5 + uT*.04)); }   // se mece sin irse de la pantalla
// 2 · campo de nebulosas de emisión (como Carina): gas turquesa y naranja que fluye, con pilares oscuros
vec3 emission(vec2 q){
  vec2 d = sceneD(q, .006);
  d += .14*vec2(fbm(d*1.8 + uT*.12), fbm(d*1.8 - uT*.1 + 3.));
  float g1 = fbm7(d*2.6 + 1.), g2 = fbm7(d*3.4 + 8.), g3 = fbm7(d*7. + uT*.08);
  vec3 col = vec3(.1, .85, .8)*smoothstep(.42, .78, g1)*.85;
  col += vec3(1., .42, .15)*smoothstep(.5, .82, g2)*1.1;
  col += vec3(1., .85, .5)*pow(smoothstep(.55, .9, g1*g2*2.), 2.)*.9;
  col *= .35 + .9*g3*fbm(d*16. + 4.)*1.6;
  col *= .25 + .75*smoothstep(.25, .55, fbm(d*1.3 + 11.));
  float wisp = pow(rid(d*vec2(5., 7.) + uT*.04), 5.)*smoothstep(.35, .6, g1 + g2*.5);
  col += (vec3(1., .55, .3)*wisp*1.3 + vec3(.2, 1., .9)*pow(rid(d*vec2(9., 6.) - uT*.03 + 4.), 7.)*smoothstep(.4, .7, g1)*.9);
  float pil = smoothstep(.62, .74, rid(vec2(d.x*4., d.y*1.6) + 6.))*smoothstep(-.6, .2, -d.y);
  col = mix(col, vec3(.02, .01, .015), pil*.9);
  col += vec3(1., .7, .4)*smoothstep(.74, .78, rid(vec2(d.x*4., d.y*1.6) + 6.))*smoothstep(.8, .74, rid(vec2(d.x*4., d.y*1.6) + 6.))*.0;
  return col*1.25*(1. + .25*uBeat);
}
// 3 · el núcleo de la galaxia: nubes de estrellas doradas y polvo oscuro que gira
vec3 coreScene(vec2 q){
  vec2 d = sceneD(q, .003);
  float a = .35 + uT*.03; d = mat2(cos(a), -sin(a), sin(a), cos(a))*d;
  float bul = exp(-dot(d*vec2(1.2, 2.6), d*vec2(1.2, 2.6))*2.2);
  float cl = fbm7(d*6. + 2.)*fbm7(d*14. - uT*.06);
  vec3 col = vec3(1., .72, .32)*bul*(.15 + 2.6*cl*cl*2.) + vec3(1., .5, .2)*exp(-length(d)*2.)*.18;
  float dust = clamp(smoothstep(.55, .78, rid(vec2(d.x*3.5, d.y*9.) + 2.))*exp(-pow(d.y/.22, 2.)) + smoothstep(.6, .8, rid(d*vec2(8., 14.) + 7.))*bul*.6, 0., 1.);
  col = mix(col, col*vec3(.18, .08, .05), dust);
  col += vec3(1., .95, .8)*starsD(q, 2.4, .7*bul, .8);
  return col;
}
// 4 · nebulosa de reflexión y cúmulo joven (como las Pléyades): bruma azul con estrellas que destellan
vec3 blueScene(vec2 q){
  vec2 d = sceneD(q, .005);
  vec2 w = d + .22*vec2(fbm(d*2. + uT*.1), fbm(d*2. + 5. - uT*.09));
  float haze = fbm7(w*3.) * fbm7(w*7. + 3.);
  vec3 col = vec3(.25, .5, 1.)*smoothstep(.15, .5, haze)*.9*(.5 + fbm(w*14.)) + vec3(.6, .3, 1.)*smoothstep(.3, .6, fbm(w*2.2 + 9.))*.35;
  // estrellas gigantes azules con picos de difracción
  vec2 g = (q + vec2(0., uFlow*2.))/(uScale*.22), id = floor(g), f = fract(g) - .5;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
    vec2 o = vec2(x, y), cid = id + o; if (h21(cid + 2.) > .55) continue;
    vec2 p = f - o - (h22(cid) - .5)*.6; float b = .5 + .5*sin(uT*2. + h21(cid)*30.);
    float k = exp(-length(p)*28.)*2. + (exp(-abs(p.x)*160.)*exp(-abs(p.y)*9.) + exp(-abs(p.y)*160.)*exp(-abs(p.x)*9.))*.9;
    col += vec3(.75, .88, 1.)*k*(.6 + .4*b);
  }
  return col;
}
// 5 · gas rojo con nubes oscuras recortadas (como la Cabeza de Caballo) y bordes encendidos
vec3 redScene(vec2 q){
  vec2 d = sceneD(q, .006);
  vec2 w = d + .13*vec2(fbm(d*2.5 + uT*.12), fbm(d*2.5 - uT*.11 + 2.));
  float glow = smoothstep(.38, .78, fbm7(w*2.4 + 4.))*(.4 + 1.*fbm7(w*12. + 1.));
  vec3 col = mix(vec3(.9, .1, .25), vec3(1., .45, .2), fbm(w*5.))*glow*1.1;
  float dk = fbm7(w*vec2(2., 3.2) + 12.) + .14*(fbm7(w*18. + 5.) - .5);
  float sil = smoothstep(.58, .61, dk)*smoothstep(-.2, .4, -d.y + .3*sin(d.x*2.));
  float rim = smoothstep(.5, .56, dk)*(1. - sil);
  col += vec3(1., .5, .55)*pow(rid(w*vec2(6., 9.) + uT*.05), 6.)*glow*1.2;
  col = mix(col, vec3(.01, .005, .01), sil) + vec3(1., .6, .35)*rim*glow*1.5;
  return col*.7*(1. + .3*uBeat);
}
float win(float j, float a, float b){ return smoothstep(a - .05, a + .05, j)*(1. - smoothstep(b - .05, b + .05, j)); }
// estrellas fugaces: unas cuantas cruzan el cielo de vez en cuando
vec3 meteors(vec2 q){
  vec3 c = vec3(0.);
  for (int i = 0; i < 3; i++){
    float fi = float(i), per = 5. + fi*2.3, tt = uT + fi*3.7, k = floor(tt/per), ph = fract(tt/per);
    if (ph > .18) continue;
    vec2 a0 = vec2(h21(vec2(k, fi)), .55 + .45*h21(vec2(fi, k + 3.)))*uRes;
    vec2 dir = normalize(vec2(-.8 + 1.6*h21(vec2(k + 9., fi)), -1.));
    vec2 hd = a0 + dir*ph/.18*uRes.y*.7;
    vec2 rel = q - hd; float along = dot(rel, -dir), perp = abs(dot(rel, vec2(-dir.y, dir.x)));
    float L = uRes.y*.18;
    float tr = step(0., along)*(1. - smoothstep(0., L, along))*exp(-perp*perp*.6);
    float fade = sin(ph/.18*3.14159);
    c += vec3(.85, .92, 1.)*tr*fade*.9 + vec3(1.)*exp(-dot(rel, rel)*.25)*fade;
  }
  return c;
}
uniform float uSpd;
// ---- capa final, igual para todos los niveles: lo que hace que "pegue" como un juego ----
vec3 hueRot(vec3 c, float a){ const vec3 k = vec3(.57735); float ca = cos(a); return c*ca + cross(k, c)*sin(a) + k*dot(k, c)*(1. - ca); }
// rayas de velocidad: al saltar, las estrellas se estiran desde el centro como en un salto al hiperespacio
vec3 warp(vec2 q0){
  vec2 d = q0 - .5*uRes; float r = length(d)/uRes.y, a = atan(d.y, d.x);
  float bins = 90., id = floor((a/6.2831 + .5)*bins), fa = fract((a/6.2831 + .5)*bins) - .5;
  float off = h21(vec2(id, 3.)), z = fract(log(r + .05)*1.6 - uFlow*.05 - uT*.25 + off*7.);
  float streak = smoothstep(.0, .05, z)*smoothstep(.35, .05, z)*exp(-fa*fa*60.)*step(.55, h21(vec2(id, 9.)));
  vec3 tint = mix(vec3(.7, .85, 1.), vec3(1., .75, .9), h21(vec2(id, 5.)));
  return tint*streak*smoothstep(.12, .45, r);
}
vec3 post(vec3 col, vec2 q0){
  float lum = dot(col, vec3(.3, .55, .15));
  col = max(vec3(0.), mix(vec3(lum), col, 1.3));                                   // colores más vivos sin perder lo natural
  float hA = .22*sin(uT*.11 + uJour*5.) + .1*sin(uT*.27);                           // la paleta se mece dentro de colores reales del espacio
  col = max(vec3(0.), hueRot(col, hA));
  col.g = min(col.g, max(col.r, col.b)*1.02 + .01);                                // en el espacio casi no hay verde: se evita que el color derive a verde
  col *= 1. + .32*uBeat;                                                             // todo late con la música
  col += warp(q0)*smoothstep(.25, .9, uSpd)*(1.3 + .6*uBeat);
  vec2 v = (q0 - .5*uRes)/uRes.y; float vg = dot(v, v);
  col *= 1. - .55*vg;                                                                // viñeta de cine
  float rp = length(q0 - uBH.xy)/uRes.y;
  col *= .82 - .5*exp(-pow(rp/.34, 2.));                                             // donde juegas el cielo se calla: los anillos mandan
  col += vec3(.25, .1, .35)*vg*.06*(1. + uBeat);                                     // un borde de color muy tenue
  return col;
}
void main(){
  vec2 q0 = gl_FragCoord.xy, ctr = .5*uRes;
  float ra = uT*.006, zb = 1. + .02*sin(uT*.25);                          // el cielo gira despacio y "respira"
  vec2 q = ctr + mat2(cos(ra), -sin(ra), sin(ra), cos(ra))*(q0 - ctr)/zb;
  // agujero de gusano: la luz se dobla a su alrededor (lente gravitacional: cada punto se ve más lejos del centro)
  float whIn = 0.;
  if (uWH.w > .001){ vec2 wd = q0 - uWH.xy; float wr = max(length(wd), 1.), te = uWH.z*1.05;
    if (wr > uWH.z) q -= (wd/wr)*(te*te/wr)*uWH.w; else { whIn = 1.; float l = wr/uWH.z; q = uWH.xy + wd*(1.45/sqrt(max(1. - l*l*.93, .05))); } }
  float j = uJour;
  float w1 = win(j, -1., .2), w2 = win(j, .2, .38), w3 = win(j, .38, .56), w4 = win(j, .56, .74), w5 = win(j, .74, .9);
  float out_ = smoothstep(.86, .98, j);
  vec3 col = vec3(.018, .016, .03);
  float body = 0.;
  // 1 · la banda de la Vía Láctea con los filamentos del Velo (violeta y magenta)
  if (w1 > .001){ vec3 mw = band(q, body); col += (mw*.4 + veil(q)*1.1)*w1; }
  if (w2 > .001) col += emission(q)*w2;
  if (w3 > .001) col += coreScene(q)*w3;
  if (w4 > .001) col += blueScene(q)*w4;
  if (w5 > .001) col += redScene(q)*w5;
  // estrellas en capas: lejanas lentas y cercanas rápidas
  col += starsD(q + vec2(0., uFlow*1.2), 2.6, mix(.05, .5, body*w1)*(1. - out_*.6), .55);
  col += starsD(q + vec2(0., uFlow*2.4), 5., .1, .9);
  col += starsD(q + vec2(0., uFlow*5.), 11., .09, 1.25);
  // estrellas brillantes con halo de color y picos suaves
  { vec2 g = (q + vec2(uT*3., uFlow*3.5))/(uScale*.16), id = floor(g), f = fract(g);
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
      vec2 o = vec2(x, y), cid = id + o; if (h21(cid + 17.) > .28) continue;
      vec2 pp = (f - o - h22(cid + 4.))*uScale*.16; float r2 = dot(pp, pp);
      vec3 sc = mix(vec3(1., .7, .45), vec3(.6, .78, 1.), h21(cid + 8.));
      float tw = .7 + .3*sin(uT*(2. + 3.*h21(cid)) + h21(cid)*20.);
      col += sc*(exp(-r2*.9)*1.4 + exp(-r2*.02)*.12 + (exp(-abs(pp.x)*1.2)*exp(-abs(pp.y)*.08) + exp(-abs(pp.y)*1.2)*exp(-abs(pp.x)*.08))*.08)*tw;
    } }
  col += meteors(q0);
  col += spiral(q)*out_*.85;
  vec2 bd = q - uBH.xy; float rb = length(bd);
  col += vec3(1., .45, .18)*.06*exp(-rb/(uRes.y*.4))*(1. - .7*j);
  col = post(col, q0);
  if (uWH.w > .001){
    float l = length(q0 - uWH.xy)/uWH.z, er = l - 1., ew = .0018 + .0006/max(uWH.z/120., .25);
    if (whIn > .5){ col = col*vec3(.8, .72, 1.2) + vec3(.03, .018, .08); col *= .62 + .55*smoothstep(1., .5, l); }   // la garganta: el mismo cielo, teñido
    // anillo de Einstein: la luz de detrás se amontona en el borde, con los colores un poco separados
    col += (vec3(1.)*exp(-er*er/ew)*.95 + vec3(1., .38, .72)*exp(-pow(er - .03, 2.)/ew)*.55 + vec3(.42, .78, 1.)*exp(-pow(er + .03, 2.)/ew)*.55 + vec3(.86, .9, 1.)*exp(-max(er, 0.)*7.)*.16)*uWH.w;
  }
  col = col/(1. + col*.5);
  gl_FragColor = vec4(col, 1.);
}`;

export { FS_MW };
