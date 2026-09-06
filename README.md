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

Cada partida son **cuatro misiones seguidas** con el mismo personaje:
tres retos de preguntas y un minijuego de acción.

**Vidas.** Empiezas con tres corazones. Fallar o quedarte sin tiempo cuesta uno.
Al llegar a cero repites la misión con las vidas llenas: nadie pierde su avance.

**Cronómetro.** Cada pregunta corre contra reloj. Los segundos que sobran se
suman a tus puntos, así que responder rápido paga.

**Racha.** Dos aciertos seguidos multiplican por 2. Cuatro seguidos, por 3. Una
respuesta mala la rompe.

**Minijuegos.**
- *Simulacro relámpago* (Sismo Tecnito): la pantalla tiembla y tienes que tocar
  agáchate → cúbrete → agárrate en ese orden, esquivando botones trampa como
  "usar el elevador". Tres rondas, cada una más rápida.
- *Separa o pierde* (Greencito): caen diez residuos y hay que mandarlos al bote
  orgánico, reciclable o peligroso antes de que se acabe su tiempo.

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
| Voz del personaje | frases cortas, comparaciones escolares, emojis | sin infantilizar, cifras concretas, humor seco |

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

Para más residuos del minijuego, agrega entradas a `RESIDUOS` con su `bote`.
Para más trampas del simulacro, a `TRAMPAS_SIMULACRO`. En `GRADOS` se ajustan
segundos, vidas y el tono con que la IA le habla a cada edad.

---

## Estructura

```
api/chat.js                    función serverless: habla con Anthropic
public/                        imágenes de los personajes (WebP sin fondo)
src/App.jsx                    estado de la partida: vidas, racha, misiones
src/components/Portada.jsx     elegir grado y personaje
src/components/Juego.jsx       HUD y ruteo de misión
src/components/Reto.jsx        pregunta con cronómetro + chat
src/components/minijuegos/     Simulacro.jsx, Basura.jsx
src/components/Final.jsx       rango, récord y medallas
src/data/personajes.js         TODO el contenido editable
src/lib/                       sonido, confeti, progreso guardado
src/styles.css                 estilos responsivos
```

## Costos

Cada comentario del personaje consume tokens de tu cuenta de Anthropic, con
tope de 700 de salida. El juego es jugable sin la API, así que si abres el sitio
al público conviene poner un límite de gasto en la consola de Anthropic.
