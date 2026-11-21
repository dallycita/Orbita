# Inventario del código de Órbita

Estado del código en la etiqueta `antes-de-limpieza`. Lo medible (funciones, variables, qué usa y qué cambia cada archivo, estilo, azar, claves guardadas) sale del análisis del código (árbol de sintaxis), no de una lectura a ojo, para que no falte nada. El propósito de cada función sale de su comentario; las que no tienen comentario quedan marcadas y reciben su descripción en la Fase 16.

## Resumen

- 49 archivos, 7490 líneas, 373 funciones de nivel superior.
- Estilo: 2242 líneas de más de 100 caracteres; 4820 instrucciones que comparten línea con otra; 706 `if`/bucles sin llaves; 55 ternarios anidados.
- Azar: 168 llamadas a `Math.random()` y 26 a `rng()` (generador con semilla de los anillos). Su orden y cantidad son FIJOS.
- 113 líneas largas repetidas en dos o más lugares (lista al final).

**Cómo leer cada archivo:** *da* = lo que otros archivos usan de él; *usa* = lo que toma de otros; *cambia* = variables de otros archivos que este modifica (estado compartido sin dueño: lo más importante para la prioridad uno).

## fuera/00-iconos-flechas.js · 10 líneas

**Qué hace:** arco de gravedad para las flechas: medio anillo que se abre hacia donde vas, con una pincelada naranja / al tocar una flecha, el arco naranja da una vuelta, como algo que entra en órbita

**Da:** `CHEV_L`, `ARC_L`, `ARC_R`, `CHEV_R`

**Variables propias:** `const CHEV_L`, `const ARC_L`, `const ARC_R`, `const CHEV_R`

**Estilo:** 7 líneas de más de 100 caracteres (la más larga: 229); 5 instrucciones en la misma línea que otra; 2 `if`/bucles sin llaves.

**Zonas delicadas:** 2 `addEventListener`.

## 01-pantalla-y-utilidades.js · 50 líneas

**Qué hace:** tres formas de mostrar el récord, para comparar / indicador fijo en "Faltan N"; la música cambia sola / medidas

**Da:** `cvs`, `ctx`, `elScore`, `elBest`, `elPbar`, `elPnum`, `elWrap`, `elArcFg`, `hudMode`, `musicStyle`, `chipsHTML`, `refreshChips`, `elHud`, `elPanel`, `reduceMotion`, `W`, `H`, `DPR`, `S`, `CX`, `CY`, `R0`, `GAP`, `PR`, `SUN`, `BONE`, `ZONES`, `rgba`, `zoneOf`, `stars`, `frac`, `clamp`, `buzz`

**Usa:** 06-record-y-estado (lvl); 08-partida-estado (tutorial)

**Variables propias:** `const cvs`, `const ctx`, `const elScore`, `const elBest`, `const elPbar`, `const elPnum`, `const elWrap`, `const elArcFg`, `const MODES`, `let hudMode`, `const MUSICS`, `let musicStyle`, `const elHud`, `const elPanel`, `const reduceMotion`, `let W`, `let H`, `let DPR`, `let S`, `let CX`, `let CY`, `const R0`, `const GAP`, `const PR`, `const SUN`, `const BONE`, `const ZONES`, `const ZONE_AND`, `const ZONE_MAG`, `const ZONE_LV`, `const stars`

**Funciones:**

- `chipsHTML` (línea 10, 1 líneas): indicador fijo en "Faltan N"; la música cambia sola
- `refreshChips` (línea 12, 1 líneas): *sin comentario*
- `resize` (línea 19, 8 líneas): *sin comentario*
- `rgba` (línea 37, 1 líneas): *sin comentario*
- `zoneOf` (línea 41, 1 líneas): *sin comentario*
- `frac` (línea 47, 1 líneas): utilidades
- `clamp` (línea 48, 1 líneas): *sin comentario*
- `buzz` (línea 49, 1 líneas): *sin comentario*

**Estilo:** 6 líneas de más de 100 caracteres (la más larga: 402); 7 instrucciones en la misma línea que otra; 2 `if`/bucles sin llaves; 2 ternarios anidados; 24 números sin nombre; nombres cortos o crípticos: `cvs`, `ctx`, `W`, `H`, `DPR`, `S`, `CX`, `CY`, `R0`, `GAP`, `PR`, `SUN`.

**Parece sin usar (todavía no se borra):** `MODES`, `MUSICS`

**Zonas delicadas:** 4 llamadas al azar, 1 `innerHTML`, 1 `addEventListener`.

## 02-audio.js · 72 líneas

**Qué hace:** audio / volumen de la música y de los efectos (0–100), se guardan; la curva es cuadrática para que el control se sienta parejo / todos los efectos (SFX) entran aquí

**Da:** `AC`, `master`, `musicBus`, `NOISE`, `shaper`, `outBus`, `musVol`, `volMus`, `volSfx`, `volGain`, `applyVolumes`, `saveVolumes`, `initAudio`, `ROOT`, `SCALE`, `cowbell`, `noiseHit`, `noise`, `thump`, `suck`, `sub`

**Usa:** 26-pantalla-inicio (muted)

**Variables propias:** `let AC`, `let master`, `let musicBus`, `let NOISE`, `let shaper`, `let outBus`, `let musVol`, `let volMus`, `let volSfx`, `const ROOT`, `const SCALE`

**Funciones:**

- `volGain` (línea 6, 1 líneas): *sin comentario*
- `applyVolumes` (línea 7, 1 líneas): *sin comentario*
- `saveVolumes` (línea 8, 1 líneas): *sin comentario*
- `initAudio` (línea 9, 14 líneas): *sin comentario*
- `cowbell` (línea 25, 12 líneas): *sin comentario*
- `noiseHit` (línea 37, 7 líneas): *sin comentario*
- `noise` (línea 44, 1 líneas): *sin comentario*
- `thump` (línea 45, 8 líneas): *sin comentario*
- `suck` (línea 53, 9 líneas): *sin comentario*
- `sub` (línea 62, 9 líneas): *sin comentario*

**Estilo:** 16 líneas de más de 100 caracteres (la más larga: 234); 66 instrucciones en la misma línea que otra; 11 `if`/bucles sin llaves; 57 números sin nombre; nombres cortos o crípticos: `AC`, `sub`.

**Zonas delicadas:** 2 llamadas al azar, claves guardadas `'orbita_vol_mus'`, `'orbita_vol_sfx'`, 20 nodos de audio creados.

## 03-musica-ritmos.js · 349 líneas

**Qué hace:** beat (se van sumando capas al subir) / estilos de música (mismo tempo: 140, para que la Respiración siga sincronizada) / en el menú se escucha completa

**Da:** `STEP`, `TB`, `musicOn`, `nextT`, `step`, `schedTimer`, `kickQueue`, `musicStart`, `dKick`, `lv`, `echoBus`, `softKick`, `dangerNow`, `tensT`, `tensionOn`, `tensionSet`, `dangerFlash`, `alarmTick`, `stepEspacial`, `stepSynthwave`, `stepPhonk`, `SW_AT`, `riserOn`, `switchAt`, `riser`, `impact`, `ROOT_A`, `andFast`, `switchMsg`, `stepAndromeda`, `stepMagallanes`, `GAL_CFG`, `stepGalaxy`, `organ`

**Usa:** 02-audio (AC, musicBus, noiseHit, ROOT, shaper, NOISE); 06-record-y-estado (state, level, pLevel); 01-pantalla-y-utilidades (clamp, reduceMotion, buzz); 08-partida-estado (sunLevel, tutorial, shake); 26-pantalla-inicio (muted)

**Cambia de otros archivos:** 02-audio (`shaper`); 08-partida-estado (`shake`)

**Variables propias:** `const BPM`, `const STEP`, `const TB`, `let musicOn`, `let nextT`, `let step`, `let schedTimer`, `let kickQueue`, `let musicStart`, `const BASS`, `const PROG`, `let echoIn`, `let tens`, `let tensT`, `let alarmT`, `let alarmWas`, `let dangerFlash`, `const SW_AT`, `let riserOn`, `let switchAt`, `const ROOT_A`, `const PROG_A`, `const PHRY`, `let andFast`, `let switchMsg`, `const ROOT_M`, `const PROG_M`, `const LYD`, `const GAL_CFG`

**Funciones:**

- `dKick` (línea 5, 7 líneas): *sin comentario*
- `dClap` (línea 12, 1 líneas): *sin comentario*
- `dHat` (línea 13, 1 líneas): *sin comentario*
- `d808` (línea 14, 13 líneas): *sin comentario*
- `lv` (línea 28, 1 líneas): en el menú se escucha completa
- `hz` (línea 31, 1 líneas): Sol#3 como referencia
- `echoBus` (línea 33, 7 líneas): *sin comentario*
- `env` (línea 40, 1 líneas): *sin comentario*
- `pad` (línea 41, 10 líneas): *sin comentario*
- `pluck` (línea 51, 6 líneas): *sin comentario*
- `bassNote` (línea 57, 6 líneas): *sin comentario*
- `softKick` (línea 63, 6 líneas): *sin comentario*
- `snareSW` (línea 69, 5 líneas): *sin comentario*
- `dangerNow` (línea 76, 1 líneas): qué tan cerca está el agujero negro de la Tierra: 0 = lejos, 1 = a punto de tragarla
- `tensionOn` (línea 79, 14 líneas): *sin comentario*
- `tensionSet` (línea 93, 10 líneas): *sin comentario*
- `alarmTick` (línea 105, 9 líneas): *sin comentario*
- `alarmHit` (línea 114, 37 líneas, sangría 4): *sin comentario*
- `stepEspacial` (línea 151, 17 líneas): *sin comentario*
- `stepSynthwave` (línea 169, 14 líneas): Synthwave: retro, con energía de persecución
- `stepPhonk` (línea 183, 8 líneas): *sin comentario*
- `riser` (línea 193, 7 líneas): *sin comentario*
- `impact` (línea 200, 1 líneas): *sin comentario*
- `hzA` (línea 206, 1 líneas): *sin comentario*
- `fmBell` (línea 208, 8 líneas): *sin comentario*
- `reese` (línea 216, 7 líneas): *sin comentario*
- `stepAndromeda` (línea 223, 17 líneas): *sin comentario*
- `hzM` (línea 246, 1 líneas): *sin comentario*
- `kalimba` (línea 247, 9 líneas): *sin comentario*
- `choir` (línea 256, 7 líneas): *sin comentario*
- `bounceBass` (línea 263, 8 líneas): *sin comentario*
- `stepMagallanes` (línea 271, 17 líneas): *sin comentario*
- `pluckSaw` (línea 297, 6 líneas): *sin comentario*
- `tom` (línea 303, 5 líneas): *sin comentario*
- `subPulse` (línea 308, 5 líneas): *sin comentario*
- `stepGalaxy` (línea 313, 23 líneas): *sin comentario*
- `organ` (línea 337, 12 líneas): *sin comentario*

**Estilo:** 95 líneas de más de 100 caracteres (la más larga: 346); 280 instrucciones en la misma línea que otra; 71 `if`/bucles sin llaves; 695 números sin nombre; más de 3 niveles de sangría: alarmHit (4); nombres cortos o crípticos: `BPM`, `TB`, `lv`, `hz`, `env`, `pad`, `hzA`, `LYD`, `hzM`, `tom`.

**Zonas delicadas:** 79 nodos de audio creados.

## 04-musica-horizonte.js · 229 líneas

**Qué hace:** "Horizonte de sucesos": la banda sonora del Sistema solar / La idea: no es una historia de amor, es una persecución. La música tiene dos personajes: / · el agujero negro: un zumbido enorme que "late" cada vez más rápido, y un motivo de dos notas que CAE medio tono,

**Da:** `hzS`, `hzDroneStop`, `stepCosmos`

**Usa:** 02-audio (AC, ROOT, musicBus, NOISE, noiseHit); 03-musica-ritmos (lv, andFast, dangerNow, riserOn, STEP, organ, softKick); 06-record-y-estado (GOAL, state)

**Variables propias:** `const HZ_PROG`, `const HZ_EARTH`, `let hzS`, `const HZ_OST`, `const HZ_ACC`, `const HZ_SC`, `const HZ_HOOK_A`, `const HZ_HOOK_B`, `const HZ_HOOK_C`, `const HZ_CH`, `const HZ_TRI`, `const HZ_OSTS`

**Funciones:**

- `hzEnsure` (línea 11, 11 líneas): *sin comentario*
- `hzOut` (línea 22, 1 líneas): *sin comentario*
- `hzDroneStart` (línea 24, 10 líneas): el agujero negro: un zumbido continuo con dos voces casi iguales que "laten" entre sí
- `hzDroneStop` (línea 34, 4 líneas): *sin comentario*
- `hzPull` (línea 39, 11 líneas): el motivo de la gravedad: dos notas graves y pesadas; la segunda cae medio tono
- `hzGlass` (línea 51, 5 líneas): la Tierra: cristal frágil, mucho eco
- `hzShepard` (línea 57, 11 líneas): el tono que sube sin fin (escala de Shepard–Risset): siete voces separadas por octavas que suben juntas
- `hzBus` (línea 69, 7 líneas): ---- producción: bus propio con compresión (para que suene lleno y fuerte) y más instrumentos ----
- `hzPan` (línea 76, 1 líneas): *sin comentario*
- `hzString` (línea 78, 7 líneas): cuerdas graves en staccato (spiccato): el motor de la persecución
- `hzBraam` (línea 86, 9 líneas): "braam": un golpe de metales graves, enorme, como una sirena de barco en el espacio
- `hzTremolo` (línea 96, 8 líneas): cuerdas agudas en trémolo: el nervio, la ansiedad (un racimo disonante que tiembla)
- `hzChoir` (línea 105, 7 líneas): coro lejano: la inmensidad del espacio
- `hzTaiko` (línea 113, 4 líneas): tambores épicos (taiko) con mucha sala, platillo al revés y golpe de platillo
- `hzSwell` (línea 117, 2 líneas): *sin comentario*
- `hzCrash` (línea 119, 2 líneas): *sin comentario*
- `hzSnare` (línea 121, 1 líneas): *sin comentario*
- `hzDeg` (línea 127, 1 líneas): *sin comentario*
- `hzSection` (línea 140, 8 líneas): la sección según qué tan lejos vas
- `hzLead` (línea 149, 9 líneas): voz principal: un sintetizador cálido parecido a cuerdas/metal suave, con vibrato que llega tarde
- `stepCosmos` (línea 158, 70 líneas): *sin comentario*

**Estilo:** 87 líneas de más de 100 caracteres (la más larga: 362); 258 instrucciones en la misma línea que otra; 36 `if`/bucles sin llaves; 4 ternarios anidados; 556 números sin nombre; funciones largas: stepCosmos (70); nombres cortos o crípticos: `hzS`.

**Comentarios de historia:** «205: ahora lo canta una voz cálida, y el cristal le responde una octava arriba» · «208: la misma melodía, lenta y enorme, en el coro y la voz: el respiro antes de la carrera»

**Parece sin usar (todavía no se borra):** `HZ_PROG`, `HZ_EARTH`

**Zonas delicadas:** 2 llamadas al azar, 63 nodos de audio creados.

## 05-musica-reproductor.js · 67 líneas

**Qué hace:** el reproductor: qué estilo suena, cuándo arranca y cuándo para

**Da:** `startMusic`, `stopMusic`

**Usa:** 01-pantalla-y-utilidades (musicStyle); 06-record-y-estado (state, level, lvl); 03-musica-ritmos (SW_AT, riserOn, riser, STEP, impact, switchAt, switchMsg, andFast, stepGalaxy, GAL_CFG, stepMagallanes, stepAndromeda, stepSynthwave, stepPhonk, stepEspacial, musicOn, nextT, step, kickQueue, musicStart, schedTimer, tensionOn, ROOT_A, echoBus); 04-musica-horizonte (stepCosmos, hzS, hzDroneStop); 02-audio (AC, musicBus, musVol, master); 08-partida-estado (tutorial)

**Cambia de otros archivos:** 03-musica-ritmos (`riserOn`, `switchAt`, `switchMsg`, `andFast`, `nextT`, `step`, `musicOn`, `kickQueue`, `musicStart`, `schedTimer`); 01-pantalla-y-utilidades (`musicStyle`)

**Variables propias:** `let galAmb`

**Funciones:**

- `scheduleStep` (línea 2, 17 líneas): ---------- el reproductor: qué estilo suena, cuándo arranca y cuándo para ----------
- `tick` (línea 19, 7 líneas): *sin comentario*
- `startMusic` (línea 26, 14 líneas): *sin comentario*
- `galAmbience` (línea 41, 16 líneas, sangría 5): *sin comentario*
- `stopMusic` (línea 57, 9 líneas): *sin comentario*

**Estilo:** 13 líneas de más de 100 caracteres (la más larga: 261); 46 instrucciones en la misma línea que otra; 15 `if`/bucles sin llaves; 3 ternarios anidados; 48 números sin nombre; más de 3 niveles de sangría: galAmbience (5).

**Zonas delicadas:** 1 temporizadores, 6 nodos de audio creados.

## 06-record-y-estado.js · 43 líneas

**Qué hace:** récord / barra de viaje arriba, como en Geometry Dash: tu planeta avanza del agujero negro a la salida; la marca dorada es tu récord / estado

**Da:** `best`, `saveBest`, `bestRing`, `runRecord`, `newRec`, `updateRingHUD`, `state`, `rings`, `level`, `pLevel`, `camLevel`, `pAng`, `jumping`, `jumpT`, `combo`, `lastLand`, `score`, `astFade`, `appear`, `charge`, `jumpTarget`, `crossed`, `GOAL`, `lvl`, `attempts2`, `attempts3`, `attX`, `bestOf`, `setBestOf`, `attemptsOf`

**Usa:** 01-pantalla-y-utilidades (elPbar, elPnum, elScore, elBest, hudMode, elWrap, elArcFg); 08-partida-estado (curGoal, tutorial, attempts)

**Variables propias:** `let best`, `let bestRing`, `let runRecord`, `let newRec`, `let state`, `let rings`, `let level`, `let pLevel`, `let camLevel`, `let pAng`, `let jumping`, `let jumpT`, `let combo`, `let lastLand`, `let score`, `let astFade`, `let appear`, `let charge`, `let jumpTarget`, `let crossed`, `const GOAL`, `let lvl`, `let best2`, `let attempts2`, `let best3`, `let attempts3`, `const bestX`, `const attX`

**Funciones:**

- `saveBest` (línea 4, 1 líneas): *sin comentario*
- `saveBestRing` (línea 7, 1 líneas): *sin comentario*
- `updateRingHUD` (línea 9, 18 líneas): *sin comentario*
- `bestOf` (línea 40, 1 líneas): *sin comentario*
- `setBestOf` (línea 41, 1 líneas): *sin comentario*
- `attemptsOf` (línea 42, 1 líneas): *sin comentario*

**Estilo:** 10 líneas de más de 100 caracteres (la más larga: 383); 10 instrucciones en la misma línea que otra; 1 `if`/bucles sin llaves; 4 ternarios anidados; 17 números sin nombre; nombres cortos o crípticos: `lvl`.

**Zonas delicadas:** claves guardadas `'orbita_best_v2'`, `'orbita_p1_anillo'`, `'orbita_p3_anillo'`, `'orbita_p3_intentos'`, `'orbita_p2_anillo'`, `'orbita_p2_intentos'`, `'orbita_p'`, 2 `innerHTML`.

## 07-planetas.js · 90 líneas

**Qué hace:** planetas para rescatar y jugar / planetas: estadísticas sacadas de datos reales / size: diámetro real (escala logarítmica) · vel: velocidad orbital real · res: densidad real (resistencia a la fuerza de marea) · charge: rotación real

**Da:** `PLANETS_P`, `curPlanet`, `maxPerf`, `plutoOk`, `allPlanets`, `shieldLeft`, `usedDouble`, `planetOk`, `curP`, `pst`, `chargeMax`, `sizeK`, `jumpDur`, `catchMargin`, `unlockedIds`, `planetThumb`, `markNewPlanets`, `rescuedCards`, `saveRunStats`, `PLANET_SVG`

**Usa:** 06-record-y-estado (bestOf, GOAL, bestRing); 08-partida-estado (JUMP_DUR, perfCount); 29-planetas-hd (PLGL)

**Variables propias:** `const PLANETS_P`, `let curPlanet`, `let maxPerf`, `let plutoOk`, `let allPlanets`, `let shieldLeft`, `let usedDouble`, `const PLANET_SVG`

**Funciones:**

- `planetOk` (línea 58, 1 líneas): *sin comentario*
- `curP` (línea 59, 1 líneas): *sin comentario*
- `pst` (línea 60, 1 líneas): *sin comentario*
- `chargeMax` (línea 61, 1 líneas): rotación real
- `sizeK` (línea 62, 1 líneas): de Plutón (×0.85) a Júpiter (×1.22): se ve y se siente, sin ser abismal // diámetro real
- `jumpDur` (línea 63, 1 líneas): los lentos flotan (hasta ~40% más de tiempo en el aire) // velocidad orbital real
- `catchMargin` (línea 64, 1 líneas): los frágiles: el agujero negro los alcanza hasta ~media vuelta de anillo antes // densidad real: los menos densos se despedazan antes
- `unlockedIds` (línea 65, 1 líneas): los frágiles: el agujero negro los alcanza hasta ~media vuelta de anillo antes // densidad real: los menos densos se despedazan antes
- `planetThumb` (línea 66, 4 líneas): *sin comentario*
- `markNewPlanets` (línea 70, 1 líneas): *sin comentario*
- `rescuedCards` (línea 71, 6 líneas): *sin comentario*
- `saveRunStats` (línea 77, 3 líneas): *sin comentario*

**Estilo:** 48 líneas de más de 100 caracteres (la más larga: 466); 2 instrucciones en la misma línea que otra; 3 `if`/bucles sin llaves; 60 números sin nombre; nombres cortos o crípticos: `pst`.

**Comentarios de historia:** «64: los frágiles: el agujero negro los alcanza hasta ~media vuelta de anillo antes            »

**Zonas delicadas:** claves guardadas `'orbita_p1_planeta'`, `'orbita_p1_maxperf'`, `'orbita_p1_pluton'`, `'orbita_p1_todos'`, `'orbita_pl_nuevo'`.

## 08-partida-estado.js · 37 líneas

**Qué hace:** estado de la partida: contadores, tutorial, efectos en pantalla / tutorial: los primeros 10 anillos de la huida, una cosa a la vez / ya no hay tutorial: se aprende jugando

**Da:** `winT`, `perfCount`, `attempts`, `TUT_TYPES`, `TUT_TIPS`, `tutorial`, `tutorialDone`, `curGoal`, `pipFlash`, `readyT`, `chargeFlash`, `readyHintDone`, `gest`, `pending`, `pendingT`, `hintsShown`, `showHint`, `hintT`, `swallow`, `holeFlare`, `streak`, `jumpClear`, `culprit`, `culpritT`, `landPop`, `PERFECT`, `t`, `timeScale`, `slowTimer`, `shake`, `flash`, `pulse`, `deadT`, `canRestart`, `particles`, `trail`, `texts`, `burns`, `sunLevel`, `lastEaten`, `debris`, `JUMP_DUR`

**Usa:** 06-record-y-estado (GOAL)

**Variables propias:** `let winT`, `let perfCount`, `let attempts`, `const veterano`, `const TUT_GOAL`, `const TUT_TYPES`, `const TUT_TIPS`, `let tutorial`, `let tutorialDone`, `const pipFlash`, `let readyT`, `let chargeFlash`, `let readyHintDone`, `let gest`, `let pending`, `let pendingT`, `let hintsShown`, `let showHint`, `let hintT`, `let swallow`, `let holeFlare`, `let streak`, `let jumpClear`, `let culprit`, `let culpritT`, `let landPop`, `const PERFECT`, `let t`, `let timeScale`, `let slowTimer`, `let shake`, `let flash`, `let pulse`, `let deadT`, `let canRestart`, `let particles`, `let trail`, `let texts`, `let burns`, `let sunLevel`, `let lastEaten`, `const debris`, `const JUMP_DUR`

**Funciones:**

- `curGoal` (línea 20, 1 líneas): ya no hay tutorial: se aprende jugando

**Estilo:** 5 líneas de más de 100 caracteres (la más larga: 120); 10 números sin nombre; nombres cortos o crípticos: `t`.

**Comentarios de historia:** «19: ya no hay tutorial: se aprende jugando»

**Parece sin usar (todavía no se borra):** `veterano`

**Zonas delicadas:** 2 llamadas al azar, claves guardadas `'orbita_p1_intentos'`, `'orbita_p1_poderlisto'`, `'orbita_p1_pista'`.

## 09-recorridos.js · 28 líneas

**Qué hace:** generador con semilla fija: el recorrido es siempre el mismo, como un nivel de Geometry Dash / tipos de anillo: se presentan uno por uno y luego se mezclan en bloques de 2 a 4 anillos / nivel 1: 49 anillos + la salida

**Da:** `SEED`, `rngState`, `rng`, `TYPE_INFO`, `ringType`, `seenTypes`

**Usa:** 08-partida-estado (tutorial, TUT_TYPES); 06-record-y-estado (GOAL, lvl); 10-ritmo-y-objetos (courseMaps)

**Variables propias:** `const SEED`, `let rngState`, `const TYPE_INFO`, `const COURSE`, `const COURSE2`, `const COURSE3`, `const courseMap3`, `const courseMap2`, `const courseMap`, `let seenTypes`

**Funciones:**

- `rng` (línea 4, 1 líneas): *sin comentario*
- `ringType` (línea 25, 1 líneas): *sin comentario*

**Estilo:** 8 líneas de más de 100 caracteres (la más larga: 318); 4 instrucciones en la misma línea que otra; 9 `if`/bucles sin llaves; 3 ternarios anidados; 49 números sin nombre; nombres cortos o crípticos: `rng`.

**Zonas delicadas:** claves guardadas `'orbita_p1_vistos'`.

## 10-ritmo-y-objetos.js · 106 líneas

**Qué hace:** sincronía con la música / fase dentro de cada golpe (0 = justo en el golpe); -1 si no hay música / intensidad del golpe: 1 justo en el bombo y se apaga rápido

**Da:** `beatPhase`, `beatKick`, `bassBreath`, `lastBeatIdx`, `beatTime`, `obsAng`, `obsRad`, `COIN_RINGS`, `wallet`, `runCoins`, `elWallet`, `updateWallet`, `coinChime`, `drawCoin`, `OBJ_NEBULA`, `OBJ_PULSAR`, `pushing`, `pushT`, `pushFrom`, `starBoost`, `placeInGap`, `drawNebula`, `drawPulsar`, `objChime`, `starLaunch`, `starPush`, `courseMaps`, `RING_MUL`, `HOLE_MUL`, `NEB_AT`, `PUL_AT`, `stretchAt`, `NOVA_BAR`, `novaTau`, `novaEnv`, `novaPush`

**Usa:** 02-audio (AC, ROOT); 03-musica-ritmos (musicOn, musicStart, TB); 01-pantalla-y-utilidades (frac, reduceMotion, ctx); 08-partida-estado (t, curGoal, pending); 25-selector-niveles (lvStarsGot); 26-pantalla-inicio (muted); 28-sonidos-interfaz (uiTone); 06-record-y-estado (level, jumping, jumpT, jumpTarget, crossed, appear, astFade); 16-partida (rr)

**Cambia de otros archivos:** 06-record-y-estado (`jumping`, `jumpT`, `jumpTarget`, `crossed`, `level`, `appear`, `astFade`); 08-partida-estado (`pending`)

**Variables propias:** `let jumpOnBeat`, `let lastBeatIdx`, `const ON_BEAT`, `const COIN_RINGS`, `let wallet`, `let runCoins`, `const elWallet`, `const OBJ_NEBULA`, `const OBJ_PULSAR`, `let pushing`, `let pushT`, `let pushFrom`, `let starBoost`, `const COURSES_X`, `const courseMaps`, `const RING_MUL`, `const HOLE_MUL`, `const NEB_AT`, `const PUL_AT`

**Funciones:**

- `beatPhase` (línea 3, 1 líneas): fase dentro de cada golpe (0 = justo en el golpe); -1 si no hay música
- `beatKick` (línea 5, 1 líneas): intensidad del golpe: 1 justo en el bombo y se apaga rápido
- `bassBreath` (línea 7, 1 líneas): respiración lenta con el bajo (cada dos golpes)
- `beatTime` (línea 10, 1 líneas): *sin comentario*
- `obsAng` (línea 12, 1 líneas): poff: lo que el anillo no giró mientras estuvo congelado
- `obsRad` (línea 13, 5 líneas): poff: lo que el anillo no giró mientras estuvo congelado
- `updateWallet` (línea 24, 11 líneas): *sin comentario*
- `coinChime` (línea 36, 1 líneas): *sin comentario*
- `drawCoin` (línea 37, 8 líneas): *sin comentario*
- `placeInGap` (línea 51, 7 líneas): *sin comentario*
- `drawNebula` (línea 58, 7 líneas): *sin comentario*
- `drawPulsar` (línea 65, 11 líneas): *sin comentario*
- `objChime` (línea 76, 1 líneas): *sin comentario*
- `starLaunch` (línea 77, 1 líneas): *sin comentario*
- `starPush` (línea 78, 1 líneas): *sin comentario*
- `stretchAt` (línea 97, 1 líneas): fuerzas de marea: el anillo se estira como un óvalo que gira
- `NOVA_BAR` (línea 99, 1 líneas): Andrómeda · nova: la estrella se carga 3 golpes y estalla al empezar cada compás; su onda empuja la muralla hacia afuera y abre la órbita un
- `novaTau` (línea 100, 1 líneas): tiempo desde el último estallido
- `novaEnv` (línea 101, 1 líneas): tiempo desde el último estallido
- `novaPush` (línea 102, 3 líneas): *sin comentario*

**Estilo:** 43 líneas de más de 100 caracteres (la más larga: 308); 79 instrucciones en la misma línea que otra; 17 `if`/bucles sin llaves; 1 ternarios anidados; 280 números sin nombre.

**Parece sin usar (todavía no se borra):** `jumpOnBeat`, `ON_BEAT`

**Zonas delicadas:** claves guardadas `'orbita_estrellas'`, 1 `innerHTML`.

## 11-peligros-datos.js · 18 líneas

**Qué hace:** peligros que no son asteroides / cometas (desde el Sombrero): cruzan entre tu anillo y el siguiente; su cola apunta lejos del agujero negro / rayos de energía (desde M87): un anillo brilla como aviso y luego dispara

**Da:** `COMET_AT`, `COMET_TIME`, `BEAM_AT`, `FLARE_AT`, `comets`, `beams`, `flareT`, `flareWarn`, `sstars`, `beamCount`, `SN_AT`, `waves`, `hot`, `hotT`, `skyFlash`, `novaSrc`

**Variables propias:** `const COMET_AT`, `const COMET_TIME`, `const BEAM_AT`, `const FLARE_AT`, `let comets`, `let beams`, `let flareT`, `let flareWarn`, `let sstars`, `let beamCount`, `const SN_AT`, `let waves`, `let hot`, `let hotT`, `let skyFlash`, `let novaSrc`

**Estilo:** 8 líneas de más de 100 caracteres (la más larga: 157); 69 números sin nombre; nombres cortos o crípticos: `hot`.

**Comentarios de historia:** «11: Sale del centro al ritmo de la música y se apaga en un anillo límite (marcado en rosa). Si» · «13: sale justo antes de una muralla o un contragiro: o pasas el primer hueco o te alcanza»

## 12-poderes.js · 410 líneas

**Qué hace:** los poderes de cada planeta (se cargan con Perfectos y se usan deslizando hacia arriba, o con la tecla D) / Cada uno nace de un dato real del planeta y tiene su propio efecto visual. / Monte Olimpo: salto triple

**Da:** `ghostT`, `shieldT`, `eclipseT`, `pfx`, `lastJT`, `periLeft`, `predT`, `strainK`, `burnT`, `ringBoostNow`, `strainNow`, `bhWob`, `usePower`, `vaporize`, `caronteSaves`, `ringSpark`, `powerUpdate`, `hsh`, `drawCaronteBack`, `drawPowerFx`, `drawPowerScene`, `drawRingPower`

**Usa:** 08-partida-estado (tutorial, sunLevel, pulse, texts, showHint, pending, curGoal, timeScale, slowTimer, flash, t, lastEaten, shake, particles, holeFlare); 06-record-y-estado (state, pLevel, charge, rings, level, jumpT, jumping, jumpTarget, crossed, pAng); 01-pantalla-y-utilidades (clamp, R0, buzz, reduceMotion, CX, S, CY, PR, frac, ctx, rgba, SUN, W, H); 07-planetas (pst, catchMargin, curP, curPlanet, shieldLeft, usedDouble, jumpDur, chargeMax, sizeK); 02-audio (AC, ROOT, noise, cowbell, SCALE, sub); 26-pantalla-inicio (muted); 28-sonidos-interfaz (uiTone); 23-intro (noteDouble); 16-partida (rr); 10-ritmo-y-objetos (obsAng, beatTime, obsRad); 29-planetas-hd (PLGL, drawPlayer)

**Cambia de otros archivos:** 08-partida-estado (`pulse`, `texts`, `showHint`, `pending`, `timeScale`, `slowTimer`, `flash`, `sunLevel`, `lastEaten`, `shake`, `holeFlare`); 06-record-y-estado (`charge`, `jumpT`, `jumping`, `jumpTarget`, `crossed`); 07-planetas (`usedDouble`, `shieldLeft`)

**Variables propias:** `let ghostT`, `let shieldT`, `let eclipseT`, `let pfx`, `let lastJT`, `let periLeft`, `let predT`, `let strainK`, `let burnT`, `let ringBoostNow`, `let bhWob`, `let BURN_DUR`

**Funciones:**

- `strainNow` (línea 4, 1 líneas): *sin comentario*
- `powerName` (línea 5, 1 líneas): *sin comentario*
- `powerShout` (línea 7, 2 líneas): *sin comentario*
- `usePower` (línea 9, 33 líneas, sangría 4): *sin comentario*
- `vaporize` (línea 43, 6 líneas): Sol: un asteroide que tocas mientras ardes se vaporiza
- `caronteSaves` (línea 50, 10 líneas): Caronte (Plutón): si algo te iba a destruir, tu luna se interpone una vez
- `caronteAng` (línea 60, 1 líneas): *sin comentario*
- `ringSpark` (línea 61, 4 líneas): Saturno: la roca rebota en el disco de hielo y salta en chispas
- `powerUpdate` (línea 65, 22 líneas, sangría 4): *sin comentario*
- `hsh` (línea 88, 1 líneas): efectos de los poderes sobre el planeta
- `smst` (línea 89, 1 líneas): *sin comentario*
- `plPos` (línea 90, 1 líneas): *sin comentario*
- `flake` (línea 92, 1 líneas): estrella de seis puntas (copo de hielo)
- `heatHaze` (línea 94, 7 líneas): aire que tiembla por el calor alrededor del planeta
- `drawAurora` (línea 102, 17 líneas): Júpiter: auroras en sus dos polos (las más potentes del sistema solar, que Hubble ve en ultravioleta)
- `drawSolarFire` (línea 120, 18 líneas): Sol: corona, protuberancias y viento solar mientras arde
- `drawSodiumTail` (línea 139, 21 líneas): Mercurio: su cola de sodio real (amarillo anaranjado, a 589 nm), más larga que la Tierra
- `caronteXY` (línea 161, 1 líneas): Caronte: la luna gris de Plutón, con su polo rojizo (Mordor Macula); mide la mitad que Plutón
- `drawCaronte` (línea 162, 9 líneas): *sin comentario*
- `caronteOn` (línea 171, 1 líneas): *sin comentario*
- `drawCaronteBack` (línea 172, 5 líneas): la mitad de la órbita que pasa detrás de Plutón
- `drawPowerFx` (línea 177, 55 líneas, sangría 6): *sin comentario*
- `drawPowerScene` (línea 233, 130 líneas, sangría 6): efectos en el escenario (anillos, agujero negro, pantalla)
- `drawRingPower` (línea 364, 45 líneas, sangría 6): los anillos afectados por un poder se ven distintos

**Estilo:** 205 líneas de más de 100 caracteres (la más larga: 563); 656 instrucciones en la misma línea que otra; 39 `if`/bucles sin llaves; 2 ternarios anidados; 935 números sin nombre; funciones largas: drawPowerFx (55), drawPowerScene (130), drawRingPower (45); más de 3 niveles de sangría: usePower (4), powerUpdate (4), drawPowerFx (6), drawPowerScene (6), drawRingPower (6); nombres cortos o crípticos: `pfx`, `hsh`.

**Comentarios de historia:** «280: grietas que se abren antes de romperse»

**Zonas delicadas:** 53 llamadas al azar.

## 13-agujero-de-gusano.js · 129 líneas

**Qué hace:** dentro del agujero de gusano: modo ÓRBITA (anillos 30–41) / La corriente del gusano te lanza sola al siguiente anillo cada dos golpes de la música. / Tú ya no saltas: tocas para cambiar el sentido en que la Tierra gira sobre su anillo y te colocas bajo el hueco.

**Da:** `whGap`, `ORB_W`, `WH_IN`, `WH_OUT`, `wh`, `whShock`, `gapC`, `viewInside`, `hideEarth`, `whEnter`, `whStartOut`, `whTap`, `whTrans`, `drawInside`

**Usa:** 06-record-y-estado (level, pLevel, pAng, jumping, jumpTarget, score, updateRingHUD, appear, GOAL, camLevel, state); 02-audio (AC, ROOT, master, noiseHit, thump, noise); 26-pantalla-inicio (muted); 03-musica-ritmos (dKick, echoBus, TB, impact); 14-lente-gravitacional (bendW, bend, WH_K, WORM_COL, whRip, lensP); 16-partida (rr, ensureRings); 08-partida-estado (pending, texts, shake, trail, tutorial, pulse, flash, sunLevel, lastEaten, burns, particles, t); 01-pantalla-y-utilidades (reduceMotion, buzz, CX, S, CY, R0, BONE, clamp, GAP, ctx, W, H, frac, PR); 34-misiones (misEvent); 10-ritmo-y-objetos (beatTime, beatKick); 15-peligros (hazardTip); 09-recorridos (seenTypes); 32-fondos-9-motor (GLBG); 07-planetas (sizeK)

**Cambia de otros archivos:** 06-record-y-estado (`jumping`, `level`, `pLevel`, `pAng`, `jumpTarget`, `score`, `appear`, `camLevel`); 08-partida-estado (`pending`, `texts`, `shake`, `trail`, `pulse`, `flash`, `sunLevel`, `lastEaten`, `burns`); 14-lente-gravitacional (`bend`, `whRip`)

**Variables propias:** `const ORB_W`, `const WH_IN`, `const WH_OUT`, `let wh`, `let whShock`, `let gapC`, `let viewInside`, `let hideEarth`, `const WH_G`

**Funciones:**

- `whGap` (línea 6, 1 líneas): los primeros cuatro, cada cuatro golpes (para aprender); luego cada tres
- `easeC3` (línea 9, 1 líneas): *sin comentario*
- `whPull` (línea 10, 11 líneas): tirón grave que sube, con el aire que se arrastra hacia la boca
- `whBoom` (línea 21, 7 líneas): golpe con eco al salir
- `whEnter` (línea 29, 7 líneas): cuánto crece la boca al entrar (hasta cubrir toda la pantalla)
- `whInDone` (línea 36, 9 líneas): *sin comentario*
- `whStartOut` (línea 45, 6 líneas): *sin comentario*
- `whOutDone` (línea 51, 12 líneas): *sin comentario*
- `whTap` (línea 63, 1 líneas): *sin comentario*
- `whTrans` (línea 64, 15 líneas): *sin comentario*
- `chromaRing` (línea 80, 8 líneas): el anillo de luz del portal, con los colores separados como en una lente real
- `drawInside` (línea 89, 38 líneas): cómo se ve todo estando dentro: el mismo cielo y los mismos anillos, vistos a través de la garganta del gusano

**Estilo:** 39 líneas de más de 100 caracteres (la más larga: 278); 116 instrucciones en la misma línea que otra; 9 `if`/bucles sin llaves; 156 números sin nombre; nombres cortos o crípticos: `wh`.

**Comentarios de historia:** «3: Tú ya no saltas: tocas para cambiar el sentido en que la Tierra gira sobre su anillo y te »

**Parece sin usar (todavía no se borra):** `easeC3`

**Zonas delicadas:** 6 llamadas al azar, claves guardadas `'orbita_p1_vistos'`, 6 nodos de audio creados.

## 14-lente-gravitacional.js · 51 líneas

**Qué hace:** espacio doblado (nivel 1, anillos 27–33): un agujero de gusano flota delante de ti y dobla el espacio. / Es una lente gravitacional de verdad: todo lo que pasa cerca (anillos, asteroides y tu planeta) se ve empujado / hacia afuera de la esfera, se estira en arcos y corre más rápido alrededor de

**Da:** `BEND_R`, `WORM_COL`, `WH_K`, `WH_EXIT`, `bend`, `whRip`, `bendRad`, `bendUpdate`, `bendW`, `lensP`, `lensJ`, `drawBendSphere`

**Usa:** 06-record-y-estado (lvl, level, state); 08-partida-estado (tutorial, t); 15-peligros (hazardTip); 16-partida (rr); 13-agujero-de-gusano (viewInside); 01-pantalla-y-utilidades (CX, S, CY, ctx, W, H); 32-fondos-9-motor (GLBG)

**Variables propias:** `const BEND_AT`, `const BEND_R`, `const WORM_COL`, `const WH_K`, `const WH_EXIT`, `let bend`, `let whRip`

**Funciones:**

- `bendRad` (línea 7, 1 líneas): *sin comentario*
- `bendUpdate` (línea 8, 11 líneas): *sin comentario*
- `bendW` (línea 19, 1 líneas): *sin comentario*
- `lensP` (línea 21, 9 líneas): lente: un punto a distancia r del centro de la esfera se ve a (r + √(r² + 4θ²))/2
- `lensJ` (línea 30, 5 líneas): cuánto se estira: a lo largo del borde (tangencial) y hacia el centro (radial)
- `drawBendSphere` (línea 35, 15 líneas): *sin comentario*

**Estilo:** 16 líneas de más de 100 caracteres (la más larga: 212); 25 instrucciones en la misma línea que otra; 6 `if`/bucles sin llaves; 41 números sin nombre.

## 15-peligros.js · 362 líneas

**Qué hace:** el primer estallido cae en un golpe / las cáscaras vivas en el instante tt (tiempo de la música): [{cx, cy, r, age, s}] / ¿el planeta en (px, py) toca un filamento (no un hueco) de alguna cáscara?

**Da:** `NOVA_LIFE`, `novaBurst`, `novaHit`, `TUNE`, `waveProx`, `waveBeepT`, `hazardsReset`, `hazardTip`, `hazardsOnLand`, `hazardsUpdate`, `drawNova`, `novaSound`, `drawHazards`, `drawFlare`

**Usa:** 08-partida-estado (shake, texts, tutorial, sunLevel, flash, pulse, particles, holeFlare, t); 01-pantalla-y-utilidades (reduceMotion, buzz, R0, GAP, PR, BONE, clamp, ctx, S, CX, CY, frac, W, H); 02-audio (AC, noise, ROOT, NOISE); 26-pantalla-inicio (muted); 28-sonidos-interfaz (uiTone, uiOut); 10-ritmo-y-objetos (beatTime, beatPhase, beatKick, novaTau, NOVA_BAR, novaEnv, obsAng, novaPush); 03-musica-ritmos (TB); 11-peligros-datos (novaSrc, comets, beams, flareT, flareWarn, beamCount, waves, sstars, COMET_AT, COMET_TIME, BEAM_AT, SN_AT, FLARE_AT, skyFlash, hot, hotT); 07-planetas (sizeK); 09-recorridos (seenTypes); 06-record-y-estado (level, lvl, pAng, pLevel, state, jumping, rings, camLevel); 16-partida (rr); 34-misiones (misEvent)

**Cambia de otros archivos:** 08-partida-estado (`shake`, `texts`, `flash`, `pulse`, `holeFlare`); 11-peligros-datos (`comets`, `beams`, `flareT`, `flareWarn`, `beamCount`, `waves`, `novaSrc`, `sstars`, `skyFlash`, `hot`, `hotT`)

**Variables propias:** `const NOVA_AT`, `const NOVA_LIFE`, `const TUNE`, `let waveProx`, `let waveBeepT`, `let novaBeat`

**Funciones:**

- `novaBurst` (línea 3, 4 líneas): *sin comentario*
- `novaSpawn` (línea 7, 5 líneas): *sin comentario*
- `novaShells` (línea 13, 9 líneas): las cáscaras vivas en el instante tt (tiempo de la música): [{cx, cy, r, age, s}]
- `novaHit` (línea 23, 10 líneas): ¿el planeta en (px, py) toca un filamento (no un hueco) de alguna cáscara?
- `hazardsReset` (línea 35, 4 líneas): ajustes finos por nivel (probados con jugadores simulados)
- `hazardTip` (línea 39, 6 líneas): *sin comentario*
- `hazardsOnLand` (línea 45, 25 líneas, sangría 4): *sin comentario*
- `keplerPos` (línea 70, 6 líneas): *sin comentario*
- `spawnWave` (línea 77, 15 líneas): devuelve la causa si un peligro alcanza al planeta
- `waveRelease` (línea 92, 17 líneas, sangría 5): *sin comentario*
- `waveBreak` (línea 109, 13 líneas, sangría 4): *sin comentario*
- `waveSafe` (línea 122, 4 líneas): *sin comentario*
- `waveCatch` (línea 127, 16 líneas): te alcanzó: la primera vez te sobrecalienta; la segunda, estando caliente, te destruye
- `hazardsUpdate` (línea 143, 45 líneas, sangría 5): *sin comentario*
- `waveShape` (línea 189, 4 líneas): la onda de supernova, como en las fotos: un frente irregular con filamentos, nudos brillantes y restos que siguen brillando
- `drawWave` (línea 193, 48 líneas, sangría 5): *sin comentario*
- `drawNova` (línea 242, 37 líneas): la nova: estrella azul-blanca con picos de difracción; tres arcos de carga (uno por golpe) y al estallar, destello, ondas y restos
- `novaSound` (línea 280, 9 líneas, sangría 4): golpes de carga (tres notas de cristal que suben) y el estallido al empezar el compás
- `drawNovaShells` (línea 289, 29 líneas, sangría 5): *sin comentario*
- `drawHazards` (línea 318, 42 líneas): *sin comentario*
- `drawFlare` (línea 360, 1 líneas): *sin comentario*

**Estilo:** 132 líneas de más de 100 caracteres (la más larga: 362); 387 instrucciones en la misma línea que otra; 45 `if`/bucles sin llaves; 4 ternarios anidados; 605 números sin nombre; funciones largas: hazardsUpdate (45), drawWave (48), drawHazards (42); más de 3 niveles de sangría: hazardsOnLand (4), waveRelease (5), waveBreak (4), hazardsUpdate (5), drawWave (5), novaSound (4), drawNovaShells (5).

**Comentarios de historia:** «308: la estrella: blanca con halo verde, se hincha antes de cada estallido»

**Zonas delicadas:** 18 llamadas al azar, claves guardadas `'orbita_p1_vistos'`, 22 nodos de audio creados.

## 16-partida.js · 346 líneas

**Qué hace:** donde apareces dentro del gusano / dentro del gusano: anillos quietos con uno o dos huecos; cada hueco queda a un lado del anterior (izquierda o derecha) / el último de dos huecos los junta: desde cualquiera llegas al hueco único que sigue

**Da:** `ensureRings`, `setup`, `start`, `rr`, `upgradeToDouble`, `winSound`, `doubleJump`, `jump`, `onLand`, `eatRings`, `die`, `sesTries`, `showTry`

**Usa:** 09-recorridos (ringType, rng, rngState, SEED, TYPE_INFO, seenTypes); 13-agujero-de-gusano (gapC, wh, whShock, whStartOut); 06-record-y-estado (lvl, level, rings, pLevel, camLevel, pAng, jumping, jumpT, combo, lastLand, score, astFade, appear, state, attX, attempts3, attempts2, runRecord, bestOf, newRec, updateRingHUD, charge, jumpTarget, crossed, setBestOf, best, saveBest, attemptsOf); 08-partida-estado (tutorial, JUMP_DUR, t, curGoal, swallow, holeFlare, streak, jumpClear, culprit, culpritT, landPop, particles, trail, texts, burns, timeScale, slowTimer, sunLevel, lastEaten, winT, perfCount, attempts, pending, gest, showHint, canRestart, flash, shake, pulse, PERFECT, pipFlash, chargeFlash, readyHintDone, hintsShown, hintT, deadT); 15-peligros (TUNE, hazardsReset, waveProx, waveBeepT, hazardsOnLand); 10-ritmo-y-objetos (RING_MUL, OBJ_NEBULA, NEB_AT, OBJ_PULSAR, PUL_AT, placeInGap, COIN_RINGS, pushing, starBoost, runCoins, obsAng, stretchAt, obsRad, wallet, updateWallet, coinChime, objChime, starPush, starLaunch); 03-musica-ritmos (TB); 14-lente-gravitacional (whRip, bend, WH_EXIT); 12-poderes (ghostT, shieldT, eclipseT, pfx, lastJT, periLeft, predT, burnT, usePower); 32-fondos-9-motor (GLBG); 11-peligros-datos (hot, hotT, skyFlash); 01-pantalla-y-utilidades (elPanel, elHud, R0, GAP, PR, buzz, reduceMotion, zoneOf, BONE); 25-selector-niveles (pendingTut, lvStarsGot, LEVELS); 07-planetas (shieldLeft, usedDouble, chargeMax, curPlanet, jumpDur, unlockedIds, saveRunStats, plutoOk, rescuedCards, markNewPlanets); 05-musica-reproductor (startMusic, stopMusic); 23-intro (noteDouble); 02-audio (noise, cowbell, SCALE, AC, NOISE, master, ROOT, thump, suck, sub); 17-tutorial (tutorialWin, tutRespawn); 34-misiones (misWin, misEvent); 21-dibujo (powerReadySound)

**Cambia de otros archivos:** 09-recorridos (`rngState`); 08-partida-estado (`swallow`, `holeFlare`, `streak`, `jumpClear`, `culprit`, `culpritT`, `landPop`, `particles`, `trail`, `texts`, `burns`, `timeScale`, `slowTimer`, `sunLevel`, `lastEaten`, `tutorial`, `winT`, `perfCount`, `attempts`, `pending`, `gest`, `showHint`, `canRestart`, `flash`, `shake`, `pulse`, `chargeFlash`, `readyHintDone`, `hintT`, `hintsShown`, `deadT`); 13-agujero-de-gusano (`gapC`, `wh`, `whShock`); 14-lente-gravitacional (`whRip`, `bend`); 06-record-y-estado (`rings`, `level`, `pLevel`, `camLevel`, `pAng`, `jumping`, `jumpT`, `combo`, `lastLand`, `score`, `astFade`, `appear`, `state`, `attempts3`, `attempts2`, `runRecord`, `newRec`, `charge`, `jumpTarget`, `crossed`, `best`); 12-poderes (`ghostT`, `shieldT`, `eclipseT`, `pfx`, `lastJT`, `periLeft`, `predT`, `burnT`); 11-peligros-datos (`hot`, `hotT`, `skyFlash`); 15-peligros (`waveProx`, `waveBeepT`); 25-selector-niveles (`pendingTut`); 07-planetas (`shieldLeft`, `usedDouble`, `plutoOk`); 10-ritmo-y-objetos (`pushing`, `starBoost`, `runCoins`, `wallet`)

**Variables propias:** `const LV_END`, `let sesTries`

**Funciones:**

- `makeRing` (línea 1, 84 líneas, sangría 4): *sin comentario*
- `ensureRings` (línea 85, 4 líneas): *sin comentario*
- `setup` (línea 89, 9 líneas): *sin comentario*
- `start` (línea 98, 13 líneas): *sin comentario*
- `rr` (línea 113, 1 líneas): *sin comentario*
- `PW` (línea 114, 1 líneas): *sin comentario*
- `clearance` (línea 117, 11 líneas): distancia libre entre la luna y el asteroide más cercano del anillo k
- `upgradeToDouble` (línea 128, 8 líneas): *sin comentario*
- `win` (línea 145, 30 líneas): *sin comentario*
- `winSound` (línea 175, 21 líneas, sangría 4): *sin comentario*
- `doubleJump` (línea 196, 6 líneas): *sin comentario*
- `jump` (línea 202, 6 líneas): *sin comentario*
- `onLand` (línea 208, 91 líneas, sangría 5): *sin comentario*
- `eatRings` (línea 299, 7 líneas): *sin comentario*
- `die` (línea 306, 31 líneas): *sin comentario*
- `showTry` (línea 339, 6 líneas): intentos de esta sesión en el nivel: vuelve a 1 cada vez que entras al nivel

**Estilo:** 74 líneas de más de 100 caracteres (la más larga: 474); 254 instrucciones en la misma línea que otra; 45 `if`/bucles sin llaves; 3 ternarios anidados; 330 números sin nombre; funciones largas: makeRing (84), onLand (91); más de 3 niveles de sangría: makeRing (4), winSound (4), onLand (5); nombres cortos o crípticos: `rr`, `PW`, `win`, `die`.

**Comentarios de historia:** «252: sin texto: el anillo nuevo destella para avisar que algo cambia (se aprende jugando, como » · «285: presentar cada cosa nueva la primera vez que aparece»

**Parece sin usar (todavía no se borra):** `PW`, `LV_END`

**Zonas delicadas:** 16 llamadas al azar, 26 a `rng()`, claves guardadas `'orbita_p'`, `'orbita_p3_intentos'`, `'orbita_p2_intentos'`, `'orbita_p1_intentos'`, `'orbita_p1_pluton'`, `'orbita_p1_poderlisto'`, `'orbita_p1_pista'`, `'orbita_p1_vistos'`, `'orbita_estrellas'`, `'orbita_lvstars'`, 2 `innerHTML`, 4 temporizadores, 10 nodos de audio creados.

## 17-tutorial.js · 37 líneas

**Qué hace:** el tutorial: reaparecer sin perder, terminarlo y empezarlo

**Da:** `tutRespawn`, `tutorialWin`, `startTutorial`

**Usa:** 06-record-y-estado (state, jumping, jumpTarget, pLevel, level, charge, runRecord, newRec, updateRingHUD); 08-partida-estado (flash, shake, particles, texts, pending, gest, sunLevel, lastEaten, swallow, culprit, culpritT, winT, canRestart, pulse, tutorialDone, tutorial, perfCount, showHint); 01-pantalla-y-utilidades (reduceMotion, buzz, R0, BONE, elHud, elPanel); 02-audio (noise); 05-musica-reproductor (stopMusic, startMusic); 16-partida (winSound, setup); 27-inicio-animacion (homeAmbience); 25-selector-niveles (elLv); 07-planetas (shieldLeft, usedDouble)

**Cambia de otros archivos:** 06-record-y-estado (`state`, `jumping`, `jumpTarget`, `pLevel`, `charge`, `runRecord`, `newRec`); 08-partida-estado (`flash`, `shake`, `pending`, `gest`, `sunLevel`, `lastEaten`, `swallow`, `culprit`, `culpritT`, `winT`, `canRestart`, `pulse`, `tutorialDone`, `tutorial`, `perfCount`, `showHint`); 07-planetas (`shieldLeft`, `usedDouble`)

**Funciones:**

- `tutRespawn` (línea 2, 10 líneas): ---------- el tutorial: reaparecer sin perder, terminarlo y empezarlo ----------
- `tutorialWin` (línea 12, 16 líneas): *sin comentario*
- `startTutorial` (línea 28, 9 líneas): *sin comentario*

**Estilo:** 9 líneas de más de 100 caracteres (la más larga: 253); 35 instrucciones en la misma línea que otra; 2 `if`/bucles sin llaves; 25 números sin nombre.

**Zonas delicadas:** 4 llamadas al azar, claves guardadas `'orbita_p1_tutorial'`, 1 `innerHTML`, 3 temporizadores.

## 18-pausa.js · 135 líneas

**Qué hace:** pausa / Todo se congela de verdad: el juego deja de avanzar y el sonido se suspende (la música sigue justo donde quedó, al ritmo). / Se ve como la pantalla de "Escapaste": la misma letra, los mismos tres botones. Al seguir, una cuenta 3·2·1 para no volver de golpe.

**Da:** `paused`, `pzCount`, `pauseGame`, `pzSnd`, `resumeGame`, `pausePress`

**Usa:** 06-record-y-estado (state, level, bestOf, lvl, rings); 08-partida-estado (gest, pending, curGoal, tutorial); 02-audio (AC, volMus, volSfx, volGain, ROOT, applyVolumes, saveVolumes); 01-pantalla-y-utilidades (buzz, elPanel, reduceMotion); 25-selector-niveles (LEVELS, lvStarsGot, openLevels); 10-ritmo-y-objetos (COIN_RINGS); 26-pantalla-inicio (muted); 36-bucle-principal (last); 16-partida (start, sesTries, showTry); 05-musica-reproductor (stopMusic)

**Cambia de otros archivos:** 08-partida-estado (`gest`, `pending`); 36-bucle-principal (`last`); 02-audio (`volMus`, `volSfx`); 16-partida (`sesTries`); 06-record-y-estado (`state`)

**Variables propias:** `let paused`, `let pzCount`, `let pzPanelCls`, `let pzDrag`, `let pzAC`, `const PZ_ICO`, `const STAR_PATH`, `let pzBus`, `let pzNoise`, `let pzHoverT`, `let pzLastV`, `const pzPrev`

**Funciones:**

- `pzVolHTML` (línea 13, 2 líneas): *sin comentario*
- `pauseGame` (línea 15, 17 líneas): *sin comentario*
- `pzClose` (línea 32, 4 líneas): *sin comentario*
- `pzCtx` (línea 37, 10 líneas): *sin comentario*
- `pzTone` (línea 47, 6 líneas): una nota de cristal (la misma que uiTone)
- `pzAir` (línea 53, 6 líneas): un soplo de aire filtrado
- `pzSub` (línea 59, 2 líneas): *sin comentario*
- `pzSnd` (línea 61, 24 líneas): *sin comentario*
- `pzTick` (línea 85, 1 líneas): *sin comentario*
- `resumeGame` (línea 86, 15 líneas): *sin comentario*
- `pzLeave` (línea 101, 5 líneas): salir de la pausa sin cuenta (para reintentar o ir a los niveles)
- `pzSetVol` (línea 106, 7 líneas): *sin comentario*
- `pausePress` (línea 114, 15 líneas, sangría 4): *sin comentario*
- `pzEnd` (línea 130, 1 líneas): *sin comentario*

**Estilo:** 49 líneas de más de 100 caracteres (la más larga: 325); 119 instrucciones en la misma línea que otra; 21 `if`/bucles sin llaves; 172 números sin nombre; más de 3 niveles de sangría: pausePress (4).

**Zonas delicadas:** 2 llamadas al azar, 5 `innerHTML`, 4 `addEventListener`, 2 temporizadores, 15 nodos de audio creados.

## 19-controles.js · 68 líneas

**Qué hace:** entrada / vista previa: se escucha completa mientras eliges / espera un instante por si es un deslizamiento

**Usa:** 18-pausa (paused, pausePress, pauseGame, pzCount, resumeGame); 06-record-y-estado (state, lvl, jumping, charge); 05-musica-reproductor (stopMusic, startMusic); 25-selector-niveles (openLevels, startLevel, LEVELS, lvIndex, pendingTut, elLv); 27-inicio-animacion (homeT, HOME_IN, logoT0); 28-sonidos-interfaz (showStop); 26-pantalla-inicio (elHome, openHome); 01-pantalla-y-utilidades (elPanel, musicStyle, refreshChips, hudMode, R0, BONE); 08-partida-estado (canRestart, tutorial, gest, pending, pendingT, texts); 16-partida (start, sesTries, showTry, jump, upgradeToDouble, doubleJump); 02-audio (initAudio, AC); 24-presentacion (splashT, skipSplash); 23-intro (endIntro); 17-tutorial (startTutorial); 13-agujero-de-gusano (wh, whTap); 10-ritmo-y-objetos (pushing); 07-planetas (chargeMax); 29-planetas-hd (uiGlass, planetStep)

**Cambia de otros archivos:** 06-record-y-estado (`state`); 27-inicio-animacion (`homeT`, `logoT0`); 25-selector-niveles (`lvIndex`, `pendingTut`); 16-partida (`sesTries`); 01-pantalla-y-utilidades (`musicStyle`, `hudMode`); 08-partida-estado (`gest`, `pending`, `pendingT`)

**Funciones:**

- `press` (línea 2, 39 líneas, sangría 4): ---------- entrada ----------
- `endGest` (línea 45, 1 líneas): *sin comentario*
- `powerKey` (línea 50, 9 líneas): tecla del poder: funciona antes de saltar y también en pleno salto; si no está cargado, avisa cuánto falta

**Estilo:** 13 líneas de más de 100 caracteres (la más larga: 415); 39 instrucciones en la misma línea que otra; 25 `if`/bucles sin llaves; 7 números sin nombre; más de 3 niveles de sangría: press (4).

**Comentarios de historia:** «49: tecla del poder: funciona antes de saltar y también en pleno salto; si no está cargado, av»

**Zonas delicadas:** claves guardadas `'orbita_p1_musica'`, `'orbita_p1_modo'`, 5 `addEventListener`.

## 20-logica.js · 168 líneas

**Qué hace:** lógica / tiempo real: cámara lenta, sacudida, destello / Urano: el anillo congelado no gira (y al soltarse sigue desde ahí, sin saltos)

**Da:** `update`

**Usa:** 08-partida-estado (slowTimer, timeScale, culpritT, hintT, pending, pendingT, particles, pipFlash, chargeFlash, readyT, landPop, shake, flash, pulse, texts, t, tutorial, sunLevel, trail, swallow, deadT, winT, holeFlare, burns, debris); 02-audio (AC, noise, thump); 03-musica-ritmos (musicOn, musicStart, TB, kickQueue, dangerNow, switchAt, switchMsg, tensT, tensionSet, alarmTick, dangerFlash, andFast); 10-ritmo-y-objetos (beatTime, lastBeatIdx, pushing, pushT, pushFrom, HOLE_MUL, obsAng, stretchAt, obsRad); 06-record-y-estado (state, pLevel, pAng, charge, astFade, appear, level, rings, jumping, lvl, GOAL, jumpTarget, jumpT, crossed, camLevel); 01-pantalla-y-utilidades (reduceMotion, buzz, R0, zoneOf, BONE, PR, CX, S, CY, SUN); 16-partida (rr, jump, onLand, eatRings, die); 07-planetas (chargeMax, jumpDur, catchMargin, sizeK); 12-poderes (powerUpdate, lastJT, shieldT, ringSpark, burnT, ghostT, vaporize, caronteSaves); 15-peligros (novaSound, novaBurst, NOVA_LIFE, novaHit, hazardsUpdate); 14-lente-gravitacional (bendUpdate, whRip, WH_EXIT, lensP, bend, WH_K, bendW, BEND_R); 13-agujero-de-gusano (whShock, wh, whTrans, ORB_W, whGap, whEnter); 32-fondos-9-motor (GLBG); 09-recorridos (seenTypes); 11-peligros-datos (novaSrc); 23-intro (introFade)

**Cambia de otros archivos:** 08-partida-estado (`slowTimer`, `timeScale`, `culpritT`, `hintT`, `pendingT`, `pending`, `chargeFlash`, `readyT`, `landPop`, `shake`, `flash`, `pulse`, `t`, `sunLevel`, `deadT`, `winT`, `holeFlare`, `particles`, `texts`, `burns`); 10-ritmo-y-objetos (`lastBeatIdx`, `pushT`, `pushing`); 06-record-y-estado (`astFade`, `appear`, `pAng`, `pLevel`, `jumpT`, `crossed`, `jumping`, `level`, `jumpTarget`, `camLevel`); 03-musica-ritmos (`switchAt`, `tensT`, `dangerFlash`); 13-agujero-de-gusano (`whShock`); 14-lente-gravitacional (`whRip`); 12-poderes (`lastJT`); 11-peligros-datos (`novaSrc`); 23-intro (`introFade`)

**Funciones:**

- `update` (línea 2, 165 líneas, sangría 5): ---------- lógica ----------

**Estilo:** 33 líneas de más de 100 caracteres (la más larga: 305); 76 instrucciones en la misma línea que otra; 29 `if`/bucles sin llaves; 2 ternarios anidados; 129 números sin nombre; funciones largas: update (165); más de 3 niveles de sangría: update (5).

**Zonas delicadas:** 15 llamadas al azar, claves guardadas `'orbita_p1_vistos'`.

## 21-dibujo.js · 262 líneas

**Qué hace:** dibujo / asteroides con volumen: roca sombreada iluminada por el disco del agujero negro (borde naranja hacia el centro) y con cráteres. / Se dibujan una vez en pequeñas imágenes (8 formas × 12 giros × tamaño) y luego solo se copian: rápido incluso en celulares.

**Da:** `astPrebake`, `drawAst`, `drawEarth`, `drawPowerAura`, `drawCharge`, `powerReadySound`, `render`

**Usa:** 01-pantalla-y-utilidades (frac, S, DPR, ctx, CY, CX, PR, BONE, clamp, W, H); 29-planetas-hd (PLGL, drawBigPlanet); 08-partida-estado (t, readyT, chargeFlash, pipFlash, particles, tutorial, hintT); 06-record-y-estado (charge, state, camLevel, jumping, pLevel, level); 07-planetas (chargeMax, sizeK); 23-intro (doblesHechos); 13-agujero-de-gusano (wh, whShock, hideEarth, viewInside, drawInside, WH_IN, WH_OUT); 14-lente-gravitacional (bend); 02-audio (AC, ROOT); 26-pantalla-inicio (muted); 28-sonidos-interfaz (uiTone, uiOut); 22-viaje-sistema-solar (renderScene)

**Cambia de otros archivos:** 06-record-y-estado (`camLevel`); 13-agujero-de-gusano (`hideEarth`, `viewInside`)

**Variables propias:** `const ASTGL (módulo)`, `const AST_SPR`, `const AST_B`, `let astPre`, `let astPreK`, `const CONT`, `const CLOUD`, `let camView`, `let camVel`, `let camT`

**Funciones:**

- `astSprite` (línea 85, 33 líneas): tamaños fijos: la memoria no crece
- `astPrebake` (línea 121, 13 líneas): *sin comentario*
- `drawAst` (línea 134, 8 líneas): *sin comentario*
- `drawEarth` (línea 144, 21 líneas): *sin comentario*
- `drawPowerAura` (línea 166, 7 líneas): poder listo: aura que late detrás del planeta (se nota de reojo sin quitar la vista del anillo de arriba)
- `drawCharge` (línea 174, 36 líneas, sangría 4): anillo de carga pegado al planeta: un arco por cada Perfecto
- `powerReadySound` (línea 211, 6 líneas): sonido propio del poder listo: un arpegio brillante que sube y un destello
- `camViewStep` (línea 223, 8 líneas): *sin comentario*
- `render` (línea 231, 5 líneas): *sin comentario*
- `renderFrame` (línea 236, 18 líneas): *sin comentario*
- `drawShock` (línea 254, 8 líneas): *sin comentario*

**Estilo:** 96 líneas de más de 100 caracteres (la más larga: 251); 207 instrucciones en la misma línea que otra; 22 `if`/bucles sin llaves; 1 ternarios anidados; 230 números sin nombre; más de 3 niveles de sangría: drawCharge (4).

**Zonas delicadas:** 5 llamadas al azar, 2 nodos de audio creados, 1 shaders GLSL.

## 22-viaje-sistema-solar.js · 278 líneas

**Qué hace:** el viaje por el Sistema solar: los planetas pasan en el fondo, en su orden real / at: en qué parte del nivel (0–1) cruza el centro de la pantalla · x: lado (fracción del ancho) · r: tamaño (fracción del lado menor) / luz: viene del disco del agujero negro, en el centro

**Da:** `renderScene`

**Usa:** 01-pantalla-y-utilidades (ctx, CX, CY, zoneOf, W, H, reduceMotion, S, stars, frac, BONE, SUN, clamp, rgba, R0, PR); 29-planetas-hd (PLGL, planetRing, drawPlayer); 08-partida-estado (t, shake, tutorial, winT, sunLevel, pulse, debris, holeFlare, burns, particles, curGoal, culprit, culpritT, trail, landPop, swallow, texts, flash, TUT_TIPS); 06-record-y-estado (level, lvl, state, rings, appear, astFade, runRecord, GOAL, jumping, pAng, charge, pLevel); 27-inicio-animacion (camZoom, homeT, logoT0); 03-musica-ritmos (dangerNow, dangerFlash); 14-lente-gravitacional (bend, bendW, bendRad, lensP, lensJ, drawBendSphere); 13-agujero-de-gusano (viewInside, wh, hideEarth); 32-fondos-9-motor (GLBG, remolinoSource, REMOLINO_PHOTO); 10-ritmo-y-objetos (beatKick, bassBreath, obsAng, obsRad, stretchAt, drawPulsar, drawNebula, drawCoin); 31-fondos-2d (drawMagallanes, drawAndromeda, drawGalBG); 11-peligros-datos (skyFlash); 16-partida (rr); 12-poderes (bhWob, drawRingPower, drawPowerScene, strainK, strainNow, drawPowerFx); 24-presentacion (brandHole, drawLogo); 21-dibujo (drawAst, drawPowerAura, drawCharge); 15-peligros (drawNova, drawHazards, drawFlare); 07-planetas (chargeMax); 23-intro (introFade)

**Cambia de otros archivos:** 27-inicio-animacion (`camZoom`); 12-poderes (`strainK`)

**Variables propias:** `const SOLAR_PATH`, `let solarJ`, `let beltRocks`

**Funciones:**

- `drawBgPlanet` (línea 15, 13 líneas): *sin comentario*
- `renderScene` (línea 28, 249 líneas, sangría 5): *sin comentario*

**Estilo:** 63 líneas de más de 100 caracteres (la más larga: 404); 190 instrucciones en la misma línea que otra; 28 `if`/bucles sin llaves; 1 ternarios anidados; 250 números sin nombre; funciones largas: renderScene (249); más de 3 niveles de sangría: renderScene (5).

**Comentarios de historia:** «106: con los cielos nuevos: contorno oscuro detrás y el anillo en blanco más firme»

**Parece sin usar (todavía no se borra):** `SOLAR_PATH`, `solarJ`, `beltRocks`, `drawBgPlanet`

**Zonas delicadas:** 9 llamadas al azar.

## 23-intro.js · 259 líneas

**Qué hace:** intro: un agujero negro errante entra al sistema solar / trayectoria del agujero negro: llega desde afuera y se instala donde estaba el Sol / crece al alimentarse

**Da:** `introFade`, `easeIO`, `doblesHechos`, `noteDouble`, `MENU_HTML`, `startIntro`, `endIntro`, `introDrone`, `updateIntro`, `renderIntro`

**Usa:** 01-pantalla-y-utilidades (clamp, chipsHTML, elPanel, elHud, SUN, S, W, CY, buzz, reduceMotion, ctx, CX, BONE, ZONES, H, stars, rgba, PR); 08-partida-estado (tutorial, sunLevel, t, flash, holeFlare, pulse, shake); 34-misiones (misEvent); 25-selector-niveles (LEVELS, storySeen, tutAfterStory, openLevels); 06-record-y-estado (lvl, state, appear); 27-inicio-animacion (homeAmbience); 16-partida (rr); 26-pantalla-inicio (storyReturn, openHome); 02-audio (AC, master, noiseHit, noise, suck, thump); 21-dibujo (drawEarth); 29-planetas-hd (PLGL, drawBigPlanet); 24-presentacion (bhDiskK)

**Cambia de otros archivos:** 06-record-y-estado (`state`, `appear`, `lvl`); 25-selector-niveles (`storySeen`, `tutAfterStory`); 26-pantalla-inicio (`storyReturn`); 08-partida-estado (`t`, `flash`, `holeFlare`, `pulse`, `shake`)

**Variables propias:** `const PLANETS`, `const EAT_AT`, `const INTRO_END`, `const T_ZOOM`, `const ZOOM_DUR`, `const T_ENTER`, `const T_ARRIVE`, `const T_SUN_END`, `const T_DISK_END`, `const T_EARTH`, `const SUN_COLS`, `let introT`, `let ip`, `let iparts`, `let introFade`, `let SI`, `let droneNodes`, `let cues`, `let doblesHechos`, `const HINT_TAP`, `const HINT_UP`, `const EARTH_W`, `const INTRO_ID`

**Funciones:**

- `introSetup` (línea 16, 4 líneas): *sin comentario*
- `once` (línea 21, 1 líneas): *sin comentario*
- `easeIO` (línea 22, 1 líneas): *sin comentario*
- `bhPos` (línea 24, 9 líneas): trayectoria del agujero negro: llega desde afuera y se instala donde estaba el Sol
- `bhRadius` (línea 33, 1 líneas): crece al alimentarse
- `diskK` (línea 34, 1 líneas): crece al alimentarse
- `sunK` (línea 35, 1 líneas): *sin comentario*
- `noteDouble` (línea 39, 1 líneas): *sin comentario*
- `MENU_HTML` (línea 42, 4 líneas): *sin comentario*
- `startIntro` (línea 46, 1 líneas): *sin comentario*
- `introZoomK` (línea 47, 1 líneas): *sin comentario*
- `holeGameR` (línea 49, 1 líneas): *sin comentario*
- `zoomZ` (línea 50, 1 líneas): *sin comentario*
- `earthEndR` (línea 51, 1 líneas): *sin comentario*
- `zoomF` (línea 52, 1 líneas): *sin comentario*
- `endIntro` (línea 53, 9 líneas): *sin comentario*
- `introDrone` (línea 62, 17 líneas): *sin comentario*
- `eatSound` (línea 79, 9 líneas): *sin comentario*
- `updateIntro` (línea 89, 45 líneas, sangría 4): *sin comentario*
- `drawPlanet` (línea 136, 18 líneas): *sin comentario*
- `caption` (línea 154, 11 líneas): *sin comentario*
- `renderIntro` (línea 165, 93 líneas): *sin comentario*

**Estilo:** 48 líneas de más de 100 caracteres (la más larga: 305); 167 instrucciones en la misma línea que otra; 13 `if`/bucles sin llaves; 235 números sin nombre; funciones largas: updateIntro (45), renderIntro (93); más de 3 niveles de sangría: updateIntro (4); nombres cortos o crípticos: `ip`, `SI`.

**Comentarios de historia:** «37: antes de jugar: solo dónde estás y "toca para escapar"; la ayuda con íconos aparece hasta »

**Parece sin usar (todavía no se borra):** `HINT_TAP`, `HINT_UP`

**Zonas delicadas:** 12 llamadas al azar, claves guardadas `'orbita_p1_dobles'`, `'orbita_p1_historia'`, 1 `innerHTML`, 6 nodos de audio creados.

## 24-presentacion.js · 250 líneas

**Qué hace:** presentación de marca: el agujero negro y el logotipo de Órbita (10 s) / agujero negro en alta calidad: el mismo diseño (mismos colores, misma forma, mismo giro), dibujado píxel a píxel en la GPU / dibuja una parte del agujero negro centrada en (cx, cy) del lienzo principal

**Da:** `SK`, `BR0`, `BR1`, `splashT`, `sfl`, `bhDiskK`, `brandHole`, `drawLogo`, `bhCore`, `skipSplash`, `updateSplash`, `renderSplash`

**Usa:** 08-partida-estado (t, flash); 01-pantalla-y-utilidades (ctx, clamp, BONE, elPanel, elHud, buzz, W, H, stars, CX, CY); 02-audio (AC, master, NOISE, ROOT, noiseHit); 06-record-y-estado (state); 25-selector-niveles (afterSplash)

**Cambia de otros archivos:** 06-record-y-estado (`state`); 08-partida-estado (`t`, `flash`)

**Variables propias:** `const SPLASH_END`, `const SK`, `const BR0`, `const BR1`, `const BST`, `let splashT`, `let splashBus`, `let splashFont`, `let sflared`, `let sfl`, `const BHGL (módulo)`, `const LOGO`

**Funciones:**

- `easeIO2` (línea 6, 1 líneas): *sin comentario*
- `bcol` (línea 7, 1 líneas): *sin comentario*
- `bbright` (línea 8, 1 líneas): *sin comentario*
- `bstyle` (línea 9, 7 líneas): *sin comentario*
- `bhDisk` (línea 16, 8 líneas): *sin comentario*
- `bhDiskK` (línea 24, 9 líneas): *sin comentario*
- `brandHole` (línea 104, 6 líneas): el agujero negro de la marca, visto casi desde arriba (como en el juego)
- `drawAccent` (línea 114, 9 líneas): el acento de la Ó: la Tierra escapando, con una estela inclinada como un acento agudo
- `drawLogo` (línea 123, 23 líneas): *sin comentario*
- `bhCore` (línea 146, 18 líneas): *sin comentario*
- `splashEarth` (línea 164, 7 líneas): *sin comentario*
- `splashSounds` (línea 172, 29 líneas): el sonido de la marca: un rumor que crece, las letras como notas, la Tierra que cae y un golpe final
- `startSplash` (línea 201, 1 líneas): *sin comentario*
- `skipSplash` (línea 202, 4 líneas): *sin comentario*
- `updateSplash` (línea 206, 6 líneas): *sin comentario*
- `renderSplash` (línea 212, 37 líneas): *sin comentario*

**Estilo:** 72 líneas de más de 100 caracteres (la más larga: 303); 178 instrucciones en la misma línea que otra; 20 `if`/bucles sin llaves; 257 números sin nombre; nombres cortos o crípticos: `SK`, `BR0`, `BR1`, `BST`, `sfl`.

**Zonas delicadas:** 9 nodos de audio creados, 1 shaders GLSL.

## 25-selector-niveles.js · 176 líneas

**Qué hace:** selector de niveles (todos abiertos, como Geometry Dash) / íconos de lo nuevo en cada nivel / dificultad como gravedad: un mini agujero negro con 4 anillos; los encendidos dicen qué tan fuerte jala

**Da:** `LEVELS`, `storySeen`, `elLv`, `lvIndex`, `lvStarsGot`, `tutAfterStory`, `pendingTut`, `afterSplash`, `resetProgress`, `openLevels`, `startLevel`

**Usa:** 06-record-y-estado (bestOf, GOAL, attemptsOf, bestRing, best, state, lvl, appear); 10-ritmo-y-objetos (COIN_RINGS, wallet, updateWallet); 00-iconos-flechas (ARC_L, CHEV_L, ARC_R, CHEV_R); 33-tarjetas-niveles (lvCanvas, lvArts); 26-pantalla-inicio (openHome, storyReturn, applyMute); 08-partida-estado (tutorialDone, attempts, hintsShown, tutorial); 09-recorridos (seenTypes); 07-planetas (curPlanet, maxPerf, plutoOk, allPlanets); 02-audio (initAudio, AC); 23-intro (startIntro, introDrone, introFade, MENU_HTML); 05-musica-reproductor (stopMusic); 27-inicio-animacion (homeAmbience); 16-partida (setup, sesTries); 01-pantalla-y-utilidades (elPanel, elHud); 28-sonidos-interfaz (showStop)

**Cambia de otros archivos:** 33-tarjetas-niveles (`lvCanvas`, `lvArts`); 08-partida-estado (`tutorialDone`, `attempts`, `hintsShown`, `tutorial`); 06-record-y-estado (`bestRing`, `best`, `state`, `lvl`, `appear`); 09-recorridos (`seenTypes`); 07-planetas (`curPlanet`, `maxPerf`, `plutoOk`, `allPlanets`); 10-ritmo-y-objetos (`wallet`); 26-pantalla-inicio (`storyReturn`); 16-partida (`sesTries`); 23-intro (`introFade`)

**Variables propias:** `const LEVELS`, `let storySeen`, `const elLv`, `let lvIndex`, `const LV_ICONS`, `const LV_DATO`, `const NEW_ICON`, `const GRAV_TIER`, `let sigShown`, `let sigTimer`, `let tutAfterStory`, `let pendingTut`

**Funciones:**

- `lvStarsGot` (línea 66, 1 líneas): *sin comentario*
- `STAR_SVG` (línea 67, 1 líneas): *sin comentario*
- `GRAV_SVG` (línea 81, 2 líneas): *sin comentario*
- `renderLevels` (línea 83, 41 líneas): *sin comentario*
- `sigTxt` (línea 127, 1 líneas): que las cifras no se partan
- `sigType` (línea 128, 18 líneas): que las cifras no se partan
- `levelsUnlocked` (línea 147, 1 líneas): por ahora, todos los niveles abiertos desde el inicio
- `afterSplash` (línea 149, 1 líneas): "Repetir tutorial": la historia desemboca otra vez en el tutorial
- `resetProgress` (línea 151, 9 líneas): empezar como jugador nuevo: olvida historia, tutorial, intentos y récords
- `openLevels` (línea 160, 6 líneas): *sin comentario*
- `startLevel` (línea 166, 9 líneas): *sin comentario*

**Estilo:** 79 líneas de más de 100 caracteres (la más larga: 614); 53 instrucciones en la misma línea que otra; 19 `if`/bucles sin llaves; 66 números sin nombre; funciones largas: renderLevels (41).

**Comentarios de historia:** «68: íconos de lo nuevo en cada nivel» · «147: por ahora, todos los niveles abiertos desde el inicio» · «150: empezar como jugador nuevo: olvida historia, tutorial, intentos y récords»

**Parece sin usar (todavía no se borra):** `STAR_SVG`, `NEW_ICON`

**Zonas delicadas:** 1 llamadas al azar, claves guardadas `'orbita_p1_historia'`, `'orbita_lvstars'`, `'orbita_p1_tutorial'`, `'orbita_p1_intentos'`, `'orbita_p1_anillo'`, `'orbita_best_v2'`, `'orbita_p1_vistos'`, `'orbita_p1_pista'`, `'orbita_p1_planeta'`, `'orbita_p1_maxperf'`, `'orbita_p1_pluton'`, `'orbita_p1_todos'`, `'orbita_estrellas'`, `'orbita_p1_poderlisto'`, `'orbita_p2_anillo'`, `'orbita_p2_intentos'`, `'orbita_p3_anillo'`, `'orbita_p3_intentos'`, `'orbita_p4_anillo'`, `'orbita_p4_intentos'`, `'orbita_p5_anillo'`, `'orbita_p5_intentos'`, `'orbita_p6_anillo'`, `'orbita_p6_intentos'`, `'orbita_p7_anillo'`, `'orbita_p7_intentos'`, `'orbita_p8_anillo'`, `'orbita_p8_intentos'`, 2 `innerHTML`, 5 `addEventListener`, 2 temporizadores, 1 `requestAnimationFrame`.

## 26-pantalla-inicio.js · 56 líneas

**Qué hace:** pantalla de inicio (como Geometry Dash): se queda hasta que eliges / a dónde volver después de ver la historia desde un menú

**Da:** `elHome`, `muted`, `applyMute`, `storyReturn`, `renderHome`, `openHome`

**Usa:** 02-audio (AC, outBus, initAudio); 07-planetas (PLANET_SVG, allPlanets); 34-misiones (misReady, misMoons, openMissions); 35-medidor (MEDIR, medEl, medPrev); 25-selector-niveles (storySeen, openLevels, tutAfterStory, resetProgress, elLv, pendingTut); 23-intro (startIntro, introDrone); 29-planetas-hd (openPlanets); 27-inicio-animacion (homeAmbience, homeT, HOME_IN, logoT0, HOME_BIG, hsEvents, hsFlare, hsBoost, hsShake, hsJet, hsRipple); 28-sonidos-interfaz (showStop, showStart); 08-partida-estado (tutorial); 16-partida (setup); 06-record-y-estado (state); 01-pantalla-y-utilidades (elPanel, elHud); 05-musica-reproductor (stopMusic)

**Cambia de otros archivos:** 25-selector-niveles (`tutAfterStory`, `pendingTut`); 35-medidor (`MEDIR`, `medEl`, `medPrev`); 07-planetas (`allPlanets`); 08-partida-estado (`tutorial`); 06-record-y-estado (`state`); 27-inicio-animacion (`homeT`, `logoT0`, `hsEvents`, `hsFlare`, `hsBoost`, `hsShake`, `hsJet`, `hsRipple`)

**Variables propias:** `const elHome`, `let muted`, `let storyReturn`

**Funciones:**

- `applyMute` (línea 5, 1 líneas): *sin comentario*
- `hasNewPlanet` (línea 7, 1 líneas): a dónde volver después de ver la historia desde un menú
- `renderHome` (línea 8, 16 líneas): *sin comentario*
- `homeAction` (línea 24, 19 líneas, sangría 4): *sin comentario*
- `hideHome` (línea 43, 1 líneas): *sin comentario*
- `openHome` (línea 44, 11 líneas): *sin comentario*

**Estilo:** 19 líneas de más de 100 caracteres (la más larga: 413); 36 instrucciones en la misma línea que otra; 14 `if`/bucles sin llaves; 4 números sin nombre; más de 3 niveles de sangría: homeAction (4).

**Zonas delicadas:** claves guardadas `'orbita_p1_sonido'`, `'orbita_pl_nuevo'`, `'orbita_medidor'`, `'orbita_p1_todos'`, 1 `innerHTML`, 1 `addEventListener`.

## 27-inicio-animacion.js · 176 líneas

**Qué hace:** entrada a la pantalla de inicio: un agujero negro enorme que se aleja / música de misterio: un zumbido profundo que respira, notas de cristal flotando y un viento cósmico / la demostración: el agujero negro dobla la luz, se come rocas y destroza una estrella

**Da:** `homeAmbience`, `HOME_BIG`, `HOME_IN`, `logoT0`, `hsRipple`, `camZoom`, `homeT`, `hsFlare`, `hsBoost`, `hsShake`, `hsJet`, `hsEvents`, `logoSounds`, `updateHomeShow`, `renderHomeIntro`

**Usa:** 02-audio (AC, master, ROOT, noiseHit); 26-pantalla-inicio (muted); 03-musica-ritmos (echoBus); 28-sonidos-interfaz (showOut, uiTone, uiOut, rockIn, bigSuck, gwChirp, showStop); 24-presentacion (sfl, SK, BR0, BR1, bhDiskK, bhCore, drawLogo); 01-pantalla-y-utilidades (clamp, buzz, reduceMotion, ctx, W, H, SUN, S, CX, CY, stars, BONE, PR); 23-intro (easeIO); 16-partida (rr); 08-partida-estado (sunLevel, t); 29-planetas-hd (drawPlayer)

**Cambia de otros archivos:** 24-presentacion (`sfl`)

**Variables propias:** `const HOME_BIG`, `const HOME_IN`, `let logoT0`, `let hsRipple`, `let camZoom`, `let homeT`, `let amb`, `let hsFlare`, `let hsBoost`, `let hsShake`, `let hsJet`, `let hsEvents`, `const ROCKS`, `const TDE`

**Funciones:**

- `homeAmbience` (línea 3, 27 líneas, sangría 5): música de misterio: un zumbido profundo que respira, notas de cristal flotando y un viento cósmico
- `hsLow` (línea 37, 1 líneas): la estrella que es destrozada
- `hsSound` (línea 38, 24 líneas, sangría 4): *sin comentario*
- `glassNote` (línea 63, 7 líneas): sonidos del logotipo al formarse: una nota por letra, y la Tierra cayendo en el acento
- `logoSounds` (línea 71, 11 líneas, sangría 4): sonidos del logotipo al formarse, en la misma tonalidad de la música de misterio
- `updateHomeShow` (línea 82, 13 líneas): *sin comentario*
- `spiralPos` (línea 96, 1 líneas): trayectoria en espiral hacia el horizonte (u: 0 a 1)
- `renderHomeIntro` (línea 97, 78 líneas, sangría 4): *sin comentario*

**Estilo:** 57 líneas de más de 100 caracteres (la más larga: 426); 199 instrucciones en la misma línea que otra; 10 `if`/bucles sin llaves; 1 ternarios anidados; 289 números sin nombre; funciones largas: renderHomeIntro (78); más de 3 niveles de sangría: homeAmbience (5), hsSound (4), logoSounds (4), renderHomeIntro (4); nombres cortos o crípticos: `amb`, `TDE`.

**Zonas delicadas:** 3 llamadas al azar, 26 nodos de audio creados.

## 28-sonidos-interfaz.js · 152 líneas

**Qué hace:** sonidos de la interfaz: cristal y eco, en la tonalidad del juego / al pasar el puntero: una nota de cristal suave, distinta cada vez / al tocar: una campana grave; al tocar Jugar: el agujero negro "traga" el toque

**Da:** `uiOut`, `uiTone`, `showOut`, `showStart`, `showStop`, `rockIn`, `bigSuck`, `gwChirp`

**Usa:** 02-audio (AC, master, ROOT, noiseHit); 26-pantalla-inicio (muted); 18-pausa (paused, pzSnd); 29-planetas-hd (uiGlass)

**Variables propias:** `let uiBus`, `let lastHover`, `let uiLastT`, `let showBus`, `let bed`

**Funciones:**

- `uiOut` (línea 3, 7 líneas): *sin comentario*
- `uiTone` (línea 10, 6 líneas): *sin comentario*
- `uiHover` (línea 17, 9 líneas): al pasar el puntero: una nota de cristal suave, distinta cada vez
- `uiClick` (línea 27, 18 líneas): al tocar: una campana grave; al tocar Jugar: el agujero negro "traga" el toque
- `showOut` (línea 62, 1 líneas): *sin comentario*
- `showStart` (línea 64, 16 líneas): un "inhalar" que nunca para: oleadas de aire que bajan de tono y se cortan, como un desagüe cósmico
- `showStop` (línea 80, 8 líneas, sangría 5): *sin comentario*
- `rockIn` (línea 89, 16 líneas): cada roca: un silbido que sube mientras acelera hacia el centro y se corta al cruzar el horizonte
- `bigSuck` (línea 106, 12 líneas, sangría 4): justo antes de tragarse la estrella: una gran inhalación que crece y se corta en seco
- `perseusVoice` (línea 121, 16 líneas): "Voz" inspirada en la sonificación de la NASA del agujero negro de Perseo (2022): un gemido grave que cambia lentamente de tono
- `gwChirp` (línea 138, 13 líneas): "Chirrido" inspirado en las ondas gravitacionales que detectó LIGO en 2015: sube de tono, crece y se apaga de golpe

**Estilo:** 40 líneas de más de 100 caracteres (la más larga: 246); 133 instrucciones en la misma línea que otra; 17 `if`/bucles sin llaves; 150 números sin nombre; más de 3 niveles de sangría: showStop (5), bigSuck (4); nombres cortos o crípticos: `bed`.

**Comentarios de historia:** «105: justo antes de tragarse la estrella: una gran inhalación que crece y se corta en seco»

**Zonas delicadas:** 1 llamadas al azar, 2 `addEventListener`, 41 nodos de audio creados.

## 29-planetas-hd.js · 660 líneas

**Qué hace:** pantalla de planetas: el planeta girando en el espacio / detalles de superficie: [longitud, latitud, ancho, alto, color] / planetas en HD: textura procedural 3D horneada una vez + esfera iluminada en WebGL

**Da:** `elPl`, `PLGL`, `planetRing`, `drawBigPlanet`, `drawPlayer`, `renderPlanetsScene`, `planetStep`, `openPlanets`, `uiGlass`

**Usa:** 01-pantalla-y-utilidades (W, H, ctx, rgba, CX, CY, S, stars, BONE, cvs); 12-poderes (ringBoostNow, hsh, drawCaronteBack, shieldT); 08-partida-estado (t, tutorial, particles); 07-planetas (PLANETS_P, sizeK, curPlanet, planetOk); 21-dibujo (drawEarth); 15-peligros (waveProx); 06-record-y-estado (state); 11-peligros-datos (hot, hotT); 30-escanear (scanOn, scanK, pRot, scanLineT, scanApplyAt, applyScanBars, STAT_ROWS, statWords, setScan); 00-iconos-flechas (ARC_L, CHEV_L); 02-audio (AC, ROOT); 26-pantalla-inicio (muted, elHome); 28-sonidos-interfaz (uiTone, uiOut)

**Cambia de otros archivos:** 12-poderes (`ringBoostNow`); 08-partida-estado (`t`); 30-escanear (`scanK`, `pRot`, `scanLineT`, `scanApplyAt`, `scanOn`); 07-planetas (`curPlanet`); 06-record-y-estado (`state`)

**Variables propias:** `const elPl`, `let pIndex`, `let pSwap`, `let pDir`, `let pTarget`, `let pPos`, `let pDrag`, `let pSlots`, `let pScan`, `let pScanT`, `let pSK`, `let pUse`, `const PFEAT`, `const PBASE`, `const PBANDS`, `const PLGL (módulo)`, `const POW_ICO`

**Funciones:**

- `pGeom` (línea 4, 1 líneas): *sin comentario*
- `planetRing` (línea 375, 27 líneas): anillos con sus divisiones reales (C, B, Cassini, A, Encke) dibujados nítidos en 2D
- `drawBigPlanet` (línea 404, 14 líneas): light: 'left' (pantalla de planetas, luz del Sol) o 'below' (en el juego, luz del disco del agujero negro)
- `drawBigPlanet2D` (línea 418, 37 líneas, sangría 4): *sin comentario*
- `drawPlayer` (línea 456, 19 líneas): el planeta del jugador en el juego: su tamaño real (en escala) cambia cómo se ve
- `drawHot` (línea 476, 15 líneas): sobrecalentado: brilla al rojo vivo, la atmósfera chisporrotea y sale humo (se queda así el resto del intento)
- `renderPlanetsScene` (línea 491, 27 líneas): *sin comentario*
- `drawPlanetOrbit` (línea 519, 72 líneas, sangría 5): pantalla de planetas en órbita: el elegido grande arriba y los demás sobre una órbita; al cambiar, todo gira contigo
- `renderPlanets` (línea 604, 41 líneas, sangría 4): *sin comentario*
- `planetStep` (línea 645, 1 líneas): *sin comentario*
- `warmNext` (línea 647, 1 líneas): prepara en segundo plano la textura HD del siguiente planeta para que el cambio no dé tirón
- `openPlanets` (línea 648, 1 líneas): *sin comentario*
- `closePlanets` (línea 649, 1 líneas): *sin comentario*
- `uiGlass` (línea 651, 8 líneas): sonido de cristal para las flechas: dos notas que suben (siguiente) o bajan (anterior)

**Estilo:** 176 líneas de más de 100 caracteres (la más larga: 565); 374 instrucciones en la misma línea que otra; 45 `if`/bucles sin llaves; 3 ternarios anidados; 594 números sin nombre; funciones largas: drawPlanetOrbit (72), renderPlanets (41); más de 3 niveles de sangría: drawBigPlanet2D (4), drawPlanetOrbit (5), renderPlanets (4); nombres cortos o crípticos: `pSK`.

**Zonas delicadas:** 8 llamadas al azar, claves guardadas `'orbita_p1_planeta'`, `'orbita_pl_nuevo'`, 1 `innerHTML`, 10 `addEventListener`, 1 temporizadores, 2 nodos de audio creados, 2 shaders GLSL.

## 30-escanear.js · 36 líneas

**Qué hace:** Escanear: el planeta gira, se encoge y aparecen sus datos reales / cómo se siente cada característica en el juego: una palabra y su efecto (los números reales van debajo) / las barras crecen desde el centro (la Tierra) cuando el planeta termina de encogerse

**Da:** `scanOn`, `scanK`, `pRot`, `scanLineT`, `scanApplyAt`, `statWords`, `STAT_ROWS`, `applyScanBars`, `setScan`

**Usa:** 29-planetas-hd (elPl); 02-audio (AC, ROOT); 26-pantalla-inicio (muted); 28-sonidos-interfaz (uiOut, uiTone)

**Variables propias:** `let scanOn`, `let scanK`, `let pRot`, `let scanLineT`, `let scanApplyAt`, `const STAT_ROWS`

**Funciones:**

- `statWords` (línea 4, 5 líneas): cómo se siente cada característica en el juego: una palabra y su efecto (los números reales van debajo)
- `applyScanBars` (línea 15, 6 líneas): las barras crecen desde el centro (la Tierra) cuando el planeta termina de encogerse
- `uiScan` (línea 21, 9 líneas): *sin comentario*
- `setScan` (línea 30, 5 líneas): *sin comentario*

**Estilo:** 10 líneas de más de 100 caracteres (la más larga: 203); 14 instrucciones en la misma línea que otra; 6 `if`/bucles sin llaves; 6 ternarios anidados; 35 números sin nombre.

**Zonas delicadas:** 1 temporizadores, 2 nodos de audio creados.

## 31-fondos-2d.js · 235 líneas

**Qué hace:** dentro de Andrómeda: toda la pantalla es la galaxia (colores reales) / núcleo amarillo-blanco de estrellas viejas, brazos espirales azules de estrellas jóvenes, / franjas de polvo café, nebulosas rosadas de hidrógeno donde nacen estrellas, y sus satélites M32 y M110

**Da:** `drawAndromeda`, `drawMagallanes`, `drawGalBG`

**Usa:** 01-pantalla-y-utilidades (W, H, ctx, clamp, CX, CY); 08-partida-estado (t)

**Variables propias:** `let andCanvas`, `let andKey`, `const AND_TW`, `let magCanvas`, `let magKey`, `const bgCache`, `const BG_BUILD`

**Funciones:**

- `buildAndromeda` (línea 5, 58 líneas, sangría 4): *sin comentario*
- `drawAndromeda` (línea 64, 12 líneas): *sin comentario*
- `buildMagallanes` (línea 81, 46 líneas): *sin comentario*
- `drawMagallanes` (línea 127, 9 líneas): *sin comentario*
- `blob` (línea 140, 1 líneas): *sin comentario*
- `drawGalBG` (línea 211, 23 líneas, sangría 5): *sin comentario*

**Estilo:** 76 líneas de más de 100 caracteres (la más larga: 353); 250 instrucciones en la misma línea que otra; 12 `if`/bucles sin llaves; 347 números sin nombre; funciones largas: buildAndromeda (58), buildMagallanes (46); más de 3 niveles de sangría: buildAndromeda (4), drawGalBG (5).

## 32-fondos-1-comun.js · 28 líneas

**Qué hace:** Fondos en WebGL: lo que comparten todos los shaders de fondo / fondos en WebGL: capas, movimiento, gas y la luz doblada por el agujero negro / Se dibuja con la tarjeta gráfica a media resolución (el gas es suave) y se copia al lienzo del juego.

**Da:** `BG_VS`, `BG_COMMON`

**Variables propias:** `const BG_VS`, `const BG_COMMON`

**Estilo:** 7 líneas de más de 100 caracteres (la más larga: 151).

**Zonas delicadas:** 1 shaders GLSL.

## 32-fondos-2-andromeda.js · 282 líneas

**Qué hace:** Andrómeda (nivel 3): el shader de la galaxia vista desde dentro / Andrómeda: disco inclinado ~77°, núcleo de estrellas viejas, brazos azules, franjas de polvo, regiones rosadas, M32 y M110 / Andrómeda: el viaje pasa por sus lugares reales, de las afueras al núcleo

**Da:** `FS_AND`, `FS_AND2`

**Usa:** 32-fondos-1-comun (BG_COMMON)

**Variables propias:** `const FS_AND`, `const FS_AND2`

**Estilo:** 58 líneas de más de 100 caracteres (la más larga: 195).

## 32-fondos-3-via-lactea.js · 234 líneas

**Qué hace:** Vía Láctea / Sistema solar (nivel 1) / fondo con fotografía: la foto real en capas, con la luz doblada por el agujero negro / Sistema solar: la Vía Láctea como en una foto de cielo profundo (muchísimas estrellas, polvo oscuro, nebulosas rojizas)

**Da:** `FS_MW`

**Usa:** 32-fondos-1-comun (BG_COMMON)

**Variables propias:** `const FS_MW`

**Estilo:** 35 líneas de más de 100 caracteres (la más larga: 196).

## 32-fondos-4-magallanes.js · 230 líneas

**Qué hace:** Nubes de Magallanes (nivel 2) / Nubes de Magallanes: el viaje pasa por sus lugares reales

**Da:** `FS_LMC`

**Usa:** 32-fondos-1-comun (BG_COMMON)

**Variables propias:** `const FS_LMC`

**Estilo:** 36 líneas de más de 100 caracteres (la más larga: 196).

## 32-fondos-50-lejanas.js · 89 líneas

**Qué hace:** Galaxias lejanas (niveles 4 a 8): lo que comparten sus fondos (estrellas, cúmulos, meteoros, destellos)

**Da:** `GX_BASE`

**Variables propias:** `const GX_BASE`

**Estilo:** 16 líneas de más de 100 caracteres (la más larga: 285).

## 32-fondos-51-centaurus.js · 63 líneas

**Qué hace:** Centaurus A (nivel 4): cuerpo, franja de polvo, chorros y lóbulos

**Da:** `GX_CENTAURUS`

**Variables propias:** `const GX_CENTAURUS`

**Estilo:** 9 líneas de más de 100 caracteres (la más larga: 167).

## 32-fondos-52-remolino.js · 165 líneas

**Qué hace:** El Remolino, M51 (nivel 5): el viaje por dentro de la galaxia

**Da:** `GX_REMOLINO`

**Variables propias:** `const GX_REMOLINO`

**Estilo:** 63 líneas de más de 100 caracteres (la más larga: 215).

## 32-fondos-53-sombrero.js · 49 líneas

**Qué hace:** El Sombrero, M104 (nivel 6): bulbo, anillo de polvo y cúmulos globulares

**Da:** `GX_SOMBRERO`

**Variables propias:** `const GX_SOMBRERO`

**Estilo:** 11 líneas de más de 100 caracteres (la más larga: 197).

## 32-fondos-54-m87.js · 62 líneas

**Qué hace:** M87 (nivel 7): halo, chorro, gas y el anillo del Event Horizon Telescope

**Da:** `GX_M87`

**Variables propias:** `const GX_M87`

**Estilo:** 20 líneas de más de 100 caracteres (la más larga: 175).

## 32-fondos-55-sagitario.js · 71 líneas

**Qué hace:** Sagitario A* (nivel 8): el centro de nuestra galaxia

**Da:** `GX_SAGITARIO`

**Variables propias:** `const GX_SAGITARIO`

**Estilo:** 29 líneas de más de 100 caracteres (la más larga: 205).

## 32-fondos-56-final.js · 91 líneas

**Qué hace:** Galaxias lejanas: la Vía Láctea vista desde fuera, la capa final y main(); aquí se arma FS_GX / Centaurus A, Remolino, Sombrero, M87 y Sagitario A*: escenas reales con los tonos medidos en fotos de Hubble, ESO, Webb y el EHT

**Da:** `FS_GX`

**Usa:** 32-fondos-1-comun (BG_COMMON); 32-fondos-50-lejanas (GX_BASE); 32-fondos-51-centaurus (GX_CENTAURUS); 32-fondos-52-remolino (GX_REMOLINO); 32-fondos-53-sombrero (GX_SOMBRERO); 32-fondos-54-m87 (GX_M87); 32-fondos-55-sagitario (GX_SAGITARIO)

**Variables propias:** `const GX_FINAL`, `const FS_GX`

**Estilo:** 24 líneas de más de 100 caracteres (la más larga: 196).

## 32-fondos-6-foto.js · 29 líneas

**Qué hace:** fotos reales como fondo (si hay)

**Da:** `FS_PHOTO`

**Usa:** 32-fondos-1-comun (BG_COMMON)

**Variables propias:** `const FS_PHOTO`

**Estilo:** 1 líneas de más de 100 caracteres (la más larga: 117).

## 32-fondos-9-motor.js · 72 líneas

**Qué hace:** fondos en WebGL: el motor que dibuja el shader de cada galaxia / carga una fotografía (url o data:) como textura / dibuja el fondo del nivel; devuelve false si no se pudo (y el juego usa el fondo anterior)

**Da:** `GLBG`, `REMOLINO_PHOTO`, `remolinoSource`

**Usa:** 32-fondos-1-comun (BG_VS); 32-fondos-6-foto (FS_PHOTO); 32-fondos-3-via-lactea (FS_MW); 32-fondos-4-magallanes (FS_LMC); 32-fondos-2-andromeda (FS_AND2, FS_AND); 32-fondos-56-final (FS_GX); 01-pantalla-y-utilidades (W, H, SUN, S, CX, CY, ctx); 16-partida (rr); 08-partida-estado (sunLevel, t)

**Variables propias:** `const GLBG (módulo)`, `let REMOLINO_PHOTO`

**Funciones:**

- `remolinoSource` (línea 71, 1 líneas): sin foto todavía: se usa el fondo dibujado

**Estilo:** 21 líneas de más de 100 caracteres (la más larga: 279); 62 instrucciones en la misma línea que otra; 15 `if`/bucles sin llaves; 4 ternarios anidados; 17 números sin nombre.

## 33-tarjetas-niveles.js · 285 líneas

**Qué hace:** tarjetas vivas: cada galaxia se dibuja en movimiento, en tiempo real (WebGL) / Una sola escena a pantalla completa detrás de las tarjetas: al deslizar, cada galaxia se mueve con su tarjeta. / tarjetas: todo lo nítido se dibuja a resolución completa (estrellas, planet

**Da:** `lvCanvas`, `lvArts`, `drawLevelsBG`

**Usa:** 08-partida-estado (t); 01-pantalla-y-utilidades (ctx, W, H); 29-planetas-hd (drawBigPlanet); 24-presentacion (bhDiskK, SK, BR0, BR1, bhCore); 25-selector-niveles (elLv, LEVELS)

**Variables propias:** `const LVGL (módulo)`, `let lvCanvas`, `let lvArts`, `let lvStars`, `let lvSets`, `let lvA`, `const LV_PL`, `const LV_SCALE`

**Funciones:**

- `lvRand` (línea 174, 1 líneas): *sin comentario*
- `lvPrep` (línea 175, 12 líneas): *sin comentario*
- `lvGlow` (línea 187, 1 líneas): *sin comentario*
- `lvPoints` (línea 188, 3 líneas): *sin comentario*
- `lvSpike` (línea 191, 4 líneas): estrella brillante con destellos que se desvanecen (como en las fotos de los telescopios)
- `lvKepler` (línea 195, 2 líneas): *sin comentario*
- `lvCrisp` (línea 199, 55 líneas, sangría 4): *sin comentario*
- `drawLevelsBG` (línea 256, 27 líneas): *sin comentario*

**Estilo:** 81 líneas de más de 100 caracteres (la más larga: 345); 117 instrucciones en la misma línea que otra; 11 `if`/bucles sin llaves; 2 ternarios anidados; 213 números sin nombre; funciones largas: lvCrisp (55); más de 3 niveles de sangría: lvCrisp (4); nombres cortos o crípticos: `lvA`.

**Zonas delicadas:** 1 shaders GLSL.

## 34-misiones.js · 341 líneas

**Qué hace:** misiones y polvo estelar / estrellas = habilidad (desbloquean) · polvo estelar = constancia (compra). Diarias: tres al día, cambian a medianoche. / el ícono de Misiones en el inicio: una constelación de tres estrellas (una por misión del día) dentro de un arco de progreso;

**Da:** `misMoons`, `misOpen`, `misEvent`, `misWin`, `misReady`, `openMissions`, `misPlanetDraw`

**Usa:** 08-partida-estado (tutorial, t); 02-audio (AC, ROOT, noise); 26-pantalla-inicio (muted, elHome, renderHome); 28-sonidos-interfaz (uiTone); 10-ritmo-y-objetos (COIN_RINGS); 25-selector-niveles (lvStarsGot, LEVELS); 07-planetas (PLANETS_P, planetThumb, curPlanet); 29-planetas-hd (PLGL, uiGlass); 00-iconos-flechas (ARC_L, CHEV_L); 01-pantalla-y-utilidades (buzz)

**Variables propias:** `const MIS_DAILY`, `const MIS_ACH`, `const MIS_FACT`, `var misDetail`, `var MIS`, `var misTab`, `var misTimer`, `var misFx`, `var misOpen`, `var misSwitch`, `const elMis`, `const MIS_ICO`, `const MIS_DICO`, `const MIS_AICO`, `var misThumbs`, `var misMinis`, `const GAL_COL`, `const MIS_COL`, `var misCount`

**Funciones:**

- `misMoons` (línea 5, 11 líneas): cada misión cumplida enciende una estrella y llena un tercio del arco; con las tres, la constelación se une y el círculo se cierra
- `misCrystal` (línea 16, 1 líneas): *sin comentario*
- `misToday` (línea 49, 1 líneas): *sin comentario*
- `misLoad` (línea 50, 5 líneas): *sin comentario*
- `misSave` (línea 55, 1 líneas): *sin comentario*
- `misRoll` (línea 56, 6 líneas): *sin comentario*
- `misDef` (línea 62, 1 líneas): *sin comentario*
- `misEvent` (línea 63, 8 líneas): *sin comentario*
- `misWin` (línea 71, 7 líneas): *sin comentario*
- `misPing` (línea 78, 5 líneas): en plena partida: las tres lunas aparecen un instante arriba y se enciende la nueva
- `misStarsBest` (línea 83, 1 líneas): *sin comentario*
- `achProg` (línea 84, 14 líneas): *sin comentario*
- `misReady` (línea 98, 6 líneas): *sin comentario*
- `misStreak` (línea 104, 1 líneas): *sin comentario*
- `misLeft` (línea 105, 1 líneas): *sin comentario*
- `openMissions` (línea 107, 5 líneas): *sin comentario*
- `misWhoosh` (línea 112, 1 líneas): *sin comentario*
- `closeMissions` (línea 113, 1 líneas): *sin comentario*
- `misClaimSound` (línea 114, 1 líneas): *sin comentario*
- `misMini` (línea 132, 32 líneas): miniaturas con el mismo lenguaje que los dibujos grandes del juego (brillos, colores de cada galaxia)
- `misThumb` (línea 164, 1 líneas): *sin comentario*
- `misTint` (línea 166, 1 líneas): *sin comentario*
- `misFeatured` (línea 168, 5 líneas): el logro más cercano a completarse (o uno listo para cobrar)
- `renderMissions` (línea 173, 73 líneas, sangría 5): *sin comentario*
- `misDetailHTML` (línea 246, 10 líneas): *sin comentario*
- `misBurst` (línea 258, 23 líneas, sangría 5): *sin comentario*
- `misSwipe` (línea 282, 8 líneas): cerrar deslizando el panel hacia abajo
- `misPlanetDraw` (línea 290, 4 líneas): *sin comentario*
- `misCanvasDraw` (línea 294, 46 líneas, sangría 4): *sin comentario*

**Estilo:** 163 líneas de más de 100 caracteres (la más larga: 491); 351 instrucciones en la misma línea que otra; 75 `if`/bucles sin llaves; 8 ternarios anidados; 366 números sin nombre; funciones largas: renderMissions (73), misCanvasDraw (46); más de 3 niveles de sangría: renderMissions (5), misBurst (5), misCanvasDraw (4); nombres cortos o crípticos: `MIS`.

**Comentarios de historia:** «11: la línea se detiene antes de cada estrella, como en un mapa del cielo» · «78: en plena partida: las tres lunas aparecen un instante arriba y se enciende la nueva»

**Parece sin usar (todavía no se borra):** `MIS_ICO`

**Zonas delicadas:** 5 llamadas al azar, claves guardadas `'orbita_mis'`, 3 `innerHTML`, 14 `addEventListener`, 6 temporizadores, 2 `requestAnimationFrame`.

## 35-medidor.js · 28 líneas

**Qué hace:** medidor de rendimiento (pruebas) / Se enciende en Ajustes ("Medidor de rendimiento") o agregando ?medir al enlace. Apagado no hace nada. / Muestra, de los últimos 2 segundos: cuadros por segundo, ms entre cuadros (mediana y peor 5 %), cuánto de cada cuadro

**Da:** `MEDIR`, `medEl`, `medPrev`, `medMid`, `medFrame`

**Usa:** 08-partida-estado (particles)

**Variables propias:** `let MEDIR`, `let medEl`, `let medPrev`, `let medMid`, `let medShow`, `const medInt`, `const medJs`, `const medUpd`, `const medJank`

**Funciones:**

- `medFrame` (línea 10, 18 líneas): *sin comentario*

**Estilo:** 12 líneas de más de 100 caracteres (la más larga: 305); 9 instrucciones en la misma línea que otra; 4 `if`/bucles sin llaves; 1 ternarios anidados; 10 números sin nombre.

**Zonas delicadas:** claves guardadas `'orbita_medidor'`, 1 `innerHTML`.

## 36-bucle-principal.js · 26 líneas

**Qué hace:** congelado: el lienzo conserva el último cuadro / en pantallas tranquilas, adelantar las rocas de la partida (ver astPrebake)

**Da:** `last`

**Usa:** 35-medidor (MEDIR, medMid, medFrame); 06-record-y-estado (state); 10-ritmo-y-objetos (elWallet); 27-inicio-animacion (homeT, HOME_IN, logoSounds, updateHomeShow, renderHomeIntro); 34-misiones (misOpen, misPlanetDraw); 24-presentacion (updateSplash, renderSplash); 23-intro (updateIntro, renderIntro); 29-planetas-hd (renderPlanetsScene); 08-partida-estado (t, deadT); 33-tarjetas-niveles (drawLevelsBG); 26-pantalla-inicio (elHome); 20-logica (update); 21-dibujo (render, astPrebake); 18-pausa (paused); 01-pantalla-y-utilidades (ctx)

**Cambia de otros archivos:** 08-partida-estado (`t`); 27-inicio-animacion (`homeT`); 35-medidor (`medMid`)

**Variables propias:** `let last`

**Funciones:**

- `frame` (línea 2, 23 líneas): *sin comentario*

**Estilo:** 4 líneas de más de 100 caracteres (la más larga: 261); 16 instrucciones en la misma línea que otra; 7 `if`/bucles sin llaves; 7 números sin nombre.

**Zonas delicadas:** 2 `requestAnimationFrame`.

## Código repetido (líneas de 50+ caracteres en 2+ lugares)

- `const o1 = AC.createOscillator(), o2 = AC.createOscillator();` — 02-audio:28, 03-musica-ritmos:85
- `const src = AC.createBufferSource(); src.buffer = NOISE;` — 02-audio:38, 03-musica-ritmos:194, 16-partida:179, 24-presentacion:184
- `const t0 = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();` — 02-audio:47, 02-audio:55, 02-audio:64, 23-intro:81
- `const o = AC.createOscillator(), g = AC.createGain();` — 03-musica-ritmos:6, 03-musica-ritmos:21, 03-musica-ritmos:64
- `const o = AC.createOscillator(), g = AC.createGain(), lp = AC.createBiquadFilter();` — 03-musica-ritmos:52, 03-musica-ritmos:58, 28-sonidos-interfaz:11
- `const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine';` — 03-musica-ritmos:118, 04-musica-horizonte:61, 28-sonidos-interfaz:32
- `const bar = Math.floor(s/16), [root, tones] = PROG[Math.floor(bar/2) % 4], b = s % 16, L = lv();` — 03-musica-ritmos:152, 03-musica-ritmos:170
- `if (dz > .45 && (dz > .75 || b % 2 === 0)) noiseHit(t0, .025, 'highpass', 7500, .04 + .1*dz, musicBus);   // t` — 03-musica-ritmos:157, 03-musica-ritmos:173
- `g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + .004); g.gain.exponentialRamp` — 03-musica-ritmos:212, 03-musica-ritmos:252
- `if (dz > .45 && (dz > .75 || b % 2 === 0)) noiseHit(t0, .025, 'highpass', 7500, .04 + .1*dz, musicBus);` — 03-musica-ritmos:238, 03-musica-ritmos:286, 03-musica-ritmos:334
- `const f1 = AC.createBiquadFilter(), f2 = AC.createBiquadFilter(), g = AC.createGain();` — 03-musica-ritmos:257, 04-musica-horizonte:106
- `if (!riserOn && s % 32 === 16){ riserOn = true; riser(t0, 16*STEP); }` — 05-musica-reproductor:4, 05-musica-reproductor:8
- `const o = AC.createOscillator(), og = AC.createGain(), l = AC.createOscillator(), lg = AC.createGain();` — 05-musica-reproductor:50, 28-sonidos-interfaz:130
- `ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';` — 12-poderes:104, 12-poderes:122, 12-poderes:239, 12-poderes:255, 12-poderes:310, 12-poderes:369, 12-poderes:403, 15-peligros:291
- `ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.globalCompositeOperation = 'lighter';` — 12-poderes:141, 12-poderes:196
- `ctx.save(); ctx.globalCompositeOperation = 'lighter';` — 12-poderes:155, 12-poderes:182, 12-poderes:207, 12-poderes:273, 12-poderes:283, 12-poderes:291, 13-agujero-de-gusano:82, 14-lente-gravitacional:44, 15-peligros:247, 21-dibujo:257, 22-viaje-sistema-solar:50, 29-planetas-hd:478
- `for (let a = 0; a < Math.PI*2 - 1e-6; a += stepA){` — 16-partida:25, 16-partida:53
- `for (let i=0;i<n;i++) obs.push({a: base + i*(Math.PI*2/n) + (rng()-.5)*.4, r: 9.5, seed: rng()*100});` — 16-partida:62, 16-partida:68
- `elHud.style.opacity = 1; elPanel.classList.add('hide');` — 16-partida:107, 17-tutorial:33
- `noise(.25, 300, 6000, .25, 'bandpass'); cowbell(SCALE[4] + 12); buzz([15,30,25]);` — 16-partida:134, 16-partida:200
- `const o = AC.createOscillator(), gg = AC.createGain(), lp = AC.createBiquadFilter();` — 16-partida:184, 24-presentacion:193
- `{ const nr = rings.get(level + 1); if (nr) nr.flash = 1; } buzz(12);` — 16-partida:253, 16-partida:293
- `g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + .006); g.gain.exponentialRamp` — 18-pausa:50, 28-sonidos-interfaz:13
- `try{ if (AC && AC.state === 'suspended') AC.resume(); }catch(e){}` — 18-pausa:98, 18-pausa:104
- `initAudio(); if (AC && AC.state === 'suspended') AC.resume();` — 19-controles:12, 19-controles:24, 25-selector-niveles:155, 25-selector-niveles:170
- `let cv = null, gl = null, pr = null, U = {}, ok = null;` — 21-dibujo:10, 24-presentacion:36
- `return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f` — 21-dibujo:15, 29-planetas-hd:45
- `mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x)` — 21-dibujo:16, 29-planetas-hd:46
- `let sc = 1; try{ const m = ctx.getTransform && ctx.getTransform(); sc = m ? Math.hypot(m.a, m.b) : (window.dev` — 21-dibujo:135, 24-presentacion:90, 29-planetas-hd:406
- `sh.addColorStop(0, 'rgba(10,14,30,0)'); sh.addColorStop(.5, 'rgba(10,14,30,.15)'); sh.addColorStop(1, 'rgba(10` — 21-dibujo:159, 23-intro:147
- `if (shake > 0) ctx.translate((Math.random()-.5)*shake, (Math.random()-.5)*shake);` — 22-viaje-sistema-solar:32, 23-intro:169
- `ctx.font = '700 12px Unbounded, system-ui, sans-serif';` — 22-viaje-sistema-solar:158, 22-viaje-sistema-solar:174
- `elPanel.innerHTML = MENU_HTML(); elPanel.classList.add('top'); elPanel.classList.remove('hide');` — 23-intro:60, 25-selector-niveles:173
- `ctx.font = '500 ' + fs + 'px Unbounded, system-ui, sans-serif';` — 23-intro:159, 23-intro:161
- `if (cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }` — 24-presentacion:92, 32-fondos-9-motor:45
- `ctx.beginPath(); ctx.arc(cx, cy, R*1.015, 0, Math.PI*2); ctx.stroke(); ctx.shadowBlur = 0; ctx.globalAlpha = 1` — 24-presentacion:108, 24-presentacion:162
- `ctx.font = LOGO.weight + ' ' + fs + 'px ' + (splashFont ? 'Unbounded' : 'system-ui') + ', sans-serif';` — 24-presentacion:127, 24-presentacion:220
- `ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, W, H);` — 24-presentacion:215, 27-inicio-animacion:100
- `elPanel.classList.add('hide'); elHud.style.opacity = 0;` — 25-selector-niveles:164, 26-pantalla-inicio:52
- `const b = e.target && e.target.closest ? e.target.closest('button') : null;` — 28-sonidos-interfaz:47, 28-sonidos-interfaz:52
- `gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, fal` — 29-planetas-hd:329, 29-planetas-hd:359, 32-fondos-9-motor:47
- `const c = document.createElement('canvas'); if (!c || !c.getContext) return null;` — 31-fondos-2d:9, 31-fondos-2d:85
- `const d = Math.min(window.devicePixelRatio || 1, 2); c.width = Math.round(W*d); c.height = Math.round(H*d);` — 31-fondos-2d:10, 31-fondos-2d:86, 31-fondos-2d:216
- `const g = c.getContext('2d'); if (!g || !g.setTransform) return null; g.setTransform(d, 0, 0, d, 0, 0);` — 31-fondos-2d:11, 31-fondos-2d:87
- `float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }` — 32-fondos-1-comun:8, 33-tarjetas-niveles:8
- `vec2 h22(vec2 p){ float n = h21(p); return vec2(n, h21(p + n)); }` — 32-fondos-1-comun:9, 33-tarjetas-niveles:9
- `float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);` — 32-fondos-1-comun:10, 33-tarjetas-niveles:10
- `return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }` — 32-fondos-1-comun:11, 33-tarjetas-niveles:11
- `float fbm(vec2 p){ float s = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 5; i++){ s +=` — 32-fondos-1-comun:12, 33-tarjetas-niveles:12
- `vec2 g = q/sc, id = floor(g), f = fract(g); vec3 c = vec3(0.);` — 32-fondos-1-comun:17, 32-fondos-2-andromeda:104, 32-fondos-3-via-lactea:11, 32-fondos-4-magallanes:8, 32-fondos-50-lejanas:7, 33-tarjetas-niveles:15
- `for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){` — 32-fondos-1-comun:18, 32-fondos-2-andromeda:105, 32-fondos-2-andromeda:135, 32-fondos-2-andromeda:145, 32-fondos-3-via-lactea:12, 32-fondos-3-via-lactea:122, 32-fondos-3-via-lactea:213, 32-fondos-4-magallanes:9, 32-fondos-4-magallanes:40, 32-fondos-4-magallanes:51, 32-fondos-4-magallanes:186, 32-fondos-50-lejanas:8, 32-fondos-50-lejanas:20, 32-fondos-50-lejanas:31, 32-fondos-50-lejanas:69, 32-fondos-50-lejanas:79, 33-tarjetas-niveles:16
- `vec2 o = vec2(x, y), cid = id + o; float n = h21(cid); if (n > dens) continue;` — 32-fondos-1-comun:19, 32-fondos-2-andromeda:106, 32-fondos-3-via-lactea:13, 32-fondos-4-magallanes:10, 32-fondos-50-lejanas:9, 33-tarjetas-niveles:17
- `vec2 sp = o + h22(cid*1.7); float dd = length(f - sp)*sc;` — 32-fondos-1-comun:20, 32-fondos-2-andromeda:107, 32-fondos-3-via-lactea:14, 32-fondos-4-magallanes:11, 32-fondos-50-lejanas:10, 33-tarjetas-niveles:18
- `float bulge = exp(-pow(r/.06, .65))*1.9 + exp(-r/.14)*.35;` — 32-fondos-2-andromeda:19, 33-tarjetas-niveles:61
- `vec2 q = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);` — 32-fondos-2-andromeda:77, 32-fondos-6-foto:15, 33-tarjetas-niveles:133
- `float A1, A2, A3; vec2 L1 = lens(q + dr*.3, A1), L2 = lens(q + dr, A2), L3 = lens(q + dr*2., A3);` — 32-fondos-2-andromeda:79, 32-fondos-6-foto:17
- `float fbm7(vec2 p){ float s = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 7; i++){ s +` — 32-fondos-2-andromeda:101, 32-fondos-3-via-lactea:7, 32-fondos-4-magallanes:5, 32-fondos-50-lejanas:4
- `float rid(vec2 p){ float s = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 5; i++){ s +=` — 32-fondos-2-andromeda:102, 32-fondos-3-via-lactea:8, 32-fondos-4-magallanes:6, 32-fondos-50-lejanas:5
- `vec3 starsD(vec2 q, float sc, float dens, float bmul){` — 32-fondos-2-andromeda:103, 32-fondos-3-via-lactea:10, 32-fondos-4-magallanes:7, 32-fondos-50-lejanas:6
- `float b = (pow(h21(cid + 7.1), 9.)*2.2 + .18)*bmul, tw = .8 + .2*sin(uT*(1. + 3.*n) + n*40.);` — 32-fondos-2-andromeda:108, 32-fondos-3-via-lactea:15, 32-fondos-4-magallanes:12, 32-fondos-50-lejanas:11
- `vec3 col = mix(vec3(1., .78, .6), vec3(.72, .84, 1.), h21(cid + 3.3));` — 32-fondos-2-andromeda:109, 32-fondos-3-via-lactea:16, 32-fondos-4-magallanes:13, 32-fondos-50-lejanas:12
- `vec2 sceneD(vec2 q, float drift){ return (q - .5*uRes)/uScale + vec2(.05*sin(uT*.05 + drift*300.), .07*sin(uFl` — 32-fondos-2-andromeda:114, 32-fondos-3-via-lactea:84, 32-fondos-4-magallanes:18
- `float win(float j, float a, float b){ return smoothstep(a - .05, a + .05, j)*(1. - smoothstep(b - .05, b + .05` — 32-fondos-2-andromeda:115, 32-fondos-3-via-lactea:143, 32-fondos-4-magallanes:19, 32-fondos-50-lejanas:49
- `float fi = float(i), per = 5. + fi*2.3, tt = uT + fi*3.7, k = floor(tt/per), ph = fract(tt/per);` — 32-fondos-2-andromeda:119, 32-fondos-3-via-lactea:148, 32-fondos-4-magallanes:23, 32-fondos-50-lejanas:53
- `vec2 a0 = vec2(h21(vec2(k, fi)), .55 + .45*h21(vec2(fi, k + 3.)))*uRes;` — 32-fondos-2-andromeda:121, 32-fondos-3-via-lactea:150, 32-fondos-4-magallanes:25, 32-fondos-50-lejanas:55
- `vec2 dir = normalize(vec2(-.8 + 1.6*h21(vec2(k + 9., fi)), -1.));` — 32-fondos-2-andromeda:122, 32-fondos-3-via-lactea:151, 32-fondos-4-magallanes:26, 32-fondos-50-lejanas:56
- `vec2 rel = q - hd; float along = dot(rel, -dir), perp = abs(dot(rel, vec2(-dir.y, dir.x)));` — 32-fondos-2-andromeda:124, 32-fondos-3-via-lactea:153, 32-fondos-4-magallanes:28, 32-fondos-50-lejanas:58
- `float tr = step(0., along)*(1. - smoothstep(0., L, along))*exp(-perp*perp*.6);` — 32-fondos-2-andromeda:126, 32-fondos-3-via-lactea:155, 32-fondos-4-magallanes:30, 32-fondos-50-lejanas:60
- `c += vec3(.85, .92, 1.)*tr*fade*.9 + vec3(1.)*exp(-dot(rel, rel)*.25)*fade;` — 32-fondos-2-andromeda:128, 32-fondos-3-via-lactea:157, 32-fondos-4-magallanes:32, 32-fondos-50-lejanas:62
- `mat2 rot(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a)); }` — 32-fondos-2-andromeda:132, 32-fondos-4-magallanes:36, 32-fondos-50-lejanas:66
- `vec3 c = vec3(0.); vec2 g = (q + vec2(uT*14., uFlow*9.))/(uRes.y*.22), id = floor(g), f = fract(g);` — 32-fondos-2-andromeda:134, 32-fondos-4-magallanes:39, 32-fondos-50-lejanas:68
- `vec2 o = vec2(x, y), cid = id + o; if (h21(cid + 31.) > .22) continue;` — 32-fondos-2-andromeda:136, 32-fondos-4-magallanes:41, 32-fondos-50-lejanas:70
- `float rr = .12 + .2*h21(cid + 5.); float dd = length(f - o - h22(cid + 9.));` — 32-fondos-2-andromeda:137, 32-fondos-4-magallanes:42, 32-fondos-50-lejanas:71
- `vec3 tint = mix(vec3(1., .4, .65), vec3(.45, .7, 1.), h21(cid + 2.));` — 32-fondos-2-andromeda:138, 32-fondos-4-magallanes:43, 32-fondos-50-lejanas:72
- `c += tint*smoothstep(rr, rr*.75, dd)*(.05 + .04*sin(uT + h21(cid)*20.));` — 32-fondos-2-andromeda:139, 32-fondos-4-magallanes:44, 32-fondos-50-lejanas:73
- `vec3 c = vec3(0.); vec2 g = (q + vec2(0., uFlow*3.))/(uRes.y*.3), id = floor(g), f = fract(g);` — 32-fondos-2-andromeda:144, 32-fondos-4-magallanes:50, 32-fondos-50-lejanas:78
- `vec2 o = vec2(x, y), cid = id + o; float per = 3. + 5.*h21(cid + 3.), ph = fract(uT/per + h21(cid + 7.));` — 32-fondos-2-andromeda:146, 32-fondos-4-magallanes:52, 32-fondos-50-lejanas:80
- `float e = sin(ph/.12*3.14159); vec2 pp = (f - o - h22(cid))*uRes.y*.3;` — 32-fondos-2-andromeda:148, 32-fondos-4-magallanes:54, 32-fondos-50-lejanas:82
- `vec3 tint = mix(vec3(1., .8, .6), vec3(.7, .85, 1.), h21(cid + 1.));` — 32-fondos-2-andromeda:149, 32-fondos-4-magallanes:55, 32-fondos-50-lejanas:83
- `c += tint*e*(exp(-dot(pp, pp)*.08)*2. + (exp(-abs(pp.x)*.9)*exp(-abs(pp.y)*.04) + exp(-abs(pp.y)*.9)*exp(-abs(` — 32-fondos-2-andromeda:150, 32-fondos-4-magallanes:56, 32-fondos-50-lejanas:84
- `vec3 hueRot(vec3 c, float a){ const vec3 k = vec3(.57735); float ca = cos(a); return c*ca + cross(k, c)*sin(a)` — 32-fondos-2-andromeda:229, 32-fondos-3-via-lactea:163, 32-fondos-4-magallanes:158, 32-fondos-56-final:14
- `vec2 d = q0 - .5*uRes; float r = length(d)/uRes.y, a = atan(d.y, d.x);` — 32-fondos-2-andromeda:232, 32-fondos-3-via-lactea:166, 32-fondos-4-magallanes:161, 32-fondos-56-final:17
- `float bins = 90., id = floor((a/6.2831 + .5)*bins), fa = fract((a/6.2831 + .5)*bins) - .5;` — 32-fondos-2-andromeda:233, 32-fondos-3-via-lactea:167, 32-fondos-4-magallanes:162, 32-fondos-56-final:18
- `float off = h21(vec2(id, 3.)), z = fract(log(r + .05)*1.6 - uFlow*.05 - uT*.25 + off*7.);` — 32-fondos-2-andromeda:234, 32-fondos-3-via-lactea:168, 32-fondos-4-magallanes:163, 32-fondos-56-final:19
- `float streak = smoothstep(.0, .05, z)*smoothstep(.35, .05, z)*exp(-fa*fa*60.)*step(.55, h21(vec2(id, 9.)));` — 32-fondos-2-andromeda:235, 32-fondos-3-via-lactea:169, 32-fondos-4-magallanes:164, 32-fondos-56-final:20
- `vec3 tint = mix(vec3(.7, .85, 1.), vec3(1., .75, .9), h21(vec2(id, 5.)));` — 32-fondos-2-andromeda:236, 32-fondos-3-via-lactea:170, 32-fondos-4-magallanes:165, 32-fondos-56-final:21
- `col = max(vec3(0.), mix(vec3(lum), col, 1.3));                                   // colores más vivos sin perd` — 32-fondos-2-andromeda:241, 32-fondos-3-via-lactea:175, 32-fondos-4-magallanes:170
- `float hA = .22*sin(uT*.11 + uJour*5.) + .1*sin(uT*.27);                           // la paleta se mece dentro ` — 32-fondos-2-andromeda:242, 32-fondos-3-via-lactea:176, 32-fondos-4-magallanes:171
- `col.g = min(col.g, max(col.r, col.b)*1.02 + .01);                                // en el espacio casi no hay ` — 32-fondos-2-andromeda:244, 32-fondos-3-via-lactea:178, 32-fondos-4-magallanes:173
- `col *= 1. + .32*uBeat;                                                             // todo late con la música` — 32-fondos-2-andromeda:245, 32-fondos-3-via-lactea:179, 32-fondos-4-magallanes:174, 32-fondos-56-final:30
- `col += warp(q0)*smoothstep(.25, .9, uSpd)*(1.3 + .6*uBeat);` — 32-fondos-2-andromeda:246, 32-fondos-3-via-lactea:180, 32-fondos-4-magallanes:175, 32-fondos-56-final:31
- `vec2 v = (q0 - .5*uRes)/uRes.y; float vg = dot(v, v);` — 32-fondos-2-andromeda:247, 32-fondos-3-via-lactea:181, 32-fondos-4-magallanes:176, 32-fondos-56-final:32
- `col *= 1. - .55*vg;                                                                // viñeta de cine` — 32-fondos-2-andromeda:248, 32-fondos-3-via-lactea:182, 32-fondos-4-magallanes:177, 32-fondos-56-final:33
- `col *= .82 - .5*exp(-pow(rp/.34, 2.));                                             // donde juegas el cielo se` — 32-fondos-2-andromeda:250, 32-fondos-3-via-lactea:184, 32-fondos-4-magallanes:179, 32-fondos-56-final:35
- `col += vec3(.25, .1, .35)*vg*.06*(1. + uBeat);                                     // un borde de color muy te` — 32-fondos-2-andromeda:251, 32-fondos-3-via-lactea:185, 32-fondos-4-magallanes:180, 32-fondos-56-final:36
- `col += starsD(q + vec2(0., uFlow*1.2), 2.6, .12, .55);` — 32-fondos-2-andromeda:267, 32-fondos-4-magallanes:212, 32-fondos-56-final:72
- `col += starsD(q + vec2(0., uFlow*2.4), 5., .1, .9);` — 32-fondos-2-andromeda:268, 32-fondos-3-via-lactea:209, 32-fondos-4-magallanes:213, 32-fondos-56-final:73
- `col += starsD(q + vec2(0., uFlow*5.), 11., .09, 1.25);` — 32-fondos-2-andromeda:269, 32-fondos-3-via-lactea:210, 32-fondos-4-magallanes:214, 32-fondos-56-final:74
- `col += vec3(.9, .85, 1.)*tr*.18*(.6 + .4*fbm(q0/uRes.y*3. + uT));` — 32-fondos-2-andromeda:274, 32-fondos-56-final:77
- `col += vec3(1., .45, .18)*.05*exp(-length(q0 - uBH.xy)/(uRes.y*.4));` — 32-fondos-2-andromeda:277, 32-fondos-56-final:79
- `if (uWH.w > .001){ vec2 wd = q0 - uWH.xy; float wr = max(length(wd), 1.), te = uWH.z*1.05;` — 32-fondos-3-via-lactea:194, 32-fondos-56-final:45
- `if (wr > uWH.z) q -= (wd/wr)*(te*te/wr)*uWH.w; else { whIn = 1.; float l = wr/uWH.z; q = uWH.xy + wd*(1.45/sqr` — 32-fondos-3-via-lactea:195, 32-fondos-56-final:46
- `float l = length(q0 - uWH.xy)/uWH.z, er = l - 1., ew = .0018 + .0006/max(uWH.z/120., .25);` — 32-fondos-3-via-lactea:226, 32-fondos-56-final:82
- `col += (vec3(1.)*exp(-er*er/ew)*.95 + vec3(1., .38, .72)*exp(-pow(er - .03, 2.)/ew)*.55 + vec3(.42, .78, 1.)*e` — 32-fondos-3-via-lactea:229, 32-fondos-56-final:84
- `vec2 g = q/cell, id = floor(g), f = fract(g); vec3 c = vec3(0.);` — 32-fondos-4-magallanes:185, 32-fondos-50-lejanas:30
- `vec2 o = vec2(x, y), cid = id + o; if (h21(cid + 17.) > dens) continue;` — 32-fondos-4-magallanes:187, 32-fondos-50-lejanas:32
- `vec2 pp = (f - o - h22(cid + 4.))*cell; float r2 = dot(pp, pp), k = .6 + .8*h21(cid + 2.);` — 32-fondos-4-magallanes:188, 32-fondos-50-lejanas:33
- `vec3 sc = mix(vec3(1., .74, .5), vec3(.62, .8, 1.), h21(cid + 8.)); float tw = .75 + .25*sin(uT*(2. + 3.*h21(c` — 32-fondos-4-magallanes:189, 32-fondos-50-lejanas:34
- `c += sc*k*(exp(-r2*.8)*1.5 + exp(-r2*.025)*.12 + (exp(-abs(pp.x)*1.1)*exp(-abs(pp.y)*.08) + exp(-abs(pp.y)*1.1` — 32-fondos-4-magallanes:190, 32-fondos-50-lejanas:35
- `if (!gl || !gl.createShader){ gl = null; failed = true; return false; }` — 32-fondos-9-motor:10, 33-tarjetas-niveles:148
- `buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(` — 32-fondos-9-motor:11, 33-tarjetas-niveles:155
- `}catch(e){ gl = null; failed = true; return false; }` — 32-fondos-9-motor:13, 33-tarjetas-niveles:157
- `const glow = (x, y, r, col, a) => { const gg = g.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, co` — 34-misiones:136, 34-misiones:307
