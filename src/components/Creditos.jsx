/**
 * Créditos institucionales.
 *
 * Ojo con una cosa: el logotipo de FCITEC ya viene en versión "lockup",
 * es decir que trae el escudo de la UABC integrado a la izquierda. Por eso
 * poner los dos archivos juntos duplica el escudo y se ve descuidado.
 *
 * Para no tener que elegir por ti, hay tres variantes:
 *
 *   "lockup"  → solo el archivo de FCITEC, que ya incluye el escudo UABC.
 *               Es el que se usa en la portada.
 *   "sello"   → solo el escudo de la UABC, chico. Se usa en la pantalla
 *               final y en el pie del centro de entrenamiento.
 *   "ambos"   → escudo y logotipo separados por una línea, como en la
 *               papelería oficial. Si tu facultad lo pide así, cambia la
 *               variante en Portada.jsx y ya.
 */

const UABC = "/uabc-escudo.webp";
const FCITEC = "/fcitec.webp";

export default function Creditos({ variante = "lockup", texto = true }) {
  return (
    <footer className={`creditos creditos--${variante}`}>
      <div className="creditos__marcas">
        {variante === "sello" && (
          <img
            className="creditos__escudo"
            src={UABC}
            alt="Universidad Autónoma de Baja California"
            width="322"
            height="440"
            loading="lazy"
            decoding="async"
          />
        )}

        {variante === "ambos" && (
          <>
            <img
              className="creditos__escudo"
              src={UABC}
              alt="Universidad Autónoma de Baja California"
              width="322"
              height="440"
              loading="lazy"
              decoding="async"
            />
            <span className="creditos__division" aria-hidden="true" />
          </>
        )}

        {(variante === "lockup" || variante === "ambos") && (
          <img
            className="creditos__lockup"
            src={FCITEC}
            alt={
              variante === "ambos"
                ? "Facultad de Ciencias de la Ingeniería y Tecnología"
                : "Universidad Autónoma de Baja California · Facultad de Ciencias de la Ingeniería y Tecnología"
            }
            width="600"
            height="224"
            loading="lazy"
            decoding="async"
          />
        )}
      </div>

      {texto && (
        <p className="creditos__texto">
          Proyecto desarrollado en la Facultad de Ciencias de la Ingeniería y
          Tecnología de la Universidad Autónoma de Baja California.
        </p>
      )}
    </footer>
  );
}
