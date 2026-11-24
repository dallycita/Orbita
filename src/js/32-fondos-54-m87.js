/**
 * Trozo de shader GLSL de la galaxia M87 (nivel 7): halo, chorro, gas y el anillo de su agujero
 * negro como lo fotografió el Event Horizon Telescope. `32-fondos-56-final` lo une al shader de
 * fondo. Todo `GX_M87` es texto GLSL: sus comentarios son parte del programa.
 */
const GX_M87 = `// ===================== M87 =====================
// Hubble: halo crema-amarillo #ca9f72 → #d5c7b8 muy suave, el chorro azul-violeta con nudos, miles de cúmulos globulares;
// el Event Horizon Telescope: anillo naranja #f38f14 / amarillo #fcd05b / rojo #911c01, más brillante abajo
vec3 m87Halo(vec2 q){
  vec2 d = sceneD(q, .002) - vec2(0., .24); float r = length(d*vec2(1., 1.06));
  vec3 col = vec3(.92, .8, .62)*(exp(-r*4.5)*.6 + exp(-r*10.)*.8) + vec3(1., .95, .85)*exp(-r*r*260.)*1.3;
  vec2 j = rot(.55)*d; float jet = exp(-pow(j.y/(.004 + .02*max(j.x, 0.)), 2.))*step(0., j.x)*exp(-j.x*5.);
  col += vec3(.55, .6, 1.)*jet*(.6 + pow(.5 + .5*cos(j.x*60. - uT*3.), 6.))*1.4;
  col *= .85 + .3*fbm7(d*28.);                                                          // granulado: billones de estrellas viejas
  col += vec3(.55, .42, 1.)*wfbm(d*3. + 4.)*exp(-r*2.6)*.24;                               // gas a millones de grados (rayos X, violeta como en Chandra)
  for (int i = 0; i < 2; i++){ float sg = i == 0 ? 1. : -1.; vec2 c = rot(.55)*d - vec2(.42*sg, .04*sg);   // lóbulos de radio a los dos lados (naranja rojizo, como en el VLA)
    col += vec3(1., .38, .14)*smoothstep(.42, .8, wfbm(c*5. + sg*3.))*exp(-length(c*vec2(1., 1.5))*4.5)*.75; }
  return col + globs(q, .38*clamp(exp(-r*2.)*1.3, 0., 1.) + .05, .07)*.7 + globs(q*1.6 + 9., .3*exp(-r*1.5), .05)*.4;   // M87 tiene unos 12 000 cúmulos globulares
}
vec3 m87Jet(vec2 q){
  vec2 b = sceneD(q, .004) - vec2(-.3, -.1), j = rot(.6)*b;
  vec3 col = vec3(.92, .8, .62)*exp(-length(b)*6.)*.45 + vec3(1., .95, .85)*exp(-dot(b, b)*500.)*1.1;
  float wd = .008 + .035*max(j.x, 0.), core = exp(-pow(j.y/wd, 2.))*step(0., j.x)*exp(-j.x*.9);
  float kn = 0.;
  for (int i = 0; i < 6; i++){ float fi = float(i), kx = fract(fi*.17 + uT*.04)*1.1 + fi*.02; kn += exp(-pow((j.x - kx)/.02, 2.))*(1. - kx*.7); }
  col += vec3(.55, .58, 1.)*core*(.5 + .8*fbm7(j*25. - vec2(uT*1.5, 0.)) + 1.6*kn);
  col += vec3(.45, .4, 1.)*fbm7(j*6. - vec2(uT*.3, 0.))*exp(-pow(j.y/(wd*2.5), 2.))*step(0., j.x)*exp(-j.x*.9)*.5;
  col += vec3(.85, .92, 1.)*pow(fbm7(j*40. - vec2(uT*2., 0.)), 4.)*core*2.;                         // hebras finas dentro del chorro
  col += vec3(1., .4, .18)*fbm7(j*4. + 7.)*exp(-pow(j.y/(wd*6.), 2.))*step(0., j.x)*exp(-j.x*1.1)*.3;   // capullo de radio alrededor del chorro
  col += vec3(.9, .95, 1.)*exp(-pow((j.x - .07)/.012, 2.) - pow(j.y/.01, 2.))*(1.2 + .8*sin(uT*3.));   // HST-1: el nudo que parpadea cerca del centro
  col += globs(q, .2*exp(-length(b)*2.) + .03, .07)*.5;
  return col*(1. + .3*uBeat);
}
vec3 m87Gas(vec2 q){
  vec2 d = sceneD(q, .003) - vec2(0., .22); float r = length(d);
  vec3 col = vec3(.92, .8, .62)*exp(-r*6.)*.45;
  vec2 w = d + .08*vec2(fbm(d*3. + uT*.1), fbm(d*3. - uT*.08 + 1.));
  float loops = pow(rid(w*vec2(5., 8.) + 2. + uT*.04), 5.)*smoothstep(.06, .25, r)*exp(-r*1.8);
  col += vec3(.5, .55, 1.)*loops*1.2 + vec3(.6, .45, .95)*wfbm(w*4.)*exp(-r*2.2)*.34;
  for (int i = 0; i < 2; i++){ float sg = i == 0 ? 1. : -1.; vec2 c = rot(.55)*d - vec2(.3*sg, .05);   // burbujas de radio que empujan el gas caliente
    float br = length(c*vec2(1., 1.3)), cav = smoothstep(.2, .1, br);
    col *= 1. - .45*cav; col += vec3(1., .4, .16)*smoothstep(.4, .8, wfbm(c*6. + 2.))*cav*.9 + vec3(.6, .6, 1.)*exp(-pow((br - .2)/.025, 2.))*.35; }
  col *= .85 + .3*fbm7(d*30.);
  return col + globs(q, .3, .07)*.5;
}
vec3 ehtRing(vec2 d, float R, vec3 c1, vec3 c2, vec3 c3, float spin){
  float r = length(d), a = atan(d.y, d.x);
  float bright = .55 + .45*cos(a + 1.57 - spin) + .25*pow(.5 + .5*cos(a*3. + spin*2.), 4.);
  float ring = exp(-pow((r - R)/(R*.32), 2.))*bright;
  float photon = exp(-pow((r - R*.92)/(R*.04), 2.))*(.6 + .4*bright);
  vec3 col = mix(c3, c1, smoothstep(.15, .7, ring))*ring*1.3;
  col = mix(col, c2, smoothstep(.75, 1.3, ring)*.8);
  col += c2*photon*.8 + c3*exp(-r/R*1.2)*.12;
  col *= smoothstep(R*.42, R*.62, r)*.85 + .15*smoothstep(R*.2, R*.62, r);
  return col;
}
vec3 m87Shadow(vec2 q){
  vec2 d = sceneD(q, .002) - vec2(0., .26);
  vec3 col = ehtRing(d, .15 + .006*uBeat, vec3(.95, .56, .08), vec3(.99, .82, .36), vec3(.57, .11, .01), uT*.1);
  float r = length(d), a = atan(d.y, d.x);
  col += vec3(1., .7, .35)*pow(fbm7(vec2(a*6. + uT*.4, r*30.)), 3.)*exp(-pow((r - .17)/.05, 2.))*.9;   // gas que gira alrededor, con hebras
  vec2 j = rot(.55)*d; col += vec3(.55, .6, 1.)*exp(-pow(j.y/(.01 + .08*max(j.x - .18, 0.)), 2.))*step(.18, j.x)*exp(-(j.x - .18)*3.)*.35;   // la base del chorro
  return col;
}
`;
