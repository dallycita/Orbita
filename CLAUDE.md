# Órbita — instrucciones para trabajar en este repo

- Edita solo `src/`. `index.html` es generado: después de cualquier cambio corre `node build.mjs` y súbelo junto con `src/`. `node build.mjs --check` debe pasar antes de cada commit (GitHub Actions también lo revisa).
- `src/js` son módulos ES: cada archivo importa lo que usa y exporta lo que ofrece. Una variable la cambia solo su módulo dueño; los demás usan su función (`setLevel(...)`). Lo que un módulo hace al cargar va en su función de arranque (`initX`), y `src/js/main.js` las llama en orden. esbuild los une en `index.html` (`node build.mjs`).
- Para cambios mecánicos (formato, comentarios) basta `node herramientas/misma-estructura.mjs <index-antes> index.html`: si el programa es idéntico, el juego también.
- `src/css/*.css` se concatenan en orden; el orden es la cascada (hay reglas posteriores que corrigen anteriores a propósito).
- Al mover o limpiar código, el juego debe quedar igual: corre `node pruebas/huella.mjs <dir>` antes y después y `node pruebas/huella.mjs --comparar <a> <b>` (capturas, estilos calculados y partidas cuadro a cuadro; unas decenas de píxeles de ruido de GPU son normales).
- La dueña del proyecto escribe en español: responde en español, explica los cambios en palabras sencillas y muestra imágenes antes de cambios visuales grandes. Lo visual y el realismo científico son la mayor fortaleza del juego; ningún planeta o poder debe dar demasiada ventaja (verificar balance con simulaciones cuando se toque la jugabilidad).
