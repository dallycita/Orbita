// Galaxias lejanas: la Vía Láctea vista desde fuera, la capa final y main(); aquí se arma FS_GX
const GX_FINAL = `// la Vía Láctea vista desde fuera: el regreso a casa
vec3 homeGalaxy(vec2 q){
  vec2 d = (q - vec2(.5*uRes.x, .74*uRes.y))/(uScale*.36); d = rot(.4 + uT*.01)*d; d.y /= .6;
  float r = length(d), ph = atan(d.y, d.x);
  float arms = pow(.5 + .5*cos(2.*(ph - log(r + .02)*3.) + fbm(d*3.)*1.5), 3.);
  vec3 col = vec3(.6, .7, 1.)*arms*exp(-r*2.2)*(.5 + 1.4*fbm7(d*9.))*1.3 + vec3(1., .3, .5)*smoothstep(.75, .88, fbm7(d*14.))*arms*exp(-r*2.)*1.2;
  col += vec3(1., .85, .55)*(exp(-r*r*16.)*1.3 + exp(-pow(d.x/.3, 2.) - pow(d.y/.1, 2.))*.8);
  return col*smoothstep(1.3, .5, r);
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
  col = max(vec3(0.), mix(vec3(lum), col, 1.15));                                   // colores más vivos sin perder lo natural
  float hA = .06*sin(uT*.11 + uJour*5.) + .03*sin(uT*.27);                           // la paleta se mece dentro de colores reales del espacio
  col = max(vec3(0.), hueRot(col, hA));
  col.g = min(col.g, (col.r + col.b)*.5 + .15*max(col.r, col.b));                                // en el espacio casi no hay verde: se evita que el color derive a verde
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
  float ra = uT*.006, zb = 1. + .02*sin(uT*.25);
  vec2 q = ctr + rot(ra)*(q0 - ctr)/zb;
  float whIn = 0.;   // agujero de gusano: lente gravitacional, y dentro el mismo cielo ampliado
  if (uWH.w > .001){ vec2 wd = q0 - uWH.xy; float wr = max(length(wd), 1.), te = uWH.z*1.05;
    if (wr > uWH.z) q -= (wd/wr)*(te*te/wr)*uWH.w; else { whIn = 1.; float l = wr/uWH.z; q = uWH.xy + wd*(1.45/sqrt(max(1. - l*l*.93, .05))); } }
  vec2 qf = ctr + (q - ctr)*1.7;
  float j = uJour;
  float w1 = win(j, -1., .22), w2 = win(j, .22, .44), w3 = win(j, .44, .64), w4 = win(j, .64, .86);
  float out_ = smoothstep(.84, .96, j);
  vec3 col = vec3(.014, .015, .026);
  if (uKind < 3.5){
    if (w1 > .001) col += cenBody(q)*w1; if (w2 > .001) col += cenLane(q)*w2; if (w3 > .001) col += cenJet(q)*w3; if (w4 > .001) col += cenLobes(q)*w4;
    if (out_ > .001) col += cenLobes(qf)*out_;
  } else if (uKind < 4.5){
    float a1 = win(j, -1., .18), a2 = win(j, .18, .38), a3 = win(j, .38, .55), a4 = win(j, .55, .72), a5 = win(j, .72, .88);
    if (a1 > .001) col += m51Full(q)*a1; if (a2 > .001) col += m51ArmFly(q)*a2; if (a3 > .001) col += m51Nebula(q)*a3; if (a4 > .001) col += m51Dust(q)*a4; if (a5 > .001) col += m51Bridge(q)*a5;
    if (out_ > .001) col += m51Full(qf)*out_;
    col = max(vec3(0.), mix(vec3(dot(col, vec3(.3, .55, .15))), col, 1.25))*1.12;   // el Remolino es de los más coloridos: más saturado
  } else if (uKind < 5.5){
    if (w1 > .001) col += sombBody(q)*w1; if (w2 > .001) col += sombRing(q)*w2; if (w3 > .001) col += sombGlobs(q)*w3; if (w4 > .001) col += sombCore(q)*w4;
    if (out_ > .001) col += sombBody(qf)*out_;
  } else if (uKind < 6.5){
    if (w1 > .001) col += m87Halo(q)*w1; if (w2 > .001) col += m87Jet(q)*w2; if (w3 > .001) col += m87Gas(q)*w3; if (w4 > .001) col += m87Shadow(q)*w4;
    if (out_ > .001) col += m87Halo(qf)*out_;
  } else {
    if (w1 > .001) col += sgrComposite(q)*w1; if (w2 > .001) col += sgrFilaments(q)*w2; if (w3 > .001) col += sgrStars(q)*w3; if (w4 > .001) col += sgrShadow(q)*w4;
    if (out_ > .001) col += homeGalaxy(q)*out_;
  }
  col *= .9;
  if (uKind < 3.5 || uKind > 4.5) col += deepField(q, uKind > 6.5 ? 1.1 : 1.);
  col += starsD(q + vec2(0., uFlow*1.2), 2.6, .12, .55);
  col += starsD(q + vec2(0., uFlow*2.4), 5., .1, .9);
  col += starsD(q + vec2(0., uFlow*5.), 11., .09, 1.25);
  col += meteors(q0) + flares(q);
  float tr = exp(-pow((j - .22)/.015, 2.)) + exp(-pow((j - .44)/.015, 2.)) + exp(-pow((j - .64)/.015, 2.)) + exp(-pow((j - .86)/.015, 2.));
  col += vec3(.9, .85, 1.)*tr*.18*(.6 + .4*fbm(q0/uRes.y*3. + uT));
  col += bokeh(q0);
  col += vec3(1., .45, .18)*.05*exp(-length(q0 - uBH.xy)/(uRes.y*.4));
  col = post(col, q0);
  if (uWH.w > .001){
    float l = length(q0 - uWH.xy)/uWH.z, er = l - 1., ew = .0018 + .0006/max(uWH.z/120., .25);
    if (whIn > .5){ col = col*vec3(.8, .72, 1.2) + vec3(.03, .018, .08); col *= .62 + .55*smoothstep(1., .5, l); }
    col += (vec3(1.)*exp(-er*er/ew)*.95 + vec3(1., .38, .72)*exp(-pow(er - .03, 2.)/ew)*.55 + vec3(.42, .78, 1.)*exp(-pow(er + .03, 2.)/ew)*.55 + vec3(.86, .9, 1.)*exp(-max(er, 0.)*7.)*.16)*uWH.w;
  }
  col = col/(1. + col*.5);
  gl_FragColor = vec4(col, 1.);
}`;
// Centaurus A, Remolino, Sombrero, M87 y Sagitario A*: escenas reales con los tonos medidos en fotos de Hubble, ESO, Webb y el EHT
const FS_GX = BG_COMMON + GX_BASE + GX_CENTAURUS + GX_REMOLINO + GX_SOMBRERO + GX_M87 + GX_SAGITARIO + GX_FINAL;
