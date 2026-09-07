/**
 * Créditos institucionales.
 *
 * Dos cosas que conviene saber antes de tocar esto:
 *
 * 1. El logotipo de FCITEC ya viene como "lockup": trae el escudo de la
 *    UABC integrado a la izquierda con su línea divisoria. Por eso no se
 *    pone además el escudo suelto al lado, se vería duplicado.
 *
 * 2. Los tres archivos de logotipo llegaron aplanados sobre fondo negro,
 *    sin transparencia. Se recortó el fondo y se compusieron sobre blanco
 *    (ver el README), así que van dentro de una tarjeta blanca. Se ve
 *    deliberado y además le da contraste a marcas de tinta oscura sobre
 *    el degradado claro del juego.
 *
 * Variantes:
 *   "completo" → las tres instituciones y la línea de crédito. Portada.
 *   "compacto" → las tres marcas, más chicas y sin texto. Centro.
 *   "sello"    → solo el escudo de la UABC. Pantalla final.
 */

const MARCAS = [
  {
    id: "fcitec",
    src: "/fcitec.webp",
    ancho: 640,
    alto: 188,
    alt: "Universidad Autónoma de Baja California · Facultad de Ciencias de la Ingeniería y Tecnología",
  },
  {
    id: "bcia",
    src: "/bcia.webp",
    ancho: 400,
    alto: 378,
    alt: "Bienestar Comunitario e Infraestructura Ambiental, A. C.",
  },
  {
    id: "copits",
    src: "/copits.webp",
    ancho: 560,
    alto: 234,
    alt: "Colegio de Profesionistas en Infraestructura y Tecnología Sostenible, A. C.",
  },
];

export default function Creditos({ variante = "completo" }) {
  if (variante === "sello") {
    return (
      <footer className="creditos creditos--sello">
        <img
          className="creditos__escudo"
          src="/uabc-escudo.webp"
          alt="Universidad Autónoma de Baja California"
          width="322"
          height="440"
          loading="lazy"
          decoding="async"
        />
      </footer>
    );
  }

  return (
    <footer className={`creditos creditos--${variante}`}>
      <div className="creditos__marcas">
        {MARCAS.map((m) => (
          <img
            key={m.id}
            className={`creditos__marca creditos__marca--${m.id}`}
            src={m.src}
            alt={m.alt}
            width={m.ancho}
            height={m.alto}
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>

      {variante === "completo" && (
        <p className="creditos__texto">
          Desarrollado en la Facultad de Ciencias de la Ingeniería y Tecnología
          de la UABC, en colaboración con BCIA, A. C. y COPITS, A. C.
        </p>
      )}
    </footer>
  );
}
