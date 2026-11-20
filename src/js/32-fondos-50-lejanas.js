// ┌─ 32-fondos-50-lejanas.js
// │ da:     GX_BASE
// │ lo usan: 32-fondos-56-final
// │ usa:    (nada de otros archivos)
// └─ generado por `node build.mjs --deps`; no se edita a mano
// Galaxias lejanas (niveles 4 a 8): lo que comparten sus fondos (estrellas, cúmulos, meteoros, destellos)
const GX_BASE = `
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
`;
