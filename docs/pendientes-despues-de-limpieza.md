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
