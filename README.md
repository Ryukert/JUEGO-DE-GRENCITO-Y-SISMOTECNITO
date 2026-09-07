# Escuadrón Tecnito y Greencito

Juego educativo por turnos con dos mascotas que hablan con Claude. Pensado para
que un grupo de primaria o secundaria lo juegue en el salón, en el celular o en
la computadora.

- **Sismo Tecnito** — protección civil ante sismos.
- **Greencito** — cuidado del medio ambiente.

Stack: React 18 + Vite. La conversación pasa por una función serverless en
`/api/chat` para que la API key nunca salga del servidor.

---

## Cómo se juega

Cada partida son **cinco misiones seguidas** con el mismo personaje, alternando
preguntas y minijuegos: reto → memorama → reto → minijuego de acción → reto.

**Vidas.** Empiezas con tres corazones. Fallar o quedarte sin tiempo cuesta uno.
Al llegar a cero repites la misión con las vidas llenas: nadie pierde su avance.

**Cronómetro.** Cada pregunta corre contra reloj. Los segundos que sobran se
suman a tus puntos, así que responder rápido paga.

**Racha.** Dos aciertos seguidos multiplican por 2. Cuatro seguidos, por 3. Una
respuesta mala la rompe.

**Minijuegos.**
- *Memorama* (los dos personajes): doce cartas, seis parejas, contra reloj. Cada
  pareja encontrada suelta un dato debajo del tablero. Un par equivocado cuesta
  tres segundos, y el tiempo que sobra se convierte en puntos.
- *Simulacro relámpago* (Sismo Tecnito): la pantalla tiembla y tienes que tocar
  agáchate → cúbrete → agárrate en ese orden, esquivando botones trampa como
  "usar el elevador". Tres rondas, cada una más rápida.
- *Separa o pierde* (Greencito): caen diez residuos y hay que mandarlos al bote
  orgánico, reciclable o peligroso antes de que se acabe su tiempo.

**Centro de entrenamiento.** Aparte de las misiones hay un catálogo de **46
minijuegos** sueltos, con dificultad propia (fácil / medio / difícil), récord por
juego y desbloqueo por XP. Se entra desde la portada o desde la pantalla final.

**Jefes finales.** Seis retos de simulación cierran el juego: Simulador de
emergencia y Comandante de emergencias por el lado de Tecnito, Salva el planeta,
Ecosistema y Ciudad sostenible por el de Greencito, y el gran desafío
**Tecnito vs Greencito**, que pide una ciudad segura y sostenible con un solo
presupuesto.

**El chat sigue vivo.** En cualquier momento se le puede preguntar lo que sea al
personaje, y contesta en su voz y al nivel del grado elegido.

**Recompensas.** Al final hay rango (Aprendiz → Vigilante → Guardián → Capitán →
Leyenda), medallas por misión y récord personal guardado en el navegador.

---

## Primaria y secundaria

El grado se elige al principio y cambia el juego de verdad, no solo el texto:

| | Primaria | Secundaria |
|---|---|---|
| Tiempo por pregunta | 22 s | 14 s |
| Opciones | 3 | 4 (un distractor más) |
| Preguntas de bonificación | no | sí, valen doble |
| Tiempo por residuo | 5 s | 3.5 s |
| Memorama | parejas iguales, 100 s | situación ↔ respuesta, 75 s |
| Voz del personaje | frases cortas, comparaciones escolares, emojis | sin infantilizar, cifras concretas, humor seco |

En el memorama la diferencia es la más marcada: primaria empareja cartas
idénticas, mientras que secundaria empareja una situación con su respuesta
correcta ("huele a gas" ↔ "no enciendas nada"), así que hay que razonar el par,
no solo recordar dónde estaba.

Las preguntas de bonificación son de nivel más alto: por qué alcanza a avisar la
alerta sísmica, qué son las réplicas, por qué el eucalipto reseca un río, dónde
se fuga más agua en una casa.

---

## Correrlo en tu computadora

```bash
npm install
cp .env.example .env.local     # pon tu ANTHROPIC_API_KEY dentro
npm run dev
```

Abre http://localhost:5173. El servidor de desarrollo monta `/api/chat` solo.

Sin API key el juego **funciona completo**: las misiones, los minijuegos, los
puntos y las explicaciones están escritos en el proyecto. Lo único que se pierde
son los comentarios improvisados del personaje. Sirve para demos sin internet.

---

## Subirlo a tu repositorio

```bash
git init
git add .
git commit -m "Escuadrón Tecnito y Greencito"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

`.env.local` está en `.gitignore`, así que tu llave no se sube.

---

## Desplegarlo en Vercel

1. Entra a [vercel.com/new](https://vercel.com/new) e importa el repositorio.
2. Vercel detecta Vite solo. Build `npm run build`, output `dist`.
3. Antes de dar Deploy, en **Environment Variables** agrega `ANTHROPIC_API_KEY`
   con tu llave de console.anthropic.com, marcada para Production, Preview y
   Development.
4. Deploy.

Desde la terminal:

```bash
npm i -g vercel
vercel env add ANTHROPIC_API_KEY
vercel --prod
```

Si cambias la variable después del primer despliegue, haz **Redeploy** para que
la tome.

---

## Diseño adaptativo

- **Teléfono vertical:** `100dvh` con el chat al centro y los controles fijos
  abajo, respeto por el notch con `safe-area-inset`, botones de 46 px mínimo y
  campo de texto de 16 px para que iOS no haga zoom.
- **Teléfono acostado:** la portada pasa a dos columnas, el tablero del
  simulacro se acomoda en cuatro y las respuestas se reparten en dos columnas.
- **Tablet:** fichas y botes más grandes, tarjetas en dos columnas.
- **Escritorio:** desde 900 px el juego se centra como una consola de 760 px con
  marco, en vez de estirarse.

`prefers-reduced-motion` apaga el temblor, el confeti y las animaciones. El
sonido se puede silenciar desde el altavoz del HUD y la preferencia se guarda.

---

## Sonido y efectos

No hay archivos de audio: todo se genera con Web Audio (`src/lib/sonido.js`).
El confeti es un canvas ligero que se crea y se destruye solo
(`src/lib/confeti.js`). El proyecto pesa lo mismo con o sin efectos.

---

## Cómo agregar contenido

Todo el material está en `src/data/personajes.js`.

Un reto:

```js
{
  id: "s5",
  tipo: "reto",
  titulo: "Título corto",
  lugar: "Dónde ocurre",
  escenario: "La situación que el personaje le plantea al jugador.",
  opciones: [
    { texto: "Respuesta buena", ok: true },
    { texto: "Respuesta mala", ok: false },
    { texto: "Otra mala", ok: false },
  ],
  opcionExtra: { texto: "Cuarta opción, solo secundaria", ok: false },
  explicacion: "Por qué la buena es la buena. Se muestra siempre.",
  dato: "Dato curioso.",
  retoSecundaria: {
    pregunta: "Nivel experto: ...",
    opciones: [ /* igual que arriba */ ],
    explicacion: "...",
  },
}
```

Agrégalo al arreglo del personaje y aparece solo en la barra de progreso.

Para más cartas del memorama, agrega entradas a `MEMORAMA[personaje].simples`
(primaria: icono, texto y dato) o a `MEMORAMA[personaje].conceptuales`
(secundaria: `a`, `b` y dato). El tablero toma seis pares al azar de la lista, así
que entre más escribas, más varía cada partida.

Para más residuos del minijuego, agrega entradas a `RESIDUOS` con su `bote`.
Para más trampas del simulacro, a `TRAMPAS_SIMULACRO`. En `GRADOS` se ajustan
segundos, vidas y el tono con que la IA le habla a cada edad.

---

## Estructura

```
api/chat.js                    función serverless: habla con Anthropic
public/                        imágenes: personajes y logos institucionales

src/App.jsx                    estado de la partida y ruteo de pantallas
src/components/Portada.jsx     elegir grado y personaje
src/components/Juego.jsx       HUD y ruteo de misión
src/components/Reto.jsx        pregunta con cronómetro + chat
src/components/minijuegos/     Memorama.jsx, Simulacro.jsx, Basura.jsx
src/components/Final.jsx       rango, récord y medallas
src/components/Creditos.jsx    logos UABC y FCITEC

src/pages/Centro.jsx           catálogo de minijuegos por categoría
src/juegos/registro.js         catálogo: qué juegos hay y con qué se juegan
src/juegos/PantallaMinijuego.jsx  instrucciones → juego → recompensa
src/juegos/ui/Marco.jsx        HUD, cronómetro, dificultad, resultado, feedback
src/juegos/motores/            Quiz, Busca, Clasifica, Ruta, Cultiva,
                               Simulacion, Construye, Coloca, Codigo, Sopa,
                               Puzzle, Ruleta, Atrapa, Clasicos

src/data/personajes.js         contenido de las misiones
src/data/juegos/               contenido de los minijuegos:
                                 preguntas.js, escenas.js, clasificacion.js,
                                 rutas.js, cultivo.js, construcciones.js,
                                 colocaciones.js, simulaciones.js, retos.js

src/hooks/useCronometro.js     cronómetro y timeouts que se limpian solos
src/lib/dificultad.js          fácil / medio / difícil
src/lib/recompensas.js         score, XP, escudos y semillas
src/lib/progreso.js            localStorage v2 con migración desde v1
src/lib/                       sonido.js, confeti.js
src/styles.css                 estilos del juego original
src/styles-minijuegos.css      estilos de los minijuegos, del centro y el
                               sistema de tableros que se ajustan a la pantalla
public/revisar.html            vista del juego en ocho tamaños a la vez

pruebas/                       pruebas con vitest + jsdom
```

---

## Colores

La paleta sale del escudo, no de una aproximación: los valores están tomados
pixel a pixel del archivo original.

| Variable | Color | Uso |
|---|---|---|
| `--uabc-verde` | `#007336` | Verde institucional. Greencito, aciertos, botones. |
| `--uabc-dorado` | `#C7940D` | Dorado institucional. **Solo adornos.** |
| `--uabc-oro` | `#8A6608` | Versión oscura del dorado. Tecnito, récords, texto. |
| `--uabc-azul` | `#171796` | Azul del emblema. Pestaña de desafíos. |
| `--tinta` | `#123B24` | Bordes gruesos y texto. Verde muy oscuro. |

**Por qué hay dos dorados.** El dorado institucional puro tiene 2.74 de
contraste contra blanco, muy por debajo del 4.5 que pide WCAG AA. No sirve ni
para texto ni para fondos con letra blanca. Por eso `--uabc-oro` es la versión
oscura de la misma familia, que da 5.27, y el dorado puro queda para adornos y
superficies grandes.

**Los dos personajes usan la misma pareja de colores, con los papeles
cambiados.** Tecnito lleva el dorado como acento y el verde como secundario;
Greencito al revés. Además de ser color de marca, el ámbar es el de la
señalética de protección civil, así que a Tecnito le queda.

```js
sismo:  { acento: "#8A6608", acento2: "#007336", fondo: "#FBF2DC" }
green:  { acento: "#007336", acento2: "#8A6608", fondo: "#E7F3E7" }
```

Sin personaje elegido (portada, centro de entrenamiento) manda el verde
institucional.

`pruebas/colores.test.jsx` calcula el contraste de cada combinación que de
verdad se usa en los tres temas y falla si alguna baja de 4.5. También falla si
vuelve a aparecer alguno de los azules o naranjas del diseño anterior.

---

## Logos institucionales

Los archivos viven en `public/`:

| Archivo | Qué es | Peso |
|---|---|---|
| `fcitec.webp` | Logotipo *UABC \| FCITEC* (trae el escudo integrado) | 18 KB |
| `bcia.webp` | Bienestar Comunitario e Infraestructura Ambiental, A. C. | 30 KB |
| `copits.webp` | Colegio de Profesionistas en Infraestructura y Tecnología Sostenible, A. C. | 26 KB |
| `uabc-escudo.webp` | Escudo de la UABC solo, con transparencia | 36 KB |

### Cómo se prepararon

Los tres logotipos llegaron **aplanados sobre fondo negro**, sin canal de
transparencia. Puestos tal cual sobre el degradado del juego se verían como
recuadros negros. El proceso fue:

1. Recortar el fondo a resolución completa con un umbral duro (todo píxel con
   canal máximo menor a 14 es fondo).
2. Componer sobre blanco **antes** de reducir la imagen. Esto importa: si se
   reduce primero y se recorta después, quedan halos negros en los bordes.
   Reduciendo al final, el propio reescalado genera el suavizado.
3. Recortar al contenido real y guardar en WebP.

El escudo de la UABC sí traía transparencia, pero venía a 2300×3138 y pesaba
755 KB. Reducido a la resolución que de verdad se usa quedó en 36 KB.

Como las tres marcas quedaron con fondo blanco, van dentro de una tarjeta
blanca. No es capricho: son logotipos de tinta oscura y así se ven como
corresponde, además de que es como se acomodan los logotipos institucionales en
cualquier publicación.

### Dónde aparecen

`src/components/Creditos.jsx` tiene tres variantes:

| Variante | Qué muestra | Dónde se usa |
|---|---|---|
| `completo` (por omisión) | Las tres marcas y la línea de crédito | Portada |
| `compacto` | Las tres marcas, más chicas y sin texto | Centro de entrenamiento |
| `sello` | Solo el escudo de la UABC | Pantalla final |

Las tres marcas comparten un mismo alto y se envuelven solas en pantallas
angostas. El escudo suelto **no** se pone junto al logotipo de FCITEC, porque
ese ya lo trae integrado a la izquierda y se vería duplicado.

Para agregar otra institución basta con meterla al arreglo `MARCAS` de
`Creditos.jsx` con su ruta, medidas y nombre completo para lectores de pantalla.

---

## Los minijuegos

Hay trece motores genéricos y 46 juegos. Un minijuego nuevo casi nunca necesita
código nuevo: necesita datos y una entrada en `src/juegos/registro.js`.

| Motor | Qué hace | Datos que lee |
|---|---|---|
| `Quiz` | situación + opciones + cronómetro | `data/juegos/preguntas.js` |
| `Busca` | encontrar N objetos en una escena | `data/juegos/escenas.js` |
| `Clasifica` | arrastrar o tocar hacia contenedores | `data/juegos/clasificacion.js` |
| `Ruta` | moverse por un mapa hasta la salida | `data/juegos/rutas.js` |
| `Cultiva` | decisiones con consecuencia visible | `data/juegos/cultivo.js` |
| `Simulacion` | indicadores, recursos y turnos | `data/juegos/simulaciones.js` |
| `Construye` | armar por etapas y probar al final | `data/juegos/construcciones.js` |
| `Coloca` | colocar equipos en una cuadrícula | `data/juegos/colocaciones.js` |
| `Codigo` | deducción tipo combinación secreta | `data/juegos/retos.js` |
| `Sopa` | sopa de letras generada al vuelo | `data/juegos/retos.js` |
| `Puzzle` | rompecabezas deslizante | `data/juegos/retos.js` |
| `Ruleta` | gira y pregunta del banco que salga | `data/juegos/retos.js` |
| `Atrapa` | quiz con las respuestas en movimiento | `data/juegos/preguntas.js` |

`Ruta` sirve para dos cosas según los datos: llegar a la salida (ruta de
evacuación) o visitar todo antes de volver (polinizadores, con
`recolectarTodo`). `Quiz` y `Atrapa` pueden mezclar varios bancos con `bancos`.

`Clasicos` no es un motor: es el adaptador que deja jugar Memorama, Simulacro y
Separa o pierde desde el centro sin haberlos modificado.

**Agregar un minijuego de preguntas** son dos pasos:

```js
// 1. src/data/juegos/preguntas.js
export const PREGUNTAS = {
  "mi-juego": [
    {
      id: "m1",
      icono: "🌎",
      situacion: "Lo que le pasa al jugador.",
      opciones: [{ texto: "La buena", ok: true }, { texto: "La mala", ok: false }],
      explicacion: "Por qué la buena es la buena.",
      dato: "El ¿sabías que...?",
    },
  ],
};

// 2. src/juegos/registro.js
{
  id: "mi-juego", nombre: "Mi juego", icono: "🌎",
  familia: "greencito", categoria: "Agua", personaje: "green",
  motor: Quiz, banco: "mi-juego", rondas: 8, segundos: 18, xp: 0,
  descripcion: "Lo que aparece en la tarjeta del centro.",
}
```

Aparece solo en el Centro, con su tarjeta, sus tres dificultades, su récord y
su recompensa.

### Dificultad

`src/lib/dificultad.js` no cambia las preguntas: cambia el tiempo, cuántos
objetos hay en pantalla, cuántas rondas, cuántas opciones y con cuántas vidas
arrancas. Fácil da 40% más tiempo y menos objetos; difícil da 28% menos tiempo,
más objetos y solo dos vidas, y a cambio paga 1.8× puntos.

### Recompensas

Todos los minijuegos devuelven el mismo objeto, calculado en un solo lugar
(`src/lib/recompensas.js`):

```js
{ score, xp, livesLost, accuracy, completed, reward: { shields, seeds } }
```

Ese mismo objeto trae también `puntos`, `vidasRestantes`, `exito` y `resumen`,
que es lo que ya esperaba el flujo de misiones. Por eso no hubo que tocar
`App.jsx` ni `Juego.jsx` para que los juegos viejos siguieran funcionando.

Tecnito paga escudos, Greencito paga semillas y los desafíos generales
reparten. La XP acumulada es lo que desbloquea juegos nuevos.

---

## Cómo se adapta a cada pantalla

El problema real de un juego de cuadrícula en un teléfono no es el ancho: es el
alto. El tablero compite con el HUD, el cronómetro y los controles, y si solo se
limita el ancho, en pantallas bajas los botones quedan fuera de la vista.

Por eso los tableros se calculan contra las **dos** medidas de su zona:

```
ancho = min( ancho de la zona, alto de la zona × proporción, tope de diseño )
```

Eso vive en `.tablero-zona` (un contenedor de consulta) y `.tablero-ajustable`
dentro de `src/styles-minijuegos.css`. El componente solo declara cuántas filas
y columnas tiene:

```jsx
<div className="tablero-zona">
  <div className="mapa tablero-ajustable" style={{ "--columnas": 11, "--filas": 12 }}>
```

De ahí sale todo lo demás: el tamaño de cada casilla, el de la letra dentro de
ella y el alto total. Las casillas ya no llevan proporción propia; la rejilla
reparte el espacio con `minmax(0, 1fr)`, así que **siempre** caben.

Si el navegador no soporta contenedores de consulta (anterior a 2023), se cae al
comportamiento clásico: ancho limitado y la pantalla se desplaza. Sigue siendo
usable, solo menos ajustado.

**Redes de seguridad.** Aunque el alto se acabe, el tablero nunca desaparece:
tiene un piso de `min(170px, 34dvh)` y en ese caso lo que se desplaza es el
cuerpo del juego, dejando el HUD y el cronómetro siempre a la vista.

**Puntos de quiebre:** móvil angosto (≤380 px), teléfono acostado (horizontal y
≤560 px de alto), tablet (≥620 px), pantalla alta (≥700×900) y escritorio
(≥900 px, donde el juego se enmarca en una tarjeta centrada). Las ilustraciones
de personajes se limitan contra `dvh` además de `vw`, que era lo que empujaba el
botón de empezar fuera del doblez en horizontal.

### Verlo con tus propios ojos

```bash
npm run dev
```

y abre **http://localhost:5173/revisar.html**

Esa página muestra el juego real corriendo dentro de ocho tamaños de pantalla a
la vez, del iPhone SE a una laptop, y se puede jugar dentro de cualquiera de
ellos. El campo de arriba abre la misma ruta en todos los marcos para comparar
una pantalla concreta.

---

## Pruebas

```bash
npm test
```

131 pruebas. Monta los 46 minijuegos del catálogo, juega hasta el final los seis
jefes de simulación, comprueba que los indicadores nunca se salen de 0 a 100,
que el presupuesto no se va a negativos, que todas las palabras listadas en la
sopa de letras están de verdad en el tablero, que el rompecabezas siempre
arranca revuelto y tiene solución, que la XP y los récords se guardan, que la
migración de progreso v1 a v2 no pierde nada y que no queda ningún `setInterval`
vivo al salir de un juego. Cualquier advertencia de React hace fallar la prueba.

Sobre el ajuste a pantalla, comprueba que cada tablero declara filas y columnas
coherentes con sus datos, que ninguna casilla se sale del marco, que la hoja de
estilos no volvió a fijar anchos rígidos, y reproduce en JavaScript la fórmula
de ajuste sobre siete tamaños de pantalla y cinco tableros para confirmar que
ninguno se sale ni queda tan chico que no se pueda tocar.

## Costos

Cada comentario del personaje consume tokens de tu cuenta de Anthropic, con
tope de 700 de salida. El juego es jugable sin la API, así que si abres el sitio
al público conviene poner un límite de gasto en la consola de Anthropic.

`api/chat.js` limita a 12 peticiones por minuto y por IP, recorta los mensajes
del jugador a 600 caracteres y descarta los vacíos. El límite vive en memoria de
la instancia: frena el abuso obvio, pero si el sitio va a recibir mucho tráfico
conviene moverlo a Redis (Upstash) para que sea un candado real.

Los minijuegos **no** usan la API: todo su contenido educativo está escrito en
`src/data/juegos/`, así que funcionan sin internet y sin costo.
