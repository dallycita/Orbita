/**
 * Shader GLSL de fondo hecho con una foto real, cuando el nivel tiene una. La foto gira muy
 * despacio y se acerca con la profundidad. Lo usa el motor de fondos (32-fondos-9-motor).
 */
import { BG_COMMON } from './common.js';

const FS_PHOTO =
  BG_COMMON +
  `
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

export { FS_PHOTO };
