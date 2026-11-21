# Plan de limpieza del código

Instrucciones para Claude en VS Code. Léelas completas antes de empezar y vuelve a ellas al comenzar cada fase.

## Objetivo

Dejar el código **ordenado, legible y mantenible**, como un proyecto hecho con cuidado por una persona, para que cualquiera pueda entenderlo y actualizarlo después:

- sin código que no se usa;
- con nombres claros;
- con comentarios útiles (JSDoc);
- sin líneas larguísimas;
- con el CSS sin capas de parches.

**El juego debe quedar exactamente igual.** Esta limpieza no agrega, quita ni mejora nada que se vea, se oiga o se juegue.

---

## Lo que es FIJO

Todo lo que existe hoy en el juego es **FIJO**:

- **Lo que se ve:** pantallas, colores, animaciones, efectos, shaders, tamaños, posiciones, tipografías y textos.
- **Lo que se oye:** la música, los sonidos, los volúmenes y los tiempos de cada sonido.
- **Cómo se juega:**
  - los recorridos de anillos y la velocidad;
  - los poderes y la duración de cada cosa;
  - la dificultad y el balance de planetas y poderes;
  - las misiones, los logros y las estrellas.
- **Los datos guardados de los jugadores:**
  - Las claves de `localStorage` (`orbita_best_v2`, `orbita_mis`, `orbita_p1_anillo`, `orbita_vol_mus`, etc.) **no se renombran**.
  - Tampoco se renombran los nombres de las propiedades de los objetos que se guardan en ellas, como los campos de `MIS` (`polvo`, `streak`, `daily`…). Si cambian, los jugadores pierden su progreso.
- **Los respaldos:**
  - el dibujo 2D cuando no hay WebGL (`31-fondos-2d`, el dibujo de rocas sin GPU en `astSprite`);
  - `prefers-reduced-motion`;
  - los `try/catch` alrededor de `localStorage` y audio.

  Parecen código que "no se usa" porque en una computadora normal no se ejecutan, **pero no se borran**.
- **El resultado final:** `index.html` sigue siendo un solo archivo que funciona con doble clic, sin servidor.
- **Las pruebas:** `pruebas/` (huella, rendimiento y bot) y la revisión de GitHub Actions.

**Regla:** si un paso de limpieza, o algo que te pidan, cambiaría algo FIJO, **detente y dilo así: "Esto es FIJO"**. Explica qué cambiaría y pregunta a Dally antes de seguir. Lo FIJO solo cambia si ella lo pide explícitamente sabiendo que es FIJO.

### Trampas que cambian el juego sin que se note en el código

- **El orden de `Math.random()`.** El juego usa azar en muchos lugares. Si mueves, juntas o reordenas código que llama a `Math.random()`, o cambias cuántas veces se llama, cambian las partidas. La huella lo detecta.
- **El orden de las operaciones.** Por cómo funcionan los decimales, `a*b*c` no siempre da lo mismo que `a*(b*c)`, y `x*.5*.5` no da exactamente lo mismo que `x*.25`. Al ponerle nombre a un número, conserva la misma operación en el mismo orden. **No precalcules productos.**
- **La cascada de CSS.** El orden de las reglas decide cuál gana. Al juntar reglas, el estilo calculado final de cada elemento debe ser idéntico. La huella compara el estilo calculado de cada elemento en cada pantalla.
- **Las clases y los ids que arma el JavaScript** con texto, por ejemplo `'orbita_p' + n`, `classList.add('wscr')` o `innerHTML` con `class="mlv"`. Antes de decidir que una clase o una función no se usa, búscala también como texto.
- **El orden de los archivos.** Mientras el código no sean módulos de verdad (fase 8), los archivos de `src/js` comparten un mismo espacio y se unen en orden numérico. Un archivo solo puede usar al cargar lo que se definió antes.
- **Las pruebas usan nombres internos del juego.** `pruebas/huella.mjs`, `pruebas/rendimiento.mjs` y `pruebas/bot.js` llaman a `start()`, `jump()`, `state`, `lvl`, `t`, `deadT`, `ASTGL`, etc. Si renombras algo que usan, renómbralo también en las pruebas **en el mismo commit**, y comprueba que la huella sigue corriendo las 54 escenas.

---

## Cómo trabajar

1. **Rama aparte.** Trabaja en una rama `limpieza`, nunca directo en `main`. Al final, cuando Dally lo apruebe, se une a `main`.
2. **Huella de referencia, antes de tocar nada.** La primera vez instala Playwright:

   ```bash
   npm install --no-save playwright && npx playwright install chromium
   ```

   Después saca la huella de referencia:

   ```bash
   node pruebas/huella.mjs ../huella-base
   ```

   Esa huella es "el juego como debe quedar". No se vuelve a generar en toda la limpieza.
3. **Pasos pequeños.** Cada paso hace **una sola cosa**, por ejemplo:
   - "formatear `21-dibujo.js`";
   - "quitar funciones sin usar del menú de pausa";
   - "renombrar las variables de la pausa".

   Nunca mezcles limpieza con cambios de comportamiento.
4. **Después de cada paso:**

   ```bash
   node build.mjs
   node build.mjs --check
   node pruebas/huella.mjs ../huella-paso
   node pruebas/huella.mjs --comparar ../huella-base ../huella-paso
   ```

   - **Si la comparación sale igual:** haz el commit. Solo se acepta "ruido del dibujo por GPU", es decir, unas decenas de píxeles con diferencias mínimas, que también salen entre dos corridas iguales.
   - **Si sale una diferencia real:** en la imagen, en los estilos o en la partida, **deshaz el paso** y hazlo de otra forma.
5. **Un commit por paso.** Usa un mensaje claro en español que diga qué se hizo, por ejemplo "Formatea el código de la pausa" o "Quita funciones sin usar de las misiones".
   - **El historial es real.** No cambies fechas ni reescribas commits anteriores.
6. **Al terminar cada fase**, explícale a Dally en palabras sencillas qué cambió, por qué el juego sigue igual (el resultado de la huella) y qué sigue.

---

## Fases (en este orden: de menos riesgo a más; las fases 9 a 17 necesitan la 8)

### Fase 0 · Quitar las cabeceras de dependencias

Las cabeceras `da / lo usan / usa / cambia` al inicio de cada archivo de `src/js` se quitan.

- Ajusta `build.mjs` para que `--check` solo revise que `index.html` está al día. Quita también la parte de `--deps` que escribe las cabeceras.
- `herramientas/dependencias.mjs` puede quedarse para generar `docs/dependencias.md` cuando se necesite, como un reporte aparte, sin escribir nada en los archivos.
- Actualiza `CLAUDE.md`, `README.md` y el flujo de GitHub Actions.

En la fase 8 los módulos de verdad (`import`/`export`) reemplazan esto de forma natural.

### Fase 1 · Formato

- Agrega Prettier y `.editorconfig`:
  - ancho máximo de línea: **100**;
  - comillas simples;
  - punto y coma;
  - 2 espacios.
- Agrega los scripts `npm run format` y `npm run format:check`.
- Formatea todo `src/js`, `src/css`, `build.mjs`, `dev.mjs`, `pruebas/` y `herramientas/`.
- **Una instrucción por línea.** Nada de `a(); b(); c();` en una sola línea.
- Este paso no cambia el significado del código. Igual corre la huella.

### Fase 2 · Quitar lo que no se usa

1. **Encuentra candidatos** con:
   - ESLint (`no-unused-vars`) sobre el código ya unido (`index.html` armado), porque archivo por archivo da falsos positivos al compartir el mismo espacio;
   - el analizador de `herramientas/dependencias.mjs`;
   - la cobertura de Chrome mientras corre la huella, para ver qué funciones nunca se ejecutan.
2. **Antes de borrar algo:** búscalo como nombre y como texto en todo el proyecto. Si es un respaldo o un caso raro (sin WebGL, movimiento reducido, tutorial, pantallas de error), es FIJO.
3. **CSS sin usar:** reglas cuyos selectores no coinciden con nada en ninguna pantalla y cuyas clases no se agregan desde JavaScript, y `@keyframes` que nadie usa.
4. **Carpetas `versiones-anteriores/` y `diseno/`:** no son código del juego (son prototipos e imágenes de diseño). **Pregúntale a Dally** antes de borrarlas o moverlas.

### Fase 3 · CSS sin parches

- **Un archivo por pantalla**, como ya está. Dentro de cada archivo, **una sola regla por selector**, con el resultado final. Quita las capas de "ajustes finales", "tarjeta v3", "botón Escapar", "arreglos"…
- Quita los `!important` que solo existen para ganarle a una regla anterior. Al juntar las reglas ya no hacen falta.
- Ordena cada archivo por componente: contenedor, partes, estados (`.on`, `.off`, `:hover`), media queries al final del componente y animaciones al final del archivo.
- **Variables CSS** (`--naranja`, `--azul-claro`…) para los colores que se repiten, con el mismo valor exacto.
- Comprueba con la huella después de cada archivo. **El estilo calculado debe ser idéntico.**

### Fase 4 · Nombres claros

- **Un solo idioma para los nombres del código: inglés**, como ya están la mayoría (`state`, `render`, `update`, `jump`, `rings`). Los comentarios y los textos del juego siguen en español.
- Cambia los nombres crípticos por nombres que digan qué son:
  - `pzSnd` → `playPauseSound`
  - `astPre` → `pendingRockSprites`
  - `hzS` → `horizonState`
  - `rp` → `spriteRadius`
  - `U` → `uniforms`

  Las variables de una letra solo se quedan en bucles cortos (`i`, `j`) y en fórmulas matemáticas donde son estándar (`x`, `y`, `t`).
- Renombra con una herramienta que entienda el código: el "Rename Symbol" (F2) de VS Code o un script con el analizador. **No uses buscar y reemplazar con texto.**
- **No se renombran:**
  - las claves de `localStorage` ni las propiedades de los objetos guardados;
  - los textos que ve el jugador;
  - los ids y clases del HTML, salvo que se cambien a la vez en HTML, CSS y JS en un paso propio verificado con huella.
- Renombra también en `pruebas/` cuando corresponda (ver "Trampas").

### Fase 5 · Números con nombre

- Los números que significan algo pasan a constantes con nombre y unidad:
  - tiempos, como `const COUNTDOWN_STEP_MS = 620`;
  - tamaños, velocidades y duraciones de poderes;
  - colores de la paleta.
- Ponlas al inicio del archivo que las usa, o en un archivo de ajustes si las usan varios.
- **El mismo valor exacto y la misma operación en el mismo orden.** No juntes ni precalcules números.
- No hace falta nombrar todo. Los números de una fórmula, como `.5` en `x*.5` o los coeficientes de un shader, pueden quedarse si un comentario explica la fórmula.

### Fase 6 · Shaders legibles

- Pasa el código GLSL que hoy vive en textos dentro del JS a archivos propios, `src/shaders/*.glsl`, y haz que `build.mjs` los meta en `index.html` al armar.
- Dentro de cada shader:
  - una instrucción por línea;
  - nombres claros;
  - un comentario breve por función, que diga qué calcula (ruido, cráteres, luz del disco…).
- Las capturas de la huella deben salir iguales. Mover espacios y saltos de línea en GLSL no cambia el resultado. Cambiar operaciones sí.

### Fase 7 · Comentarios

- **Al inicio de cada archivo:** 2 a 4 líneas que digan qué contiene y para qué sirve.
- **JSDoc en cada función** que se use fuera de su archivo o que no sea obvia:

  ```js
  /**
   * Dibuja un asteroide usando la imagen ya preparada de su forma, giro y tamaño.
   * @param {number} x Posición horizontal en píxeles de pantalla.
   * @param {number} y Posición vertical en píxeles de pantalla.
   * @param {number} radius Radio en píxeles de pantalla.
   * @param {number} seed Semilla del asteroide; decide su forma.
   * @param {number} rotation Giro actual, en radianes.
   * @param {string} fallbackColor Color si no se puede usar la imagen.
   * @param {number} alpha Opacidad de 0 a 1.
   */
  ```

- **Los comentarios explican qué hace el código y por qué, en presente, cortos y técnicos.** No cuentan la historia de los cambios.
  - ❌ "para no fabricarlas en pleno juego, donde cada una era un tirón"
  - ✅ "Prepara las imágenes de los asteroides en pantallas sin partida, unas pocas por cuadro."
  - ❌ "ahora", "antes", "nuevo", "v3", "ajuste final", "arreglado", "como pidió…", "por fin".
- **No comentes lo obvio** (`i++ // suma uno`). Sin emojis ni signos de exclamación.

### Fase 8 · Módulos de verdad (la más grande; hacerla al final)

- Cambia los archivos de `src/js` a módulos con `import`/`export`. Cada archivo declara lo que usa en sus `import`, que es la forma normal de hacer lo que hacían las cabeceras.
- `build.mjs` los une en el mismo `index.html` de un solo archivo, con un empaquetador como esbuild.
- **El estado compartido** que hoy cambian varios archivos (`state`, `level`, `t`, `paused`…) va en un objeto (`game.state`, `game.level`…), porque un módulo no puede reasignar una variable de otro.
- **Hazlo un archivo a la vez**, con la huella después de cada uno. Si se complica, se detiene aquí: las fases 0 a 7 ya dejan el código limpio, y de las siguientes se pueden hacer las que no dependen de módulos (10, 11, 14, 15, 16, 17).

### Fase 9 · Carpetas por tema

Cuando el código ya sean módulos, quita los números de los nombres de archivo y ordénalos por tema:

```
src/
  core/       bucle principal, pantalla y medidas, estado del juego
  game/       anillos, saltos, peligros, poderes, gusano, tutorial
  render/     dibujo de la partida, asteroides, planetas, efectos
  shaders/    un .glsl por galaxia y un archivo común
  audio/      motor de sonido, música, efectos, sonidos de interfaz
  screens/    inicio, niveles, planetas, misiones, pausa, panel
  data/       niveles, planetas, misiones, peligros, textos
  css/        un archivo por pantalla (igual que hoy)
```

Cada archivo tiene un solo tema. Si un archivo pasa de unas 400 líneas, probablemente se puede partir.

### Fase 10 · Datos separados de la lógica

- Los recorridos de cada nivel (`COURSE`, `COURSE2`, `COURSE3` y los demás), los datos de los planetas, las misiones y los horarios de peligros pasan a `src/data/`, como objetos de datos sin lógica.
- **Todos los textos que ve el jugador** van en un solo archivo, `src/data/textos.js`: botones, tips del tutorial, nombres de anillos, misiones y mensajes. El código los usa por su clave. Así se puede traducir el juego algún día.
- Los valores no cambian (son FIJOS); solo cambian de lugar.

### Fase 11 · Sin HTML armado con texto

Las pantallas que hoy se arman pegando texto (`'<div class="mlv">Nivel ' + … + '</div>'` con `innerHTML`) pasan a una de estas dos formas:

- **Plantillas** `<template>` en `src/index.html`, que el código copia y llena.
- **Funciones pequeñas** que crean cada pieza con `document.createElement`.

El HTML final de cada pantalla debe ser idéntico. La huella compara los estilos calculados de cada elemento.

### Fase 12 · Funciones gigantes partidas

- **Anillos:** `makeRing` deja de ser un `if / else if` por tipo. Se convierte en una tabla con una función por tipo de anillo (`clasico`, `muralla`, `respiracion`, `escalera`, `marea`, `freno`, `nova`, `arrastre`, `orbita`…).
  - **Cuidado:** cada tipo debe llamar a `rng()` las mismas veces y en el mismo orden que hoy.
- **Poderes:** cada planeta tiene un objeto con `activate`, `update` y `draw`, en vez de condiciones repartidas por `update` y `render`.
- **Pantallas:** se hace una máquina de estados. Cada pantalla (presentación, intro, inicio, niveles, planetas, partida, pausa) es un objeto con `enter`, `update`, `render` y `exit`. `frame()` solo llama a la pantalla actual, en vez de la cadena de `if (state === …)`.
- **`update` y `render`** se parten en funciones con nombre, como `updateRings`, `updatePlayer`, `updateHazards`, `drawRings`, `drawPlayer` y `drawHud`. **El orden en que se llaman no cambia.**

### Fase 13 · Estado agrupado

Las variables sueltas de la partida (`level`, `combo`, `score`, `charge`, `shieldT`, `ghostT`, `jumping`…) se agrupan en objetos con sentido:

- `run`: la partida actual;
- `player`;
- `camera`;
- `settings`;
- `audioState`.

Lo que se reinicia al empezar una partida queda en `run`, y `setup()` crea un `run` nuevo con los mismos valores iniciales de hoy.

### Fase 14 · Sin código repetido

Ayudantes para lo que hoy se repite:

- **`storage.get(clave, valorPorDefecto)` y `storage.set(clave, valor)`**, con el `try/catch` adentro, en vez de repetirlo en decenas de lugares. Las claves siguen siendo exactamente las mismas (FIJO).
- **Intentos por nivel:** las cuatro ramas de `start()` (`attempts`, `attempts2`, `attempts3`, `attX`) se cambian por un ayudante que guarda en la misma clave de siempre.
- **`dom.js`**, con todas las referencias a elementos de la página (`getElementById`) en un solo lugar.
- **Funciones GLSL repetidas entre shaders** (ruido, hash, fbm…) en un archivo común que el armado agrega a cada shader. Solo si el código es idéntico en todos; si una versión es distinta, se queda separada.
- **Patrones de dibujo repetidos**, como degradados radiales del mismo estilo, en funciones con nombre.

### Fase 15 · Tipos y revisión automática

- Activa `// @ts-check` en cada archivo, con los tipos en JSDoc (`jsconfig.json` ya existe), para que VS Code marque errores mientras se escribe.
- Configura ESLint con reglas claras:
  - `prefer-const`;
  - `no-var`;
  - `eqeqeq`;
  - `no-unused-vars`;
  - un límite de complejidad por función.

  Arregla lo que marque sin cambiar el comportamiento.

### Fase 16 · Pruebas pequeñas

Agrega pruebas con `node:test` para las funciones de cálculo puro, por ejemplo:

- el tamaño de los asteroides (`obsRad`);
- la seguridad de un salto;
- la carga de los poderes (`chargeMax`);
- la generación de anillos con una semilla fija.

Se corren con `npm test`. La huella sigue siendo la prueba principal de que el juego no cambió.

### Fase 17 · Documentación y orden del repositorio

- **`docs/arquitectura.md`:** cómo funciona el juego por dentro, con un diagrama del bucle (toque → `update` → `render`), las pantallas y cómo se comunican los módulos.
- **Guías cortas:** `docs/agregar-un-nivel.md` y `docs/agregar-un-planeta.md`.
- **`CONTRIBUTING.md`:** cómo trabajar, las reglas de estilo y cómo comprobar con la huella.
- **`CHANGELOG.md`:** qué trae cada versión, y etiquetas de versión en git (`v1.0`…).
- **`package.json`:** nombre, versión y descripción. Archivo `LICENSE` (preguntar a Dally cuál).
- **Las carpetas `diseno/` y `versiones-anteriores/`** salen del código; preguntar a Dally si van a otra carpeta o a otro repositorio. Las ideas de `orbita_ideas_pendientes.md` pueden pasar a *Issues* de GitHub.

### Fase 18 · Cierre

- Actualiza `README.md`: estructura, cómo correr, cómo probar y las reglas de estilo.
- GitHub Actions revisa también `npm run format:check` y ESLint.
- Huella completa contra `../huella-base` una última vez.
- Dally prueba el juego antes de unir la rama a `main`.

---

## Reglas de estilo (para siempre, también después de la limpieza)

- Líneas de máximo 100 caracteres y una instrucción por línea.
- Funciones cortas que hagan una sola cosa. Si una pasa de ~50 líneas, probablemente son dos.
- Nombres claros en inglés y comentarios en español, en presente, sin historia.
- JSDoc en las funciones públicas de cada archivo.
- Constantes con nombre para los números que significan algo.
- CSS: una regla por selector, sin `!important` salvo que sea indispensable, con variables para colores.
- Commits pequeños, uno por cambio, con mensaje claro.
- Antes de cada commit: `node build.mjs --check`, `npm run format:check` y, si se tocó código del juego, la huella.
