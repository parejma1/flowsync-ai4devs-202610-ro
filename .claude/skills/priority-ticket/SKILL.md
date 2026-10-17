---
name: priority-ticket
description: Trae de Jira el ticket asignado al usuario actual con la prioridad más alta que esté en "To Do" / "Por hacer", resume sus criterios de aceptación, entra en plan mode proponiendo cómo implementarlo y, si el plan se aprueba, mueve el ticket a "En curso". Úsala cuando el usuario invoque /priority-ticket o pida "coger el siguiente ticket prioritario".
argument-hint: "[clave de proyecto opcional, p. ej. FS]"
---

# /priority-ticket

Flujo para empezar a trabajar en el ticket más prioritario del usuario. Usa el MCP de Atlassian (`mcp__atlassian__*`); carga sus esquemas con ToolSearch si aún son diferidos.

## 1. Contexto de Atlassian

1. `getAccessibleAtlassianResources` → guarda el `cloudId` (si hay varios sitios, pregunta cuál usar).
2. `atlassianUserInfo` → guarda el `accountId` del usuario actual.

## 2. Buscar el ticket

Lanza `searchJiraIssuesUsingJql` con esta JQL (si se pasó una clave de proyecto en `$ARGUMENTS`, añade `AND project = <CLAVE>`):

```
assignee = currentUser() AND statusCategory = "To Do" ORDER BY priority DESC, updated ASC
```

- `statusCategory = "To Do"` cubre el estado tanto si se llama "To Do" como "Por hacer".
- Pide `maxResults` pequeño (p. ej. 5) y los campos `summary, status, priority, description, issuetype, labels, parent`.
- Si no hay resultados, díselo al usuario y termina.
- Si hay empate en la prioridad más alta, quédate con el primero y menciona los demás empatados en una línea.

Después recupera el ticket elegido completo con `getJiraIssue` (incluye descripción y, si existe, el campo personalizado de criterios de aceptación: usa `view: "evidence"` o `full` para ver los `customFields`).

## 3. Resumir el ticket

Muestra al usuario, en español y conciso:

- **Clave, título, tipo, prioridad, estado actual** y enlace al ticket.
- **Contexto**: 1–3 frases sobre qué se pide.
- **Criterios de aceptación**: lista numerada. Sácalos del campo de criterios de aceptación si existe; si no, de la descripción (secciones "Criterios de aceptación", "Acceptance criteria", Given/When/Then, checklists). Si el ticket no tiene criterios explícitos, dilo y deduce unos provisionales marcándolos como "(inferido)".
- **Huecos o ambigüedades** detectados (p. ej. cosas que el ticket no dice pero el backend exige; ver CLAUDE.md).

## 4. Plan mode

1. Llama a `EnterPlanMode`.
2. Explora el código relevante (en este repo se trabaja en `frontend/`; el `backend/` solo se lee para saber qué exige la API).
3. Redacta un plan de implementación que:
   - Mapee cada criterio de aceptación a los cambios que lo cumplen.
   - Liste archivos a crear/modificar, dependencias nuevas y decisiones técnicas con su justificación.
   - Incluya cómo se verificará (build, lint, prueba manual contra la API).
4. Presenta el plan con `ExitPlanMode`, indicando en el plan la clave del ticket.

## 5. Tras la respuesta al plan

- **Si el plan se aprueba**: transiciona el ticket a "En curso" / "In Progress".
  1. Obtén las transiciones disponibles del ticket (usa `discover` para localizar la operación de listar transiciones si no la tienes como herramienta primaria, y ejecútala con `executeRead`).
  2. Elige la transición cuyo estado destino sea "En curso" / "In Progress" (categoría `indeterminate`). Si no hay una clara o hay varias, pregunta al usuario.
  3. Ejecuta `transitionJiraIssue` con ese id y confirma el nuevo estado al usuario.
  4. Continúa con la implementación del plan aprobado.
- **Si el plan se rechaza**: no toques el ticket en Jira. Ajusta el plan según el feedback y vuelve a presentarlo, o termina si el usuario lo indica.

## Reglas

- No modifiques ningún campo del ticket salvo la transición de estado, y solo tras la aprobación del plan.
- No añadas comentarios en Jira salvo que el usuario lo pida.
