(function(){
const DT = 1/60;
function gauss(){ let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
// ¿saltar dentro de tau segundos (de juego) sería seguro? simula el salto cuadro a cuadro con la misma regla de choque que update()
function safeAt(tau){
  const k = level + 1, ring = rings.get(k); if (!ring) return true;
  const dur = jumpDur(), hitP = PR*sizeK(), ang = -Math.PI/2;
  let cam = camLevel; const nW = Math.round(tau/DT);
  for (let i = 0; i < nW; i++) cam += (level - cam)*Math.min(1, DT*6);
  let jt = 0;
  for (let f = 0; f < 60; f++){
    jt += DT; const p = Math.min(jt/dur, 1), pl = level + (1 - Math.pow(1 - p, 3));
    cam += (level - cam)*Math.min(1, DT*6);
    const tt = t + tau + jt;
    const ph = ring.sync ? ring.w*tt : ring.phase + ring.w*(tau + jt);
    const pr = R0 + (pl - cam)*GAP, R = R0 + (k - cam)*GAP, px = Math.cos(ang)*pr, py = Math.sin(ang)*pr;
    for (const o of ring.obs){
      const oa = o.a + (o.dir || 1)*ph;
      let rad = o.r; if (ring.type === 'respiracion'){ const x = frac(tt/(4*TB)), sz = .5 - .5*Math.cos(2*Math.PI*x); rad = o.r*(.3 + .7*sz); }
      const Rp = ring.type === 'nova' ? R + novaPush({na: ring.na, phase: ph}, oa, tt) : R;
      if (Math.hypot(px - Math.cos(oa)*Rp, py - Math.sin(oa)*Rp) < hitP + rad*.66) return false;
    }
    if (novaSrc.length && novaHit(px, py, tt, cam)) return false;
    if (p >= 1) break;
  }
  return true;
}
window.__safe = safeAt;
function waveThreat(){ return waves.some(w => !w.over && !w.safe && !w.hitDone && level < w.L); }
// un jugador completo: varios intentos hasta ganar o rendirse
return function play(P, lv, maxAtt){
  lvl = lv; tutorial = false; curPlanet = 'tierra'; seenTypes = {}; readyHintDone = true;
  const deathsAt = {}; let best = 0, noProg = 0, waveAware = P.waveAware0, totalT = 0, attemptsLog = [];
  for (let a = 1; a <= maxAtt; a++){
    start(); hot = 0;
    const learn = Math.max(P.floor, Math.pow(P.learnRate, a - 1));
    let wseen = 0, wsafe = 0, rolled = -1, rushNow = false, plan = null, T0 = t, frames = 0, cause = null, hits = 0, hotWas = 0, dj = 0;
    while (frames < 60*240){
      frames++;
      if (state === 'play' && !jumping && !pushing){
        const urgent = (waveAware && waveThreat()) || dangerNow() > P.panicAt;
        if (P.dj && charge >= chargeMax() && level + 2 <= curGoal() && (urgent || Math.random() < .004)){ doubleJump(); plan = null; dj++; }
        else if (!plan){
          // decide cuándo saltar
          const tmin = P.react*(.85 + .3*Math.random());
          if (rolled !== level){ rolled = level; rushNow = Math.random() < P.rush; }   // el impulso se decide una vez por anillo
          if (rushNow) { plan = t + tmin; rushNow = false; }
          else {
            const N = 360, s = []; for (let i = 0; i < N; i++) s.push(safeAt(tmin + i*DT));
            const need = urgent ? 2 : Math.round(P.margin/DT); let i = 0, pick = null, first = null;
            while (i < N){ if (!s[i]){ i++; continue; } let j = i; while (j < N && s[j]) j++; const len = j - i;
              if (first === null) first = [i, len]; if (len >= need){ pick = [i, len]; break; } i = j; }
            if (!pick) pick = first;
            if (pick){ const off = Math.min(pick[1]/2, P.aimMax/DT), tau = tmin + (pick[0] + off)*DT; plan = t + tau + gauss()*(P.weber || 0)*Math.min(tau, .6); }
            else plan = null;
          }
          if (plan !== null){ const k = level + 1, sg = P.sigma*learn*Math.max(.55, 1 - .12*(deathsAt[k] || 0)); plan += gauss()*sg; plan = Math.max(plan, t + .02); }
        }
        if (plan !== null && t >= plan){ jump(); plan = null; }
      }
      update(DT);
      for (const w of waves){ if (w.released && !w.__c){ w.__c = 1; wseen++; } if (w.safe && !w.__s){ w.__s = 1; wsafe++; } }
      if (hot && !hotWas){ hotWas = 1; waveAware = true; hits++; }
      if (state === 'dead'){ cause = swallow ? 'agujero' : (culprit ? 'asteroide' : 'onda'); break; }
      if (state === 'win'){ cause = 'gano'; break; }
    }
    const ring = cause === 'gano' ? GOAL : level, dur = t - T0; totalT += dur + (cause === 'agujero' ? 2.4 : .85);
    if (cause === 'asteroide') deathsAt[level + 1] = (deathsAt[level + 1] || 0) + 1;
    attemptsLog.push([ring, cause, Math.round(dur*10)/10, hits, dj, wseen, wsafe]);
    if (cause === 'gano') return {won: true, attempts: a, time: totalT, log: attemptsLog};
    if (ring > best){ best = ring; noProg = 0; } else noProg++;
    const pq = P.q0 + P.q1*Math.min(noProg, 25);
    if (Math.random() < pq) return {won: false, quit: true, attempts: a, time: totalT, best, log: attemptsLog};
  }
  return {won: false, quit: false, attempts: maxAtt, time: totalT, best, log: attemptsLog};
};
})()
