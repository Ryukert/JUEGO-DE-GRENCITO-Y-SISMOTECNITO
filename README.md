# Escuadrón Tecnito y Greencito

Juego-chatbot educativo para niñas y niños de 8 a 12 años. Dos personajes guían
misiones por turnos y responden preguntas libres usando Claude.

- **Sismo Tecnito** — protección civil ante sismos: qué hacer durante el temblor,
  mochila de emergencia y qué sigue después.
- **Greencito** — cuidado ambiental: separación de residuos, reforestación y uso
  responsable del agua.

Stack: React 18 + Vite. La conversación pasa por una función serverless en
`/api/chat` para que la API key nunca salga del servidor.

---

## Correrlo en tu computadora

```bash
npm install
cp .env.example .env.local     # pon tu ANTHROPIC_API_KEY dentro
npm run dev
```

Abre http://localhost:5173. El servidor de desarrollo monta `/api/chat` por su
cuenta, así que no necesitas nada más.

Si no configuras la llave, el juego **igual funciona**: cada personaje tiene
respuestas de repuesto escritas a mano y muestra un aviso discreto. Útil para
demos sin internet.

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
2. Vercel detecta Vite solo. Deja Build Command `npm run build` y Output `dist`.
3. Antes de dar Deploy, abre **Environment Variables** y agrega:

   | Nombre | Valor |
   |---|---|
   | `ANTHROPIC_API_KEY` | tu llave de console.anthropic.com |

   Márcala para Production, Preview y Development.
4. Deploy. Listo.

Desde la terminal es lo mismo:

```bash
npm i -g vercel
vercel env add ANTHROPIC_API_KEY
vercel --prod
```

Si cambias la variable después del primer despliegue, tienes que volver a
desplegar (**Redeploy**) para que la tome.

---

## Diseño adaptativo

Móvil primero, probado en tres escenarios:

- **Teléfono vertical:** el chat ocupa toda la altura con `100dvh`, las opciones y
  el campo de texto quedan fijos abajo, y hay respeto por el notch con
  `safe-area-inset`. El input usa 16px para que iOS no haga zoom al escribir.
- **Teléfono acostado:** la portada pasa a dos columnas y las tarjetas se vuelven
  horizontales para no perder altura.
- **Tablet y escritorio:** desde 900px el juego se centra como una consola de
  760px con marco y sombra, en lugar de estirarse a lo ancho.

Todos los botones tienen 46px de alto mínimo para el dedo, hay foco visible con
teclado, y `prefers-reduced-motion` apaga la animación del temblor.

---

## Cómo agregar contenido

Todo el material educativo está en `src/data/personajes.js`. Cada misión es un
objeto:

```js
{
  id: "s4",
  titulo: "Título corto",
  lugar: "Dónde ocurre",
  escenario: "La situación que el personaje le plantea al jugador.",
  opciones: [
    { texto: "Respuesta buena", ok: true },
    { texto: "Respuesta mala", ok: false },
    { texto: "Otra mala", ok: false },
  ],
  explicacion: "Por qué la buena es la buena (también es el texto de repuesto).",
  dato: "Dato curioso que aparece al final.",
}
```

Agrégala al arreglo del personaje y aparece sola en la barra de progreso. En ese
mismo archivo está `persona`, que define cómo habla cada personaje, y los colores
del tema.

---

## Estructura

```
api/chat.js              función serverless: habla con Anthropic
public/                  imágenes de los personajes (fondo removido, WebP)
src/App.jsx              estado del juego y turnos
src/components/          Portada, Juego, Final
src/data/personajes.js   misiones, personalidades y temas
src/styles.css           estilos responsivos
```

## Costos

Cada respuesta consume tokens de tu cuenta de Anthropic. El límite está en 700
tokens de salida y solo se mandan los últimos 10 mensajes, así que una partida
completa cuesta fracciones de centavo. Aun así, si lo abres al público, conviene
poner un límite de gasto en la consola de Anthropic.
