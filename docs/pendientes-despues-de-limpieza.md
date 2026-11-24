# Pendientes para después de la limpieza

Cosas que se encontraron durante la limpieza y que NO se cambiaron, porque la limpieza no cambia el juego.
Cada una se decide aparte, cuando termine la limpieza.

## Funciones desactivadas que se quitaron del código

- **Mensajes de luz en Andrómeda** (`20-logica.js`, dentro de `if (false && lvl === 2 …)`): al cambiar de
  banda de luz mostraban "Ultravioleta: brillan las estrellas jóvenes", "Infrarrojo: ahora ves el polvo" y
  "Todas las luces a la vez". Nunca se ejecutaban. El código original está en la etiqueta `antes-de-limpieza`.
- **Planetas del Sistema solar en el fondo** (`22-viaje-sistema-solar.js`: `SOLAR_PATH`, `drawBgPlanet`):
  dibujaban los planetas pasando en su orden real, pero nada los llamaba. También en `antes-de-limpieza`.

## Posibles errores o restos encontrados (no se cambiaron)

- **El tutorial nunca se ofrece al empezar** (`08-partida-estado.js`: `tutorialDone = true`). Solo se llega a él
  desde "Repetir tutorial". Confirmar si es intencional ("se aprende jugando").
- **Shader de la esfera de los planetas** (`29-planetas-hd.js`): hay un bloque vacío
  `if (uSpec > 0. && uK != 0){ }` y uniforms que no se usan (`uLay`, y `c3`/`c4` en los cráteres).
- **Comentario viejo de la lente gravitacional** (`14-lente-gravitacional.js`): decía "anillos 27–33", pero el
  código usa `BEND_AT = {3: [26, 28]}`. El comentario nuevo describe lo que hace el código.
- **Pantalla que nunca existe** (`19-controles.js`, `press()`): revisa `state === 'missions'`, pero ningún
  archivo pone `state` en ese valor. Esa parte de la condición nunca se cumple.
- **Parámetro sin uso** (`21-dibujo.js`): `drawCharge(px, py, z)` nunca usa `z`.
- **Cálculos que no hacen nada** (`33-tarjetas-niveles.js`, `drawLevelsBG`): `W / 2 - (i - pos) * 0` multiplica
  por 0, y `zA` y `zB` valen siempre 1.
- **Números de nivel mezclados:** en comentarios y shaders los niveles van del 1 al 8 (Magallanes es el 2); en
  el código `lvl` empieza en 0 (`lvl === 1` es Magallanes).
- **Evento con número** (`34-misiones.js`): la misión `streak3` usa el evento `'streak3'`; las demás usan
  nombres sin número (`'perf'`, `'ring'`).
- **Clave guardada con "v2"**: el récord se guarda en `orbita_best_v2`. Es FIJO (cambiarla borraría el récord de
  los jugadores), así que se queda.
- **Escudo de Saturno** (`12-poderes.js`): un comentario decía "3 segundos sin choques", pero el código da
  `shieldT = 1.5`. Confirmar cuánto debe durar.
- **Parámetro sin uso** (`12-poderes.js`): `powerUpdate(dt, d)` nunca usa `d`.
- **Agujero de gusano** (`13-agujero-de-gusano.js`): se describía como "anillos 30 a 41", pero el código usa
  `WH_K = 29`. Probablemente es contar desde 0 o desde 1; confirmar.

## Pendiente de la limpieza misma (para la Fase 7)

- **CSS:** quedan 96 selectores repetidos que no se pudieron juntar sin riesgo de cambiar la cascada, 39
  `!important` y el orden por componente. Se resuelven al partir el CSS por componente, regla por regla.
- **Ternarios anidados (55):** se parten al rehacer cada función (fases 9 y 12), para no tocarlas dos veces.

## Pedido de la dueña para después de la limpieza

- **Fluidez:** el juego se siente lento entre saltos. En el equipo de la dueña el medidor marca 30 FPS y baja hasta 12 (en una Mac rápida iba a 60): es rendimiento. El medidor marca "código" de 40 a 60 ms por cuadro: el procesador no alcanza (el cuadro debe caber en 16 ms). Revisar: objetos creados en cada cuadro (degradados, listas, textos), shadowBlur, la copia del fondo WebGL al lienzo y la resolución de dibujo. Primero medir con el "Medidor de rendimiento" en el celular
  para saber si es rendimiento (cuadros perdidos) o el ritmo del juego (duración del salto, cámara, cámara lenta del
  "Perfecto"). Lo segundo cambia cómo se juega.
- **Planetas rescatados que nunca se mostraban** (`16-partida.js`, `win()` y `die()`): se armaba el HTML de las
  tarjetas de "Rescatado/Rescatados" con su miniatura, pero solo se usaba para saber si hubo planetas nuevos; nunca
  entraba al panel. En la limpieza se reemplazó por `rescuedPlanets()`, que da lo mismo sin armar el HTML.
  Decidir si las tarjetas deben aparecer en el panel de victoria.
