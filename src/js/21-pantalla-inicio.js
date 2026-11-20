// ---------- pantalla de inicio (como Geometry Dash): se queda hasta que eliges ----------
const elHome = document.getElementById('home');
let muted = false;
try{ muted = localStorage.getItem('orbita_p1_sonido') === '0'; }catch(e){}
function applyMute(){ if (AC && outBus){ try{ outBus.gain.setValueAtTime(muted ? 0 : .6, AC.currentTime); }catch(e){} } }
let storyReturn = null;   // a dónde volver después de ver la historia desde un menú
function hasNewPlanet(){ try{ return localStorage.getItem('orbita_pl_nuevo') === '1'; }catch(e){ return false; } }
function renderHome(){
  if (!elHome) return;
  elHome.innerHTML =
    '<div class="playrow"><button type="button" class="plan' + (hasNewPlanet() ? ' new' : '') + '" data-h="planets" aria-label="Elegir planeta"><span class="orb"></span><svg viewBox="0 0 100 100" aria-hidden="true">' + PLANET_SVG.saturno + '</svg><span class="plabel">PLANETAS</span></button>' +
    '<button type="button" class="bigplay" data-h="play" aria-label="Jugar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="#fff"/></svg></button><button type="button" class="plan mis' + (misReady() ? ' new' : '') + '" data-h="missions" aria-label="Misiones"><svg viewBox="0 0 100 100" aria-hidden="true">' + misMoons() + '</svg><span class="plabel">MISIONES</span></button></div>' +
    '<div class="playlbl">JUGAR</div>' +
    '<div class="row"><button type="button" class="sm" data-h="story">Historia</button><button type="button" class="sm" data-h="cfg">Ajustes</button></div>' +
    '<div class="sheet" role="dialog" aria-label="Ajustes"><h3>Ajustes</h3>' +
    '<button type="button" class="opt" data-h="snd"><span>Sonido</span><b>' + (muted ? 'Apagado' : 'Encendido') + '</b></button>' +
    '<button type="button" class="opt" data-h="allp"><span>Todos los planetas (pruebas)</span><b>' + (allPlanets ? 'Sí' : 'No') + '</b></button>' +
    '<button type="button" class="opt danger" data-h="reset"><span>Borrar progreso</span><b>Empezar de cero</b></button>' +
    '<button type="button" class="opt" data-h="close" style="justify-content:center"><span>Cerrar</span></button></div>';
  if (!elHome.querySelectorAll) return;
  elHome.querySelectorAll('[data-h]').forEach(b => b.addEventListener('click', () => homeAction(b.dataset.h, b)));
}
function homeAction(a, b){
  initAudio(); if (AC && AC.state === 'suspended') AC.resume(); applyMute();
  const sheet = elHome.querySelector ? elHome.querySelector('.sheet') : null;
  if (a === 'play'){ if (!storySeen){ hideHome(); startIntro(); } else { hideHome(true); openLevels(); } }
  else if (a === 'story'){ hideHome(); storyReturn = 'home'; startIntro(); }
  else if (a === 'tut'){ hideHome(); tutAfterStory = true; startIntro(); }
  else if (a === 'cfg'){ if (sheet) sheet.classList.add('on'); }
  else if (a === 'planets'){ openPlanets(); }
  else if (a === 'missions'){ openMissions(); }
  else if (a === 'allp'){ allPlanets = !allPlanets; try{ localStorage.setItem('orbita_p1_todos', allPlanets ? '1' : '0'); }catch(e){} const v = b.querySelector('b'); if (v) v.textContent = allPlanets ? 'Sí' : 'No'; }
  else if (a === 'close'){ if (sheet) sheet.classList.remove('on'); }
  else if (a === 'snd'){ muted = !muted; try{ localStorage.setItem('orbita_p1_sonido', muted ? '0' : '1'); }catch(e){} applyMute(); const v = b.querySelector('b'); if (v) v.textContent = muted ? 'Apagado' : 'Encendido'; }
  else if (a === 'reset'){
    const v = b.querySelector('b');
    if (!b.dataset.sure){ b.dataset.sure = '1'; if (v){ v.textContent = '¿Seguro? Toca otra vez'; v.style.color = 'var(--sun)'; } return; }
    hideHome(); resetProgress();
  }
}
function hideHome(keepAmb){ if (elHome) elHome.classList.add('off'); if (!keepAmb) homeAmbience(false); showStop(.3); }
function openHome(withIntro){
  if (elLv) elLv.classList.add('off');
  tutorial = false; pendingTut = false; introDrone(false);
  setup(); state = 'home';
  renderHome();
  homeT = withIntro ? 0 : HOME_IN; logoT0 = withIntro ? HOME_BIG + .45 : -99; hsEvents = {}; hsFlare = hsBoost = hsShake = hsJet = hsRipple = 0;
  if (withIntro) showStart();
  if (elHome){ if (homeT >= HOME_IN) elHome.classList.remove('off'); else elHome.classList.add('off'); }
  elPanel.classList.add('hide'); elHud.style.opacity = 0;
  stopMusic(); applyMute(); homeAmbience(true);
}

