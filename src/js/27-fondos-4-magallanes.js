// Nubes de Magallanes (nivel 2)
// Nubes de Magallanes: el viaje pasa por sus lugares reales
const FS_LMC = BG_COMMON + `
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
// polvo luminoso en primer plano, desenfocado, que pasa flotando (da profundidad)
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
// estrellas que estallan en un destello de vez en cuando
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
float tone(vec3 c){ return dot(c, vec3(.3, .55, .15)); }
// 1 · la Gran Nube: galaxia irregular, barra de estrellas descentrada, nubes de estrellas y regiones rosadas
vec3 lmcBody(vec2 q){
  vec2 d = rot(.45 + uT*.01)*(sceneD(q, .003) - vec2(0., .18));
  vec2 w = d + .1*vec2(fbm(d*2. + uT*.05), fbm(d*2. + 4. - uT*.04));
  float disk = exp(-length(w*vec2(1., 1.5))*2.)*smoothstep(.2, .55, fbm7(w*2.2 + 1.));
  float bar = exp(-pow((w.x + .12)/.45, 2.) - pow((w.y - .05)/.1, 2.));
  float cl = fbm7(w*7. + 3.)*fbm7(w*16. - uT*.04);
  vec3 col = vec3(.5, .66, 1.)*disk*(.35 + 3.2*cl) + vec3(1., .8, .55)*bar*(.7 + 2.4*cl);
  float h2 = smoothstep(.74, .86, fbm7(w*8. + 9.))*(disk + bar);
  col += vec3(1., .28, .5)*h2*1.8 + vec3(1., .3, .5)*pow(rid(w*9. + uT*.05), 7.)*disk*1.2;
  col *= 1. - .55*smoothstep(.62, .8, rid(w*vec2(5., 9.) + 2.))*(disk + bar);
  col += vec3(.9, .94, 1.)*starsD(q, 2.3, .75*clamp(disk + bar, 0., 1.), .7);
  return col;
}
// 2 · la Nebulosa de la Tarántula (30 Doradus): filamentos rosados que salen de un cúmulo azul gigante (R136)
vec3 tarantula(vec2 q){
  vec2 d = rot(uT*.015)*(sceneD(q, .004) - vec2(-.05, .26));
  vec2 w = d + .08*vec2(fbm(d*3. + uT*.08), fbm(d*3. - uT*.07 + 5.));
  float r = length(w), a = atan(w.y, w.x);
  float legs = pow(rid(vec2(a*2.2 + r*2.5, r*5.) + uT*.03), 3.);
  float fil = pow(rid(w*vec2(7., 9.) + 3. + uT*.05), 6.);
  float env = exp(-r*2.2)*smoothstep(.06, .2, r);
  float gas = fbm7(w*4. + 2.);
  vec3 col = vec3(1., .3, .55)*(legs*2.2 + fil*1.8)*env*(.5 + gas) + vec3(1., .55, .35)*fil*env*.6;
  col += vec3(.95, .2, .3)*gas*exp(-r*1.5)*.45;
  col += vec3(.3, .95, .85)*smoothstep(.45, .8, gas)*exp(-r*4.)*.7;
  col += vec3(.8, .9, 1.)*exp(-r*r*900.)*1.6 + vec3(.6, .8, 1.)*exp(-r*22.)*.25;
  float rays = pow(.5 + .5*cos(a*9. + fbm(vec2(a*2., uT*.2))*5.), 4.)*exp(-r*5.)*smoothstep(.01, .06, r);
  col += vec3(.75, .85, 1.)*rays*(.3 + .15*sin(uT*.8));
  float sw = fract(uT*.22); col += vec3(1., .55, .75)*exp(-pow((r - sw*.7)/.012, 2.))*(1. - sw)*.9;
  col += vec3(.85, .92, 1.)*starsD(q, 2., .9*exp(-r*7.), 1.4);
  return col*(1. + .25*uBeat);
}
// 3 · la superburbuja N44: un anillo de gas inflado por vientos de estrellas jóvenes
vec3 bubble(vec2 q){
  vec2 d = sceneD(q, .005) - vec2(.04, .24);
  vec2 w = d + .06*vec2(fbm(d*4. + uT*.08), fbm(d*4. - uT*.08 + 2.));
  float r = length(w*vec2(1., 1.15))*(1. - .04*sin(uT*.9)), wob = .04*(fbm(vec2(atan(w.y, w.x)*2., uT*.1)) - .5);
  float ring = exp(-pow((r - .22 - wob)/.035, 2.))*(.5 + fbm7(vec2(atan(w.y, w.x)*3., r*9.)));
  float shell = exp(-pow((r - .22 - wob)/.1, 2.));
  float gas = fbm7(w*6. + 4.);
  vec3 col = vec3(1., .3, .5)*ring*(.6 + 1.4*gas)*1.3 + vec3(.9, .25, .35)*shell*gas*.5;
  col += vec3(.25, .85, .9)*smoothstep(.24, .0, r)*fbm7(w*5. + uT*.05)*.5;
  col += vec3(1., .5, .6)*pow(rid(w*8. + uT*.04), 6.)*shell*1.2;
  vec2 b2 = w - vec2(.45, -.3); float r2 = length(b2);
  col += vec3(1., .35, .55)*exp(-pow((r2 - .12)/.03, 2.))*(.5 + gas)*.9;
  float sw = fract(uT*.18); col += vec3(.4, 1., .9)*exp(-pow((r - sw*.22)/.01, 2.))*(1. - sw)*.7;
  col += vec3(.85, .92, 1.)*starsD(q, 2.4, .8*smoothstep(.24, .0, r), 1.2);
  return col*(1. + .25*uBeat);
}
// 4 · la Supernova 1987A: el anillo de perlas brillantes y dos anillos tenues; a un lado, los restos de N49
vec3 supernova(vec2 q){
  vec2 d = sceneD(q, .004);
  vec2 c = (d - vec2(-.12, .3))*1.9;
  vec2 e = rot(.35)*c; e.y /= .55;
  float r = length(e), a = atan(e.y, e.x);
  float beads = pow(.5 + .5*cos(a*16. + uT*.4), 6.);
  float ring = exp(-pow((r - .16)/.01, 2.));
  vec3 col = vec3(1., .9, .8)*ring*(.25 + 2.4*beads) + vec3(1., .6, .5)*exp(-pow((r - .16)/.05, 2.))*.18;
  vec2 e2 = e - vec2(0., .26), e3 = e + vec2(0., .26);
  col += vec3(1., .4, .55)*(exp(-pow((length(e2) - .2)/.01, 2.)) + exp(-pow((length(e3) - .2)/.01, 2.)))*.28;
  col += vec3(1., .5, .4)*exp(-r*r*900.)*(1.2 + .8*sin(uT*3.)) + vec3(1., .3, .4)*exp(-r*18.)*.25;
  for (int i = 0; i < 3; i++){ float ph = fract(uT*.15 + float(i)/3.); col += vec3(1., .75, .6)*exp(-pow((r - ph*.6)/.008, 2.))*(1. - ph)*.8; }
  vec2 n = d - vec2(.35, -.35); float rn = length(n);
  float shell = exp(-pow((rn - .2)/.08, 2.))*pow(rid(n*vec2(9., 11.) + uT*.06), 4.);
  col += (vec3(1., .3, .5)*shell*1.6 + vec3(.4, .7, 1.)*pow(rid(n*12. - uT*.05 + 7.), 7.)*exp(-pow((rn - .2)/.1, 2.))*1.2)*(1. + .3*uBeat);
  col += vec3(.55, .65, 1.)*fbm7(d*3. + uT*.02)*.12;
  return col;
}
// 5 · el Puente de Magallanes y la Pequeña Nube con NGC 346
vec3 bridge(vec2 q){
  vec2 d = sceneD(q, .005);
  vec2 b = rot(-.7)*d; float v = b.y + .08*sin(b.x*3. + uT*.2) + .06*(fbm(vec2(b.x*2., uT*.05)) - .5);
  float stream = exp(-pow(v/.14, 2.))*fbm7(vec2(b.x*3., v*7.) + vec2(uT*.05, 0.));
  vec3 col = vec3(.45, .58, .95)*stream*1.1 + vec3(.7, .6, .9)*pow(rid(vec2(b.x*4., v*12.) + uT*.03), 6.)*exp(-pow(v/.16, 2.))*.8;
  vec2 s = d - vec2(.32, .3); s = rot(.6)*s;
  float smc = exp(-length(s*vec2(1., 2.2))*5.)*(.4 + 1.2*fbm7(s*9. + 1.));
  col += vec3(.75, .82, 1.)*smc*.9;
  float ng = exp(-length(s - vec2(.04, .02))*24.);
  col += vec3(1., .35, .55)*ng*(.6 + fbm7(s*30. + uT*.1))*1.4;
  col += vec3(.85, .9, 1.)*starsD(q, 2.2, .7*clamp(smc*2. + stream*.4, 0., 1.), .9);
  return col;
}
// salida: desde lejos, las dos nubes y la Vía Láctea al fondo, como en la foto del cielo austral
vec3 farView(vec2 q){
  vec2 d = (q - .5*uRes)/uScale;
  vec2 l = d - vec2(-.16, .3), s = d - vec2(.22, .4);
  float L = exp(-length(rot(.4)*l*vec2(1., 1.7))*7.)*(.2 + 1.4*fbm7(l*9. + 2.)*fbm7(l*20.));
  float S = exp(-length(rot(.8)*s*vec2(1., 1.6))*12.)*(.3 + 1.2*fbm7(s*12. + 6.));
  vec3 col = vec3(.8, .86, 1.)*L*2. + vec3(1., .3, .5)*smoothstep(.66, .8, fbm7(l*14.))*L*2.4 + vec3(.8, .86, 1.)*S*1.6;
  col += vec3(.85, .9, 1.)*starsD(q, 2., .8*clamp(L*2. + S*2., 0., 1.), .8);
  vec2 m = rot(-1.1)*d; float band = exp(-pow((m.y + .35)/.16, 2.))*fbm7(m*5. + 1.);
  col += vec3(.6, .55, .75)*band*.4;
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
// detalle fino: estrellas brillantes con destello y nubes de estrellas (la Gran Nube tiene unos 30 mil millones)
vec3 lmcStarsB(vec2 q, float cell, float dens, float bmul){
  vec2 g = q/cell, id = floor(g), f = fract(g); vec3 c = vec3(0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
    vec2 o = vec2(x, y), cid = id + o; if (h21(cid + 17.) > dens) continue;
    vec2 pp = (f - o - h22(cid + 4.))*cell; float r2 = dot(pp, pp), k = .6 + .8*h21(cid + 2.);
    vec3 sc = mix(vec3(1., .74, .5), vec3(.62, .8, 1.), h21(cid + 8.)); float tw = .75 + .25*sin(uT*(2. + 3.*h21(cid)) + h21(cid)*20.);
    c += sc*k*(exp(-r2*.8)*1.5 + exp(-r2*.025)*.12 + (exp(-abs(pp.x)*1.1)*exp(-abs(pp.y)*.08) + exp(-abs(pp.y)*1.1)*exp(-abs(pp.x)*.08))*.1)*tw*bmul;
  }
  return c;
}
vec3 lmcDetail(vec2 q){
  vec2 p = q/uScale; float cloud = smoothstep(.4, .85, fbm7(p*2. + vec2(uFlow*.004, 7.)));
  return vec3(.8, .78, .9)*cloud*.06*(.7 + .6*fbm7(p*20.)) + vec3(.95, .93, 1.)*starsD(q + vec2(0., uFlow*1.6), 3., .12 + .3*cloud, .9) + lmcStarsB(q + vec2(uT*2., uFlow*3.), uScale*.19, .22, .8);
}
void main(){
  vec2 q0 = gl_FragCoord.xy, ctr = .5*uRes;
  float ra = uT*.006, zb = 1. + .02*sin(uT*.25);
  vec2 q = ctr + rot(ra)*(q0 - ctr)/zb;
  float j = uJour;
  float w1 = win(j, -1., .2), w2 = win(j, .2, .38), w3 = win(j, .38, .55), w4 = win(j, .55, .72), w5 = win(j, .72, .88);
  float out_ = smoothstep(.85, .97, j);
  vec3 col = vec3(.016, .018, .034);
  if (w1 > .001) col += lmcBody(q)*w1;
  if (w2 > .001) col += tarantula(q)*w2;
  if (w3 > .001) col += bubble(q)*w3;
  if (w4 > .001) col += supernova(q)*w4;
  if (w5 > .001) col += bridge(q)*w5;
  col += lmcDetail(q);
  col += starsD(q + vec2(0., uFlow*1.2), 2.6, .12, .55);
  col += starsD(q + vec2(0., uFlow*2.4), 5., .1, .9);
  col += starsD(q + vec2(0., uFlow*5.), 11., .09, 1.25);
  col += meteors(q0);
  col += flares(q);
  // ola de color que barre el cielo despacio
  float wave = sin((q0.x*.6 + q0.y)/uRes.y*3. - uT*.5);
  col *= 1. + .22*vec3(wave, sin((q0.x*.6 + q0.y)/uRes.y*3. - uT*.5 + 2.1), sin((q0.x*.6 + q0.y)/uRes.y*3. - uT*.5 + 4.2));
  // destello al cruzar de una escena a otra
  float tr = exp(-pow((j - .2)/.015, 2.)) + exp(-pow((j - .38)/.015, 2.)) + exp(-pow((j - .55)/.015, 2.)) + exp(-pow((j - .72)/.015, 2.)) + exp(-pow((j - .88)/.015, 2.));
  col += vec3(.9, .8, 1.)*tr*.18*(.6 + .4*fbm(q0/uRes.y*3. + uT));
  col += bokeh(q0);
  col += farView(q)*out_;
  vec2 bd = q0 - uBH.xy; col += vec3(1., .45, .18)*.05*exp(-length(bd)/(uRes.y*.4));
  col = post(col, q0);
  col = col/(1. + col*.5);
  gl_FragColor = vec4(col, 1.);
}`;
