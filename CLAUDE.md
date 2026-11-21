# Órbita — instrucciones para trabajar en este repo

## Lo FIJO

Todo lo que el juego tiene hoy es **FIJO**:

- lo que se ve, lo que se oye y cómo se juega;
- el balance;
- los datos guardados (claves de `localStorage` y sus campos);
- los respaldos sin WebGL o con movimiento reducido.

Si algo que vas a hacer, o que te piden, cambiaría algo FIJO, **detente y di "Esto es FIJO"**. Explica qué cambiaría y pregunta antes de seguir. Lo FIJO solo cambia si la dueña lo pide sabiendo que es FIJO.

## Limpieza del código

Las instrucciones completas están en `docs/plan-limpieza.md`: la única regla, lo FIJO, las trampas, la guía de estilo y las 21 fases. Si estás limpiando, ordenando o renombrando código, síguelo paso a paso. Comprueba con la huella después de cada paso: **el juego debe quedar exactamente igual**.

## Reglas de trabajo

- Edita solo `src/`. `index.html` es generado: después de cualquier cambio corre `node build.mjs` y súbelo junto con `src/`. `node build.mjs --check` debe pasar antes de cada commit (GitHub Actions también lo revisa).
- Cada archivo de `src/js` empieza con una cabecera generada (qué da, qué usa, qué cambia de otros archivos). Si un cambio agrega o quita un uso entre archivos, corre `node build.mjs --deps`; `--check` falla si no coincide. Prefiere usar lo que ya "da" un archivo antes que crear dependencias nuevas.
- `src/js/*.js` se concatenan en orden numérico dentro de un único `(() => { ... })()`: comparten un solo ámbito (no son módulos, no hay import/export). Cada archivo debe ser JavaScript válido por sí solo (`node --check`) y cortar en un límite de nivel superior, nunca a mitad de una función o bloque.
- `src/css/*.css` se concatenan en orden; el orden es la cascada (hay reglas posteriores que corrigen anteriores a propósito).
- Al mover o limpiar código, el juego debe quedar igual: corre `node pruebas/huella.mjs <dir>` antes y después y `node pruebas/huella.mjs --comparar <a> <b>` (capturas, estilos calculados y partidas cuadro a cuadro; unas decenas de píxeles de ruido de GPU son normales).
- La dueña del proyecto escribe en español: responde en español, explica los cambios en palabras sencillas y muestra imágenes antes de cambios visuales grandes. Lo visual y el realismo científico son la mayor fortaleza del juego; ningún planeta o poder debe dar demasiada ventaja (verificar balance con simulaciones cuando se toque la jugabilidad).
