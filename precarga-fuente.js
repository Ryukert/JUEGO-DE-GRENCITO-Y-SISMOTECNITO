/**
 * Plugin de Vite: avisa al navegador desde el <head> que va a necesitar la fuente Nunito.
 *
 * Sin esto, el navegador descubre la fuente hasta que ya bajó y leyó el CSS, y el texto de
 * la portada (lo más grande que se ve primero) se dibuja tarde. Con <link rel="preload"> la
 * pide en paralelo con el CSS. El nombre del archivo cambia en cada versión (lleva hash),
 * por eso se busca en lo que se acaba de compilar.
 *
 * Vive aparte de vite.config.js para que las pruebas lo importen sin cargar Vite.
 */
export function precargarFuente() {
  return {
    name: "precargar-fuente",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(_html, ctx) {
        const fuente = Object.keys(ctx?.bundle || {}).find((f) => f.endsWith(".woff2"));
        if (!fuente) return [];
        return [{
          tag: "link",
          attrs: { rel: "preload", href: "/" + fuente, as: "font", type: "font/woff2", crossorigin: "" },
          injectTo: "head-prepend",
        }];
      },
    },
  };
}
