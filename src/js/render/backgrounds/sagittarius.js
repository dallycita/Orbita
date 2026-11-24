/**
 * Parte del shader de las galaxias lejanas para Sagitario A* (nivel 8), el agujero negro del
 * centro de nuestra galaxia. 32-fondos-56-final la une con las demás en FS_GX.
 * Todo es código GLSL dentro de un texto: cambiar algo ahí dentro cambia el juego.
 */

const GX_SAGITARIO = `// ===================== SAGITARIO A* =====================
// centro galáctico: en luz visible nubes doradas y polvo; el compuesto de NASA (Hubble+Spitzer+Chandra) en violeta #3e3775,
// azul #454b9f, magenta #7e4774 y filamentos dorados; los filamentos de radio de MeerKAT; las estrellas S girando;
// el anillo del EHT naranja #e36402 / #fa9728 / #f7d883
vec3 sgrComposite(vec2 q){
  vec2 d = sceneD(q, .005);
  vec2 w = d + .1*vec2(fbm(d*2.5 + uT*.08), fbm(d*2.5 - uT*.07 + 3.));
  float g1 = fbm7(w*3. + 1.), g2 = fbm7(w*5. + 7.), g3 = fbm7(w*9. + 3.);
  float m = smoothstep(.42, .7, g1);
  vec3 col = (vec3(.24, .22, .46)*m*1.3 + vec3(.27, .3, .62)*smoothstep(.55, .82, g2)*1.1 + vec3(.5, .28, .46)*smoothstep(.62, .88, g3)*1.)*m*(.8 + .4*fbm7(w*20.));
  col += vec3(1., .72, .32)*pow(rid(w*vec2(6., 4.) + uT*.05), 9.)*m*1.1;
  col += vec3(.7, .8, 1.)*exp(-length(d - vec2(-.25, .3))*14.)*.9;
  float cl = fbm7(w*2. + 5.);
  col += vec3(1., .8, .45)*pow(smoothstep(.25, .85, cl), 1.6)*.75*(.75 + .5*fbm7(w*22.)) + vec3(1., .78, .5)*starsD(q, 3.6, .2*cl, 1.4);   // nubes de estrellas viejas: hay millones
  float ir = wfbm(w*2.2 + 11.);
  col += vec3(1., .38, .16)*smoothstep(.45, .82, ir)*.85 + vec3(1., .6, .3)*pow(rid(w*7. + 2.), 6.)*smoothstep(.4, .7, ir)*.9;   // polvo tibio que brilla en infrarrojo (rojo, como en Spitzer), con hebras
  col += vec3(.45, .5, 1.)*smoothstep(.6, .9, wfbm(w*3.5 + 30.))*.55;                           // gas a millones de grados (rayos X, azul violeta como en Chandra)
  col *= 1. - .72*smoothstep(.55, .78, wfbm(w*vec2(3., 6.) + 20.))*smoothstep(.2, .6, cl);     // nubes oscuras de polvo delante
  for (int i = 0; i < 2; i++){ vec2 cc = d - (i == 0 ? vec2(.3, .38) : vec2(.08, .55)); float k = i == 0 ? 1. : .7;   // los cúmulos Arches y Quintuplete: estrellas gigantes azules apretadas
    col += vec3(.7, .85, 1.)*(exp(-length(cc)*22.)*.7*k + exp(-length(cc)*60.)*.8*k + starsD(q + 13.*float(i), 3.2, .9*exp(-length(cc)*16.), 2.2)); }
  col += starsB(q + vec2(uT*2., 0.), uScale*.17, .3, 1.);
  return col*(1. + .25*uBeat) + vec3(1., .9, .75)*starsD(q, 2.8, .22, .8);
}
vec3 sgrFilaments(vec2 q){
  vec2 d = sceneD(q, .005); vec3 col = vec3(0.);
  for (int i = 0; i < 24; i++){   // filamentos de radio (como en la imagen de MeerKAT): cientos, rectos y paralelos
    float fi = float(i), x0 = (h21(vec2(fi, 2.)) - .5)*1.6, cv = (h21(vec2(fi, 5.)) - .5)*.6;
    float xx = d.x - x0 - cv*d.y*d.y - .015*sin(d.y*6. + uT*.3 + fi);
    float th = (exp(-pow(xx/(.004 + .004*h21(vec2(fi, 8.))), 2.))*1.4 + exp(-pow(xx/.03, 2.))*.15)*exp(-pow(d.y/(.35 + .3*h21(vec2(fi, 9.))), 2.));
    float xs = xx - .009*(1. + h21(vec2(fi, 11.)));   // cada filamento tiene hebras hermanas
    th += exp(-pow(xs/.0025, 2.))*.6*exp(-pow(d.y/(.25 + .3*h21(vec2(fi, 12.))), 2.));
    col += mix(vec3(1., .5, .75), vec3(1., .78, .5), h21(vec2(fi, 4.)))*th*(.45 + .7*pow(fbm(vec2(d.y*14. - uT*.3, fi)), 1.5));
  }
  col += vec3(.35, .2, .4)*wfbm(d*3. + uT*.03)*.38;
  vec2 bb = d*vec2(1., .55); col += vec3(.85, .7, 1.)*exp(-pow((length(bb) - .78)/.05, 2.))*fbm7(d*6.)*.22;   // las burbujas gigantes del centro galáctico, apenas visibles
  col += vec3(1., .3, .2)*smoothstep(.5, .85, wfbm(d*4. - vec2(.6, -.3)))*exp(-length(d - vec2(-.55, -.2))*3.)*.6;   // Sgr B2: la nube de gas más grande de la galaxia
  return col + vec3(1., .9, .8)*starsD(q, 2.8, .3, .9) + vec3(1., .75, .5)*starsD(q*1.2 + 3., 3.4, .2, 1.1);
}
vec3 sgrStars(vec2 q){
  vec2 d = sceneD(q, .002) - vec2(0., .24); vec3 col = vec3(1., .55, .3)*exp(-length(d)*6.)*.35 + vec3(.5, .3, .55)*fbm7(d*4. + uT*.04)*exp(-length(d)*2.)*.35;
  float rr0 = length(d), an0 = atan(d.y, d.x);
  col += vec3(1., .3, .35)*pow(.5 + .5*cos(3.*an0 - log(rr0 + .01)*4. - uT*.05), 5.)*smoothstep(.03, .1, rr0)*exp(-rr0*5.)*(.4 + .9*fbm7(d*18.))*.8;   // la minispiral: gas ionizado que cae hacia el centro
  col += vec3(1., .45, .5)*exp(-pow((length(d*vec2(1., 1.6)) - .42)/.05, 2.))*(.3 + 1.2*pow(fbm7(d*10. + uT*.03), 2.))*.6;   // el disco de gas que lo rodea
  col += vec3(1., .8, .55)*starsD(q, 3., .6*exp(-rr0*2.), 1.3);   // el cúmulo de estrellas más denso de la galaxia
  for (int i = 0; i < 12; i++){
    float fi = float(i), aa = .3 + .1*fi, ecc = .45 + .4*h21(vec2(fi, 3.)), ori = h21(vec2(fi, 7.))*6.28;
    float T = 3. + 5.*h21(vec2(fi, 1.)), M = uT/T*6.28 + fi*1.7, E = M + ecc*sin(M); E = M + ecc*sin(E); E = M + ecc*sin(E);
    vec2 p = vec2(aa*(cos(E) - ecc), aa*sqrt(1. - ecc*ecc)*sin(E))*.35; p = rot(ori)*p;
    vec2 rel = d - p; col += vec3(.75, .85, 1.)*(exp(-dot(rel, rel)*5000.)*3. + exp(-dot(rel, rel)*350.)*.4);
    vec2 e = rot(-ori)*d/.35; e.x = e.x/aa + ecc; e.y /= aa*sqrt(1. - ecc*ecc);
    float ae = atan(e.y, e.x), lag = mod(E - ae + 6.2831, 6.2831);   // estela: la parte de la órbita que la estrella acaba de recorrer
    col += vec3(.6, .7, 1.)*exp(-pow((length(e) - 1.)/.012, 2.))*(.08 + .6*exp(-lag*2.5));
  }
  return col*(1. + .2*uBeat);
}
vec3 sgrShadow(vec2 q){
  vec2 d = sceneD(q, .002) - vec2(0., .26);
  vec3 col = ehtRing(rot(.4)*d, .15 + .006*uBeat, vec3(.89, .39, .01), vec3(.97, .85, .51), vec3(.5, .08, 0.), uT*.25);
  float r = length(d), a = atan(d.y, d.x);
  col += vec3(1., .75, .4)*pow(fbm7(vec2(a*6. - uT*.6, r*34.)), 3.)*exp(-pow((r - .17)/.05, 2.))*1.;   // gas en remolino, con hebras
  float ha = uT*1.6; vec2 hp = vec2(cos(ha), sin(ha))*.18, hd = d - hp;   // la mancha caliente que gira alrededor (la vio el instrumento GRAVITY, a un 30% de la velocidad de la luz)
  float lag = mod(ha - a + 6.2831, 6.2831);
  col += vec3(1., .9, .7)*(exp(-dot(hd, hd)*3000.)*2.2 + exp(-pow((r - .18)/.012, 2.))*exp(-lag*3.)*.7);
  col *= 1. + .35*pow(.5 + .5*sin(uT*.9), 12.);                                            // destellos: Sgr A* parpadea varias veces al día
  col += vec3(1., .3, .35)*pow(.5 + .5*cos(3.*a - log(r + .01)*4. - uT*.05), 5.)*smoothstep(.25, .4, r)*exp(-r*3.)*.35;   // la minispiral alrededor
  col += vec3(1., .8, .55)*starsD(q, 3., .45*exp(-r*2.5)*smoothstep(.2, .35, r), 1.3);
  return col;
}
`;

export { GX_SAGITARIO };
