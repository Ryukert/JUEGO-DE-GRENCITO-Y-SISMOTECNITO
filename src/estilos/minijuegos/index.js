/**
 * Estilos de los minijuegos, del Centro y de la interfaz, partidos por tema (antes eran un solo
 * archivo de 2,500 líneas: styles-minijuegos.css).
 *
 * EL ORDEN IMPORTA: en CSS, cuando dos reglas pesan lo mismo gana la que viene después. Los
 * archivos llevan número para que el orden se vea, y se cargan aquí en ese mismo orden, justo
 * después de styles.css. Una sección nueva va en el archivo de su tema o en uno con el número
 * siguiente; las pruebas leen todos los .css de esta carpeta.
 */
import "./01-base.css";                  // pantalla de minijuego
import "./02-tableros.css";              // tableros que se ajustan al alto y al ancho
import "./03-marco-comun.css";           // HUD, intro, dificultad, resultado y retroalimentación
import "./04-motores-basicos.css";       // quiz, búsqueda, clasificación, ruta y cultivo
import "./05-centro.css";                // Centro de entrenamiento y su versión para móvil
import "./06-motores-avanzados.css";     // simulación, construcción, colocación, código, sopa…
import "./07-pantallas-originales.css";  // portada, final y centro se desplazan con la página
import "./08-creditos.css";              // logotipos UABC · FCITEC, BCIA y COPITS
import "./09-iconos-y-tema.css";         // iconos, tema oscuro, centro compacto y festejo
import "./10-interfaz.css";              // transiciones, ajustes, tutorial, logros, panel lateral
import "./11-grupos-y-encuestas.css";    // cuentas, panel del maestro, evaluación, encuestas, editores
import "./12-portada-y-avisos.css";      // tarjeta del nombre, aviso de inactividad y constancia
import "./13-juego-y-maestros.css";     // repaso, tarea del alumno y del maestro, avance por tema
