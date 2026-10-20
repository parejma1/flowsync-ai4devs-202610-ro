# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este repo

FlowSync: proyecto de ejercicio del módulo 1 de AI4Devs (cohorte 202610-ro). Monorepo sin workspaces con dos apps independientes, cada una con su propio `package.json` y `node_modules`:

- `backend/`: API AdonisJS 7 (TypeScript, Lucid + SQLite, VineJS, auth por access tokens). **Ya existe y no se modifica en el ejercicio**: se lee para saber qué exige la API.
- `frontend/`: React 19 + Vite 8 + TypeScript. Aquí es donde se trabaja. Ahora mismo es la plantilla de Vite sin tocar (sin router, sin cliente HTTP, sin Tailwind/shadcn instalados todavía).

`README.md` es el enunciado del ejercicio y está generado: no se edita a mano. `prompts.md` es la plantilla donde se registran los prompts lanzados (parte del entregable, junto con `docs/harness/comparacion.md`).

Requiere Node.js 24+ (con versiones anteriores el backend falla con `Unknown file extension ".ts"`).

## Comandos

Backend (`cd backend`), sirve en `http://localhost:3333`:

```bash
npm install && cp .env.example .env && node ace generate:key   # setup inicial
node ace migration:run      # crea tmp/db.sqlite3 y regenera database/schema.ts
npm run dev                 # node ace serve --hmr
npm run lint                # eslint
npm run typecheck           # tsc --noEmit
npm run format              # prettier (@adonisjs/prettier-config)
npm test                    # node ace test (Japa; suites unit y functional)
node ace test functional    # una sola suite
node ace test --files tests/functional/foo.spec.ts   # un solo archivo
```

Aún no hay specs: los tests van en `tests/unit/**/*.spec.ts` y `tests/functional/**/*.spec.ts` (definido en `adonisrc.ts`). Los tests usan `.env.test`.

Frontend (`cd frontend`), sirve en `http://localhost:5173`:

```bash
npm run dev       # vite
npm run build     # tsc -b && vite build (es también la comprobación de tipos)
npm run lint      # oxlint (.oxlintrc.json)
npm test          # Vitest + Testing Library (jsdom), src/**/*.test.{ts,tsx}
npm run test:e2e  # Playwright (Chromium headless), e2e/*.spec.ts
```

- Los tests de Vitest simulan `fetch` con los helpers de `src/test/utils.tsx`.
- Playwright arranca solo backend (`node ace serve`, en modo dev porque el CORS solo acepta orígenes en desarrollo) y frontend, o reutiliza los que ya estén levantados. Usa la BD de desarrollo con emails únicos por test.
- La primera vez en un servidor nuevo: `npx playwright install chromium` y, con sudo, `npx playwright install-deps chromium`.

## Arquitectura del backend

- Rutas en `start/routes.ts`, todas bajo `/api/v1`:
  - `POST /auth/signup` → `NewAccountController.store`
  - `POST /auth/login` → `AccessTokensController.store`
  - `GET /account/profile` y `POST /account/logout` → protegidas con `middleware.auth()` (guard `api`).
- Los controladores se referencian vía `controllers` de `#generated/controllers` (`.adonisjs/server/`), generado por los hooks de `adonisrc.ts` (`indexEntities`, Tuyau `generateRegistry`). No editar `.adonisjs/` ni `database/schema.ts` a mano: se regeneran (`database/schema.ts` con `migration:run`; los modelos extienden `UserSchema` de ahí).
- Imports con alias de subpath (`#models/*`, `#validators/*`, `#transformers/*`, etc.) definidos en `package.json` → `imports`.
- Auth: guard por defecto `api` = access tokens opacos (prefijo `oat_`) guardados en BD; el cliente los envía como `Authorization: Bearer <token>`. Logout borra el token actual.
- Validación con VineJS en `app/validators/user.ts`. **Lo que el ticket de producto no dice y el backend sí exige**:
  - signup: `email` (único en `users`, máx. 254), `password` (8–32), **`passwordConfirmation`** (obligatorio, igual a `password`), `fullName` opcional/nullable.
  - login: `email` y `password`.
- Respuestas: `ctx.serialize()` (añadido en `providers/api_provider.ts`) envuelve todo en `{ data: ... }`. Signup y login devuelven `{ data: { user, token } }`; profile devuelve `{ data: user }`. La forma del usuario la fija `app/transformers/user_transformer.ts` (`id, fullName, email, createdAt, updatedAt, initials`).
- `force_json_response_middleware` fuerza `Accept: application/json`, así que los errores (validación 422, credenciales inválidas) salen siempre como JSON vía `app/exceptions/handler.ts`.
- CORS (`config/cors.ts`) acepta cualquier origen en desarrollo, con credentials.

## Reglas de proceso

1. **Antes de tocar código**, crea una rama nueva a partir de la rama actual (`git switch -c <tipo>/<descripcion-corta>`). Nunca trabajes directamente sobre `main`.
2. **Al cerrar la tarea**, haz el commit con la skill `/commit` y abre el pull request con `gh pr create` (sube antes la rama con `git push -u origin <rama>`).
3. **Después**, lanza el subagente `adversarial-reviewer` contra ese pull request.
4. **Publica su informe** tal cual como comentario en el pull request: guárdalo en un archivo temporal y usa `gh pr comment <url> --body-file <archivo>`. El subagente no publica nada; lo hace el agente principal.
5. **En el chat**, muestra únicamente la URL del pull request (sin resumen ni informe de la revisión: ese queda en el comentario).
