# Historial de versiones

Todos los cambios del juego, de la versión más nueva a la más vieja.

El número sigue el [Versionado Semántico](https://semver.org/lang/es/): **MAYOR.MENOR.PARCHE**.

- **MAYOR** sube cuando algo deja de funcionar como antes para quien juega o administra
  (por ejemplo, un cambio en la base de datos que obliga a migrar).
- **MENOR** sube con funciones nuevas que no rompen nada.
- **PARCHE** sube con correcciones y mantenimiento que no cambian lo que se ve.

Cada versión tiene su etiqueta en git (`v1.8.0`, `v1.7.3`…), y el juego muestra su número
en **Ajustes**. Cómo sacar una versión nueva: ver «Versiones» en el README.

## [Sin publicar]

## [2.9.0] - 2026-11-26

### Agregado
- **Evaluación abierta en `/opinion`**, como la pantalla de un restaurante: cualquier persona
  califica el juego, el trato y la explicación con caritas, sin correo, código ni PIN. Botón
  «¿Qué te pareció? ¡Califícanos!» a la vista arriba de la portada. Se puede dejar abierta en
  una tableta (se limpia sola para la siguiente persona) y funciona sin internet. Resultados en
  la administración, con filtro por quién contestó. Tabla `opiniones` y funciones
  `registrar_opinion` / `resumen_opiniones` (migración `20261126020000_opiniones.sql`).

### Corregido
- El rompecabezas a veces arrancaba ya armado: si al revolverlo quedaba resuelto, el
  movimiento extra nunca se hacía. Ahora siempre arranca revuelto.

## [2.8.1] - 2026-11-26

### Seguridad
- **Content-Security-Policy:** solo corren scripts del propio sitio y el script del tema (por su
  hash); nada se conecta a otros dominios. Una prueba revisa que el hash coincida con
  `index.html`. El script de `revisar.html` pasó a `revisar.js`.
- Supabase: nadie puede llamar a `rls_auto_enable` por la API (sigue activando RLS en tablas
  nuevas) e índice para `encuestas.alumno_id` (migración `20261126010000_ajustes_asesor.sql`).

### Cambiado
- Vercel instala con `npm ci` (lo mismo que se probó) y Node queda fijo en 24 (`engines`).
- Dependabot: pull requests semanales con las dependencias nuevas y mensuales con las acciones.

## [2.8.0] - 2026-11-26

### Agregado
- **Mi cuenta: cambiar mi contraseña** dentro de la administración, pidiendo la actual. Sirve
  también a quien no tiene correo institucional, que no puede usar «¿Olvidaste tu contraseña?».
- **Panel de cuentas para el superusuario:** ver todas las cuentas con su último acceso, agregar
  cuentas ya confirmadas (por ejemplo, de otra universidad), cambiar el rol, bloquear y
  desbloquear, y ponerle contraseña a alguien. Usa las funciones `public.admin_*` de la base
  (migración `20261126000000_cuentas_admin.sql`), que revisan con cada llamada que quien las pide
  siga siendo superusuario. Nadie se cambia el rol ni se bloquea a sí mismo.
- Rol **`admin`**: entra a la administración aunque su correo no sea institucional, sin poder
  administrar cuentas.

## [2.7.0] - 2026-11-15

### Agregado
- **Superusuario:** una cuenta con `app_metadata.rol = "superusuario"` entra a la
  administración aunque su correo no sea institucional. La marca vive en Supabase (no en el
  código: el repositorio es público). Cualquier otro correo no institucional recibe siempre el
  mismo mensaje, sin revelar si tiene cuenta. Crear cuentas y pedir enlaces de contraseña
  siguen siendo solo para correos institucionales.

## [2.6.0] - 2026-11-15

### Agregado
- **Cada quien crea su cuenta de administración** con su correo institucional (`@uabc.edu.mx`
  y sus subdominios; la lista está en `src/data/institucion.js`). Entra después de confirmar su
  correo con el enlace que manda Supabase, así nadie se registra con la dirección de otro.
- **«¿Olvidaste tu contraseña?»**: llega un enlace por correo que abre la administración para
  poner una contraseña nueva.
- Se puede bloquear a alguien sin borrar su cuenta (`app_metadata.rol = "bloqueado"`).

### Cambiado
- Ya no hace falta marcar a cada administrador: basta con el correo institucional confirmado.
  Otro dominio se rechaza sin preguntar a Supabase. Los correos de crear cuenta y de cambiar
  contraseña tienen tope (3 por correo y 6 por IP cada hora).

### Corregido
- La ventana de administración ponía su propio `<main>` dentro del `<main>` de la app
  (desde 2.2.0); axe-core lo encontró y ahora es un `<div>`. Los textos de ayuda de los campos
  ya no forman parte del nombre del campo (se leían dos veces).

## [2.5.0] - 2026-11-15

### Agregado
- **Entrar a la administración con correo y contraseña.** Las cuentas son de Supabase Auth
  (Authentication → Users) y solo entran las marcadas con `app_metadata.rol = "admin"`.
  El navegador no recibe los tokens de Supabase, solo el pase de 8 horas; arriba se ve con
  qué correo entraste. La clave `EDITORES_CLAVE` queda como respaldo («Entrar con la clave
  de administración»).

### Corregido
- El tope de intentos para entrar a la administración era uno solo para todos: 10 fallos de
  cualquiera bloqueaban a todos una hora. Ahora es por correo (y la clave tiene el suyo), además
  del de 20 fallos por IP.

## [2.4.0] - 2026-11-15

### Agregado
- Botón «Administración» (con candado) al pie de la portada: lleva a la administración de
  encuestas, que pide la clave.

## [2.3.0] - 2026-11-15

### Agregado
- **Administración de encuestas en vivo** (`/admin`, `/administradores` o `/editores`, con la
  clave `EDITORES_CLAVE`): las gráficas se actualizan solas cada 30 segundos, sin parpadear, y
  las barras se deslizan a su nuevo tamaño. Indicador «En vivo · actualizado hace 12 s» con
  botón de pausa. Cuando llegan respuestas aparece «+N» en el total, se iluminan los juegos que
  las recibieron y un lector de pantalla lo anuncia. Con la pestaña oculta no consulta; al
  volver, se actualiza en seguida.

## [2.2.3] - 2026-11-15

### Corregido
- La causa real del «NO_LCP» era la animación de entrada de cada pantalla: arrancaba en
  opacidad 0 y Chrome no cuenta como LCP lo que se pinta invisible; si el texto de la portada
  se pintaba en ese cuadro, el navegador ya no reportaba el LCP (pasaba en la mitad de las
  mediciones, en cualquier versión). Ahora arranca en 0.01: a la vista es igual y el LCP se
  mide siempre (Lighthouse en local: 4 de 4, rendimiento 94–95).

## [2.2.2] - 2026-11-15

### Corregido
- Se quita la precarga de la fuente de la 2.2.1: casi no ayudaba (0.1 s en el primer dibujo).
  Se pensó que causaba el «NO_LCP» de Lighthouse, pero la causa era otra (ver 2.2.3).
  Lo demás de la 2.2.1 se queda.

## [2.2.1] - 2026-11-15

### Cambiado
- **Carga más rápida en teléfonos** (Lighthouse en móvil: rendimiento 96, accesibilidad 100,
  buenas prácticas 100):
  - Logotipos al doble del tamaño en que se ven: de 106 KB a 26 KB entre los cuatro.
  - Fondo del teléfono de 98 KB a 54 KB (va detrás de un velo, se ve igual); personajes
    recomprimidos (−6 KB).
  - Las imágenes de los personajes declaran su tamaño, para que el navegador aparte el lugar.
  - La fuente Nunito se pide junto con el CSS (`<link rel="preload">`, `precarga-fuente.js`).
  - Mis logros, el panel del maestro y el repaso se descargan al abrirse (`src/paginas.js`):
    el script principal baja de 102 a 97 KB comprimido. El service worker también los guarda.

### Corregido
- Faltaba `robots.txt`: la ruta devolvía el HTML del juego y Lighthouse marcaba 43 errores de
  SEO. Ahora permite todo menos `/editores` y `/api/`.

## [2.2.0] - 2026-11-08

### Agregado
- **Más retos:** cada uno de los 6 retos de las misiones tiene 2 variantes con otra situación
  del mismo tema (12 retos nuevos, con su pregunta de bonificación). Cada partida elige al azar
  en cada reto. Las insignias siguen siendo las del reto original.
- **Repasar lo que fallé:** las preguntas de misión que se fallan quedan pendientes y en la
  portada aparece «Repasar lo que fallé». Acertar una la quita. Cada jugador de la computadora
  tiene su repaso, y el del alumno con cuenta viaja con su progreso a otros equipos.
- **Tarea del maestro:** en el panel elige hasta 5 minijuegos y una nota. El alumno la ve en
  su portada, cada minijuego se abre con un toque y se palomea al jugarlo; el maestro ve quién
  la terminó. Necesita la tabla `tareas` (`supabase/migrations/20261108000000_tareas.sql`);
  sin ella el panel sigue y solo avisa que las tareas no están activadas.
- **Avance por tema** en el panel: aciertos del grupo en cada reto de las misiones.
- **PDF del panel del maestro**, con alumnos, tarea, avance por tema y preguntas difíciles.
- **Errores en producción:** el navegador avisa a `/api/error`, que los escribe en el registro
  de Vercel (sin datos de quién juega, con tope por IP y diario). Si una pantalla se rompe,
  sale «¡Ups! Algo se atoró» con un botón para volver a empezar en vez de quedar en blanco.
- Encabezados de seguridad en todo el sitio (`nosniff`, `Referrer-Policy`,
  `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy`).

### Cambiado
- **Accesibilidad:** «Coloca» se recorre con las flechas (una sola casilla en el orden de
  Tab) y cada casilla dice su fila y columna; «Clasifica» anuncia cada residuo y acepta las
  teclas 1 a 6. Toda la app va dentro de `<main>` y las vidas se leen con texto oculto.
  axe-core revisa portada, misión, Centro, repaso, los juegos de arrastrar y el panel del
  maestro en las pruebas.

## [2.1.0] - 2026-11-08

### Cambiado
- La portada carga más rápido: el script principal pasa de 489 KB a 300 KB (de 156 a 93 KB
  comprimido, 40 % menos). Los 13 motores de minijuegos y su contenido se descargan hasta
  que alguien abre uno, empezando desde la pantalla de instrucciones, así que al tocar
  «¡Empezar!» normalmente ya llegaron (`src/juegos/diferido.jsx`).
- Las pruebas corren un 30 % más rápido (de 28 s a 19 s en promedio) con un entorno jsdom por
  proceso (`pool: "vmThreads"`), y cada publicación tarda menos.

### Agregado
- El service worker guarda todos los minijuegos al instalarse: funcionan sin internet aunque
  nunca se hayan abierto (antes solo los que ya se habían jugado). Las librerías de PDF se
  siguen guardando la primera vez que se usan.
- Si un minijuego no se puede descargar (sin internet y sin caché), avisa y ofrece
  «Intentar de nuevo» en vez de quedarse en blanco.

## [2.0.0] - 2026-11-08

### Eliminado
- El juego ya no usa Anthropic (Claude) ni ninguna inteligencia artificial. Se quitan el
  campo «Pregúntale algo», los comentarios improvisados del personaje, la función
  `/api/chat`, sus topes de uso y las variables `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`,
  `CHAT_LIMITE_MINUTO`, `CHAT_LIMITE_IP_DIA` y `CHAT_LIMITE_DIARIO` (ya se pueden borrar
  de Vercel). También las instrucciones para la IA de `personajes.js` (`persona`, `estilo`
  y `construirSistema`).

### Cambiado
- Para quien juega no cambia nada: la pregunta, la explicación escrita de cada respuesta,
  la bonificación y el botón **Escuchar** siguen igual. El juego no tiene costo por uso.
- La conversación de la misión usa la clase `.conversacion` (antes `.chat`).

## [1.8.0] - 2026-11-08

### Agregado
- Versionado del proyecto: este historial, etiquetas de git en cada versión publicada desde
  la 1.0.0 y el número de versión al pie de **Ajustes**.
- `npm version patch|minor|major` saca una versión nueva: sube el número, pasa lo anotado en
  «Sin publicar» a la versión con su fecha, hace el commit y la etiqueta, y lo sube a GitHub.
- Pruebas que revisan que `package.json`, este historial y Ajustes digan la misma versión.

## [1.7.3] - 2026-11-08

### Corregido
- El build de Vercel ya no repite 8 veces el aviso de la versión de Node: se quita
  `engines` de `package.json` y se usa Node 24, el de *Project Settings*. GitHub Actions
  también pasa a Node 24.
- Las pruebas ya no escriben «Not implemented: Window's scrollTo()».

## [1.7.2] - 2026-11-08

### Corregido
- El confeti se detiene sin error si la animación sigue viva cuando se cierra la página
  (hacía fallar las pruebas en GitHub Actions con Vitest 5).

### Cambiado
- GitHub Actions usa `actions/checkout` y `actions/setup-node` v5 (las v4 corrían en Node 20).

## [1.7.1] - 2026-11-08

### Seguridad
- Dependencias al día: jsPDF 2.5 → 4.2, Vite 5 → 8, Vitest 2 → 5, @vitejs/plugin-react 4 → 6,
  jsdom 25 → 29. `npm audit` pasa de 9 vulnerabilidades (3 críticas) a 0.

### Cambiado
- ESLint 10 (`npm run lint`) revisa el código antes de cada publicación, en Vercel y en
  GitHub Actions; no se publica con errores ni avisos.
- `usarAtajos` y `usarInactividad` se llaman `useAtajos` y `useInactividad` (React solo
  reconoce un hook si empieza con «use»).
- `api/chat.js` usa las funciones compartidas de `_comun.js` en vez de copias.
- `styles-minijuegos.css` (2,500 líneas) se parte en 12 archivos por tema en
  `src/estilos/minijuegos/`; el CSS compilado sale idéntico.

## [1.7.0] - 2026-11-08

### Agregado
- Fondo de la página con la ilustración de Greencito y Sismo Tecnito, con un velo de los
  colores del personaje para que el texto se lea (más ligero en teléfonos y guardado para
  jugar sin internet).
- Autor: Marco Antonio Adame Rodriguez (`package.json`, `<meta name="author">` y README).

## [1.6.1] - 2026-11-08

### Corregido
- Un salón entero detrás de la misma IP ya no se bloquea al entrar: solo los intentos
  fallidos cuentan contra el tope de 20 por IP (`ENTRAR_FALLOS_IP`, `ENTRAR_LIMITE_IP`).
- El service worker cambia con cada versión publicada y borra la caché vieja; antes los
  scripts viejos se quedaban guardados para siempre.
- `/editores` cuenta los días con la medianoche real de Tijuana, también en horario de verano.

### Agregado
- Vercel corre las pruebas antes de compilar y GitHub Actions en cada push: con una prueba
  rota no se publica.

## [1.6.0] - 2026-11-06

### Agregado
- El juego revisa cada 10 minutos si hay versión nueva y se recarga solo cuando nadie juega.
- Botón **Escuchar** en la tarjeta del nombre, las preguntas de las misiones y las encuestas.
- Constancia en PDF con nombre, ID, rango, misiones, XP y espacio para la firma del maestro.
- Ventana de editores: descarga en Excel (CSV).

## [1.5.0] - 2026-11-06

### Agregado
- Portada con una tarjeta grande para que los niños escriban su nombre.
- Reinicio por inactividad: tras 5 minutos sin tocar la pantalla vuelve al inicio y pide el
  nombre otra vez, con aviso «¿Sigues jugando?» 30 segundos antes.

## [1.4.0] - 2026-11-06

### Agregado
- **¿Quién juega?**: en la computadora del salón cada niño escribe su nombre y recibe un ID
  de 6 caracteres; récords, XP y medallas por jugador.
- Ventana de editores (`/editores`): gráficas de las encuestas, filtros y descarga en PDF.

### Corregido
- Build limpio en Vercel, sin avisos de npm.

## [1.3.0] - 2026-11-06

### Agregado
- Base de datos (Supabase): grupos con código, alumnos con apodo y PIN (sin datos
  personales), progreso en la nube que se combina sin perder nada.
- Panel del maestro: avance, aciertos, preguntas más falladas, PIN nuevo, quitar alumnos y CSV.
- Evaluación anónima al maestro con caritas de rojo a verde.
- Encuestas de satisfacción al terminar cada juego; funcionan aun sin la llave secreta de
  Supabase.

## [1.2.0] - 2026-10-16

### Agregado
- Personaje en escena durante la misión, con reloj grande verde, amarillo y rojo.
- Iconos propios, fuente Nunito dentro del proyecto, contraste WCAG AA y tema oscuro.
- Insignias propias para los 46 juegos y medallas de rango.
- Interfaz completa: botón atrás, ajustes, tutorial, Mis logros, atajos de teclado y app
  instalable que funciona sin internet.

### Seguridad
- Las instrucciones del chat se arman en el servidor y hay topes de uso y de gasto.

## [1.1.0] - 2026-10-02

### Cambiado
- La ruta de evacuación genera un laberinto nuevo cada partida, con peligros que tapan el
  paso, réplicas y apagones: mucho más difícil.
- Todo sale al azar (preguntas, opciones, lugares y terrenos) para que no se aprenda de memoria.
- El edificio de **Construye** se dibuja pieza por pieza y se somete al sismo.

## [1.0.0] - 2026-09-07

### Agregado
- Primera versión publicada: cinco misiones con Sismo Tecnito (protección civil) y
  Greencito (medio ambiente), primaria y secundaria, vidas, cronómetro y racha.
- Chat con los personajes.
- Centro de entrenamiento con 46 minijuegos en 13 motores, tres dificultades y jefes finales.

[2.9.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v2.8.1...v2.9.0
[2.8.1]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v2.8.0...v2.8.1
[2.8.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v2.7.0...v2.8.0
[2.7.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v2.6.0...v2.7.0
[2.6.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v2.2.3...v2.3.0
[2.2.3]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v2.2.2...v2.2.3
[2.2.2]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v2.2.1...v2.2.2
[2.2.1]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v1.8.0...v2.0.0
[1.8.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v1.7.3...v1.8.0
[1.7.3]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v1.7.2...v1.7.3
[1.7.2]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v1.7.1...v1.7.2
[1.7.1]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v1.7.0...v1.7.1
[1.7.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v1.6.1...v1.7.0
[1.6.1]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/releases/tag/v1.0.0
