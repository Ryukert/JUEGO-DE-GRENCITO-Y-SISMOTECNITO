/* Antes de cada archivo de pruebas: los motores de minijuegos se cargan diferidos en el juego
   (src/juegos/diferido.jsx); aquí se descargan todos de una vez para que las pruebas los monten
   sin esperar. Lo diferido en sí se prueba aparte, en pruebas/velocidad.test.jsx. */
import { precargarMotores } from "../src/juegos/registro.js";

await precargarMotores();
