---
name: commit
description: Crea un commit convencional (`tipo(scope): descripción`) a partir de los cambios preparados (staged). Úsala cuando el usuario invoque /commit o pida hacer un commit de lo que tiene en el stage.
argument-hint: "[pista opcional sobre tipo, scope o motivo]"
---

# /commit

Genera y ejecuta un commit con formato Conventional Commits usando **solo** los cambios ya preparados.

## 1. Revisar el stage

Ejecuta en paralelo:

- `git diff --cached --stat` y `git diff --cached` → qué se va a commitear.
- `git status --short` → para avisar si hay cambios sin preparar (no los añadas).
- `git log --oneline -10` → para seguir el estilo de los commits recientes.

Si no hay nada preparado, díselo al usuario y termina. **No ejecutes `git add`** salvo que el usuario lo pida.

## 2. Redactar el mensaje

Formato:

```
tipo(scope): descripción

[cuerpo opcional]

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

- **tipo**: uno de `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Elige el que mejor describa el cambio principal.
- **scope**: la zona afectada, en minúsculas (p. ej. `frontend`, `backend`, `auth`, `skills`, o el que ya usen los commits recientes). Omite `(scope)` si el cambio es transversal.
- **descripción**: en español, en presente, minúscula inicial, sin punto final, ≤ 72 caracteres en total para la primera línea. Explica el *qué/por qué*, no lista archivos.
- **cuerpo**: solo si aporta (motivo, decisiones, efectos). Líneas de ≤ 72 caracteres.
- Cambio incompatible: añade `!` tras el scope (`feat(api)!: …`) y un pie `BREAKING CHANGE: …`.
- Si los cambios preparados mezclan cosas sin relación, sugiere al usuario dividirlos en varios commits antes de seguir.
- Si `$ARGUMENTS` trae una pista (tipo, scope, motivo, ticket), respétala.

## 3. Hacer el commit

Ejecuta el commit pasando el mensaje con heredoc para conservar los saltos de línea:

```bash
git commit -F - <<'EOF'
tipo(scope): descripción

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

- No uses `--no-verify` ni `--amend` salvo petición expresa.
- Si un hook pre-commit falla, muestra el error, corrige si es trivial (y vuelve a preparar solo esos archivos) o pregunta al usuario; después crea un commit nuevo.
- No hagas `git push`.

## 4. Confirmar

Muestra el hash corto y la primera línea del commit (`git log --oneline -1`) y avisa si quedan cambios sin preparar.
