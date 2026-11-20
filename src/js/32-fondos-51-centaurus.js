// ┌─ 32-fondos-51-centaurus.js
// │ da:     GX_CENTAURUS
// │ lo usan: 32-fondos-56-final
// │ usa:    (nada de otros archivos)
// └─ generado por `node build.mjs --deps`; no se edita a mano
// Centaurus A (nivel 4): cuerpo, franja de polvo, chorros y lóbulos
const GX_CENTAURUS = `// ===================== CENTAURUS A =====================
// tonos de las fotos de ESO: cuerpo crema-gris #d6c5c1, franja de polvo café con borde naranja, cúmulos azules,
// regiones rosadas; chorros en rayos X azules (#6a8ad8) y lóbulos naranjas en submilimétrico
vec3 cenGalaxy(vec2 d, float sc){
  d /= sc; float r = length(d*vec2(1., 1.1));
  vec3 col = vec3(.84, .78, .74)*(exp(-r*5.)*.7 + exp(-r*12.)*.9);
  vec2 l = rot(-.5)*d; float lw = .055 + .025*fbm(vec2(l.x*4., 2.));
  float band = exp(-pow((l.y + .025*sin(l.x*7. + uT*.1))/lw, 2.))*smoothstep(.55, .05, abs(l.x));
  float dust = clamp(band*(.55 + .7*fbm7(l*14. + 3.)), 0., 1.);
  col *= 1. - .93*dust;
  col += vec3(1., .5, .22)*band*(1. - dust)*.35*exp(-r*2.);
  col += vec3(1., .32, .5)*smoothstep(.72, .86, fbm7(l*24. + 8.))*band*1.5*exp(-r*1.5);
  col += vec3(.55, .7, 1.)*smoothstep(.76, .88, fbm7(l*30. + 2.))*band*1.2*exp(-r*1.5);
  return col;
}
vec3 cenBody(vec2 q){
  vec2 d = rot(.15 + uT*.004)*(sceneD(q, .003) - vec2(0., .22));
  return cenGalaxy(d, .75)*1.4*(.85 + .3*fbm7(d*26.)) + vec3(.92, .9, .88)*starsD(q, 2.3, .6*exp(-length(d)*3.), .9) + starsB(q + vec2(uT*2., 0.), uScale*.2, .12, .8);
}
vec3 cenLane(vec2 q){
  vec2 l = rot(-.35)*(sceneD(q, .006) - vec2(0., .2));
  vec2 w = l + .06*vec2(fbm(l*3. + uT*.08), fbm(l*3. - uT*.07 + 4.));
  vec3 col = vec3(.9, .8, .7)*.35*exp(-abs(w.y)*4.);
  float lay = fbm7(w*vec2(3., 7.) + 1.), lay2 = fbm7(w*vec2(7., 13.) + 6.);
  float dust = smoothstep(.38, .62, lay)*exp(-pow(w.y/.32, 2.));
  float hb = rid(w*vec2(9., 20.) + 3.); dust *= .75 + .3*hb;                       // el polvo tiene hebras, no es liso
  col = mix(col, vec3(.07, .035, .02) + vec3(.05, .02, .01)*fbm(w*30.), dust*.95);
  col += vec3(1., .5, .2)*smoothstep(.34, .42, lay)*(1. - smoothstep(.42, .52, lay))*exp(-pow(w.y/.3, 2.))*.8*(.6 + .6*hb);
  col += vec3(.6, .75, 1.)*smoothstep(.8, .92, fbm7(w*vec2(10., 18.) + 9.))*exp(-pow(w.y/.22, 2.))*(1. - dust)*1.2;   // cúmulos azules a lo largo del polvo
  col += vec3(1., .3, .5)*smoothstep(.78, .9, lay2)*exp(-pow(w.y/.3, 2.))*1.6;
  col += vec3(.6, .75, 1.)*starsD(q, 3.2, .55*exp(-pow(w.y/.25, 2.))*(1. - dust), 2.);
  return col*(1. + .25*uBeat);
}
vec3 cenJet(vec2 q){
  vec2 b = sceneD(q, .004) - vec2(-.22, .02), j = rot(-.95)*b;
  float wd = .012 + .06*max(j.x, 0.);
  float jet = exp(-pow(j.y/wd, 2.))*step(0., j.x)*exp(-j.x*1.1);
  float knots = pow(.5 + .5*cos(j.x*28. - uT*2.5), 6.);
  vec3 col = vec3(.55, .7, 1.)*jet*(.8 + 2.2*knots + .8*fbm7(j*20. - vec2(uT, 0.)))*1.4;
  col += vec3(.35, .5, 1.)*fbm7(j*5. - vec2(uT*.2, 0.))*exp(-pow(j.y/(wd*3.), 2.))*step(0., j.x)*exp(-j.x*.8)*.6;
  col += vec3(.45, .55, 1.)*exp(-pow(j.y/(wd*.7), 2.))*step(j.x, 0.)*exp(j.x*3.)*.35;     // contrachorro tenue
  col += cenGalaxy(b, .5)*.9;
  return col*(1. + .3*uBeat);
}
vec3 cenLobes(vec2 q){
  vec2 d = sceneD(q, .003) - vec2(0., .2);
  vec3 col = vec3(0.);
  for (int i = 0; i < 2; i++){
    float s = i == 0 ? 1. : -1.;
    vec2 c = d - s*vec2(.2, .26); c = rot(.4*s + uT*.02)*c;
    float r = length(c*vec2(1., 1.4));
    float lobe = exp(-r*5.5)*(.4 + 1.3*fbm7(c*7. + uT*.05 + s));
    float fil = pow(rid(c*9. + uT*.04 + s*3.), 6.)*exp(-r*4.);
    col += vec3(1., .62, .25)*lobe*1.6 + vec3(1., .8, .5)*fil*1.8;
    col += vec3(.4, .55, 1.)*exp(-pow((length(c) - .17)/.04, 2.))*fbm7(c*10. + uT*.05)*.6;   // frente de choque en rayos X, difuso
  }
  col += cenGalaxy(d, .35)*1.3;
  vec2 jj = rot(-.95)*d; col += vec3(.55, .7, 1.)*exp(-pow(jj.y/(.006 + .03*abs(jj.x)), 2.))*exp(-abs(jj.x)*3.)*.8;
  return col;
}
`;
