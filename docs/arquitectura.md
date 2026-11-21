# Arquitectura propuesta (Fase 1)

Propuesta de cómo queda el código al terminar la limpieza. Sale del inventario (`docs/inventario.md`).
Nada de esto cambia el juego: solo dónde vive cada cosa y quién puede cambiarla.

## El problema de hoy, en números

Los 49 archivos comparten un solo espacio de variables. 150 variables las cambian archivos que no son
su dueño. Las más repartidas:

| Variable | Qué es | Archivos que la cambian |
|---|---|---|
| `state` | pantalla actual | 9 (16, 17, 18, 19, 23, 24, 25, 26, 29) |
| `shake`, `flash` | sacudida y destello | 8 cada una |
| `pending` | toque guardado para saltar | 8 |
| `pulse` | latido visual | 7 |
| `jumping`, `jumpTarget`, `appear` | el salto | 6 cada una |
| `t` | reloj del juego | 5 (20, 23, 24, 29, 36) |
| `sunLevel`, `texts`, `holeFlare` | agujero negro y textos | 5 cada una |

`16-partida` es el centro del enredo: cambia variables de 14 archivos distintos (para reiniciar la partida).

## Capas: dependencias en una sola dirección

```
config/ data/  →  core/  →  audio/  →  game/  →  render/  →  screens/  →  main.js
```

Cada capa solo importa de las capas a su izquierda. El armado (`build.mjs`) falla si aparece un ciclo
o una importación hacia la derecha. Cuando una capa de abajo necesita avisar a una de arriba (por ejemplo,
"la partida terminó" → mostrar el panel), usa eventos de `core/events.js` (`emit` / `on`).

## Carpetas y archivos

| Carpeta / archivo | Viene de | Ofrece (exporta) |
|---|---|---|
| `config/tuning.js` | constantes de 01, 07, 08, 16 | tamaños (`RING_GAP`, `RING_R0`…), tiempos, velocidades |
| `data/courses.js` | 09 | recorridos de anillos por nivel |
| `data/planets.js` | 07 (datos) | planetas, estadísticas reales, poderes |
| `data/levels.js` | 25, 33 (datos) | galaxias, metas, estrellas por nivel |
| `data/hazards.js` | 11 (datos) | parámetros de cometas, ondas, novas |
| `data/missions.js` | 34 (datos) | misiones diarias, logros, datos reales |
| `data/texts.js` | todos | textos del jugador, por pantalla |
| `core/loop.js` | 36 | `startLoop()`; llama a la pantalla actual |
| `core/screen.js` | `state` (06) | `getScreen()`, `setScreen()`; único dueño de la pantalla actual |
| `core/clock.js` | `t`, `timeScale` (08) | reloj del juego y cámara lenta |
| `core/storage.js` | `try/catch` de `localStorage` repetidos | `storage.get(key, fallback)`, `storage.set(key, value)` (mismas claves) |
| `core/events.js` | nuevo | `emit`, `on` |
| `core/random.js` | `rng`, `rngState` (09) | generador con semilla de los anillos |
| `core/dom.js` | referencias `el…` repartidas | elementos de la página |
| `core/math.js` | 01 (`clamp`, `frac`…) | utilidades de números |
| `core/canvas.js` | 01 (`ctx`, `W`, `H`, `S`, `DPR`, tamaño) | lienzo y escala |
| `audio/engine.js` | 02 | contexto de audio, buses, volúmenes, ruido |
| `audio/sfx.js` | 02, 10, 12, 13, 15, 16, 21, 23, 30, 34 (sonidos sueltos) | todos los efectos del juego |
| `audio/ui-sounds.js` | 28, 18 (sonidos de pausa) | sonidos de botones y de la pausa |
| `audio/music-player.js` | 05 + estado de 03 | `startMusic`, `stopMusic`; dueño del programador |
| `audio/tracks/*.js` | 03, 04 | un archivo por estilo de música |
| `game/run.js` | 06, 08, 16 | la partida: `startRun`, `jump`, `doubleJump`, `die`, `win`; dueño de `run` |
| `game/camera.js` | `camLevel` + cámara de dibujo (21) | `updateCamera`, `getCamera` |
| `game/feedback.js` | `shake`, `flash`, `pulse`, `texts`, `particles` | `shakeScreen(n)`, `flashScreen(n)`, `addText()`… |
| `game/rings.js`, `game/ring-types/*.js` | 16 (`makeRing`) | tabla `RING_TYPES`, un archivo por tipo |
| `game/beat.js` | 10 | ritmo, objetos en los anillos, estrellas de la partida |
| `game/powers/*.js` | 12 | un objeto por poder: `activate`, `update`, `draw`, `reset` |
| `game/hazards/*.js` | 15 (+ estado de 11) | un objeto por peligro, mismo esquema |
| `game/wormhole.js`, `game/gravitational-lens.js` | 13, 14 | agujero de gusano y lente |
| `game/tutorial.js` | 17 | tutorial |
| `game/controls.js` | 19 | toque, deslizar y teclado → acciones |
| `game/progress.js` | récords, intentos, monedas, planeta elegido (06, 07, 10, 25) | leer y guardar el progreso, mismas claves |
| `game/settings.js` | volúmenes (02), silencio (26), medidor (35), modo del HUD (01) | ajustes del jugador |
| `game/update.js` | 20 | `updateGame(dt)` partido en funciones con nombre, mismo orden |
| `render/scene.js` | 21, 22 | `drawScene()` partido en funciones, mismo orden de dibujo |
| `render/rocks.js` | 21 (`ASTGL`, `astSprite`, `astPrebake`) | asteroides en 3D y su respaldo 2D |
| `render/planets-gl.js` | 29 (dibujo) | planetas en alta calidad |
| `render/black-hole.js` | 24 (`BHGL`) | agujero negro de la presentación |
| `render/backgrounds/*.js` | 31, 32-* | fondos por galaxia; respaldo 2D sin WebGL |
| `render/effects.js` | 12 (dibujo de efectos), partículas | efectos visuales |
| `render/hud.js` | 06 (`updateRingHUD`), 21 (carga) | barra de viaje, carga del poder |
| `shaders/*.glsl` | textos GLSL en 21, 24, 29, 32-*, 33 | un archivo por shader |
| `screens/*.js` | 23, 24, 25, 26, 27, 29, 30, 33, 34, 18, 35 | cada pantalla con `enter`, `update`, `render`, `exit` |
| `main.js` | 36 | arranque, en el mismo orden de hoy |

## Dueños del estado

Cada parte del estado tiene un solo módulo dueño. Los demás la leen con una función o un objeto de solo
lectura y la cambian solo con funciones del dueño.

| Estado | Dueño | Cómo lo cambian los demás |
|---|---|---|
| pantalla actual (`state`) | `core/screen.js` | `setScreen('menu')` |
| reloj (`t`, cámara lenta) | `core/clock.js` | `advanceClock(dt)`, `slowMotion(scale, seconds)` |
| partida (`level`, `pLevel`, `jumping`, `score`, `charge`…) | `game/run.js` (objeto `run`) | `jump()`, `addCharge()`, `startRun()` |
| cámara (`camLevel`) | `game/camera.js` | `updateCamera(dt)` |
| sacudida, destello, latido, textos, partículas | `game/feedback.js` | `shakeScreen()`, `flashScreen()`, `addText()` |
| poderes (`ghostT`, `shieldT`, `pfx`…) | `game/powers/` | `powers.reset()`, `powers.activate()` |
| peligros (`comets`, `waves`, `novaSrc`…) | `game/hazards/` | `hazards.reset()` |
| agujero de gusano y lente | `game/wormhole.js`, `game/gravitational-lens.js` | `reset()` de cada uno |
| música (`musicOn`, `step`, `nextT`…) | `audio/music-player.js` | `startMusic()`, `stopMusic()` |
| progreso guardado | `game/progress.js` | `saveBest()`, `addAttempt()`… (mismas claves) |
| ajustes (volúmenes, silencio, medidor) | `game/settings.js` | `setVolume()`, `toggleMute()`… |
| animación del inicio (`homeT`, `hs…`) | `screens/home.js` | solo la pantalla de inicio |
| escaneo de planetas (`scan…`) | `screens/planets.js` | solo esa pantalla |

## Reglas que se mantienen (FIJO)

- `index.html` sigue siendo un solo archivo que funciona con doble clic (esbuild lo arma).
- El orden de ejecución al cargar, de cada cuadro, del azar, del dibujo y del audio es el de hoy.
- Las claves de `localStorage`, los campos guardados, las clases y los ids no cambian.
- Los respaldos (sin WebGL, movimiento reducido, `try/catch`) se quedan.
- Las pruebas usan una entrada explícita (`window.__orbitaTest`) en el armado de pruebas.
