#!/bin/sh
# Sube a GitHub la rama actual para que Vercel la publique:
#   main          → sitio publicado (producción)
#   otras ramas   → vista previa con su propio enlace
# Lo llaman post-commit y post-merge. Se activa con:  git config core.hooksPath .githooks
# Para hacer un commit SIN subirlo:  SIN_SUBIR=1 git commit ...

[ -n "$SIN_SUBIR" ] && exit 0
rama=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
[ -z "$rama" ] || [ "$rama" = "HEAD" ] && exit 0                       # sin rama (detached)
for d in rebase-merge rebase-apply; do                                   # a media rebase, no
  [ -d "$(git rev-parse --git-path "$d")" ] && exit 0
done
git remote get-url origin >/dev/null 2>&1 || exit 0

if [ "$rama" = "main" ]; then
  echo "→ Subiendo main a GitHub: Vercel actualizará el sitio publicado en 1-2 minutos..."
else
  echo "→ Subiendo '$rama' a GitHub: Vercel hará una vista previa (el sitio publicado no cambia)..."
fi
if git push -u origin "$rama" >/dev/null 2>&1; then
  echo "  Listo: subido."
else
  echo "  No se pudo subir (¿sin internet?). Cuando haya conexión corre:  git push"
fi
exit 0
