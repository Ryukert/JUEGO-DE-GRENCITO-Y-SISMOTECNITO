/**
 * Revisión del código con ESLint (`npm run lint`). Corre también antes de publicar.
 *
 * - Reglas recomendadas de JavaScript y las de los hooks de React: que los hooks no se llamen
 *   dentro de un if (error) y que los efectos declaren lo que usan (aviso).
 * - api/ y las configuraciones corren en Node; src/ en el navegador; pruebas/ en los dos.
 */
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist/", "coverage/", "node_modules/"] },

  js.configs.recommended,

  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // las variables que empiezan con _ son a propósito sin usar; { id, ...resto } sirve
      // para quitar un campo antes de mandar un objeto, así que «id» no cuenta como sin usar
      "no-unused-vars": ["error", {
        argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none", ignoreRestSiblings: true,
      }],
      // try { localStorage… } catch {}: sin almacenamiento el juego sigue, a propósito
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },

  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: {
      // las dos reglas clásicas de los hooks; las demás de react-hooks 7 son para el React
      // Compiler, que este proyecto no usa
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  {
    files: ["api/**/*.js", "*.config.js", "version-sw.js"],
    languageOptions: { globals: globals.node },
  },

  {
    files: ["public/sw.js"],
    languageOptions: { globals: globals.serviceworker },
  },

  {
    files: ["pruebas/**/*.{js,jsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
];
