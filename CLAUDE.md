# Órbita — instrucciones para trabajar en este repo

- Edita solo `src/`. `index.html` es generado: después de cualquier cambio corre `node build.mjs` y súbelo junto con `src/`. `node build.mjs --check` debe pasar antes de cada commit (GitHub Actions también lo revisa).
- `node build.mjs --deps` escribe `docs/dependencias.md`: qué usa y qué cambia cada archivo de los demás. `npm run lint` avisa si un archivo usa o cambia algo de otro que no estaba antes. Prefiere usar lo que ya ofrece un archivo antes que crear dependencias nuevas.
- Para cambios mecánicos (formato, comentarios) basta `node herramientas/misma-estructura.mjs <index-antes> index.html`: si el programa es idéntico, el juego también.
- `src/js/*.js` se concatenan en orden numérico dentro de un único `(() => { ... })()`: comparten un solo ámbito (no son módulos, no hay import/export). Cada archivo debe ser JavaScript válido por sí solo (`node --check`) y cortar en un límite de nivel superior, nunca a mitad de una función o bloque.
- `src/css/*.css` se concatenan en orden; el orden es la cascada (hay reglas posteriores que corrigen anteriores a propósito).
- Al mover o limpiar código, el juego debe quedar igual: corre `node pruebas/huella.mjs <dir>` antes y después y `node pruebas/huella.mjs --comparar <a> <b>` (capturas, estilos calculados y partidas cuadro a cuadro; unas decenas de píxeles de ruido de GPU son normales).
- La dueña del proyecto escribe en español: responde en español, explica los cambios en palabras sencillas y muestra imágenes antes de cambios visuales grandes. Lo visual y el realismo científico son la mayor fortaleza del juego; ningún planeta o poder debe dar demasiada ventaja (verificar balance con simulaciones cuando se toque la jugabilidad).
