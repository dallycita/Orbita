// ---------- fondos en WebGL: capas, movimiento, gas y la luz doblada por el agujero negro ----------
// Se dibuja con la tarjeta gráfica a media resolución (el gas es suave) y se copia al lienzo del juego.
const GLBG = (() => {
  let cv = null, gl = null, progs = {}, buf = null, failed = false, flow = 0, photoTex = {}, lastKey = '';
  const VS = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }';
  const COMMON = `
precision highp float;
uniform vec2 uRes; uniform float uT, uFlow, uBeat, uJour; uniform vec3 uBH; uniform vec4 uWH; // xy: centro (px), z: radio de Einstein (px)
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
vec2 h22(vec2 p){ float n = h21(p); return vec2(n, h21(p + n)); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 5; i++){ s += a*vn(p); p = m*p; a *= .5; } return s; }
// lente gravitacional de una masa puntual: lo que ves en x viene de la posición b = x·(1 − θE²/|x|²)
vec2 lens(vec2 q, out float amp){ amp = 1.; return q; }   // sin deformación del fondo
// estrellas en una rejilla: cada celda tiene una estrella con brillo y color propios
vec3 stars(vec2 q, float sc, float dens){
  vec2 g = q/sc, id = floor(g), f = fract(g); vec3 c = vec3(0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
    vec2 o = vec2(x, y), cid = id + o; float n = h21(cid); if (n > dens) continue;
    vec2 sp = o + h22(cid*1.7); float dd = length(f - sp)*sc;
    float b = pow(h21(cid + 7.1), 6.)*1.4 + .15, tw = .75 + .25*sin(uT*(1. + 3.*n) + n*40.);
    vec3 col = mix(vec3(1., .82, .65), vec3(.7, .82, 1.), h21(cid + 3.3));
    c += col*b*tw*exp(-dd*dd*1.6);
  }
  return c;
}
`;
  // Andrómeda: disco inclinado ~77°, núcleo de estrellas viejas, brazos azules, franjas de polvo, regiones rosadas, M32 y M110
  const FS_AND = COMMON + `
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
  // fondo con fotografía: la foto real en capas, con la luz doblada por el agujero negro
  // Sistema solar: la Vía Láctea como en una foto de cielo profundo (muchísimas estrellas, polvo oscuro, nebulosas rojizas)
  // y, al salir del sistema solar, la galaxia vista desde fuera con sus brazos espirales
  const FS_MW = COMMON + `
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
  // Nubes de Magallanes: el viaje pasa por sus lugares reales
  const FS_LMC = COMMON + `
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
  // Andrómeda: el viaje pasa por sus lugares reales, de las afueras al núcleo
  const FS_AND2 = COMMON + `
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
  // Centaurus A, Remolino, Sombrero, M87 y Sagitario A*: escenas reales con los tonos medidos en fotos de Hubble, ESO, Webb y el EHT
  const FS_GX = COMMON + `
uniform float uScale; uniform float uKind;
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
vec2 sceneD(vec2 q, float drift){ return (q - .5*uRes)/uScale + vec2(.05*sin(uT*.05 + drift*300.), .07*sin(uFlow*drift*1.5 + uT*.04)); }
vec3 globs(vec2 q, float dens, float size){
  vec3 c = vec3(0.); vec2 g = (q + vec2(uT*4., uFlow*2.5))/(uRes.y*size), id = floor(g), f = fract(g);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
    vec2 o = vec2(x, y), cid = id + o; if (h21(cid + 13.) > dens) continue;
    vec2 pp = (f - o - h22(cid + 2.))*size*uRes.y; float r2 = dot(pp, pp), s = 1.2 + 2.6*h21(cid + 4.);
    c += mix(vec3(1., .86, .66), vec3(.95, .93, 1.), h21(cid + 6.))*(exp(-r2/(s*s))*.8 + exp(-r2/(s*s*.08))*.9)*(.85 + .15*sin(uT*2. + h21(cid)*30.));
  }
  return c;
}
float wfbm(vec2 p){ vec2 w = vec2(fbm(p + vec2(1.7, 9.2) + uT*.015), fbm(p + vec2(8.3, 2.8) - uT*.012)); return fbm7(p + 1.7*w); }   // gas con filamentos (ruido torcido)
// estrellas brillantes con halo de color y destellos en cruz (como en las fotos de telescopio)
vec3 starsB(vec2 q, float cell, float dens, float bmul){
  vec2 g = q/cell, id = floor(g), f = fract(g); vec3 c = vec3(0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
    vec2 o = vec2(x, y), cid = id + o; if (h21(cid + 17.) > dens) continue;
    vec2 pp = (f - o - h22(cid + 4.))*cell; float r2 = dot(pp, pp), k = .6 + .8*h21(cid + 2.);
    vec3 sc = mix(vec3(1., .74, .5), vec3(.62, .8, 1.), h21(cid + 8.)); float tw = .75 + .25*sin(uT*(2. + 3.*h21(cid)) + h21(cid)*20.);
    c += sc*k*(exp(-r2*.8)*1.5 + exp(-r2*.025)*.12 + (exp(-abs(pp.x)*1.1)*exp(-abs(pp.y)*.08) + exp(-abs(pp.y)*1.1)*exp(-abs(pp.x)*.08))*.1)*tw*bmul;
  }
  return c;
}
// fondo profundo: nubes de estrellas, estrellas brillantes con destello y galaxias lejanas diminutas (como en una foto de campo profundo)
vec3 deepField(vec2 q, float dens){
  vec2 p = q/uScale; float cloud = smoothstep(.35, .8, fbm7(p*2.2 + vec2(uFlow*.004, 3.)));
  vec3 c = vec3(.75, .72, .8)*cloud*.05;
  c += vec3(.95, .92, .9)*starsD(q + vec2(0., uFlow*1.8), 2.9, dens*(.16 + .45*cloud), .8);
  c += starsB(q + vec2(uT*2., uFlow*3.), uScale*.19, .24*dens, .7);
  vec2 g = (q + vec2(uT*1.5, uFlow*1.2))/(uScale*.09), id = floor(g), f = fract(g) - .5;
  if (h21(id + 41.) < .22*dens){ float ra = h21(id + 5.)*6.28; vec2 o0 = f - (h22(id + 3.) - .5)*.6, o = vec2(cos(ra)*o0.x - sin(ra)*o0.y, sin(ra)*o0.x + cos(ra)*o0.y); c += mix(vec3(1., .8, .55), vec3(.6, .75, 1.), h21(id + 9.))*exp(-dot(o*vec2(1., 2.6), o*vec2(1., 2.6))*700.)*.45; }
  return c;
}
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
// ===================== CENTAURUS A =====================
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
// ===================== REMOLINO M51 =====================
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
// ===================== SOMBRERO M104 =====================
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
// ===================== M87 =====================
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
// ===================== SAGITARIO A* =====================
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
// la Vía Láctea vista desde fuera: el regreso a casa
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
  const FS_PHOTO = COMMON + `
uniform sampler2D uImg; uniform vec2 uImgSize; uniform vec4 uFit; // xy: centro de la foto en pantalla (0-1), z: zoom
vec3 photo(vec2 q, float depth){
  float asp = uImgSize.x/uImgSize.y, sasp = uRes.x/uRes.y;
  vec2 uv = q/uRes; uv -= uFit.xy; uv /= uFit.z*(1. + depth*.04);
  if (sasp < asp) uv.x *= sasp/asp; else uv.y *= asp/sasp;
  uv = mat2(cos(uT*.003), -sin(uT*.003), sin(uT*.003), cos(uT*.003))*uv;
  uv += .5; if (uv.x < 0. || uv.y < 0. || uv.x > 1. || uv.y > 1.) return vec3(0.);
  vec3 c = texture2D(uImg, uv).rgb;
  float edge = smoothstep(0., .08, min(min(uv.x, uv.y), min(1. - uv.x, 1. - uv.y)));
  return c*edge;
}
void main(){
  vec2 q = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 dr = vec2(sin(uT*.05), cos(uT*.037))*uRes.y*.01;
  float A1, A2, A3; vec2 L1 = lens(q + dr*.3, A1), L2 = lens(q + dr, A2), L3 = lens(q + dr*2., A3);
  vec3 col = vec3(.01, .01, .025);
  col += stars(L1, 7., .45)*.4*A1;
  col = max(col, photo(L2, 0.)*A2);
  vec2 dq = L3 - uBH.xy; float rr = length(dq)/uRes.y, an = atan(dq.y, dq.x);
  vec2 lp = vec2(an*1.6, log(rr + .05)*2.2 - uFlow);
  float neb = fbm(lp + fbm(lp*1.7 + uT*.03)*1.4);
  col += vec3(.3, .32, .55)*pow(neb, 3.)*.35*smoothstep(.05, .35, rr);
  col += stars(L3 + vec2(0., uFlow*40.), 26., .18)*.8*A3;
  col *= 1. + uBeat*.08;
  gl_FragColor = vec4(col, 1.);
}`;
  function init(){
    if (gl || failed) return !!gl;
    try{
      if (!document.createElement) { failed = true; return false; }
      cv = document.createElement('canvas');
      gl = cv && cv.getContext && (cv.getContext('webgl', {preserveDrawingBuffer: true, antialias: false}) || cv.getContext('experimental-webgl', {preserveDrawingBuffer: true}));
      if (!gl || !gl.createShader){ gl = null; failed = true; return false; }
      buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      return true;
    }catch(e){ gl = null; failed = true; return false; }
  }
  function prog(name, fs){
    if (progs[name] !== undefined) return progs[name];
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)){ console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
    const v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f){ progs[name] = null; return null; }
    const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)){ progs[name] = null; return null; }
    const U = {}; ['uRes', 'uT', 'uFlow', 'uBeat', 'uJour', 'uSpd', 'uBand', 'uBH', 'uWH', 'uScale', 'uImg', 'uImgSize', 'uFit', 'uKind'].forEach(k => U[k] = gl.getUniformLocation(p, k));
    return progs[name] = {p, U};
  }
  // carga una fotografía (url o data:) como textura
  function photo(name, src){
    if (photoTex[name]) return photoTex[name];
    const rec = photoTex[name] = {ready: false, w: 1, h: 1, tex: null};
    if (src && src.getContext){ try{ rec.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, rec.tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      rec.w = src.width; rec.h = src.height; rec.ready = true; }catch(e){} return rec; }
    try{ const img = new Image(); img.onload = () => { if (!gl) return; rec.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, rec.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        rec.w = img.width; rec.h = img.height; rec.ready = true; }; img.src = src; }catch(e){}
    return rec;
  }
  // dibuja el fondo del nivel; devuelve false si no se pudo (y el juego usa el fondo anterior)
  function draw(kind, opts){
    if (!init()) return false;
    const p = kind === 'photo' ? prog('photo', FS_PHOTO) : kind === 'mw' ? prog('mw', FS_MW) : kind === 'lmc' ? prog('lmc', FS_LMC) : kind === 'and2' ? prog('and2', FS_AND2) : kind === 'gx' ? prog('gx', FS_GX) : prog('and', FS_AND); if (!p) return false;
    let rec = null; if (kind === 'photo'){ rec = photo(opts.name, opts.src); if (!rec.ready) return false; }
    const sc = (kind === 'mw' || kind === 'lmc' || kind === 'and2' || kind === 'gx') ? Math.min(window.devicePixelRatio || 1, 1.6, 2400/Math.max(W, H)) : Math.min(1, 900/Math.max(W, H)), w = Math.max(2, Math.round(W*sc)), h = Math.max(2, Math.round(H*sc));
    if (cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
    gl.viewport(0, 0, w, h); gl.useProgram(p.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    // el agujero negro y su anillo de Einstein (la luz se dobla más cerca de él)
    const Rg = Math.max(rr(sunLevel), SUN)*S;
    gl.uniform2f(p.U.uRes, w, h); gl.uniform1f(p.U.uT, t); gl.uniform1f(p.U.uFlow, flow); gl.uniform1f(p.U.uBeat, opts.beat || 0); if (p.U.uJour) gl.uniform1f(p.U.uJour, jour); if (p.U.uSpd) gl.uniform1f(p.U.uSpd, spd); if (p.U.uBand) gl.uniform1f(p.U.uBand, bandE);
    gl.uniform3f(p.U.uBH, CX*sc, CY*sc, Rg*1.9*sc);
    if (p.U.uWH){ const wh = opts.wh; if (wh) gl.uniform4f(p.U.uWH, wh[0]*sc, (H - wh[1])*sc, wh[2]*sc, wh[3]); else gl.uniform4f(p.U.uWH, 0, 0, 1, 0); }
    if (p.U.uScale) gl.uniform1f(p.U.uScale, Math.max(W, H)*sc*.9);
    if (p.U.uKind) gl.uniform1f(p.U.uKind, opts.kind || 0);
    if (rec){ gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, rec.tex); gl.uniform1i(p.U.uImg, 0); gl.uniform2f(p.U.uImgSize, rec.w, rec.h); gl.uniform4f(p.U.uFit, opts.fx || .5, opts.fy || .4, opts.zoom || 1.15, 0); }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(cv, 0, 0, W, H); ctx.restore();
    return true;
  }
  // cuánto "avanzas": lento siempre, más rápido al saltar y en la recta final
  let jour = 0, spd = 0, band = 0, bandE = 0;
  function advance(d, speed, target){ flow += d*speed; spd += (Math.min(speed, 3)/3 - spd)*Math.min(1, d*4); if (target !== undefined) jour += (target - jour)*Math.min(1, d*1.5); }
  // cambia de luz al ritmo de la canción: 15 entran los platillos, 28 el bombo, y el beat acelerado
  function setBand(target, d){ const st = d/6; band = band < target ? Math.min(target, band + st) : Math.max(target, band - st); const x = band - Math.floor(band), e = x*x*(3 - 2*x); bandE = Math.floor(band) + e; }
  function reset(){ jour = 0; band = bandE = 0; }
  return {draw, advance, reset, setBand, ok: () => init(), canvas: () => cv};
})();

// Remolino: método con fotografía real (mientras llega la foto, usa el dibujo actual como base)
let REMOLINO_PHOTO = '';
function remolinoSource(){ return REMOLINO_PHOTO || null; }   // sin foto todavía: se usa el fondo dibujado
