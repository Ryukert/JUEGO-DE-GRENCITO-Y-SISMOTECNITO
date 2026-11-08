import { Component } from "react";
import { reportarError } from "../lib/errores.js";

/**
 * Si una pantalla se rompe, en vez de dejar la página en blanco se ve un aviso amable con un
 * botón para volver a empezar, y el error se manda a /api/error. El progreso no se pierde:
 * vive en el navegador (y en el grupo, si el alumno entró con su cuenta).
 */
export default class Tropiezo extends Component {
  constructor(props) {
    super(props);
    this.state = { roto: false };
  }

  static getDerivedStateFromError() {
    return { roto: true };
  }

  componentDidCatch(error, info) {
    const pila = `${error?.stack || ""}\n${info?.componentStack || ""}`.trim();
    reportarError({ message: error?.message || String(error), stack: pila });
  }

  render() {
    if (!this.state.roto) return this.props.children;
    return (
      <div className="pantalla final tropiezo" role="alert">
        <h1>¡Ups! Algo se atoró</h1>
        <p className="final__record">
          Tu progreso está guardado. Toca el botón para volver a empezar; si se repite, avísale a tu maestro.
        </p>
        <div className="opciones opciones--centro">
          <button className="boton-grande" onClick={() => window.location.assign("/")}>
            Volver a empezar
          </button>
        </div>
      </div>
    );
  }
}
