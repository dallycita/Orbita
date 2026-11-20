// ┌─ 32-fondos-2-andromeda.js
// │ da:     FS_AND, FS_AND2
// │ lo usan: 32-fondos-9-motor
// │ usa 32-fondos-1-comun: BG_COMMON
// └─ generado por `node build.mjs --deps`; no se edita a mano
// Andrómeda (nivel 3): el shader de la galaxia vista desde dentro
// Andrómeda: disco inclinado ~77°, núcleo de estrellas viejas, brazos azules, franjas de polvo, regiones rosadas, M32 y M110
const FS_AND = BG_COMMON + `
uniform float uScale; uniform float uSpd; uniform float uBand;   // 0 visible · 1 ultravioleta · 2 infrarrojo · 3 todas las luces
vec2 galC(){ return vec2((mix(.62, .5, uJour) + .03*sin(uT*.045))*uRes.x, (mix(-.32, .34, uJour) + .015*cos(uT*.037))*uRes.y); }
vec3 galaxy(vec2 q){
  vec2 c = galC(); float S = uScale*(1.25 + .35*uJour);    // la galaxia es enorme: la vas recorriendo de las afueras al núcleo
  float a = -1.2 + uJour*.35 + .08*sin(uT*.045);                               // casi vertical: subes a lo largo de la galaxia; la cámara la rodea despacio
  vec2 d = (q - c)/S; d = mat2(cos(a), -sin(a), sin(a), cos(a))*d; d.y /= .26 + uJour*.08 + .05*sin(uT*.03 + 1.);   // inclinación real ~77°
  float r0 = length(d), rot = uT*(.03 + .012/(r0 + .3));                       // todo el disco gira (una vuelta por minuto, acelerado para que se vea)
  d = mat2(cos(rot), sin(rot), -sin(rot), cos(rot))*d;
  float r = length(d), ph = atan(d.y, d.x);
  float tw = fbm(d*2.2 + 5.)*1.6;                                             // los brazos de Andrómeda son irregulares, casi anillos rotos
  float arm = 2.*(ph - log(r + .02)/.32) + tw;
  float arms = .5 + .5*cos(arm);
  float clump = .55 + .9*fbm(d*9. + 1.3);                                     // nubes de estrellas
  float disk = exp(-r/.38)*(.25 + .75*pow(arms, 2.2))*clump;
  float halo = exp(-r/.9)*.05;
  float bulge = exp(-pow(r/.06, .65))*1.9 + exp(-r/.14)*.35;
  float lane = smoothstep(.45, .92, .5 + .5*cos(arm - .7));                   // franjas de polvo por dentro de los brazos
  float dust = lane*smoothstep(.05, .16, r)*exp(-r/1.1)*(.5 + .9*fbm(d*11. + 7.));
  dust *= 1. + .6*smoothstep(0., .4, -d.y);                                   // más marcadas del lado cercano, como en las fotos
  float hii = smoothstep(.7, .86, fbm(d*26. + 3.))*pow(arms, 3.)*smoothstep(.15, .3, r)*(1. - smoothstep(.55, .85, r));   // solo dentro de los brazos
  // luz visible: núcleo dorado de estrellas viejas, brazos azulados, polvo oscuro
  vec3 vis = vec3(.5, .62, 1.)*disk + vec3(.75, .8, 1.)*halo + vec3(1., .86, .62)*bulge + vec3(1., .38, .62)*hii*2.4;
  vis *= 1. - .85*clamp(dust, 0., 1.);
  vis += vec3(.35, .18, .08)*dust*exp(-r/.25)*.4;
  // ultravioleta (como GALEX): brillan las estrellas jóvenes de los brazos; el núcleo viejo casi se apaga
  vec3 uv = vec3(.45, .55, 1.25)*disk*pow(arms, .8)*1.3 + vec3(.7, .75, 1.)*hii*2.8 + vec3(.5, .5, .9)*bulge*.22;
  uv *= 1. - .5*clamp(dust, 0., 1.);
  // infrarrojo (como Spitzer): el polvo que antes tapaba la luz ahora brilla, en anillos naranjas
  float ring10 = exp(-pow((r - .42)/.1, 2.))*.9 + exp(-pow((r - .2)/.05, 2.))*.4;
  float dustIR = lane*smoothstep(.05, .16, r)*exp(-r/1.1)*(.5 + .9*fbm(d*11. + 7.));
  vec3 ir = vec3(1., .4, .1)*(dustIR*1.5 + ring10*(.35 + .7*clump))*.55 + vec3(1., .75, .3)*hii*2.5 + vec3(.8, .35, .15)*bulge*.35 + vec3(.5, .2, .08)*disk*.3;
  // pesos suaves entre las luces
  float b = uBand;
  float w0 = max(0., 1. - abs(b)), w1 = max(0., 1. - abs(b - 1.)), w2 = max(0., 1. - abs(b - 2.)), w3 = max(0., 1. - abs(b - 3.));
  vec3 col = vis*w0 + uv*w1 + ir*w2 + (vis*.85 + ir*.4 + uv*.35)*w3*1.1;
  vec2 m32 = (q - c - vec2(.11, .13)*S)/S; col += vec3(1., .9, .75)*exp(-dot(m32, m32)/.0005)*.9;
  vec2 m110 = (q - c - vec2(.18, .62)*S)/S; m110.y /= .5;   // M110 aparece al principio del camino y la dejas atrás col += vec3(1., .9, .78)*exp(-dot(m110, m110)/.006)*.35;
  return col;
}
// capas que vienen hacia ti desde el punto al que viajas (como volar entre las estrellas)
float starDot(vec2 sp, float sz){
  vec2 id = floor(sp), f = fract(sp); float n = h21(id); if (n > .35) return 0.;
  vec2 o = .2 + .6*h22(id*1.3); float dd = length(f - o);
  return exp(-dd*dd/(sz*sz))*(.4 + .6*h21(id + 5.));
}
vec3 flyStars(vec2 q, vec2 vp){
  vec3 c = vec3(0.); vec2 u = (q - vp)/uRes.y;
  for (int i = 0; i < 4; i++){
    float z = fract(float(i)*.25 + uFlow*.11);                     // cada capa se acerca y se recicla
    float sc = 22.*pow(.03, z), fade = smoothstep(0., .3, z)*smoothstep(1., .85, z);
    float sz = (.5 + 1.3*z)*sc/uRes.y, blur = (.02 + .45*z*z)*uSpd;   // tamaño en píxeles reales: puntos, no manchas           // al ir rápido, las estrellas se alargan
    float acc = 0.;
    for (int k = 0; k < 5; k++){ float kk = float(k)/4.; acc += starDot((u*(1. - blur*kk))*sc + float(i)*17.3, sz); }
    c += mix(vec3(1., .86, .72), vec3(.75, .85, 1.), h21(vec2(float(i), 9.)))*acc*.45*fade*(.5 + 1.2*z);
    if (z > .55){ vec2 sp = u*sc + float(i)*17.3, id = floor(sp), f = fract(sp); if (h21(id) < .06){ vec2 o = .2 + .6*h22(id*1.3), e = (f - o)*uRes.y/sc;
      float spike = exp(-abs(e.x)*.9)*exp(-abs(e.y)*.05) + exp(-abs(e.y)*.9)*exp(-abs(e.x)*.05); c += vec3(.85, .9, 1.)*spike*.35*fade*z; } }
  }
  return c;
}
vec3 flyDust(vec2 q, vec2 vp){
  vec3 c = vec3(0.); vec2 u = (q - vp)/uRes.y;
  for (int i = 0; i < 3; i++){
    float z = fract(float(i)/3. + uFlow*.05);
    float sc = mix(5., .5, z), fade = smoothstep(0., .4, z)*smoothstep(1., .7, z);
    vec2 p = u*sc + float(i)*9.1;
    float n = fbm(p + fbm(p*1.7 + uT*.02)*1.2);
    vec3 tint = mix(vec3(.2, .26, .6), vec3(.5, .25, .5), h21(vec2(float(i), 3.)));
    tint = mix(tint, vec3(.25, .3, .85), clamp(1. - abs(uBand - 1.), 0., 1.)); tint = mix(tint, vec3(.7, .3, .12), clamp(1. - abs(uBand - 2.), 0., 1.));
    c += tint*pow(n, 3.6)*fade*.45;
  }
  return c;
}
void main(){
  vec2 q = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 dr = vec2(sin(uT*.07), cos(uT*.05))*uRes.y*.015;
  float A1, A2, A3; vec2 L1 = lens(q + dr*.3, A1), L2 = lens(q + dr, A2), L3 = lens(q + dr*2., A3);
  vec2 vp = galC(); vp.y = max(vp.y, -.15*uRes.y);                    // las estrellas vienen desde arriba: vas subiendo
  vec3 col = vec3(.006, .007, .02) + vec3(.015, .012, .035)*(1. - q.y/uRes.y);
  col += stars(L1 + vec2(0., -uJour*uRes.y*.35), 7., .5)*.45*A1;   // hasta las estrellas lejanas bajan un poco: subes                                      // estrellas muy lejanas (casi quietas)
  col += galaxy(L2)*A2;                                                 // la galaxia, que se acerca y gira
  col += flyDust(L3, vp)*A3;                                            // nubes que pasan a tu lado
  col += flyStars(L3, vp)*A3;                                           // estrellas que pasan a tu lado
  // el núcleo brilla más allá de su borde (como en una foto de larga exposición)
  vec2 gc = galC(); float gd = length(q - gc)/uRes.y;
  vec3 glowC = mix(mix(vec3(1., .85, .62), vec3(.6, .65, 1.), clamp(1. - abs(uBand - 1.), 0., 1.)), vec3(1., .5, .2), clamp(1. - abs(uBand - 2.), 0., 1.));
  col += glowC*.18*exp(-gd*7.)*(.6 + .4*uJour)*(1. - .6*clamp(1. - abs(uBand - 1.), 0., 1.));
  col *= 1. + uBeat*.08;
  col = 1. - exp(-col*1.35);                                                  // tono suave
  col = mix(col, col*col*(3. - 2.*col), .35);                                  // contraste profundo
  vec2 uv = q/uRes; float vig = smoothstep(1.15, .35, length((uv - .5)*vec2(1.1, .9)));
  col *= .55 + .45*vig;                                                        // bordes oscurecidos
  col += (h21(q + fract(uT*7.3)*91.) - .5)*.035;                               // grano de cámara
  gl_FragColor = vec4(pow(max(col, 0.), vec3(.95)), 1.);
}`;
// Andrómeda: el viaje pasa por sus lugares reales, de las afueras al núcleo
const FS_AND2 = BG_COMMON + `
uniform float uScale;
float fbm7(vec2 p){ float s = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 7; i++){ s += a*vn(p); p = m*p; a *= .5; } return s; }
float rid(vec2 p){ float s = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 5; i++){ s += a*(1. - abs(vn(p)*2. - 1.)); p = m*p; a *= .5; } return s; }
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
vec2 sceneD(vec2 q, float drift){ return (q - .5*uRes)/uScale + vec2(.05*sin(uT*.05 + drift*300.), .07*sin(uFlow*drift*1.5 + uT*.04)); }   // se mece sin irse de la pantalla
float win(float j, float a, float b){ return smoothstep(a - .05, a + .05, j)*(1. - smoothstep(b - .05, b + .05, j)); }
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
mat2 rot(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a)); }
vec3 bokeh(vec2 q){
  vec3 c = vec3(0.); vec2 g = (q + vec2(uT*14., uFlow*9.))/(uRes.y*.22), id = floor(g), f = fract(g);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
    vec2 o = vec2(x, y), cid = id + o; if (h21(cid + 31.) > .22) continue;
    float rr = .12 + .2*h21(cid + 5.); float dd = length(f - o - h22(cid + 9.));
    vec3 tint = mix(vec3(1., .4, .65), vec3(.45, .7, 1.), h21(cid + 2.));
    c += tint*smoothstep(rr, rr*.75, dd)*(.05 + .04*sin(uT + h21(cid)*20.));
  }
  return c;
}
vec3 flares(vec2 q){
  vec3 c = vec3(0.); vec2 g = (q + vec2(0., uFlow*3.))/(uRes.y*.3), id = floor(g), f = fract(g);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
    vec2 o = vec2(x, y), cid = id + o; float per = 3. + 5.*h21(cid + 3.), ph = fract(uT/per + h21(cid + 7.));
    if (ph > .12) continue;
    float e = sin(ph/.12*3.14159); vec2 pp = (f - o - h22(cid))*uRes.y*.3;
    vec3 tint = mix(vec3(1., .8, .6), vec3(.7, .85, 1.), h21(cid + 1.));
    c += tint*e*(exp(-dot(pp, pp)*.08)*2. + (exp(-abs(pp.x)*.9)*exp(-abs(pp.y)*.04) + exp(-abs(pp.y)*.9)*exp(-abs(pp.x)*.04))*.5);
  }
  return c;
}
// un disco espiral inclinado (Andrómeda está casi de canto: ~77°)
vec3 disk(vec2 d, float tilt, float bright){
  vec2 e = d; e.y /= tilt; float r = length(e), a = atan(e.y, e.x);
  float sp = a - log(r + .03)*3.4 - uT*.03;
  float arms = pow(.5 + .5*cos(2.*sp + fbm(e*3.)*2.), 2.5)*smoothstep(.05, .2, r);
  float ring = exp(-pow((r - .55)/.12, 2.));
  float cl = fbm7(e*8. + 2.);
  vec3 col = vec3(.5, .65, 1.)*(arms + ring*.9)*exp(-r*1.4)*(.4 + 1.8*cl);
  col += vec3(1., .3, .5)*smoothstep(.7, .84, fbm7(e*11. + 5.))*(arms + ring)*exp(-r*1.2)*1.3;
  col += vec3(1., .86, .62)*exp(-r*r*14.)*1.2;
  col *= .45 + 1.1*fbm7(e*24. + 7.);
  col *= 1. - .75*smoothstep(.55, .78, rid(vec2(sp*1.2, r*9.) + 3.))*smoothstep(.08, .3, r)*exp(-r*.8);
  return col*bright;
}
// 1 · las afueras: los brazos azules y polvo, con la galaxia ocupando todo el cielo
vec3 outer(vec2 q){
  vec2 d = rot(-.55 + uT*.008)*(sceneD(q, .003) - vec2(.15, .35));
  return disk(d*.75, .3, 1.3) + vec3(.9, .94, 1.)*starsD(q, 2.4, .5*exp(-length(d)*1.5), .7);
}
// 2 · NGC 206: la nube de estrellas jóvenes más grande de Andrómeda, azul y llena de destellos
vec3 ngc206(vec2 q){
  vec2 d = sceneD(q, .004) - vec2(-.05, .22);
  vec2 w = d + .1*vec2(fbm(d*3. + uT*.08), fbm(d*3. - uT*.07 + 4.));
  float cloud = exp(-length(w*vec2(1., 1.6))*3.)*(.3 + 1.4*fbm7(w*7. + 1.));
  vec3 col = vec3(.35, .6, 1.)*cloud*1.1 + vec3(.6, .45, 1.)*smoothstep(.55, .8, fbm7(w*4. + 6.))*cloud*.5;
  col += vec3(1., .35, .55)*smoothstep(.76, .88, fbm7(w*14. + 3.))*cloud*1.6;
  col += vec3(.8, .9, 1.)*starsD(q, 1.9, .95*clamp(cloud*1.5, 0., 1.), 1.5) + vec3(.6, .8, 1.)*starsD(q, 4.5, .55*clamp(cloud*1.4, 0., 1.), 2.6);
  col *= 1. - .6*smoothstep(.62, .82, rid(w*vec2(6., 10.) + 9.))*smoothstep(.1, .5, cloud);
  return col*(1. + .2*uBeat);
}
// 3 · M32: la pequeña galaxia elíptica que pasa rozando y arranca estrellas del disco
vec3 m32(vec2 q){
  vec2 d = sceneD(q, .004);
  vec3 col = disk(rot(-.9)*(d - vec2(-.3, .5))*.6, .28, .7);
  vec2 m = d - vec2(.12 + .05*sin(uT*.15), .28);
  float r = length(m*vec2(1., 1.25));
  col += vec3(1., .85, .6)*(exp(-r*r*220.)*1.6 + exp(-r*12.)*.5);
  vec2 tt = rot(.5)*m; float tail = exp(-pow(tt.y/(.03 + .1*abs(tt.x)), 2.))*exp(-abs(tt.x)*3.)*fbm7(tt*8. - vec2(uT*.1, 0.));
  col += vec3(1., .8, .6)*tail*.8;
  col += vec3(1., .9, .75)*starsD(q, 2.2, .8*exp(-r*7.), 1.);
  return col;
}
// 4 · el anillo de fuego: así se ve Andrómeda en infrarrojo, anillos de polvo encendido
vec3 fireRing(vec2 q){
  vec2 d = rot(-.5 + uT*.01)*(sceneD(q, .003) - vec2(0., .2)); d.y /= .42;
  float r = length(d), a = atan(d.y, d.x);
  float g = fbm7(vec2(a*4., r*10.) + uT*.06);
  float rings = exp(-pow((r - .45 - .03*sin(a*3.))/.05, 2.))*1.4 + exp(-pow((r - .22)/.03, 2.))*.7 + exp(-pow((r - .75)/.07, 2.))*.5;
  vec3 col = mix(vec3(1., .22, .08), vec3(1., .7, .25), g)*rings*(.4 + 1.4*g);
  col += vec3(1., .5, .2)*pow(rid(vec2(a*6., r*14.) + uT*.05), 6.)*rings*1.2;
  col += vec3(.6, .15, .1)*exp(-r*2.)*fbm7(d*5.)*.4;
  col += vec3(1., .85, .6)*exp(-r*r*60.)*.9;
  return col*(1. + .3*uBeat);
}
// 5 · el núcleo: bulbo dorado, el doble núcleo y el viento que sopla el agujero negro (en rayos X, violeta)
vec3 core(vec2 q){
  vec2 d = sceneD(q, .002) - vec2(0., .26);
  float r = length(d*vec2(1., 1.3));
  vec3 col = vec3(1., .78, .45)*exp(-r*6.5)*(.4 + 1.1*fbm7(d*9. + uT*.05));
  col += vec3(1., .95, .8)*(exp(-dot(d - vec2(.015, 0.), d - vec2(.015, 0.))*3000.) + exp(-dot(d + vec2(.015, 0.), d + vec2(.015, 0.))*2200.)*.8)*1.6;
  vec2 rr = rot(uT*.02)*d; float a = atan(rr.y, rr.x);
  float wind = pow(.5 + .5*cos(a*2.), 6.)*exp(-r*3.)*fbm7(d*6. - uT*.1)*(1. + .5*sin(uT*1.5 - r*30.));
  col += vec3(.65, .35, 1.)*wind*2.6;
  for (int i = 0; i < 3; i++){ float ph = fract(uT*.2 + float(i)/3.); col += vec3(.8, .6, 1.)*exp(-pow((r - ph*.5)/.01, 2.))*(1. - ph)*.6; }
  col += vec3(1., .9, .7)*starsD(q, 2., .9*exp(-r*5.), 1.2);
  return col;
}
// salida: Andrómeda y la Vía Láctea, que dentro de 4500 millones de años chocarán
vec3 collide(vec2 q){
  vec2 d = (q - .5*uRes)/uScale;
  vec3 col = disk(rot(-.6)*(d - vec2(-.18, .36))*2.6, .32, 1.) + disk(rot(.9 + uT*.01)*(d - vec2(.22, .28))*3.4, .7, .85);
  return col;
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
  float ra = uT*.006, zb = 1. + .02*sin(uT*.25);
  vec2 q = ctr + rot(ra)*(q0 - ctr)/zb;
  float j = uJour;
  float w1 = win(j, -1., .18), w2 = win(j, .18, .36), w3 = win(j, .36, .54), w4 = win(j, .54, .72), w5 = win(j, .72, .88);
  float out_ = smoothstep(.85, .97, j);
  vec3 col = vec3(.016, .018, .036);
  if (w1 > .001) col += outer(q)*w1;
  if (w2 > .001) col += ngc206(q)*w2;
  if (w3 > .001) col += m32(q)*w3;
  if (w4 > .001) col += fireRing(q)*w4;
  if (w5 > .001) col += core(q)*w5;
  col += starsD(q + vec2(0., uFlow*1.2), 2.6, .12, .55);
  col += starsD(q + vec2(0., uFlow*2.4), 5., .1, .9);
  col += starsD(q + vec2(0., uFlow*5.), 11., .09, 1.25);
  col += meteors(q0) + flares(q);
  float wave = (q0.x*.6 + q0.y)/uRes.y*3. - uT*.5;
  col *= 1. + .2*vec3(sin(wave), sin(wave + 2.1), sin(wave + 4.2));
  float tr = exp(-pow((j - .18)/.015, 2.)) + exp(-pow((j - .36)/.015, 2.)) + exp(-pow((j - .54)/.015, 2.)) + exp(-pow((j - .72)/.015, 2.)) + exp(-pow((j - .88)/.015, 2.));
  col += vec3(.9, .85, 1.)*tr*.18*(.6 + .4*fbm(q0/uRes.y*3. + uT));
  col += bokeh(q0);
  col += collide(q)*out_;
  col += vec3(1., .45, .18)*.05*exp(-length(q0 - uBH.xy)/(uRes.y*.4));
  col = post(col, q0);
  col = col/(1. + col*.5);
  gl_FragColor = vec4(col, 1.);
}`;
