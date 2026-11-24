/**
 * Trozo de shader GLSL de la galaxia del Sombrero, M104 (nivel 6): bulbo, anillo de polvo y
 * cúmulos globulares, con los colores de la foto del Hubble. `32-fondos-56-final` lo une al
 * shader de fondo. Todo `GX_SOMBRERO` es texto GLSL: sus comentarios son parte del programa.
 */

const GX_SOMBRERO = `// ===================== SOMBRERO M104 =====================
// Hubble: bulbo plateado con un toque lavanda #d1ccdc, halo gris #8c8687, anillo de polvo café oscuro #2a1e18 con borde
// cálido #6f5848, y cientos de cúmulos globulares alrededor
vec3 sombGalaxy(vec2 d, float sc){
  d /= sc; float rb = length(d*vec2(1., 1.55));
  vec3 col = vec3(.86, .84, .92)*(exp(-rb*5.)*.7 + exp(-rb*11.)*1.1) + vec3(1., .97, .95)*exp(-rb*rb*80.)*1.1;
  vec2 e = d; e.y = (e.y + .02)/.11; float re = length(e);
  float disk = exp(-pow((re - .58)/.2, 2.))*smoothstep(1.2, .3, re);
  col += vec3(.8, .78, .85)*disk*.35*(.6 + .8*fbm7(e*vec2(6., 2.)));
  float ring = exp(-pow((re - .6 - .03*fbm(vec2(atan(e.y, e.x)*3., 1.)))/.13, 2.));
  float front = smoothstep(.02, -.05, d.y + .005);
  float dust = clamp(ring*(.7 + .5*fbm7(vec2(atan(e.y, e.x)*8., re*12.) + uT*.03))*mix(.55, 1., front), 0., 1.);
  col = mix(col, vec3(.09, .06, .045), dust*.92);
  col += vec3(.75, .55, .38)*exp(-pow((re - .48)/.04, 2.))*ring*.5;
  return col;
}
vec3 sombBody(vec2 q){ vec2 d = rot(-.08 + .02*sin(uT*.05))*(sceneD(q, .003) - vec2(0., .34)); return sombGalaxy(d, 1.05)*(.88 + .25*fbm7(d*30.)) + globs(q, .22*exp(-length(d)*2.) + .04, .07)*.6; }
vec3 sombRing(vec2 q){
  vec2 d = sceneD(q, .006) - vec2(0., .18);
  vec2 w = d + .05*vec2(fbm(d*3. + uT*.1), fbm(d*3. - uT*.08 + 2.));
  vec3 col = vec3(.86, .84, .92)*(.35*exp(-abs(w.y + .15)*5.) + .04);
  col += sombGalaxy(rot(-.08)*(d - vec2(0., .12)), 1.7)*.85*(.85 + .3*fbm7(w*30.));   // cada vez más cerca del Sombrero
  float band = exp(-pow((w.y + .02*sin(w.x*3.))/.12, 2.));
  float cl = fbm7(vec2(w.x*5., w.y*14.) + 1.);
  float hb = rid(vec2(w.x*14., w.y*40.) + 5.), dust = clamp(band*(.6 + .7*cl)*(.75 + .35*hb), 0., 1.);
  col = mix(col, vec3(.07, .045, .035) + vec3(.05, .03, .02)*fbm(w*40.), dust*.95);
  col += vec3(.8, .55, .35)*band*smoothstep(.28, .45, cl)*(1. - smoothstep(.45, .62, cl))*.7*(.6 + .6*hb);   // bordes del polvo, con hebras finas
  col += vec3(.95, .9, .85)*smoothstep(.85, .95, fbm7(vec2(w.x*20., w.y*50.) + 2.))*band*(1. - dust)*.8;   // estrellas que asoman entre el polvo
  col += vec3(.95, .93, 1.)*starsD(q, 2.6, .35*(1. - dust), .8);
  return col*(1. + .2*uBeat);
}
vec3 sombGlobs(vec2 q){
  vec2 d = sceneD(q, .003) - vec2(0., .3);
  vec3 col = sombGalaxy(rot(-.08)*d, 1.3)*.8*(.85 + .3*fbm7(d*30.)) + vec3(.9, .87, .9)*exp(-length(d*vec2(1., 1.3))*3.)*.3;   // el halo del Sombrero
  return col + globs(q, .6, .08)*.9 + globs(q*1.7 + 50., .45, .11)*.5 + globs(q*2.6 + 9., .4, .06)*.35;   // tiene unos 2000 cúmulos globulares
}
vec3 sombCore(vec2 q){
  vec2 d = sceneD(q, .002) - vec2(0., .25); float r = length(d*vec2(1., 1.4));
  vec3 col = vec3(.9, .88, .98)*(exp(-r*7.)*.7 + exp(-r*r*160.)*1.6);
  float a = atan(d.y, d.x);
  col += vec3(.95, .92, 1.)*pow(.5 + .5*cos(a*10. + fbm(vec2(a, uT*.2))*3.), 6.)*exp(-r*5.)*.25;
  col += vec3(.9, .88, .98)*exp(-pow(d.y/.008, 2.))*exp(-abs(d.x)*4.)*.6;
  col *= .88 + .25*fbm7(d*34.);
  col += sombGalaxy(rot(-.08)*(d + vec2(0., .04)), 2.3)*.6;
  return col + vec3(1., .95, .9)*starsD(q, 2.2, .8*exp(-r*5.), 1.) + globs(q*1.3 + 20., .25, .06)*.5;
}
`;

export { GX_SOMBRERO };
