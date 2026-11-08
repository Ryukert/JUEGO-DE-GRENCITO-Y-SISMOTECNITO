import { useState, useEffect } from "react";

/**
 * Componente que se descarga hasta que hace falta.
 *
 * Los 13 motores de minijuegos y su contenido (preguntas, escenas, simulaciones…) son más de
 * la mitad del código del juego, y quien solo juega las misiones no los necesita. Con esto
 * cada motor viaja en su propio archivo y se pide la primera vez que alguien lo abre.
 *
 *   const Quiz = diferido(() => import("./motores/Quiz.jsx"));
 *   Quiz.precargar();   // empieza a descargarlo sin esperar (p. ej. en las instrucciones)
 *   <Quiz {...props} /> // si ya llegó, se dibuja al instante; si no, «Cargando…» y luego el juego
 *
 * No usa React.lazy a propósito: si el archivo ya llegó, el juego aparece en el mismo
 * render, sin pasar por «Cargando» (y las pruebas no tienen que esperar). Si la descarga
 * falla (sin internet y sin caché), ofrece reintentar en vez de dejar la pantalla en blanco.
 */
export function diferido(cargar, nombre = "default") {
  let Componente = null;
  let promesa = null;

  function precargar() {
    if (!promesa) {
      promesa = cargar().then(
        (modulo) => (Componente = modulo[nombre]),
        (error) => {
          promesa = null;   // para poder reintentar
          throw error;
        },
      );
    }
    return promesa;
  }

  function Diferido(props) {
    const [, setListo] = useState(Componente !== null);
    const [fallo, setFallo] = useState(false);
    const [intento, setIntento] = useState(0);

    useEffect(() => {
      if (Componente) return undefined;
      let vivo = true;
      precargar().then(
        () => vivo && setListo(true),
        () => vivo && setFallo(true),
      );
      return () => {
        vivo = false;
      };
    }, [intento]);

    if (Componente) return <Componente {...props} />;
    if (fallo) {
      return (
        <div className="cargando-juego" role="alert">
          <p>No se pudo abrir el juego. Revisa la conexión a internet.</p>
          <button
            className="boton-grande"
            onClick={() => {
              setFallo(false);
              setIntento((n) => n + 1);
            }}
          >
            Intentar de nuevo
          </button>
        </div>
      );
    }
    return (
      <p className="cargando-juego" role="status">
        Cargando el juego…
      </p>
    );
  }

  Diferido.precargar = precargar;
  Diferido.displayName = `Diferido(${nombre})`;
  return Diferido;
}
