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
