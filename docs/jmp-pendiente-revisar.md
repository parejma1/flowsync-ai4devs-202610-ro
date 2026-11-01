# Cuentas y acceso — incoherencias pendientes de revisar

Resultado de cruzar la spec viva `docs/spec-viva/jmp.md` (18 requisitos) con el código del backend y del frontend y con pruebas reales de la API hechas con curl (2026-11-01). La spec describe la verdad actual, así que aquí se separan:

- **Bug**: la spec lo recoge fielmente, pero el comportamiento no debería ser así.
- **Falta de contrato**: la spec no dice nada sobre el tema o se queda corta.

No se ha tocado código. Prioridad sugerida: **0**, los bugs **1, 2 y 3**, y las faltas de contrato **11, 12 y 14**.

## Error en la propia spec

| # | Dónde | Problema | Evidencia |
|---|---|---|---|
| 0 | Requisito «Iniciales del usuario» | Dice que el nombre se trocea «sin recortarlo antes» y que las iniciales pueden salir «vacías». Es falso: el backend recorta los espacios del principio y del final de **todos** los campos de texto antes de validar, así que una inicial vacía no se puede dar por la API (`" ada"` llega como `"ada"` y da `AD`). Sí puede salir una sola letra (`"A  B"`, `"a"`). | El parser del cuerpo de las peticiones tiene `trimWhitespaces: true` por defecto y no se desactiva en `backend/config/bodyparser.ts`. |

## Bugs

| # | Requisito afectado | Incoherencia | Gravedad | Evidencia |
|---|---|---|---|---|
| 1 | Validación del registro / Inicio de sesión | **El email distingue mayúsculas.** `Ada@Example.com` y `ada@example.com` son dos cuentas distintas, y entrar con otra combinación de mayúsculas falla como «credenciales incorrectas». Permite cuentas duplicadas y deja fuera a quien cambia una mayúscula. El aviso «Ese email ya está registrado» no salta en ese caso. | Alta | Probado con curl. La regla `unique` del validador y el índice único de SQLite comparan el texto tal cual. |
| 2 | Cierre de sesión desde la pantalla + Los tokens no caducan | La pantalla borra la sesión local **antes** de avisar al servidor e ignora si esa llamada falla. Como los tokens no caducan nunca, si el logout no llega al servidor el token sigue válido para siempre y el usuario ya no tiene forma de revocarlo. | Alta | `frontend/src/auth/auth-provider.tsx` (`logout`: `clearSession()` y después `api.logout(...).catch(() => undefined)`); los tokens se emiten sin caducidad (`expires_at` nulo). |
| 3 | Validación del registro | **La contraseña también se recorta sin avisar.** `"  secret12  "` se guarda como `"secret12"`. La longitud mínima de 8 se cuenta después de recortar: si alguien escribe 7 espacios y una letra, recibe «al menos 8 caracteres» aunque haya escrito 8. | Media | Mismo recorte global que en el punto 0. |
| 4 | Pantalla de registro | La comprobación local de «las contraseñas no coinciden» compara los valores **sin recortar**, pero el servidor sí recorta. `"secret123"` frente a `"secret123 "` se bloquea en la pantalla aunque el servidor lo aceptaría como iguales. | Baja | `frontend/src/pages/register-page.tsx` (`password !== passwordConfirmation`). |
| 5 | Persistencia de la sesión + Los tokens no caducan | Cualquier 401 se muestra como «Tu sesión ha **caducado**», pero la propia spec dice que los tokens no caducan. El mensaje miente sobre la causa (un token revocado o borrado). Son dos requisitos de la spec que se contradicen entre sí. | Media | `frontend/src/lib/api.ts` (`toApiError`, rama `status === 401`). |
| 6 | Cierre de sesión (API) | Es la **única** respuesta sin el envoltorio `{ data: ... }`: devuelve `{"message": ...}`, mientras que todo lo demás va dentro de `data`. Rompe la convención del proyecto de que toda respuesta pasa por el serializer. | Media | `backend/app/controllers/access_tokens_controller.ts` (`destroy` devuelve un objeto sin `serialize`). |
| 7 | Registro / Perfil | **`createdAt` y `updatedAt` cambian según quién responda.** El registro devuelve milisegundos (`18:45:34.428`) y el login o el perfil del mismo usuario devuelven `18:45:34.000`. | Baja | Probado con curl: la respuesta del alta sale del objeto en memoria y las demás de lo que se lee de SQLite. |
| 8 | Iniciales del usuario | Sin nombre, las iniciales salen de la primera letra del email y de la primera del **dominio**: `p3@example.com` da `PE`, y todo el que use `@gmail.com` acaba en `?G`. Además, si hay espacios dobles en medio del nombre, `Ada  Lovelace` da `A` en vez de `AL`. | Baja | `backend/app/models/user.ts` (getter `initials`, `split(' ')` y `split('@')`). |
| 9 | Mensajes de error | Los errores de longitud empiezan en minúscula: «la contraseña debe tener al menos 8 caracteres.». | Cosmético | `frontend/src/lib/api.ts` (`translate`, casos `minLength` y `maxLength`). |
| 10 | Mensajes de error (campo que no está en pantalla) | Si llegan a la vez un error de un campo visible y otro de un campo oculto, el aviso general enseña el primero de la lista (que se ve duplicado bajo su campo) y el del campo oculto se pierde. Hoy no se puede dar con el backend actual. | Latente | `frontend/src/auth/use-auth-form.ts` + `translate(errors[0])` en `frontend/src/lib/api.ts`. |

## Faltas de contrato en la spec

| # | Tema | Qué falta |
|---|---|---|
| 11 | Recorte de espacios | La spec solo menciona el recorte del email. No dice que se recortan **todos** los textos (nombre y contraseña incluidos), ni que una cadena vacía o solo con espacios equivale a `null`. |
| 12 | Longitud del nombre | El nombre no tiene **límite de longitud** ni en la API ni en la spec. Se puede registrar un nombre de megas. Hay que decidir el límite y fijarlo. |
| 13 | Contraseña en el login | En el login la contraseña no tiene longitud máxima, pero en el registro sí (32). La spec recoge la asimetría pero no la justifica. Habría que confirmar que es intencionada. |
| 14 | Fuerza bruta | No hay **límite de intentos** de login ni de registro, y la spec no dice nada al respecto. |
| 15 | Formato de los datos | No se fijan los tipos ni el formato de `id`, `createdAt` y `updatedAt` (ISO 8601 con zona, precisión). Por eso el bug 7 pasa desapercibido. |
| 16 | Errores fuera de lo previsto | No se define el cuerpo de una ruta inexistente, de un método equivocado o de un JSON mal formado. En desarrollo esas respuestas devuelven el **stack trace completo** con rutas internas del servidor. |
| 17 | Registro con sesión iniciada | La API permite registrarse aunque ya se tenga un token válido; solo la pantalla lo impide. La spec no dice cuál es el comportamiento esperado de la API. |
| 18 | Código de respuesta del registro | El alta devuelve `200` y no `201 Created`. Está documentado pero sin decidir; conviene fijarlo de forma explícita antes de que haya consumidores que dependan de ello. |
| 19 | Mapeo de errores en la pantalla | La pantalla trata **cualquier** 400 como «El email o la contraseña no son correctos.», también en el registro. La spec lo recoge, pero no define qué debería verse ante un 400 que no venga del login. |
