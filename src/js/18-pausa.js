// ---------- pausa ----------
// Todo se congela de verdad: el juego deja de avanzar y el sonido se suspende (la música sigue justo donde quedó, al ritmo).
// Se ve como la pantalla de "Escapaste": la misma letra, los mismos tres botones. Al seguir, una cuenta 3·2·1 para no volver de golpe.
let paused = false, pzCount = null, pzPanelCls = '', pzDrag = null, pzAC = null;
const PZ_ICO = {
  re: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12a7 7 0 1 1-2.05-4.95" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 4.5v4h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lv: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.6" fill="currentColor"/><circle cx="12" cy="12" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="9.6" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".55"/></svg>',
  go: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
  mus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>',
  sfx: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>'
};
const STAR_PATH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>';
function pzVolHTML(k, ico, lb, v){ return '<div class="pz-vol' + (k === 'sfx' ? ' fx' : '') + (v <= 0 ? ' zero' : '') + '" data-vol="' + k + '"><button type="button" class="ico" data-pz="mute-' + k + '" aria-label="' + lb + ': silenciar o activar">' + ico + '</button><span class="lb">' + lb + '</span>' +
  '<span class="line" style="--v:' + v + '%" role="slider" aria-label="Volumen de ' + lb + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(v) + '"><i></i><b></b></span><span class="val">' + Math.round(v) + '</span></div>'; }
function pauseGame(){
  if (paused || state !== 'play') return;
  paused = true; gest = null; pending = false;
  try{ if (AC && AC.state === 'running') AC.suspend(); }catch(e){}
  buzz(12); pzSnd('open');
  const g = curGoal(), v = Math.min(level, g), bst = tutorial ? 0 : Math.min(bestOf(lvl), g), L = LEVELS[lvl] || LEVELS[0];
  const cr = !tutorial && COIN_RINGS[lvl] ? [...COIN_RINGS[lvl]] : [], gotS = new Set(lvStarsGot(lvl)); for (const [k, r] of rings) if (r.coin && r.coin.got) gotS.add(k);
  const nSt = cr.filter(k => gotS.has(k)).length;
  pzPanelCls = elPanel.className;
  elPanel.className = 'wscr pzp';
  elPanel.innerHTML = '<div class="title wtit">Pausa</div><div class="wtries">' + (tutorial ? 'Tutorial' : L.name) + ' · anillo ' + v + ' de ' + g + '</div>' +
    '<div class="pz-trip" style="--p:' + (v/g*100).toFixed(1) + '%;--r:' + (bst/g*100).toFixed(1) + '%"><span class="bh"></span><span class="line"><i></i>' + (bst > 0 && bst < g ? '<u class="rec"></u>' : '') + '<b class="me"></b></span><span class="exit"></span></div>' +
    (cr.length ? '<div class="wstars" aria-label="Estrellas: ' + nSt + ' de ' + cr.length + '">' + cr.map((k, i) => '<span class="' + (gotS.has(k) ? 'on' : '') + '" style="animation-delay:' + (.3 + i*.07).toFixed(2) + 's">' + STAR_PATH + '</span>').join('') + '</div>' : '') +
    '<div class="wact"><button type="button" class="wico" data-pz="again" aria-label="Reintentar">' + PZ_ICO.re + '</button><button type="button" class="wgo" data-pz="go" aria-label="Seguir">' + PZ_ICO.go + '</button><button type="button" class="wico" data-pz="levels" aria-label="Niveles">' + PZ_ICO.lv + '</button></div>' +
    '<div class="pz-sl">' + pzVolHTML('mus', PZ_ICO.mus, 'Música', volMus) + pzVolHTML('sfx', PZ_ICO.sfx, 'SFX', volSfx) + '</div>';
  if (document.body && document.body.classList) document.body.classList.add('paused');
}
function pzClose(){
  elPanel.className = pzPanelCls || 'hide'; elPanel.innerHTML = '';
  if (document.body && document.body.classList) document.body.classList.remove('paused');
}
let pzBus = null, pzNoise = null, pzHoverT = 0, pzLastV = {};
function pzCtx(){
  if (!pzAC){ pzAC = new (window.AudioContext || window.webkitAudioContext)();
    const out = pzAC.createGain(), comp = pzAC.createDynamicsCompressor(), dl = pzAC.createDelay(1), fb = pzAC.createGain(), wet = pzAC.createGain();
    out.gain.value = .6; dl.delayTime.value = .27; fb.gain.value = .35; wet.gain.value = .45;   // el mismo eco de los botones del juego
    pzBus = pzAC.createGain(); pzBus.connect(out); pzBus.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(out); out.connect(comp); comp.connect(pzAC.destination);
    const len = pzAC.sampleRate; pzNoise = pzAC.createBuffer(1, len, pzAC.sampleRate); const d = pzNoise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random()*2 - 1; }
  if (pzAC.state === 'suspended') pzAC.resume();
  pzBus.gain.value = volGain(volSfx);
  return pzAC;
}
function pzTone(semi, t0, dur, gain, type){   // una nota de cristal (la misma que uiTone)
  const A = pzAC, o = A.createOscillator(), g = A.createGain(), lp = A.createBiquadFilter();
  o.type = type || 'sine'; o.frequency.value = ROOT*Math.pow(2, semi/12); lp.type = 'lowpass'; lp.frequency.value = 3200;
  g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + .006); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  o.connect(lp); lp.connect(g); g.connect(pzBus); o.start(t0); o.stop(t0 + dur + .05);
}
function pzAir(t0, dur, f0, f1, gain, type){   // un soplo de aire filtrado
  const A = pzAC, src = A.createBufferSource(), f = A.createBiquadFilter(), g = A.createGain();
  src.buffer = pzNoise; src.loop = true; f.type = type || 'bandpass'; f.Q.value = .9; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + dur*.25); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(pzBus); src.start(t0); src.stop(t0 + dur + .05);
}
function pzSub(t0, f0, f1, dur, gain){ const A = pzAC, o = A.createOscillator(), g = A.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + .015); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur); o.connect(g); g.connect(pzBus); o.start(t0); o.stop(t0 + dur + .05); }
function pzSnd(kind, v){
  if (muted) return;
  try{ pzCtx(); const n = pzAC.currentTime + .005;
    if (kind === 'open'){   // el tiempo se detiene: el aire baja, tres notas de cristal que caen y un golpe grave
      pzAir(n, .55, 3200, 260, .2, 'lowpass'); pzSub(n, 140, 46, .5, .3);
      pzTone(19, n, 1.2, .06); pzTone(15, n + .07, 1.2, .05); pzTone(12, n + .14, 1.6, .055); pzTone(24, n + .14, .7, .012);
    } else if (kind === 'go'){   // seguir: notas que suben, con brillo
      pzTone(12, n, 1, .06); pzTone(19, n + .06, 1.1, .05); pzTone(24, n + .12, 1.3, .045); pzAir(n, .4, 400, 4200, .1);
    } else if (kind === 'count'){   // cada número de la cuenta (v = 3, 2, 1)
      const s = {3: 12, 2: 15, 1: 19}[v] || 12; pzTone(s, n, .55, .075); pzTone(s + 12, n, .3, .018); pzSub(n, 110, 70, .14, .14);
    } else if (kind === 'launch'){   // vuelve el juego: un destello y el grave que te lanza
      pzTone(24, n, .9, .05); pzTone(31, n + .03, .7, .02); pzAir(n, .35, 6000, 1200, .12, 'highpass'); pzSub(n, 70, 140, .22, .2);
    } else if (kind === 'again'){   // reintentar: un rebobinado corto
      pzAir(n, .32, 300, 3800, .16); pzTone(7, n, .5, .05); pzTone(12, n + .08, .7, .055); pzSub(n + .02, 60, 110, .2, .18);
    } else if (kind === 'levels'){   // niveles: el mismo cristal que las flechas del juego, de regreso
      pzTone(19, n, 1.1, .06); pzTone(12, n + .07, 1.3, .055); pzTone(24, n + .07, .7, .015);
    } else if (kind === 'mute'){ pzTone(12, n, .4, .045); pzTone(5, n + .06, .6, .04);
    } else if (kind === 'unmute'){ pzTone(5, n, .4, .04); pzTone(12, n + .06, .6, .05);
    } else if (kind === 'slide'){   // al arrastrar: una nota que sube con el volumen (en la escala del juego)
      const sc = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24], s = sc[Math.min(sc.length - 1, Math.round(v/100*(sc.length - 1)))];
      pzTone(s, n, .35, .02 + .045*v/100); pzTone(s + 12, n, .18, .008);
    } else if (kind === 'hover'){ const now = performance.now(); if (now - pzHoverT < 60) return; pzHoverT = now; const nt = [0, 3, 7, 10, 12, 15]; pzTone(nt[Math.floor(Math.random()*nt.length)] + 12, n, .9, .04); }
  }catch(e){}
}
function pzTick(i){ pzSnd('count', i); }
function resumeGame(){
  if (!paused || pzCount || !document.body.classList.contains('paused')) return;
  pzClose();
  let el = document.getElementById('pzcount'); if (!el){ el = document.createElement('div'); el.id = 'pzcount'; el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
  const quick = reduceMotion; let n = quick ? 1 : 3;
  const show = () => { el.innerHTML = '<i></i><b>' + n + '</b>' + (n === 3 ? '<u>Prepárate</u>' : ''); pzTick(n); buzz(8); };
  show();
  pzCount = setInterval(() => {
    n--;
    if (n > 0){ show(); return; }
    clearInterval(pzCount); pzCount = null; el.innerHTML = ''; pzSnd('launch');
    paused = false; last = performance.now();
    try{ if (AC && AC.state === 'suspended') AC.resume(); }catch(e){}
  }, 620);
}
function pzLeave(){   // salir de la pausa sin cuenta (para reintentar o ir a los niveles)
  if (pzCount){ clearInterval(pzCount); pzCount = null; const el = document.getElementById('pzcount'); if (el) el.innerHTML = ''; }
  pzClose(); paused = false; last = performance.now();
  try{ if (AC && AC.state === 'suspended') AC.resume(); }catch(e){}
}
function pzSetVol(k, v, row){
  v = Math.max(0, Math.min(100, Math.round(v)));
  { const step = Math.round(v/10); if (pzDrag && pzLastV[k] !== step){ pzLastV[k] = step; pzSnd('slide', v); } }
  if (k === 'mus') volMus = v; else volSfx = v;
  if (row){ const ln = row.querySelector('.line'), val = row.querySelector('.val'); if (ln){ ln.style.setProperty('--v', v + '%'); ln.setAttribute('aria-valuenow', String(v)); } if (val) val.textContent = String(v); row.classList.toggle('zero', v <= 0); }
  applyVolumes(); saveVolumes();
}
const pzPrev = {mus: 100, sfx: 100};
function pausePress(e){
  if (pzCount) return;
  const tg = e && e.target && e.target.closest ? e.target : null; if (!tg){ return; }
  const b = tg.closest('[data-pz]'), row = tg.closest('.pz-vol');
  if (e.cancelable) e.preventDefault();
  if (b){ const A = b.dataset.pz;
    if (A === 'go'){ pzSnd('go'); setTimeout(resumeGame, 140); }
    else if (A === 'again'){ pzSnd('again'); pzLeave(); start(); sesTries++; showTry(0); }
    else if (A === 'levels'){ pzSnd('levels'); pzLeave(); state = 'menu'; stopMusic(true); openLevels(); }
    else if (A === 'mute-mus' || A === 'mute-sfx'){ const k = A.slice(5), cur = k === 'mus' ? volMus : volSfx; if (cur > 0){ pzPrev[k] = cur; pzSnd('mute'); pzSetVol(k, 0, row); } else { pzSetVol(k, pzPrev[k] || 80, row); pzSnd('unmute'); } buzz(6); }
    return; }
  if (row && tg.closest('.line')){ const ln = row.querySelector('.line'), r = ln.getBoundingClientRect();
    pzDrag = {k: row.dataset.vol, row, x0: r.left, w: r.width, id: e.pointerId}; row.classList.add('drag');
    pzSetVol(pzDrag.k, (e.clientX - r.left)/r.width*100, row); }
}
window.addEventListener('pointermove', e => { if (!pzDrag || (e.pointerId !== undefined && pzDrag.id !== undefined && e.pointerId !== pzDrag.id)) return; pzSetVol(pzDrag.k, (e.clientX - pzDrag.x0)/pzDrag.w*100, pzDrag.row); });
const pzEnd = () => { if (pzDrag){ pzDrag.row.classList.remove('drag'); pzLastV[pzDrag.k] = null; pzDrag = null; buzz(6); } };
window.addEventListener('pointerup', pzEnd); window.addEventListener('pointercancel', pzEnd);
// si sales de la app o te llaman, el juego se pausa solo
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play' && !paused) pauseGame(); });

