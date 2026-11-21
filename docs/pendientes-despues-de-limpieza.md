# Pendientes para después de la limpieza

Cosas que se encontraron durante la limpieza y que NO se cambiaron, porque la limpieza no cambia el juego.
Cada una se decide aparte, cuando termine la limpieza.

## Funciones desactivadas que se quitaron del código

- **Mensajes de luz en Andrómeda** (`20-logica.js`, dentro de `if (false && lvl === 2 …)`): al cambiar de
  banda de luz mostraban "Ultravioleta: brillan las estrellas jóvenes", "Infrarrojo: ahora ves el polvo" y
  "Todas las luces a la vez". Nunca se ejecutaban. El código original está en la etiqueta `antes-de-limpieza`.
- **Planetas del Sistema solar en el fondo** (`22-viaje-sistema-solar.js`: `SOLAR_PATH`, `drawBgPlanet`):
  dibujaban los planetas pasando en su orden real, pero nada los llamaba. También en `antes-de-limpieza`.
