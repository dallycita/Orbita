/**
 * Trozo de shader GLSL de la galaxia del Remolino, M51 (nivel 5): el viaje por dentro de la
 * galaxia, con los colores de la foto del Hubble. `32-fondos-56-final` lo une al shader de fondo.
 * Todo `GX_REMOLINO` es texto GLSL: sus comentarios son parte del programa.
 */

const GX_REMOLINO = `// ===================== REMOLINO M51 =====================
// Hubble: brazos azul-grisáceos #8aa0b8, núcleo amarillo #e8d0a8, regiones HII rojo-rosa muy marcadas, polvo café #5f4f49,
// la compañera NGC 5195 amarillo-café con polvo cruzándola
vec3 m51Spiral(vec2 d, float sc, float spin){
  // M51 como la fotografió el Hubble: brazos azules de estrellas jóvenes, cuentas rosas de gas encendido (regiones HII),
  // polvo marrón rojizo en el borde interior de los brazos y un núcleo dorado de estrellas viejas
  d = rot(spin)*d/sc; vec2 e = d; e.y /= .86; float r = length(e), a = atan(e.y, e.x);
  float ph = 2.*(a - log(r + .02)*2.3) + fbm(e*3.)*1.4;
  float arms = pow(.5 + .5*cos(ph), 2.4), armsN = pow(.5 + .5*cos(ph), 9.), lanes = pow(.5 + .5*cos(ph - .6), 12.);
  float cl = fbm7(e*9. + 2.), cl2 = fbm7(e*22. + 7.), disk = exp(-r*1.7);
  vec3 col = vec3(1., .8, .5)*(exp(-r*r*40.)*1.8 + exp(-r*5.)*.55) + vec3(.85, .7, .5)*disk*.1;          // estrellas viejas: el bulbo dorado
  col += vec3(.3, .55, 1.)*arms*disk*(.45 + 2.6*cl*cl2*1.6) + vec3(.55, .76, 1.)*armsN*disk*.85;         // brazos: estrellas jóvenes azules
  float dust = clamp(lanes*smoothstep(.03, .18, r)*1.7, 0., .9)*(.55 + .6*cl2);
  col = mix(col, col*vec3(.3, .15, .08) + vec3(.035, .012, .004)*disk, dust);                            // polvo marrón rojizo
  float hii = smoothstep(.7, .86, fbm7(e*26. + 5.))*arms*exp(-r*1.05);
  col += vec3(1., .18, .5)*hii*(2.6 + 1.4*uBeat) + vec3(1., .5, .75)*hii*hii*1.6;                        // regiones HII: laten con la música
  col += vec3(1., .3, .55)*smoothstep(.55, .86, fbm7(e*12. + 5.))*arms*exp(-r*1.3)*.35;                  // su brillo rosado alrededor
  col += vec3(.72, .86, 1.)*smoothstep(.82, .92, fbm7(e*40. + 9.))*arms*exp(-r*1.2)*2.1;                 // cúmulos azules muy brillantes
  col += vec3(.6, .8, 1.)*starsD(e*700., 2., .5*arms*exp(-r*1.2), 1.8) + vec3(1., .35, .6)*starsD(e*700. + 50., 2.4, .25*arms*exp(-r*1.3), 1.6);   // estrellas y nudos rosas sueltos a lo largo de los brazos
  col *= 1. - .45*smoothstep(.62, .82, rid(rot(a)*e*14. + 3.))*(1. - arms)*smoothstep(.1, .3, r)*exp(-r*1.2);   // espolones de polvo entre los brazos
  col += vec3(.28, .4, .85)*exp(-r*.9)*.1*(.4 + arms);                                                    // halo azul de los brazos exteriores
  // supernova: cada tanto una estrella de un brazo brilla como media galaxia y se apaga (M51 tuvo tres en 17 años)
  float k = floor(uT/7.), f = fract(uT/7.), sa = h21(vec2(k, 3.))*6.283, sr = .16 + .42*h21(vec2(k, 8.));
  vec2 sn = vec2(cos(sa), sin(sa))*sr, sv = e - sn; float sd = length(sv), env = exp(-f*3.5)*smoothstep(0., .02, f);
  col += vec3(.85, .93, 1.)*(exp(-sd*sd*12000.)*3.5 + exp(-sd*55.)*.5 + (exp(-abs(sv.x)*500.)*exp(-abs(sv.y)*22.) + exp(-abs(sv.y)*500.)*exp(-abs(sv.x)*22.))*.7)*env;
  return col*smoothstep(1.5, .45, r);
}

// ---- el Remolino (M51): un viaje por dentro de la galaxia, con lugares distintos ----
// 1 · la galaxia entera con su compañera · 2 · dentro de un brazo azul (nubes de estrellas y polvo que pasan)
// 3 · una nebulosa gigante donde nacen estrellas · 4 · el polvo a contraluz del núcleo dorado · 5 · la compañera NGC 5195 y su corriente de estrellas
vec3 m51Full(vec2 q){
  vec2 d = sceneD(q, .002);
  vec3 col = m51Spiral(d - vec2(-.04, .16), .7, uT*.012);
  vec2 c = d - vec2(.36, .62); float r = length(c*vec2(1., 1.15));
  vec3 comp = vec3(1., .78, .5)*(exp(-r*r*140.)*1.5 + exp(-r*9.)*.6);
  comp *= 1. - .7*smoothstep(.5, .75, wfbm(rot(.7)*c*vec2(6., 16.) + 2.))*exp(-r*6.);
  vec2 t = d - vec2(.2, .42); float br = exp(-pow((length(t*vec2(1., 1.4)) - .2)/.045, 2.))*smoothstep(-.1, .25, t.x)*fbm7(t*10. + uT*.04);
  col += comp + vec3(.45, .6, 1.)*br*1.3 + vec3(1., .2, .5)*smoothstep(.78, .9, fbm7(t*28.))*br*2.;
  col += vec3(.7, .8, 1.)*starsD(q, 2.6, .12, .9) + starsB(q + vec2(uT*2., 0.), uScale*.2, .16, .8);
  return col;
}
vec3 m51ArmFly(vec2 q){
  vec2 d = sceneD(q, .004), dr = rot(.55)*d; float fl = uFlow*.012 + uT*.012;
  float band = exp(-pow((dr.y + .08*sin(dr.x*2. + 1.))/.55, 2.));
  vec3 col = vec3(.012, .02, .05) + vec3(.1, .16, .35)*band*.25;                     // bruma azul de millones de estrellas lejanas
  for (int i = 0; i < 3; i++){ float fi = float(i), z = 1. + fi*.9;              // tres capas de nubes de estrellas: las cercanas pasan más rápido
    vec2 p = dr*z*vec2(1.4, 2.8) + vec2(fl*z*3., fi*5.3);
    float c = wfbm(p), c2 = fbm7(p*4.3 + 2.), grain = fbm(p*13. + 5.);
    vec3 tint = mix(vec3(.25, .45, 1.), vec3(.62, .78, 1.), fi*.45);
    col += tint*pow(smoothstep(.38, .82, c), 2.6)*(1.3 - fi*.25)*band*(.45 + 1.2*c2)*(.7 + .6*grain);
    col += vec3(.78, .9, 1.)*pow(smoothstep(.6, .9, c), 4.)*.9*band*(1. - fi*.3);   // corazones brillantes de las nubes de estrellas
    col += vec3(1., .85, .65)*pow(smoothstep(.55, .9, c*c2*1.6), 3.)*.25*band;     // algunas estrellas viejas amarillas entre las azules
  }
  // cúmulos de estrellas jóvenes: puñados de puntos azules muy brillantes
  float kn = smoothstep(.62, .8, fbm7(dr*vec2(4., 7.) + vec2(fl*5., 2.)))*band;
  col += vec3(.65, .82, 1.)*starsD(q + vec2(uFlow*2.4, 0.), 1.7, .85*kn, 2.2);
  col += vec3(.5, .7, 1.)*kn*.18;
  // polvo: filamentos oscuros con textura, delante de las estrellas
  vec2 pd = dr*vec2(2., 4.5) + vec2(fl*9., 3.); float dd = wfbm(pd), dfil = rid(pd*3.1 + 7.);
  float dust = smoothstep(.44, .64, dd)*(.7 + .3*smoothstep(.4, .9, dfil));
  col = mix(col, vec3(.035, .018, .013) + vec3(.05, .025, .015)*fbm(pd*6.), clamp(dust, 0., .93));
  col += vec3(.95, .55, .35)*smoothstep(.36, .48, dd)*(1. - smoothstep(.48, .6, dd))*.1*band*(.5 + dfil);   // el borde del polvo, encendido apenas
  float hii = smoothstep(.83, .93, fbm7(dr*vec2(5., 9.) + vec2(fl*4., 7.)));
  col += (vec3(1., .2, .5)*hii*(1.3 + uBeat) + vec3(1., .55, .75)*pow(hii, 3.)*1.2)*band*(1. - dust);   // pocas nubes rosas sueltas
  col += vec3(.75, .85, 1.)*starsD(q + vec2(uFlow*1.5, 0.), 3., .3*band*(1. - dust*.8), 1.7);
  col += vec3(.85, .92, 1.)*starsD(q + vec2(uFlow*4., 0.), 6., .12, 1.6);
  col += starsB(q + vec2(uFlow*6., 0.), uScale*.18, .22, 1.1);                      // supergigantes azules muy cerca, con su destello
  return col;
}
vec3 m51Nebula(vec2 q){
  vec2 d = sceneD(q, .005) - vec2(.0, .4);
  vec2 w = d + .18*vec2(fbm(d*2.2 + uT*.06), fbm(d*2.2 - uT*.05 + 4.)); float r = length(w);
  float g1 = wfbm(w*2.6 + 1.), g2 = wfbm(w*4.4 + 9.), g3 = fbm7(w*14. + uT*.05), fil = pow(rid(w*6. + vec2(uT*.02, 0.)), 5.), shell = smoothstep(1., .15, r);
  vec3 col = vec3(1., .22, .36)*smoothstep(.32, .82, g1)*shell*1.45;                             // hidrógeno (rojo rosado)
  col += vec3(.7, .06, .13)*smoothstep(.5, .9, g2)*shell*.95;                                     // azufre (rojo oscuro)
  col += vec3(.2, .8, .95)*smoothstep(.42, .85, g2*g1*1.8)*exp(-r*r*5.)*1.6;                      // oxígeno: el centro más caliente, verdeazulado
  col *= .45 + 1.15*g3;
  col += vec3(1., .55, .6)*fil*shell*smoothstep(.3, .7, g1)*1.4;                                  // filamentos finos y brillantes del gas
  float ion = smoothstep(.62, .5, abs(g1 - .5)*2.)*smoothstep(.1, .5, r)*shell;                    // frentes de ionización: bordes que brillan
  col += vec3(1., .78, .7)*pow(ion, 6.)*.6;
  float pil = rid(vec2(w.x*3., w.y*1.4) + 6.), side = smoothstep(-.1, .5, -w.y + .15), pd = smoothstep(.62, .74, pil)*side;
  col = mix(col, vec3(.02, .008, .012) + vec3(.06, .02, .02)*fbm(w*20.), pd*.92);                  // pilares de polvo, con textura
  col += vec3(1., .7, .5)*smoothstep(.5, .62, pil)*(1. - smoothstep(.62, .7, pil))*side*.45*exp(-r*1.5);
  for (int i = 0; i < 5; i++){ float fi = float(i); vec2 gp = w - (vec2(h21(vec2(fi, 31.)), h21(vec2(fi, 32.))) - .5)*1.1;   // glóbulos: nubecitas oscuras donde nacerán estrellas
    col *= 1. - .85*smoothstep(.05, .0, length(gp*vec2(1., 1.6)) - .03*fbm(gp*40.)); }
  vec2 cc = w - vec2(.02, .05);
  for (int i = 0; i < 9; i++){ float fi = float(i); vec2 pp = cc - (vec2(h21(vec2(fi, 1.)), h21(vec2(fi, 2.))) - .5)*.2; float b = .6 + .4*sin(uT*2. + fi), k = .5 + h21(vec2(fi, 5.));
    col += vec3(.7, .85, 1.)*k*(exp(-dot(pp, pp)*9000.)*2.2 + exp(-dot(pp, pp)*400.)*.2 + (exp(-abs(pp.x)*420.)*exp(-abs(pp.y)*26.) + exp(-abs(pp.y)*420.)*exp(-abs(pp.x)*26.))*.38)*b; }   // estrellas recién nacidas
  col += vec3(.6, .75, 1.)*exp(-length(cc)*6.)*.35*(1. + .5*uBeat);
  col += vec3(.75, .85, 1.)*starsD(q, 2.6, .3, 1.) + starsB(q + vec2(uT*3., 0.), uScale*.2, .14, .7);
  return col*(1. + .2*uBeat);
}
vec3 m51Dust(vec2 q){
  vec2 d = sceneD(q, .003), L = vec2(.35, .55); float fl = uFlow*.01 + uT*.008, lr = length(d - L);
  vec3 light = vec3(1., .78, .45)*(exp(-lr*2.2)*1.4 + exp(-lr*lr*30.)*2.) + vec3(1., .9, .7)*exp(-lr*lr*400.)*2.;   // el núcleo dorado, detrás del polvo
  float tr = 1.;
  for (int i = 0; i < 7; i++){ vec2 p = mix(d, L, float(i)/7.*.65); tr *= 1. - smoothstep(.45, .75, fbm(p*vec2(2.5, 4.) + vec2(fl*3., 0.)))*.25; }   // rayos de luz entre el polvo
  vec2 pdD = d*vec2(2.5, 4.) + vec2(fl*3., 0.);
  float hD = wfbm(pdD), D = smoothstep(.45, .75, hD), fine = rid(pdD*3.5 + 2.);
  float N = smoothstep(.55, .75, wfbm(d*vec2(4., 8.) + vec2(fl*8., 5.)));
  vec3 col = light*tr*(1. - D*.85*(.75 + .25*fine));
  col += vec3(.95, .45, .2)*D*(1. - D)*2.2*exp(-lr*1.5)*.7*(.6 + .6*fine);              // el polvo se enciende rojizo en sus bordes
  col += vec3(1., .7, .4)*pow(fine, 6.)*(1. - D)*exp(-lr*1.8)*.5;                       // hebras finas de polvo iluminado
  col = mix(col, vec3(.03, .015, .01) + vec3(.04, .02, .01)*fbm(d*30.), N*.92);         // polvo cercano que pasa rápido
  col += vec3(.3, .5, 1.)*smoothstep(.75, .9, fbm7(d*6. + 30.))*(1. - D)*.5;
  col += vec3(1., .9, .75)*starsD(q + vec2(uFlow*2., 0.), 2.4, .35*(1. - N), 1.1) + starsB(q + vec2(uFlow*5., 0.), uScale*.2, .12*(1. - N), .9);
  return col;
}
vec3 m51Bridge(vec2 q){
  vec2 d = sceneD(q, .003), c = d - vec2(.12, .32); float r = length(c*vec2(1., 1.25));
  vec3 col = vec3(1., .76, .45)*(exp(-r*r*45.)*1.8 + exp(-r*4.5)*.75) + vec3(1., .9, .75)*exp(-r*r*900.)*1.5;   // NGC 5195: estrellas viejas, doradas
  col *= .8 + .35*fbm7(c*30.);                                                                                   // granulado: millones de estrellas
  float lf = wfbm(rot(.7)*c*vec2(4., 10.) + 2.), lanes = smoothstep(.5, .72, lf)*exp(-r*3.2)*(.7 + .3*rid(c*24.));
  col = mix(col, col*vec3(.22, .1, .05), lanes*.92);                                                             // polvo revuelto por el choque
  col += vec3(1., .5, .2)*smoothstep(.5, .63, lf)*(1. - smoothstep(.63, .72, lf))*exp(-r*4.)*.35;
  vec2 t = d - vec2(-.45, -.05); float ang = atan(t.y, t.x), rad = length(t);
  float stream = exp(-pow((rad - .55 - .08*sin(ang*3. + 1.))/.08, 2.))*smoothstep(-.4, .9, ang), sc = wfbm(vec2(ang*6., rad*20.) + vec2(uFlow*.02, 0.));
  col += vec3(.35, .55, 1.)*stream*(.35 + 1.7*sc*sc)*1.2;                                                         // la corriente de estrellas que le arrancó a la galaxia grande
  col += vec3(.6, .8, 1.)*starsD(q + vec2(uFlow*.8, 0.), 1.6, .8*stream, 2.);                                     // sus cúmulos
  col += vec3(1., .2, .5)*smoothstep(.8, .9, fbm7(vec2(ang*14., rad*30.) + 4.))*stream*(1.8 + uBeat);
  col += vec3(.9, .75, .55)*(exp(-pow((r - .55)/.03, 2.))*.16*fbm7(c*10.) + exp(-pow((r - .8)/.04, 2.))*.11*fbm7(c*8. + 3.));   // conchas de estrellas del choque
  col += vec3(1., .92, .8)*starsD(q, 2.4, .5*exp(-r*2.), 1.) + starsB(q + vec2(uT*2., 0.), uScale*.2, .14, .8);
  return col;
}

vec3 m51Arms(vec2 q){ vec2 d = sceneD(q, .003) - vec2(0., .2); return m51Spiral(d, .72, uT*.012); }
vec3 m51HII(vec2 q){
  vec2 d = rot(-.6)*(sceneD(q, .006) - vec2(0., .15));
  vec2 w = d + .07*vec2(fbm(d*3. + uT*.08), fbm(d*3. - uT*.08 + 3.));
  float arm = exp(-pow((w.y + .1*sin(w.x*2.))/.3, 2.));
  vec3 col = vec3(.32, .55, 1.)*arm*(.3 + 1.5*fbm7(w*6.)) + vec3(1., .82, .55)*exp(-pow(w.y/.6, 2.))*.06;
  float lane = smoothstep(.5, .7, fbm7(vec2(w.x*3., w.y*10.) + 4.))*exp(-pow((w.y + .05)/.12, 2.));
  col = mix(col, vec3(.1, .045, .025), lane*.85);
  float hii = fbm7(w*7. + 11.);
  col += vec3(1., .18, .5)*smoothstep(.62, .82, hii)*arm*(2. + 1.2*uBeat) + vec3(1., .5, .72)*pow(rid(w*12. + uT*.05), 7.)*smoothstep(.55, .8, hii)*arm*1.5;
  col += vec3(.9, .2, .5)*smoothstep(.45, .85, hii)*arm*.45;   // el gas rosa alrededor de cada región
  col += vec3(.7, .82, 1.)*starsD(q, 2.8, .7*arm*(1. - lane), 1.7);
  return col*(1. + .25*uBeat);
}
vec3 m51Core(vec2 q){
  vec2 d = rot(uT*.02)*(sceneD(q, .002) - vec2(0., .24));
  float r = length(d), a = atan(d.y, d.x);
  vec3 col = vec3(1., .88, .66)*(exp(-r*r*60.)*1.6 + exp(-r*5.)*.6);
  float spi = pow(rid(vec2(a*2. - log(r + .01)*5., r*12.) + 3.), 4.);
  col *= 1. - .7*spi*smoothstep(.02, .1, r)*exp(-r*1.5);
  col += vec3(1., .2, .5)*smoothstep(.78, .9, fbm7(d*30.))*exp(-r*4.)*(1.6 + uBeat);
  col += vec3(.3, .55, 1.)*(1. - spi)*exp(-r*1.8)*smoothstep(.05, .2, r)*(.4 + 1.6*fbm7(d*14. + 3.))*.9;   // los brazos azules alrededor del núcleo
  col += vec3(1., .2, .5)*smoothstep(.74, .88, fbm7(d*18. + 21.))*(1. - spi)*exp(-r*1.6)*smoothstep(.06, .2, r)*(1.8 + uBeat);   // y sus regiones rosas
  col += vec3(1., .95, .85)*starsD(q, 2.2, .8*exp(-r*5.), 1.);
  return col;
}
vec3 m51Pair(vec2 q){
  vec2 d = sceneD(q, .003);
  vec3 col = m51Spiral(d - vec2(-.12, .12), .55, uT*.012);
  vec2 c = d - vec2(.22, .42); float r = length(c*vec2(1., 1.2));
  vec3 comp = vec3(1., .82, .58)*(exp(-r*r*120.)*1.3 + exp(-r*8.)*.6);
  comp *= 1. - .75*smoothstep(.55, .75, fbm7(rot(.7)*c*vec2(6., 16.) + 2.))*exp(-r*6.);
  vec2 t = c - vec2(-.2, -.18); float bridge = exp(-pow((length(t) - .22)/.035, 2.))*smoothstep(.3, -.1, t.x + t.y)*fbm7(t*12. + uT*.05);
  col += comp + vec3(.4, .6, 1.)*bridge*1.5 + vec3(1., .2, .5)*smoothstep(.78, .9, fbm7(t*30.))*bridge*2.6;
  return col;
}
`;

export { GX_REMOLINO };
