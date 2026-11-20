// ---------- Escanear: el planeta gira, se encoge y aparecen sus datos reales ----------
let scanOn = false, scanK = 0, pRot = 0, scanLineT = 0, scanApplyAt = 0;
// cómo se siente cada característica en el juego: una palabra y su efecto (los números reales van debajo)
function statWords(k, v){
  if (k === 'size') return v <= -10 ? ['Pequeño', 'pasa fácil por los huecos'] : v >= 10 ? ['Grande', 'más difícil de esquivar'] : ['Normal', 'como la Tierra'];
  if (k === 'vel') return v <= -10 ? ['Lento', 'salta flotando'] : v >= 5 ? ['Rápido', 'salta al instante'] : ['Normal', 'como la Tierra'];
  return v <= -30 ? ['Frágil', 'el agujero negro lo alcanza antes'] : v <= -8 ? ['Algo frágil', 'aguanta un poco menos'] : ['Firme', 'aguanta cerca del agujero negro'];
}
const STAT_ROWS = [
  ['size', 'Tamaño', v => v <= -10 ? 'Pequeño: pasa fácil por los huecos' : v >= 10 ? 'Grande: más difícil de esquivar' : 'Como la Tierra', P => 'Diámetro real: ' + P.d, v => v < 0],
  ['vel', 'Velocidad', v => v <= -10 ? 'Lento: salta flotando' : v >= 5 ? 'Rápido: salta al instante' : 'Salto normal', P => 'Velocidad en su órbita: ' + P.v, v => v > 0],
  ['res', 'Resistencia', v => v <= -30 ? 'Frágil: el agujero negro lo alcanza antes' : v <= -8 ? 'Algo frágil' : 'Firme cerca del agujero negro', P => 'Densidad real: ' + P.rho, v => v > 0],
];
function scanHTML(P){
  const rows = STAT_ROWS.map(([k, lab, hint, dat, good], i) => {
    const v = P.st[k], cls = v === 0 ? '#ece6d8' : good(v) ? '#7ad38a' : '#ff8a4d';
    return '<div class="srow"><div class="shead"><span>' + lab + '<small>' + hint(v) + '</small></span><span class="sval" style="color:' + cls + '">' + (v > 0 ? '+' : '') + v + ' %</span></div>' +
      '<div class="sdat">' + dat(P) + '</div><div class="sbar"><b></b><i data-v="' + v + '" style="background:' + cls + ';transition-delay:' + (i*.15) + 's"></i></div></div>';
  }).join('');
  const ch = P.st.charge, chCol = ch < 3 ? '#7ad38a' : ch > 3 ? '#ff8a4d' : '#ece6d8';
  const charge = '<div class="srow"><div class="shead"><span>Carga<small>Perfectos para tu poder</small></span><span class="sval" style="color:' + chCol + '">' + ch + '</span></div>' +
    '<div class="sdat">Un día allí dura ' + P.day + ': mientras más rápido gira, más rápido carga</div><div class="spips">' + Array.from({length: ch}, (_, i) => '<i class="on" style="transition-delay:' + (.45 + i*.08) + 's"></i>').join('') + '</div></div>';
  const soon = '';
  return '<div class="sname">' + P.name + '</div>' + rows + charge +
    '<div class="spower"><div class="spk">PODER ESPECIAL</div><div class="spn">' + P.power[0] + '</div><div class="spd">' + P.power[1] + '</div><div class="spf">' + P.power[2] + '</div>' + soon + '</div>' +
    '<button type="button" class="sclose">Cerrar escaneo</button>';
}
// las barras crecen desde el centro (la Tierra) cuando el planeta termina de encogerse
function applyScanBars(){
  if (!elPl || !elPl.querySelectorAll || !elPl.querySelector) return;
  elPl.querySelectorAll('.sbar i').forEach(i => { const v = Math.max(-50, Math.min(50, Number(i.dataset.v))); i.style.width = Math.abs(v) + '%'; i.style.left = (v >= 0 ? 50 : 50 - Math.abs(v)) + '%'; });
  elPl.querySelectorAll('.spips i').forEach(i => { i.style.opacity = '1'; });
  const pw = elPl.querySelector('.spower'); if (pw) setTimeout(() => pw.classList.add('on'), 650);
}
function uiScan(){
  if (!AC || muted) return;
  try{
    const n = AC.currentTime, out = uiOut();
    const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(140, n); o.frequency.exponentialRampToValueAtTime(1300, n + .7);
    g.gain.setValueAtTime(.0001, n); g.gain.exponentialRampToValueAtTime(.06, n + .35); g.gain.exponentialRampToValueAtTime(.0001, n + .75); o.connect(g); g.connect(out); o.start(n); o.stop(n + .8);
    [0, 3, 7, 12].forEach((sm, i) => uiTone(ROOT*2*Math.pow(2, sm/12), n + .75 + i*.15, .6, .035));
  }catch(e){}
}
function setScan(on){
  scanOn = on; scanLineT = 0;
  if (elPl) elPl.classList.toggle('scanning', on);
  if (on){ uiScan(); scanApplyAt = performance.now() + 650; }
}

