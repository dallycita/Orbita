// Nombres del juego que usan las pruebas (huella, audio, rendimiento, bot).
// El estado del juego vive agrupado en objetos (`run.level`, `effects.shake`…). Las escenas de las pruebas se escribieron
// con los nombres sueltos (`level`, `shake`) y deben funcionar igual con el código de `antes-de-limpieza`, que tiene los
// nombres sueltos. Por eso el evaluador de las pruebas traduce: si el objeto existe, `level` es `run.level`; si no
// existe (código anterior), `level` es la variable de siempre.
export const GROUPS = {
  camera: ['camLevel'],
  run: ['rings', 'level', 'pLevel', 'pAng', 'jumping', 'jumpT', 'combo', 'lastLand', 'score', 'astFade', 'appear',
    'charge', 'jumpTarget', 'crossed', 'lvl', 'runRecord', 'newRec'],
  records: ['best', 'bestRing', 'best2', 'attempts2', 'best3', 'attempts3', 'attempts'],
  effects: ['shake', 'flash', 'pulse', 'particles', 'trail', 'texts', 'burns', 'landPop', 'holeFlare', 'chargeFlash',
    'readyT', 'debris'],
  hole: ['sunLevel', 'lastEaten', 'swallow'],
  time: ['t', 'timeScale', 'slowTimer'],
  outcome: ['winT', 'deadT', 'canRestart', 'culprit', 'culpritT', 'streak', 'jumpClear', 'perfCount'],
  tutorialState: ['tutorial', 'tutorialDone', 'showHint', 'hintT', 'hintsShown', 'readyHintDone'],
  input: ['gest', 'pending', 'pendingT'],
  settings: ['muted', 'volMus', 'volSfx'],
};

// Código que se pone al final del juego (dentro de su función) en el armado de pruebas: `window.__ev(s)` evalúa
// `s` con los nombres del juego a la vista, traducidos según GROUPS.
export function testHook(){
  const map = {};
  for (const [obj, fields] of Object.entries(GROUPS)) for (const f of fields) map[f] = obj;
  const getters = Object.keys(GROUPS).map(o => `${JSON.stringify(o)}: () => typeof ${o} !== 'undefined' && ${o} && typeof ${o} === 'object' ? ${o} : undefined`).join(', ');
  return `const __map = ${JSON.stringify(map)}, __objs = {${getters}};
  const __owner = k => Object.prototype.hasOwnProperty.call(__map, k) ? __objs[__map[k]]() : undefined;
  const __alias = new Proxy({}, {
    has: (o, k) => typeof k === 'string' && __owner(k) !== undefined,
    get: (o, k) => k === Symbol.unscopables ? undefined : __owner(k)[k],
    set: (o, k, v) => { __owner(k)[k] = v; return true; },
  });
  window.__ev = s => { with (__alias) { return eval(s); } };`;
}
