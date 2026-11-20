# Órbita — instrucciones para trabajar en este repo

- Edita solo `src/`. `index.html` es generado: después de cualquier cambio corre `node build.mjs` y súbelo junto con `src/`. `node build.mjs --check` debe pasar antes de cada commit (GitHub Actions también lo revisa).
- `src/js/*.js` se concatenan en orden numérico dentro de un único `(() => { ... })()`: comparten un solo ámbito (no son módulos, no hay import/export). Cada archivo debe ser JavaScript válido por sí solo (`node --check`) y cortar en un límite de nivel superior, nunca a mitad de una función o bloque.
- `src/css/*.css` se concatenan en orden; el orden es la cascada (hay reglas posteriores que corrigen anteriores a propósito).
- Al mover código entre archivos, el resultado armado debe seguir funcionando igual: compara con capturas del juego (Playwright) antes y después.
- La dueña del proyecto escribe en español: responde en español, explica los cambios en palabras sencillas y muestra imágenes antes de cambios visuales grandes. Lo visual y el realismo científico son la mayor fortaleza del juego; ningún planeta o poder debe dar demasiada ventaja (verificar balance con simulaciones cuando se toque la jugabilidad).
