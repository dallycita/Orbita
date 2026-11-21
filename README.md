# Órbita

La Tierra escapa de un agujero negro saltando entre anillos que giran, al ritmo de la música, a través de 8 galaxias reales: del Sistema solar hasta Sagitario A\*.

Es un juego web: HTML, CSS y JavaScript sin librerías, con Canvas 2D, shaders de WebGL para los fondos, planetas y el agujero negro, y la música generada en vivo con Web Audio.

## Jugar

Abre `index.html` en el navegador. Es un solo archivo con todo adentro.

## Trabajar en el juego

Necesitas [Node.js](https://nodejs.org) 18 o más nuevo. La primera vez corre `npm install` (solo instala el analizador que revisa las dependencias).

```bash
npm run dev      # abre http://localhost:5173 y recarga solo cada vez que guardas
npm run build    # arma index.html a partir de src/
npm run check    # comprueba que index.html está al día y que cada archivo declara lo que usa
npm run deps     # escribe docs/dependencias.md: qué usa y qué cambia cada archivo de los demás
```

**La regla más importante: se edita `src/`, nunca `index.html`.** `index.html` se genera solo; si lo editas a mano, el próximo `build` borra el cambio. Antes de subir un cambio, corre `npm run build` (con `npm run dev` abierto se hace solo). GitHub también lo revisa en cada subida.

## Dónde está cada cosa

```
src/
  index.html             la página: lienzo, botones fijos y las marcas donde entran el estilo y el código
  css/                   el estilo, en orden (lo de abajo pisa a lo de arriba)
  js/fuera/              lo poco que vive fuera del juego (íconos de las flechas)
  js/                    el juego, en orden
index.html               el juego armado (no se edita)
build.mjs  dev.mjs       las herramientas para armar y trabajar
diseno/                  imágenes de diseño, pruebas y comparaciones
musica/                  muestras de la banda sonora
versiones-anteriores/    prototipos viejos
orbita_ideas_pendientes.md
```

### El estilo (`src/css/`)

Un archivo por pantalla: `01-base` (colores y página), `02-navegacion` (flechas y botón de volver), `03-inicio`, `04-niveles`, `05-planetas`, `06-misiones`, `07-partida` (marcador, botón de pausa, "Intento N"), `08-panel` (antes de jugar, victoria y derrota) y `09-pausa`.

### El código (`src/js/`)

| Archivo | Qué tiene |
|---|---|
| `01-pantalla-y-utilidades` | elementos de la página, tamaño de pantalla, zonas, estrellas del fondo, utilidades (`clamp`, `frac`, vibración) |
| `02-audio` | el motor de sonido: canales de música y SFX, volúmenes, golpes y ruido |
| `03-musica-ritmos` | ritmos y la música de Andrómeda, Magallanes y los niveles 4 a 8 |
| `04-musica-horizonte` | "Horizonte de sucesos", la banda sonora del Sistema solar |
| `05-musica-reproductor` | qué música suena, cuándo arranca y cuándo para |
| `06-record-y-estado` | récords y el estado general (nivel, anillo, posición) |
| `07-planetas` | los planetas: datos reales, estadísticas y poderes |
| `08-partida-estado` | contadores, tutorial y efectos en pantalla de la partida |
| `09-recorridos` | los recorridos de anillos de cada nivel |
| `10-ritmo-y-objetos` | sincronía con la música, estrellas (moneda), nebulosas y púlsares |
| `11-peligros-datos` | dónde aparecen cometas, rayos, llamaradas, supernovas y novas |
| `12-poderes` | los poderes de cada planeta y sus efectos visuales |
| `13-agujero-de-gusano` | el modo Órbita dentro del gusano y su portal |
| `14-lente-gravitacional` | la lente que dobla el espacio alrededor del gusano |
| `15-peligros` | cómo se mueven y dibujan los peligros (novas, ondas, cometas…) |
| `16-partida` | anillos, inicio, saltos, aterrizar, ganar y morir |
| `17-tutorial` | el tutorial |
| `18-pausa` | el menú de pausa, sus sonidos y la cuenta 3·2·1 |
| `19-controles` | toques, deslizamientos y teclado |
| `20-logica` | lo que pasa en cada cuadro (`update`) |
| `21-dibujo` | cómo se dibuja cada cuadro (`render`) |
| `22-viaje-sistema-solar` | los planetas que pasan en el fondo del Sistema solar |
| `23-intro` | la historia: el agujero negro entra al sistema solar |
| `24-presentacion` | la presentación con el logotipo |
| `25-selector-niveles` | la pantalla para elegir galaxia |
| `26-pantalla-inicio` | el inicio, ajustes y sonido |
| `27-inicio-animacion` | la animación del inicio |
| `28-sonidos-interfaz` | los sonidos de cristal de los botones |
| `29-planetas-hd` | la pantalla de planetas y los planetas en 3D (WebGL) |
| `30-escanear` | el escaneo de datos de cada planeta |
| `31-fondos-2d` | los fondos 2D (respaldo si no hay WebGL) |
| `32-fondos-*` | los shaders de cada fondo, uno por galaxia, y `32-fondos-9-motor` que los dibuja |
| `33-tarjetas-niveles` | las galaxias en movimiento del selector |
| `34-misiones` | misiones diarias, logros y polvo estelar |
| `35-medidor` | el medidor de rendimiento (Ajustes o `?medir`) |
| `36-bucle-principal` | el bucle que mueve todo (`frame`) |

### Cada archivo declara qué usa de los demás

`docs/dependencias.md` (lo escribe `npm run deps`) muestra, por archivo, **qué usa** de cada otro archivo y **qué variables de otros archivos cambia** (lo más delicado: es estado compartido). `npm run lint` avisa si un archivo usa o cambia algo de otro que no estaba declarado.

Todos los archivos de `js/` comparten el mismo espacio de nombres: una función de un archivo puede usar las variables de otro. El número al principio fija el orden en que se unen, y ese orden importa: un archivo puede usar al cargar lo que se definió en un archivo anterior, no en uno posterior. Si agregas un archivo nuevo, ponle el número del lugar donde va.

## Comprobar que nada cambió

`pruebas/huella.mjs` juega el juego solo, de forma exacta y repetible (mismo azar, reloj falso), y guarda una "huella": una captura de cada pantalla y de las 8 galaxias, el estilo calculado de cada elemento y el estado de cada partida cuadro a cuadro. Sirve para cambios internos (ordenar, limpiar) que no deben cambiar nada.

```bash
npm install --no-save playwright && npx playwright install chromium   # una vez
node pruebas/huella.mjs antes                  # antes del cambio
node pruebas/huella.mjs despues                # después
node pruebas/huella.mjs --comparar antes despues
```

Las capturas pueden diferir en unos pocos píxeles por cómo dibuja la tarjeta gráfica (pasa incluso entre dos corridas iguales); el comparador lo indica aparte.
