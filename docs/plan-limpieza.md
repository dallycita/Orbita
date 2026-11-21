# Instrucciones: limpieza y reorganización completa del código de Órbita

**Para Claude en VS Code.** Lee este documento completo antes de tocar cualquier archivo. Vuelve a leer la sección "La única regla" y la de la fase en curso cada vez que empieces una fase nueva.

---

## 1. Qué se quiere

Dally, la dueña del proyecto, quiere que **todo el código** del juego quede ordenado, limpio, bien hecho y profesional, como un proyecto hecho con cuidado por personas que saben lo que hacen. Las razones:

1. **Que un cambio en un lugar no rompa otro.** Esta es la **prioridad número uno**. Hoy los 50 archivos de `src/js` comparten un solo espacio de variables: cualquier archivo puede leer y cambiar las variables de cualquier otro. Por eso un cambio en un lado puede romper algo en otro lado sin aviso. Al terminar, cada parte del juego debe tener límites claros: qué ofrece, qué usa y qué puede cambiar.
2. **Que cualquiera pueda entenderlo y trabajar en él.** Nombres claros, comentarios útiles, archivos con un solo tema y líneas cortas.
3. **Que esté listo para crecer.** Antes de agregar cualquier cosa nueva al juego, la base tiene que estar perfecta.

El tiempo no importa. Esto puede tomar muchas horas y muchas sesiones. **Se revisa todo: archivo por archivo, función por función, línea por línea.** Se puede cambiar, mover, partir, renombrar o reescribir cualquier cosa del código, todo lo que haga falta.

### Situación actual (para orientarte)

- **JavaScript:** `src/js/`, 50 archivos y unas 8 100 líneas. Unas 2 700 líneas pasan de 100 caracteres, muchas con varias instrucciones seguidas. Se unen en orden numérico dentro de un solo `(() => { … })()`, así que comparten un mismo espacio: no son módulos.
- **CSS:** `src/css/`, 9 archivos y unas 900 líneas. Hay capas de parches: secciones como "ajustes finales", "tarjeta v3" o "botón Escapar", reglas que pisan reglas anteriores del mismo selector, y `!important` para ganar.
- **Lo que se publica:** `build.mjs` arma `index.html`, el único archivo que se publica y que funciona con doble clic.
- **Las cabeceras:** cada archivo de `src/js` empieza con una cabecera generada (`da / lo usan / usa / cambia`), escrita por `herramientas/dependencias.mjs`.
- **Las pruebas:** `pruebas/huella.mjs` comprueba que el juego no cambió; `pruebas/rendimiento.mjs` y `pruebas/bot.js` son el jugador automático y la medición.

---

## 2. La única regla: el juego queda EXACTAMENTE igual

**El juego debe quedar tal y como está. Ni más ni menos.** Esta limpieza no arregla errores, no mejora la fluidez, no cambia ningún detalle y no agrega nada. Solo cambia cómo está escrito y organizado el código.

### Lo FIJO

Todo esto es **FIJO** y no puede cambiar:

- **Lo que se ve:**
  - las pantallas y los colores;
  - las animaciones y los efectos;
  - los shaders;
  - los tamaños y las posiciones;
  - las tipografías y los textos, letra por letra;
  - los tiempos de cada animación.
- **Lo que se oye:**
  - la música y cada sonido;
  - los volúmenes;
  - cuándo suena cada cosa.
- **Cómo se juega:**
  - los recorridos de anillos;
  - las velocidades y las duraciones;
  - los poderes;
  - la dificultad y el balance;
  - las misiones, los logros, las estrellas y el polvo estelar;
  - el tutorial y la pausa;
  - los controles: toque, deslizar y teclado.
- **Los datos guardados de los jugadores:**
  - Las claves de `localStorage` (`orbita_best_v2`, `orbita_estrellas`, `orbita_lvstars`, `orbita_mis`, `orbita_medidor`, `orbita_p1_…` a `orbita_p8_…`, `orbita_pl_nuevo`, `orbita_vol_mus`, `orbita_vol_sfx`).
  - El formato de lo que se guarda en ellas, incluidos los nombres de los campos de los objetos guardados (por ejemplo `polvo`, `streak`, `daily`, `ach` y `planetsWon` en `MIS`).

  Si algo de esto cambia, los jugadores pierden su progreso.
- **Los respaldos y casos raros:**
  - el dibujo 2D cuando no hay WebGL (`31-fondos-2d` y el dibujo de rocas sin GPU dentro de `astSprite`);
  - `prefers-reduced-motion`;
  - los `try/catch` alrededor de `localStorage` y del audio;
  - lo que pasa cuando un shader no compila.

  No se ejecutan en una computadora normal, pero **no son código sin usar**.
- **La estructura de la página:** los ids, las clases y la estructura del HTML. La huella identifica cada elemento por su ruta en la página (por ejemplo `div#home > div.sheet > button.opt`), así que cambiarlos rompe la comparación y además es riesgoso. Las clases e ids **se quedan con su nombre actual**.
- **El resultado final:** `index.html` sigue siendo **un solo archivo**, sin dependencias externas nuevas, y funciona con doble clic.

### Qué hacer si algo tocaría lo FIJO

Si un paso de la limpieza, una idea tuya o algo que te pidan cambiaría algo FIJO:

1. **Detente.**
2. Escribe: **"Esto es FIJO."**
3. Explica qué cambiaría, en palabras sencillas.
4. Pregúntale a Dally y espera su respuesta.

Lo FIJO solo cambia si Dally lo pide sabiendo que es FIJO. Si dudas si algo es FIJO, trátalo como FIJO.

### Trampas: cosas que cambian el juego aunque el código "parezca igual"

1. **El orden del azar.** El juego llama a `Math.random()` en unos 66 lugares, y además usa su propio generador `rng()` con semilla para los anillos. Si mueves, juntas, partes o reordenas código que llama a cualquiera de los dos, o cambias cuántas veces se llama, **cambian las partidas**. Al partir una función, las llamadas al azar deben ocurrir en el mismo orden y la misma cantidad de veces.
2. **El orden de las operaciones con decimales.** `a*b*c` no siempre da exactamente lo mismo que `a*(b*c)`, y `x*.5*.5` no da exactamente lo mismo que `x*.25`. Al ponerle nombre a un número o reescribir una fórmula, conserva **las mismas operaciones, en el mismo orden y con los mismos paréntesis**. No precalcules, no simplifiques y no "limpies" fórmulas.
3. **El orden de ejecución.** El orden en que se llaman las cosas en cada cuadro (lógica, dibujo, capas que se pintan encima de otras), el orden de los `addEventListener`, de los `setTimeout` y `setInterval`, y el de la creación de nodos de audio, **no cambia**.
4. **El orden en que se dibuja.** Lo que se dibuja después queda encima. Al partir `render` en funciones, se llaman en el mismo orden exacto.
5. **La cascada de CSS.** El orden de las reglas decide cuál gana. Al juntar reglas, el **estilo calculado final de cada elemento** debe quedar idéntico. Ojo con las media queries, con la especificidad y con los estados `:hover`, `:active`, `.on` y `.off`.
6. **Lo que se arma con texto.** Muchas cosas se buscan por un texto armado en el momento:
   - claves de `localStorage` (`'orbita_p' + (lvl + 1) + '_intentos'`);
   - clases (`classList.add('wscr')`);
   - HTML dentro de `innerHTML`;
   - nombres de datos (`data-h="medir"`);
   - acciones de botones (`A === 'levels'`).

   Antes de decidir que algo "no se usa", búscalo **también como texto**, en todo el proyecto.
7. **Las pruebas usan nombres internos.** `pruebas/huella.mjs`, `pruebas/rendimiento.mjs` y `pruebas/bot.js` llaman directamente a cosas del juego, como `start()`, `jump()`, `state`, `lvl`, `t`, `deadT`, `tutorial`, `curPlanet`, `powerKey()`, `chargeMax()` y `ASTGL`. Si renombras o mueves algo que usan, **actualiza las pruebas en el mismo commit**, y comprueba que la huella corre las 54 escenas sin errores.
8. **El audio no lo revisa la huella.** La huella corre sin sonido (`AudioContext` desactivado). Por eso, **antes de tocar cualquier archivo de audio o música** (`02-audio`, `03-musica-ritmos`, `04-musica-horizonte`, `05-musica-reproductor`, `18-pausa`, `28-sonidos-interfaz`), hay que crear la prueba de audio de la Fase 0.

---

## 3. Cómo trabajar (siempre)

### Rama, etiqueta y referencia

1. **Etiqueta el punto de partida** antes de empezar: `git tag antes-de-limpieza`. Esa etiqueta es "el juego como debe quedar" para siempre.
2. **Trabaja en la rama `limpieza`**, nunca directo en `main`. Al final, cuando Dally lo apruebe, se une a `main`.
3. **Huella de referencia.** La primera vez instala Playwright:

   ```bash
   npm install --no-save playwright && npx playwright install chromium
   ```

   Después saca la referencia:

   ```bash
   node pruebas/huella.mjs ../huella-base
   ```

   Si agregas escenas nuevas a la huella (ver Fase 0), la referencia se vuelve a sacar **desde la etiqueta `antes-de-limpieza`**, nunca desde el código ya cambiado. Usa una copia aparte (`git worktree add ../orbita-base antes-de-limpieza`), copia ahí la huella nueva y corre la huella en esa copia.

### Pasos pequeños, comprobados uno por uno

Cada paso hace **una sola cosa** y se comprueba antes de seguir:

```bash
node build.mjs                    # arma index.html
node build.mjs --check            # index.html al día (y lo demás que revise el armado)
npm run lint && npm run format:check  # desde que existan (Fase 2)
npm test                          # desde que existan (Fase 17)
node pruebas/huella.mjs ../huella-paso
node pruebas/huella.mjs --comparar ../huella-base ../huella-paso
node pruebas/audio.mjs --comparar # si se tocó audio (Fase 0)
```

- **Resultado aceptable:** "0 escenas con diferencias", o solo "ruido del dibujo por GPU". El ruido son unas decenas de píxeles con diferencias mínimas, que también salen entre dos corridas iguales.
- **Cualquier otra diferencia** (de imagen, de estilos, de partida o de audio) significa que **el paso cambió el juego**. Deshazlo (`git checkout -- .` o `git revert`), entiende por qué y hazlo de otra forma.
- **No sigas con el siguiente paso** si el actual no pasó todas las comprobaciones.

### Commits

- **Un commit por paso**, con un mensaje claro en español que diga qué se hizo. Por ejemplo:
  - `Formatea src/js/18-pausa.js`
  - `Quita funciones sin usar de las misiones`
  - `Separa los recorridos de anillos en data/courses.js`
- **El historial es real.** Commits pequeños y frecuentes, con las fechas reales. No cambies fechas, no reescribas commits que ya existen, no uses `push --force` y no juntes muchos commits en uno.
- Al terminar cada fase, sube la rama (`git push`).

### Informe a Dally al terminar cada fase

Escribe en español sencillo, sin jerga:

1. qué se hizo en la fase, con ejemplos de antes y después;
2. el resultado de la huella y la prueba de audio, y por qué eso demuestra que el juego quedó igual;
3. si algo fue FIJO y se dejó como estaba, qué fue;
4. qué sigue.

**Espera su visto bueno antes de empezar la siguiente fase.**

### Si dudas

Pregunta. Es mejor preguntar que adivinar. Nunca "aproveches" para arreglar un error o mejorar algo del juego: anótalo en `docs/pendientes-despues-de-limpieza.md` y sigue.

---

## 4. Cómo debe quedar el código (la guía de estilo)

Esto vale para **cada línea** del proyecto, durante y después de la limpieza.

### Formato

- Líneas de **100 caracteres como máximo**.
- **Una instrucción por línea.** Nada de `a(); b(); c();` en la misma línea, ni varias declaraciones complejas con comas.
- **Llaves siempre** en `if`, `for` y `while`, aunque sea una sola instrucción. Nada de `if (x) return;` encadenado con más cosas en la misma línea.
- Expresiones largas partidas en varias líneas, una idea por línea.
- **Sin ternarios anidados.** `a ? b : c ? d : e` se vuelve `if/else` o una tabla.
- Prettier se encarga del formato. Respeta lo que deja.

### Nombres

- **Un solo idioma para el código: inglés.** Variables, funciones, archivos y carpetas en inglés. **Comentarios y documentación en español.** Los textos que ve el jugador siguen como están (FIJO).
- `camelCase` para variables y funciones, `PascalCase` para clases y `UPPER_SNAKE_CASE` para constantes.
- Archivos en `kebab-case`: `ring-types.js`, `pause-menu.js`.
- **Los nombres dicen qué son, completos:**

  | Antes | Después |
  |---|---|
  | `pzSnd` | `playPauseSound` |
  | `pzAC` | `pauseAudioContext` |
  | `astPre` | `pendingRockSprites` |
  | `astPrebake` | `prebakeRockSprites` |
  | `hzS` | `horizonState` |
  | `rp` | `spriteRadius` |
  | `U` | `uniforms` |
  | `MIS` | `missionsState` |
  | `wh` | `wormhole` |
  | `pfx` | `powerEffects` |

- **Las funciones son verbos** (`drawRing`, `updateHazards`, `loadVolume`) y los booleanos preguntas (`isPaused`, `hasShield`, `canDoubleJump`).
- Las letras sueltas solo en bucles cortos (`i`, `j`) y en fórmulas donde son el nombre estándar (`x`, `y`, `t`, `dt`).
- Sin abreviaturas inventadas. Las de siempre se pueden usar (`ctx`, `gl`, `dpr`, `rgb`).
- **No se renombran** las claves de `localStorage`, los campos guardados, las clases ni los ids del HTML (son FIJOS).

### Funciones y archivos

- **Cada función hace una sola cosa.** Si pasa de ~40 líneas o tiene más de 3 niveles de sangría, probablemente son varias funciones.
- **Cada archivo tiene un solo tema.** Si pasa de ~300 líneas, probablemente se puede partir.
- **Sin código repetido.** Si algo aparece dos veces o más, va en una función con nombre.

### Números

- Los números que significan algo van en **constantes con nombre y unidad**: `COUNTDOWN_STEP_MS = 620`, `RING_GAP = 34`, `JUMP_DURATION_S`.
- Ponlas al inicio del archivo que las usa, o en `src/config/` si las usan varios.
- **Mismo valor exacto y la misma operación en el mismo orden** (ver Trampas). Los coeficientes internos de una fórmula pueden quedarse si un comentario explica la fórmula.

### Comentarios

- **Al inicio de cada archivo**, 2 a 5 líneas que digan qué contiene y para qué sirve:

  ```js
  /**
   * Menú de pausa: abrir, continuar con la cuenta 3·2·1, reintentar y salir a los niveles.
   * También guarda los volúmenes de música y efectos que el jugador elige aquí.
   */
  ```

- **JSDoc en cada función exportada** y en las internas que no sean obvias. Incluye qué hace, cada parámetro con su tipo y unidad (píxeles, segundos, radianes, de 0 a 1), qué devuelve y, si aplica, qué estado cambia:

  ```js
  /**
   * Dibuja un asteroide con la imagen ya preparada de su forma, giro y tamaño.
   * Si no hay imagen (sin WebGL), dibuja un círculo del color de respaldo.
   *
   * @param {number} x Posición horizontal, en píxeles de pantalla.
   * @param {number} y Posición vertical, en píxeles de pantalla.
   * @param {number} radius Radio, en píxeles de pantalla.
   * @param {number} seed Semilla del asteroide; decide su forma.
   * @param {number} rotation Giro actual, en radianes.
   * @param {string} fallbackColor Color del círculo de respaldo.
   * @param {number} alpha Opacidad, de 0 a 1.
   */
  ```

- **Dentro de las funciones**, comentarios cortos solo donde el código no se explica solo: el *por qué* de una decisión, de dónde sale una fórmula o un dato real (por ejemplo "la luz viene de abajo: del disco del agujero negro"). En presente, técnicos y breves.
- **No cuentes la historia de los cambios.** Nada de "ahora", "antes", "nuevo", "v2/v3", "ajuste final", "arreglado", "por fin", "como se pidió", "para que ya no…". El historial está en git.
  - ❌ `// rocas por adelantado: para no fabricarlas en pleno juego, donde cada una era un tirón`
  - ✅ `// Prepara las imágenes de los asteroides en pantallas sin partida, unas pocas por cuadro.`
- **No comentes lo obvio** (`i++ // suma uno`). Sin emojis, sin signos de exclamación y sin mayúsculas para gritar.
- Los datos científicos reales (distancias, masas, nombres de galaxias) **conservan su comentario**: son parte del valor del juego.

### CSS

- Un archivo por pantalla o componente.
- **Una sola regla por selector** dentro de su archivo, con el resultado final. Nada de "parches" que pisan una regla anterior del mismo selector.
- **`!important` solo si es indispensable**, con un comentario de por qué.
- **Orden dentro de cada componente:** contenedor, partes internas, estados (`.on`, `.off`, `:hover`, `:active`, `:focus-visible`), media queries del componente y, al final del archivo, sus `@keyframes`.
- **Colores repetidos como variables** en `:root` (`--color-sun`, `--color-sky`…), con el valor exacto de hoy.
- Comentarios de sección cortos que digan qué parte de la pantalla es, sin historia.

---

## 5. Las fases, en orden

Cada fase se hace en pasos pequeños, con la comprobación completa después de cada paso y el informe a Dally al final.

### Fase 0 · Preparar las redes de seguridad

Antes de cambiar una sola línea del juego:

1. `git tag antes-de-limpieza`, la rama `limpieza` y la huella de referencia (sección 3).
2. **Prueba de audio, `pruebas/audio.mjs`:**
   - corre el motor de sonido en un `OfflineAudioContext` con el azar con semilla y el reloj falso de la huella;
   - genera unos segundos de:
     - cada pista de música de cada nivel;
     - cada efecto de sonido (salto, aterrizaje, perfecto, poderes, muerte, victoria);
     - cada sonido de la pausa y de los botones;
   - guarda una huella (hash) de las muestras de cada uno;
   - con `--comparar`, dice cuáles cambiaron.

   Saca su referencia desde `antes-de-limpieza`. Si no es posible hacer una prueba de audio confiable, **dilo**: entonces los archivos de audio solo reciben cambios mecánicos (formato, nombres, comentarios), revisados con cuidado extra.
3. **Revisa qué cubre la huella.** Hoy tiene 54 escenas. Si una zona del juego que vas a reorganizar no aparece en ninguna escena, **agrégale una escena antes de tocarla** y vuelve a sacar la referencia desde `antes-de-limpieza`. Algunas zonas que podrían no estar cubiertas:
   - cada poder en acción;
   - cada pantalla de Ajustes;
   - completar una misión;
   - el polvo estelar;
   - el tutorial completo;
   - la pausa con la cuenta 3·2·1;
   - ganar un nivel;
   - los 8 niveles con más tiempo de partida;
   - el modo de movimiento reducido;
   - el respaldo sin WebGL.

   Para el respaldo sin WebGL, se puede hacer con una escena que desactive `getContext('webgl')`.
4. Informe a Dally: qué cubren las pruebas y qué no.

### Fase 1 · Leer todo y hacer el inventario

**Lee cada archivo completo, línea por línea**, antes de cambiar la estructura. Escribe `docs/inventario.md` con, por cada archivo:

- qué hace (2 o 3 líneas);
- sus funciones y para qué sirve cada una;
- qué variables propias tiene;
- qué variables y funciones de **otros** archivos lee, y cuáles **cambia** (esto es lo más importante para la prioridad número uno);
- código que parece sin usar (candidato; todavía no se borra);
- código repetido aquí o en otros archivos;
- problemas de estilo: líneas largas, nombres crípticos, números sin nombre, comentarios de historia, funciones demasiado largas;
- zonas delicadas: azar, orden de dibujo, audio, `localStorage`, texto armado.

Al final del inventario, propón en `docs/arquitectura.md` **cómo quedará el código**:

- las carpetas y los archivos;
- qué ofrece cada módulo;
- quién depende de quién: en una sola dirección y sin ciclos;
- dónde vive cada parte del estado, y quién es el único que la cambia.

**Muéstrale la propuesta a Dally y espera su visto bueno** antes de la Fase 6.

### Fase 2 · Herramientas

- **Prettier** con `printWidth: 100`, comillas simples, punto y coma y 2 espacios, más `.editorconfig`.
- **ESLint** (configuración plana, `eslint.config.js`) con estas reglas:
  - `no-unused-vars`;
  - `prefer-const`;
  - `no-var`;
  - `eqeqeq`;
  - `curly`;
  - `max-len` (100, sin contar textos ni URL largas);
  - `max-depth` 3;
  - `complexity` (empieza solo como aviso);
  - `no-shadow`;
  - `no-implicit-globals`.

  Mientras el código no sea módulos, ESLint se corre sobre el `index.html` armado o con la lista de globales compartidas. Desde la Fase 6, archivo por archivo.
- **Scripts en `package.json`:**
  - `format`;
  - `format:check`;
  - `lint`;
  - `test` (vacío por ahora);
  - `huella`;
  - `audio`.
- **GitHub Actions:** agrega `format:check` y `lint` cuando ya pasen.

### Fase 3 · Formato y cabeceras

1. **Quita las cabeceras de dependencias** (`da / lo usan / usa / cambia`) de todos los archivos de `src/js`.
   - Ajusta `build.mjs` (`--check` y `--deps`), `CLAUDE.md`, `README.md` y el flujo de GitHub.
   - `herramientas/dependencias.mjs` se puede quedar solo como reporte (`docs/dependencias.md`) mientras dure la limpieza. En la Fase 6 los `import` hacen ese trabajo y la herramienta se borra.
2. **Pasa Prettier** a todo, un archivo por commit.
3. **Parte a mano lo que Prettier no parte:**
   - varias instrucciones en una línea;
   - `if` sin llaves;
   - ternarios anidados.
   - **No cambies el orden de nada.**
4. **Los shaders (GLSL dentro de textos):** de momento solo saltos de línea y sangría; en la Fase 15 se ordenan del todo.

### Fase 4 · Quitar lo que no se usa

1. **Junta los candidatos** de:
   - el inventario;
   - ESLint (`no-unused-vars`);
   - la cobertura de Chrome mientras corre la huella, para ver qué funciones nunca se ejecutan.
2. **Por cada candidato:**
   1. Búscalo como nombre y **como texto** en todo el proyecto, incluido el HTML, el CSS y las pruebas.
   2. Decide si es un respaldo o un caso raro (sección 2): si lo es, es FIJO y se queda.
   3. Si de verdad no se usa, bórralo, **un tema por commit**, y comprueba con la huella.
3. **CSS sin usar:**
   - reglas cuyos selectores no coinciden con nada en ninguna escena y cuyas clases no se agregan desde JavaScript;
   - `@keyframes` y variables CSS que nadie usa;
   - reglas tapadas por completo por otra posterior.
4. **Archivos y carpetas que no son del juego** (`versiones-anteriores/`, `diseno/`, `musica/`, `orbita_ideas_pendientes.md`): **pregúntale a Dally** si se borran, se mueven a otra carpeta o se quedan.

### Fase 5 · CSS sin parches

Un archivo a la vez:

1. Por cada selector, junta todas sus reglas repartidas en el archivo, y en otros archivos si las hay, en **una sola regla con el resultado final**.
2. Quita los `!important` que ya no hacen falta.
3. Ordena por componente (sección 4).
4. Pasa los colores repetidos a variables con el valor exacto.
5. Quita los títulos de historia ("ajustes finales", "tarjeta v3", "botón Escapar"…) y deja comentarios de sección normales.
6. **Comprueba con la huella después de cada archivo.** El estilo calculado debe ser idéntico en las 54 escenas.

### Fase 6 · Módulos de verdad (el corazón de la prioridad número uno)

Esta fase hace que **un cambio en un lugar no rompa otro**:

1. **Cambia a módulos ES** (`import` / `export`). `build.mjs` los empaqueta con **esbuild** en el mismo `index.html` de un solo archivo; agrégalo como dependencia de desarrollo. Revisa que el resultado siga funcionando con doble clic: sin `type="module"` externo y sin archivos aparte.
2. **Cada módulo exporta solo lo que otros necesitan.** Todo lo demás es privado.
3. **Las dependencias van en una sola dirección:**

   `config/data → core → audio → game → render → screens → main`

   - Un módulo nunca importa de uno que está "después".
   - **Sin ciclos.** Agrega una comprobación al armado (con `madge` o con el análisis de esbuild) que falle si hay un ciclo.
4. **El estado compartido tiene dueño.** Hoy varios archivos cambian directamente variables de otros (`state`, `level`, `t`, `paused`, `charge`…). Cada parte del estado vive en el módulo que es su dueño:
   - **Los demás lo leen** con funciones o con el objeto exportado.
   - **Lo cambian solo a través de funciones del dueño**, como `setScreen('menu')` o `addCharge()`, nunca asignando la variable desde afuera.
   - Usa las variables cambiadas de otros archivos que anotaste en el inventario: cada una debe quedar con **un solo dueño**.
5. **Para avisar de algo, eventos simples en vez de llamadas cruzadas.** Por ejemplo, "terminó la partida" o "se completó una misión", con un `emit`/`on` pequeño en `core/events.js`, cuando así se evita que un módulo de abajo dependa de uno de arriba.
6. **Haz la migración de a un módulo**, con la huella después de cada uno. El orden de ejecución al cargar debe ser el mismo de hoy.
7. **Las pruebas** (`huella`, `bot`, `rendimiento`) hoy usan nombres internos con `eval`. Dales una entrada de pruebas explícita, por ejemplo un objeto `window.__orbitaTest` que solo existe en el armado de pruebas, con lo que necesitan (`start`, `jump`, `getState`…). Así no dependen de los nombres internos.
8. Al terminar, borra `herramientas/dependencias.mjs` y `docs/dependencias.md`: los `import` ya dicen todo.

### Fase 7 · Carpetas por tema

Sin números en los nombres. Un ejemplo; ajústalo según el inventario y la propuesta aprobada:

```
src/
  index.html
  main.js                 arranque: crea todo y arranca el bucle
  config/                 constantes de ajuste (tiempos, tamaños, colores)
  data/                   datos puros, sin lógica
    courses.js            recorridos de anillos de cada nivel
    planets.js            datos reales de los planetas y sus estadísticas
    levels.js             galaxias: nombre, colores, música, datos reales
    hazards.js            dónde aparecen cometas, rayos, llamaradas, novas…
    missions.js           misiones y logros
    texts.js              todos los textos que ve el jugador
  core/
    loop.js               el bucle de cuadros
    screen.js             tamaño de pantalla, escala, DPR
    storage.js            leer y guardar en localStorage
    events.js             avisos entre módulos
    random.js             azar con semilla de los anillos
    dom.js                referencias a los elementos de la página
    math.js               clamp, frac, lerp…
  audio/
    engine.js             contexto, canales, volúmenes
    music-player.js       qué suena y cuándo
    tracks/…              cada pista
    sfx.js                efectos del juego
    ui-sounds.js          sonidos de botones y pausa
  game/
    run.js                estado de la partida actual
    rings.js              crear y mover anillos
    ring-types/…          un archivo por tipo de anillo
    player.js             saltar, aterrizar, morir, ganar
    powers/…              un archivo por poder de planeta
    hazards/…             cada peligro
    wormhole.js           el agujero de gusano
    gravitational-lens.js
    tutorial.js
    controls.js
  render/
    scene.js              orden de dibujo de un cuadro
    rocks.js              asteroides en 3D
    planets-gl.js         planetas en 3D
    black-hole.js
    backgrounds/…         motor de fondos y un archivo por galaxia
    effects.js            partículas, textos flotantes, destellos
    hud.js
  shaders/…               .glsl, un archivo por shader
  screens/
    splash.js  intro.js  home.js  levels.js  planets.js
    missions.js  pause.js  panel.js  perf-meter.js
  css/                    un archivo por pantalla o componente
```

### Fase 8 · Estado agrupado

Las variables sueltas se agrupan en objetos con sentido, cada uno con su dueño:

- **`run`:** la partida actual (nivel, anillo, combo, puntaje, carga, escudos, tiempos…). `setup()` crea un `run` nuevo con **los mismos valores iniciales de hoy**.
- **`player`, `camera`, `settings`** (volúmenes, modo, música…) y **`progress`** (récords, estrellas, intentos; se lee y guarda con las mismas claves de siempre).
- Nada de variables sueltas de partida a nivel de módulo.

### Fase 9 · Partir lo grande

- **Pantallas como máquina de estados.** Cada pantalla es un objeto con `enter`, `update`, `render` y `exit`. `frame()` solo llama a la pantalla actual, en vez de la cadena `if (state === 'splash') … else if (state === 'intro') …`. **Mismo orden de ejecución que hoy dentro de cada pantalla.**
- **Anillos.** `makeRing` deja de ser un `if/else` por tipo y se vuelve una tabla: `RING_TYPES = { clasico: createClassicRing, muralla: … }`, con un archivo por tipo. **Cada tipo llama a `rng()` las mismas veces y en el mismo orden.**
- **Poderes.** Cada planeta tiene un objeto con `activate`, `update`, `draw` y `reset`, en vez de condiciones repartidas por `update` y `render`.
- **Peligros.** Igual que los poderes: un objeto por peligro.
- **`update` y `render`** se parten en funciones con nombre (`updateRings`, `updatePlayer`, `updateHazards`, `drawBackground`, `drawRings`, `drawPlayer`, `drawHud`…). Se llaman **en el mismo orden**.
- Cualquier función de más de ~40 líneas se parte en funciones con nombre.

### Fase 10 · Datos y textos aparte

- **Los recorridos** (`COURSE`, `COURSE2`, `COURSE3` y los de los demás niveles), **los planetas**, **los niveles**, **los peligros**, **las misiones y los logros** pasan a `data/` como datos puros, con los mismos valores.
- **Todos los textos que ve el jugador** van en `data/texts.js`, organizados por pantalla, y el código los usa por su clave. El texto que se ve es idéntico, letra por letra.

### Fase 11 · Sin HTML armado con texto

Lo que hoy se arma pegando texto en `innerHTML` (las tarjetas de niveles, el panel de antes de jugar, las misiones, el escaneo…) pasa a una de estas formas:

- plantillas `<template>` en `src/index.html`, que el código copia y llena;
- funciones pequeñas que crean cada pieza con `document.createElement`.

El HTML resultante debe ser **idéntico**: mismos elementos, en el mismo orden, con las mismas clases y atributos. Los textos que vienen de datos se ponen con `textContent`, no con `innerHTML`.

### Fase 12 · Sin código repetido

Busca en el inventario todo lo que se repite y hazlo una sola vez:

- **`storage.get(key, fallback)` / `storage.set(key, value)`**, con el `try/catch` adentro, en lugar de repetirlo en decenas de lugares. **Mismas claves.**
- **Intentos por nivel:** las cuatro ramas de `start()` (`attempts`, `attempts2`, `attempts3`, `attX[lvl]`) se reemplazan por una función que guarda en **la misma clave de siempre** según el nivel.
- **Las referencias a elementos de la página** en `core/dom.js`.
- **Los degradados, brillos y halos** que se crean igual en varios lugares, en funciones con nombre.
- **Los botones con el mismo comportamiento** (sonido de cristal, salto al pasar el mouse) con una sola forma de conectarlos.
- **Las funciones GLSL repetidas entre shaders** (hash, ruido, fbm…) en un archivo común que el armado agrega, **solo si el código es idéntico**. Si una versión es distinta aunque sea por un número, se queda aparte: cambiarla cambia la imagen.

### Fase 13 · Nombres

Con el código ya en su lugar, revisa **cada nombre** de cada archivo según la guía (sección 4):

- Usa el "Rename Symbol" (F2) de VS Code, que entiende el código. **Nunca buscar y reemplazar texto.**
- Un módulo o un tema por commit, con la huella después de cada uno.
- Actualiza las pruebas si hace falta.
- **No se renombran** las claves guardadas, los campos guardados, las clases ni los ids (FIJO).

### Fase 14 · Números con nombre

Los números con significado pasan a constantes con nombre y unidad:

- tiempos;
- tamaños;
- velocidades;
- duraciones de poderes;
- radios;
- colores.

Van en el archivo que las usa o en `config/`. **Mismo valor, misma operación, mismo orden.**

### Fase 15 · Shaders legibles

- Cada shader en su propio archivo `.glsl` en `src/shaders/`, y `build.mjs` (o esbuild) los mete como texto en el armado.
- **Dentro de cada shader:**
  - una instrucción por línea;
  - nombres claros en las funciones y variables internas;
  - un comentario corto por función, que diga qué calcula (ruido, cráteres, luz del disco, lente, estrellas…) y de dónde sale el modelo cuando es ciencia real.
- **Los nombres de los uniforms** (`uRes`, `uT`…) se pueden renombrar solo si se cambian a la vez en el shader y en el JS.
- **Las operaciones no cambian**, ni siquiera de orden. Solo cambian el formato y los nombres. Comprueba con la huella.

### Fase 16 · Comentarios y JSDoc

Recorre **cada archivo y cada función** según la guía (sección 4):

- un encabezado por archivo;
- JSDoc en cada función exportada y en las no obvias;
- comentarios del *por qué* donde hagan falta;
- **borra todos los comentarios de historia** y los obvios.

Que se lea como un proyecto profesional bien documentado.

### Fase 17 · Tipos y pruebas pequeñas

- **`// @ts-check`** en cada archivo (`jsconfig.json` ya existe), con tipos en JSDoc (`@typedef` para los objetos principales: anillo, asteroide, partida, planeta, nivel). Arregla lo que marque **sin cambiar el comportamiento**. Si algo que marca es un error real del juego, **no lo arregles**: anótalo en `docs/pendientes-despues-de-limpieza.md` para Dally.
- **Pruebas con `node:test`** (`npm test`) para las funciones puras:
  - el tamaño de los asteroides;
  - la seguridad de un salto;
  - la carga y duración de los poderes;
  - la creación de anillos con una semilla fija (mismo resultado que antes de la limpieza);
  - la lectura y escritura del progreso con las claves de siempre.

### Fase 18 · Documentación y orden del repositorio

- **`README.md`:**
  - qué es el juego;
  - cómo correrlo (`npm run dev`) y armarlo;
  - la estructura de carpetas;
  - cómo comprobar con la huella.
- **`docs/arquitectura.md`** (la versión final):
  - el diagrama del bucle (toque → `update` → `render`);
  - las pantallas;
  - los módulos y en qué dirección van sus dependencias;
  - quién es dueño de cada estado.
- **Guías cortas:**
  - `docs/agregar-un-nivel.md`;
  - `docs/agregar-un-planeta-y-su-poder.md`;
  - `docs/agregar-un-tipo-de-anillo.md`.
- **`CONTRIBUTING.md`:**
  - las reglas de lo FIJO;
  - la guía de estilo;
  - cómo hacer un cambio y comprobarlo.
- **`CHANGELOG.md`**, con una primera entrada que diga que el código se reorganizó sin cambios en el juego.
- **`package.json`** con nombre, versión `1.0.0` y descripción. `LICENSE`: preguntar a Dally cuál quiere, o si prefiere no poner ninguna.
- **`.gitignore`** revisado.
- **Actualiza `CLAUDE.md`** con las reglas nuevas: la estructura, los comandos y la guía de estilo.

### Fase 19 · Segunda revisión, línea por línea

Con todo terminado, **vuelve a leer cada archivo completo, línea por línea**, con esta lista:

- [ ] ¿Cada línea mide 100 caracteres o menos y tiene una sola instrucción?
- [ ] ¿Cada nombre dice qué es, en inglés y sin abreviaturas inventadas?
- [ ] ¿Cada función hace una sola cosa y tiene JSDoc si es exportada o no es obvia?
- [ ] ¿Hay algún número con significado sin nombre?
- [ ] ¿Hay algún comentario de historia ("ahora", "antes", "nuevo", "v3", "arreglo", "ajuste")?
- [ ] ¿Hay código repetido que debería ser una función?
- [ ] ¿Hay código que no se usa y no es un respaldo?
- [ ] ¿El archivo tiene un solo tema? ¿Importa solo lo que usa?
- [ ] ¿Algún módulo cambia el estado de otro sin pasar por su dueño?
- [ ] ¿Hay `!important` sin razón, o selectores repetidos en el CSS?
- [ ] ¿Pasan `format:check`, `lint`, `test`, la huella y la prueba de audio?

Corrige lo que salga, con la huella después de cada corrección.

### Fase 20 · Cierre

1. **Huella completa y prueba de audio contra la referencia de `antes-de-limpieza`**: 0 diferencias reales.
2. **Lista para que Dally pruebe a mano**, con lo que debe revisar:
   - cada pantalla;
   - jugar un nivel de cada galaxia;
   - cada planeta y su poder;
   - la pausa;
   - las misiones;
   - los Ajustes;
   - que su progreso guardado siga ahí.
3. Con su visto bueno, abre un pull request de `limpieza` a `main` con el resumen de todas las fases y únelo.
4. Etiqueta `v1.0.0`.

---

## 6. Lo que nunca se hace

- Cambiar algo FIJO sin que Dally lo pida sabiendo que es FIJO.
- Arreglar errores, mejorar la fluidez o "aprovechar" para cambiar algo del juego. Se anota en `docs/pendientes-despues-de-limpieza.md`.
- Renombrar claves de `localStorage`, campos guardados, clases o ids del HTML.
- Reordenar llamadas al azar, al dibujo, a eventos o al audio.
- Precalcular o simplificar fórmulas.
- Borrar respaldos o casos raros porque "no se ejecutan".
- Buscar y reemplazar texto para renombrar.
- Juntar muchos cambios en un commit, cambiar fechas, reescribir el historial o hacer `push --force`.
- Seguir con el siguiente paso si el actual no pasó todas las comprobaciones.
- Empezar una fase nueva sin el visto bueno de Dally.
