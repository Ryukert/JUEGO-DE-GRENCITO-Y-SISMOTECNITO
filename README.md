# Escuadrón Tecnito y Greencito

Autor: **Marco Antonio Adame Rodriguez**

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

### Publicar con cada commit

Vercel publica solo cada vez que llega algo a GitHub. Para no tener que hacer
`git push` a mano, el repositorio trae un *hook* que sube la rama después de cada
commit (y de cada merge). Se activa una vez por computadora:

```bash
git config core.hooksPath .githooks
```

- Commit en **`main`** → Vercel actualiza el **sitio publicado** en 1-2 minutos.
- Commit en otra rama → Vercel hace una **vista previa** con su propio enlace; el
  sitio publicado no cambia hasta juntar la rama con `main`.
- Para un commit sin subir: `SIN_SUBIR=1 git commit ...`
- Sin internet no pasa nada: avisa y se sube después con `git push`.

**Nada se publica con pruebas rotas.** Vercel corre `npm test` antes de compilar
(`vercel.json`): si una prueba falla, el despliegue falla y el sitio se queda con la
versión anterior. Además, GitHub Actions (`.github/workflows/pruebas.yml`) corre las
pruebas y el build en cada push y pull request, y muestra ✅ o ❌ en GitHub.

---

## ¿Quién juega? (computadora del salón)

En la escuela el juego suele estar en una sola computadora y los niños no tienen
cuenta. Con el botón **¿Quién juega?** de la portada cada niño escribe su nombre
y elige a Tecnito o a Greencito; el juego le da un **ID de jugador** de 6 letras y
números (por ejemplo `K7P2QX`, sin 0/O ni 1/I para dictarlo sin confusión).

- Cada jugador guarda **sus propios** récords, XP y medallas en esa computadora.
- Al volver a abrir el juego pregunta quién juega (si ya hay nombres guardados);
  el siguiente niño toca su nombre o se agrega. También se puede jugar sin nombre.
- El nombre y el ID aparecen en la portada, en *Mis logros* y al terminar la partida.
- *Borrar jugadores* (abajo en la ventana) quita a quien ya no juega, con su progreso.
- **Si nadie toca la pantalla en 5 minutos**, el juego vuelve al inicio y pide el
  nombre otra vez (30 segundos antes avisa «¿Sigues jugando?»; tocar la pantalla lo
  quita). El progreso de cada niño se queda guardado. El tiempo se cambia en
  `MINUTOS_INACTIVIDAD` de `src/lib/inactividad.js`. No aplica a alumnos con cuenta de grupo.
- **Versiones nuevas sin recargar a mano:** cada 10 minutos el juego revisa si se
  publicó una versión nueva y, si la hay, se recarga solo en el siguiente reinicio
  por inactividad (cuando nadie está jugando).
- **Escuchar:** la tarjeta del nombre, las preguntas de las misiones y las encuestas
  tienen botón 🔊 para que el juego lo lea en voz alta; el aviso «¿Sigues jugando?»
  se lee solo si el sonido está encendido.
- **Constancia:** en *Mis logros* y al terminar la partida, *Descargar mi constancia*
  da un PDF horizontal con el nombre, el ID, el rango, las misiones, la XP y un
  espacio para la firma del maestro.
- Todo se queda en esa computadora: no se manda a ningún servidor.

---

## Ventana de editores (resultados de las encuestas)

En **`/editores`** (por ejemplo `https://tu-sitio.vercel.app/editores`) quienes
hacen el juego ven los resultados de las encuestas de satisfacción:

- Cifras: respuestas, promedio de «¿Te gustó?», % que dijo que la dificultad fue
  «Justo» y juegos evaluados.
- **¿Les gustó? por juego:** barras al 100 % del favorito al que menos.
- **¿Qué tan difícil fue? por juego** y **respuestas por día**.
- Filtros por periodo (7, 30, 90 días o todo), grado y tipo (minijuegos o misiones);
  pasando el mouse sobre una barra se ven los números, y abajo está la tabla completa.
- **Descargar PDF** con las mismas gráficas y la tabla, o **Excel (CSV)** con la tabla.

Se entra con la clave de la variable `EDITORES_CLAVE` (en Vercel). Solo se ven
números resumidos: nunca quién contestó. En las gráficas la escala va de rojo a
azul pasando por gris (😡 → 😄), porque el rojo→verde no se distingue con
daltonismo; cada color va con su emoji y su nombre.

---

## Grupos, maestros y evaluación (base de datos)

Opcional. Sin base de datos todo funciona como antes y el botón **Mi grupo** no
aparece. Con ella:

- **El maestro** crea un grupo desde *Mi grupo → Soy maestro → Crear un grupo*
  (nombre, grado y una clave suya). Recibe un **código de 6 letras** para dictarlo.
- **El alumno** entra con *código + apodo + PIN de 4 números* y elige a Tecnito o a
  Greencito como avatar. **No se pide nombre, correo ni ningún dato personal.**
- **Progreso en la nube:** récords, XP, medallas y minijuegos se guardan en el grupo.
  Varios alumnos pueden usar la misma computadora: cada uno tiene su copia aparte.
  Sin internet se guarda en el navegador y se sube al volver la conexión. Si dos
  equipos guardan cosas distintas, se combinan quedándose con lo mejor de cada uno.
- **Panel del maestro:** avance de cada alumno, % de aciertos, última vez que jugó,
  las preguntas que más se fallan, **PIN nuevo** para quien lo olvidó, quitar
  alumnos y descarga en CSV.
- **Evaluación al maestro:** el alumno contesta tres preguntas con cinco caritas
  de rojo a verde (😡 🙁 😐 🙂 😄): ¿explica claro?, ¿te gustó la clase?,
  ¿aprendiste algo nuevo? Una por día (si la repite, se actualiza). **Es anónima:**
  el maestro solo ve promedios y cuántos eligieron cada carita, y nada aparece
  hasta que haya al menos 3 evaluaciones. No hay texto libre.
- **Encuestas de satisfacción de los juegos:** al terminar un minijuego o una partida
  de misiones aparece una tarjeta con «¿Te gustó?» (😡 a 😄, de rojo a verde) y
  «¿Cómo estuvo de difícil?» (😴 muy fácil · 👌 justo · 😰 muy difícil). Al tocar las
  dos se manda sola; «Ahora no» la cierra. Sale **una vez al día por juego**, se puede
  contestar sin cuenta y, sin internet, espera y se manda después. El maestro ve en
  su panel qué juegos le gustan a su grupo y cuáles se les hacen difíciles; el
  resumen de todos los grupos está en Supabase en la vista `encuestas_por_juego`.

### Ponerla en marcha

1. Las tablas ya están en el proyecto de Supabase `JUEGO-DE-GRENCITO-Y-SISMOTECNITO`
   (las migraciones están en `supabase/migrations/`; para otro proyecto, córrelas en
   el SQL Editor en orden).
2. En Vercel (y en `.env.local` para probar en tu computadora) agrega:
   - `SUPABASE_URL` = `https://jnenecohdrvvegukjbxc.supabase.co`
   - `SUPABASE_SECRET_KEY` = la llave **secreta** `sb_secret_…` de
     *Project Settings → API Keys*. Va solo en el servidor; nunca con prefijo `VITE_`.
   - `JUEGO_SECRETO` = 32+ caracteres al azar
     (`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`).
3. Redeploy.

**Encuestas sin llave secreta.** Si todavía no está `SUPABASE_SECRET_KEY`, las
encuestas de los juegos funcionan igual con `SUPABASE_PUBLISHABLE_KEY` +
`JUEGO_SECRETO`: el servidor llama a la función `public.registrar_encuesta`, que
solo inserta encuestas y exige una «llave de la API» derivada de `JUEGO_SECRETO`
(en la base solo está su sha256, en el esquema `privado`). Si cambias
`JUEGO_SECRETO`, actualiza ese resumen:

```bash
node -e "const c=require('crypto');const k=c.createHmac('sha256',process.argv[1]).update('api-rpc').digest('hex');console.log(c.createHash('sha256').update(k).digest('hex'))" "TU_JUEGO_SECRETO"
# y en el SQL Editor:  update privado.llaves set hash = '<resultado>' where nombre = 'api';
```

Grupos, alumnos, evaluación y panel del maestro sí necesitan la llave secreta.

### Cómo se cuida

- El navegador **nunca** habla con la base de datos: todo pasa por `api/alumno.js`,
  `api/progreso.js`, `api/grupo.js`, `api/evaluacion.js` y `api/encuesta.js`. Las tablas tienen RLS
  activo **sin políticas**, así que con la llave pública no se lee ni escribe nada.
- PIN y clave del maestro se guardan resumidos (scrypt + sal + `JUEGO_SECRETO`).
- Después de entrar, cada quien recibe un **pase firmado**: el del alumno dura el
  ciclo escolar en ese equipo; el del maestro, 12 horas y se borra al cerrar el
  navegador. Un maestro solo puede ver y cambiar a los alumnos de **su** grupo.
- **Adivinar un PIN a lo bruto se frena:** 10 intentos por hora por cuenta y 20 intentos
  **fallidos** cada 10 minutos por IP. Los que entran bien no gastan ese tope: en la escuela
  todo el salón sale por la misma IP, así que 30 niños pueden entrar a la vez (el tope total
  por IP es de 200 cada 10 minutos). Se cambian con `ENTRAR_FALLOS_IP` y `ENTRAR_LIMITE_IP`.
- Si una respuesta fue correcta lo decide el servidor con el contenido del juego,
  igual que en el chat; el progreso que llega se limpia antes de guardarse.

---

## Seguridad del chat

La llave de Anthropic solo vive en el servidor (`api/chat.js`) y el chat está pensado
para que nadie pueda usarlo para otra cosa a costa de tu cuenta:

- **El navegador no manda instrucciones para la IA.** Solo dice qué se juega
  (personaje, grado, misión) y qué respondió o preguntó el jugador. Las
  instrucciones se arman en el servidor con `construirSistema` y el contenido de
  `src/data/personajes.js`. Un personaje, grado, misión o respuesta que no exista
  se rechaza sin llamar a la IA, y si la respuesta es correcta lo decide el servidor.
- **Cuidado de quien juega:** el personaje nunca pide datos personales, no repite
  los que alguien comparta, no cambia de papel aunque se lo pidan y, si alguien
  cuenta que está en peligro, le dice que avise a un adulto o llame al 911.
- **Topes de uso** (`api/_limites.js`): por persona, 12 mensajes por minuto y 150
  por día; del juego completo, 3,000 al día. Se cambian con `CHAT_LIMITE_MINUTO`,
  `CHAT_LIMITE_IP_DIA` y `CHAT_LIMITE_DIARIO`. Sin más configuración, cada copia del
  servidor cuenta en su memoria; con `UPSTASH_REDIS_REST_URL` y
  `UPSTASH_REDIS_REST_TOKEN` (Upstash o Vercel KV) la cuenta es una sola para todas.
  Al llegar al tope el juego sigue: solo el chat descansa.
- **Errores sin detalles:** si Anthropic falla (sin crédito, llave inválida…), el
  jugador ve «El personaje no puede contestar ahorita» y el detalle queda en el
  registro de Vercel (Logs).
- **Tope de gasto en Anthropic:** además, pon un límite mensual en
  console.anthropic.com → Settings → Limits. Es la última barrera si algo falla.

Las variables están explicadas en `.env.example`. `.env` y `.env.local` están en
`.gitignore`: la llave no se sube a GitHub.

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

**Fondo de la página:** la ilustración de Greencito y Sismo Tecnito (`public/fondo.webp`,
y `fondo-movil.webp` más ligera para teléfonos) va en una capa fija detrás de todo, con un
velo de los colores del personaje encima para que el texto se lea. Qué tanto tapa el velo
se ajusta con `--velo-fondo` en `styles.css` (0.7 en tema claro, 0.84 en oscuro).

`prefers-reduced-motion` apaga el temblor, el confeti y las animaciones. El
sonido se puede silenciar desde el altavoz del HUD y la preferencia se guarda.

---

## Identidad visual

- **Tipografía:** Nunito (redondeada, muy legible para primaria), dentro del
  proyecto en `src/fuentes/` con su licencia SIL OFL. No se pide nada a Google
  Fonts; el archivo pesa 39 KB y solo trae el alfabeto latino (cubre á, ñ, ¿, ¡).
- **Iconos propios:** `src/components/Icono.jsx` dibuja en SVG los controles y
  el marcador (volver, sonido, corazones, racha, escudo, semilla, estrella,
  trofeo, candado, tema…). Toman el color del texto, así que sirven en los dos
  temas.
- **Insignias de los minijuegos:** `src/components/IconoJuego.jsx` tiene un
  dibujo propio para cada uno de los 46 juegos, sobre el color de su categoría
  (los jefes finales llevan corona), y medallas para los rangos (Aprendiz a
  Leyenda). Al agregar un juego nuevo hay que dibujarle su insignia: la prueba
  `pruebas/iconos.test.jsx` falla si falta o si repite dibujo.
- **Emojis del contenido:** los objetos, residuos y escenas siguen con emoji, pero
  solo con los que existen desde antes de 2019, para que no salgan como cuadritos
  en teléfonos y computadoras viejas de las escuelas (la misma prueba lo revisa).
- **Contraste:** todas las parejas de texto y fondo pasan WCAG AA (4.5:1) en los
  dos temas. Por eso el verde y los naranjas de los botones son un poco más
  oscuros que los del dibujo. La prueba `pruebas/diseno.test.jsx` lo revisa.
- **Tema oscuro:** sigue al sistema hasta que se toca el botón de luna/sol (en
  la portada y el Centro); desde ahí se recuerda en este navegador. Cada
  personaje tiene `tema` y `temaOscuro` en `personajes.js`; lo demás son
  variables en `styles.css` (`--superficie`, `--contorno`, `--texto-suave`…).
  Los dibujos de los tableros y los logotipos conservan sus colores.
- **Festejo:** al terminar la partida los puntos cuentan desde cero, salen de una
  a tres estrellas según el rango, confeti en tres tandas y, con récord nuevo,
  un listón dorado. En las misiones, la racha salta cada vez que sube y la
  respuesta muestra el multiplicador.

---

## Interfaz

- **Botón «atrás»** del navegador o del teléfono: sube un nivel (minijuego →
  Centro → portada) en vez de salirse de la página. Con Ajustes abiertos, los cierra.
- **Chat:** el juego pregunta al servidor (`GET /api/chat`, no gasta) si el chat
  está encendido. Si no lo está, o no hay internet, esconde «Pregúntale algo» y lo explica.
- **Un solo reloj** (`src/components/Reloj.jsx`) en misiones y minijuegos.
- **Teclado:** 1-4 o A-D para responder, Enter para seguir (`src/lib/atajos.js`).
- **Ajustes** (engrane en la portada y el Centro): sonido, tema, letra grande,
  menos animaciones, vibración, volver a ver la explicación, instalar y borrar el progreso.
- **Tutorial** de 3 pasos antes de la primera partida; **«Seguir con…»** en la
  portada para quien regresa; **Mis logros** con medallas, insignias y los 46 juegos.
- **Escritorio ancho** (1200 px o más): panel «Tu partida» a un lado de la consola.
- **Sin internet:** se puede instalar como app (`public/manifest.webmanifest`) y,
  después de la primera visita, funciona sin conexión (`public/sw.js`). Solo el
  chat necesita internet. El service worker solo se registra en la versión publicada.
  Al compilar, `version-sw.js` le pone a `dist/sw.js` la huella de la versión: cada
  publicación abre su propia caché y borra la anterior, así no se acumulan archivos viejos.

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
api/chat.js                    función serverless: arma la consulta y habla con Anthropic
api/_limites.js                topes de uso del chat (por persona y diario)
public/                        imágenes: personajes y logos institucionales

src/App.jsx                    estado de la partida y ruteo de pantallas
src/components/Portada.jsx     elegir grado y personaje
src/components/Juego.jsx       HUD y ruteo de misión
src/components/Reto.jsx        pregunta con cronómetro + chat
src/components/minijuegos/     Memorama.jsx, Simulacro.jsx, Basura.jsx
src/components/Final.jsx       rango, estrellas, récord y festejo
src/components/Creditos.jsx    logos UABC y FCITEC
src/components/Icono.jsx       iconos SVG de la interfaz y corazones de vida
src/components/IconoJuego.jsx  insignias de los 46 juegos y medallas de rango
src/components/Reloj.jsx       el reloj de todo el juego
src/components/Ajustes.jsx     ventana de ajustes
src/components/Tutorial.jsx    explicación de 3 pasos
src/pages/Logros.jsx           Mis logros
src/lib/preferencias.js        letra grande, menos animaciones, vibración, tutorial, último personaje
src/lib/atajos.js              atajos de teclado
src/lib/chat.js                ¿está encendido el chat?
public/sw.js                   funciona sin internet
public/manifest.webmanifest    instalar como app (iconos icono-*.png)
src/components/BotonTema.jsx   botón de tema claro / oscuro

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
src/lib/tema.js                tema claro / oscuro (sistema o elección guardada)
src/lib/                       sonido.js, confeti.js
src/fuentes/                   Nunito (woff2) y su licencia OFL
src/styles.css                 estilos del juego original
src/styles-minijuegos.css      estilos de los minijuegos, del centro y el
                               sistema de tableros que se ajustan a la pantalla
public/revisar.html            vista del juego en ocho tamaños a la vez

pruebas/                       pruebas con vitest + jsdom
```

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
`recolectarTodo`). En la ruta de evacuación los peligros tapan el paso
(`peligrosBloquean`) y chocar también quita segundos, los tres niveles generan
un laberinto nuevo cada partida (`src/lib/laberinto.js`), hay réplicas que
tiran escombro sin cerrar nunca el último camino y en medio y difícil se va la
luz. El tiempo se calcula con el largo de la ruta segura más corta. `Quiz` y `Atrapa` pueden mezclar varios bancos con `bancos`.

**Todo sale al azar.** Para que la dificultad no se pueda aprender de memoria,
los juegos revuelven con `src/lib/azar.js` (Fisher-Yates: el viejo
`sort(() => Math.random() - 0.5)` no revolvía parejo). Se revuelven preguntas
y opciones (también en el modo historia, donde la buena siempre era la A), los
lugares de los objetos en `Busca`, el orden de los contenedores en `Clasifica`
(medio y difícil), el terreno de `Coloca` (en espejo) y las decisiones de las
simulaciones por fases.

`Construye` dibuja el edificio pieza por pieza (`src/juegos/ui/Edificio.jsx`)
y al final lo somete al sismo: aguanta, se agrieta o se cae según lo elegido.
En fácil (primaria) usa textos cortos (`preguntaCorta`, `corto`,
`explicacionCorta`, `resultadosCortos`), solo dos opciones grandes y lectura en
voz alta (`src/lib/voz.js`, con la voz del navegador).

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

290 pruebas. Monta los 46 minijuegos del catálogo, juega hasta el final los seis
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
