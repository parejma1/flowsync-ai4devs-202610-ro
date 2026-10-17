# Prompts

Aquí van **todos los prompts que lanzaste** para hacer el ejercicio, en el orden en que los
lanzaste, con el modelo y la herramienta de cada uno.

Esto no es papeleo. Lo que se revisa es **cómo pediste las cosas**, no solo lo que salió: un
resultado flojo con un prompt bueno y un resultado flojo con un prompt vago necesitan feedback
distinto, y sin este archivo no se distinguen.

## Cómo rellenarlo

- Un apartado `## Prompt N` por cada prompt.
- **Pega el prompt tal cual lo lanzaste**, dentro del bloque de código, aunque ocupe diez líneas
  y aunque tenga faltas. No lo reescribas para que quede bien: el que arreglaste mentalmente
  después no es el que lanzaste.
- Incluye también los que **no funcionaron**. Suelen ser los más útiles de leer.
- `Modelo` y `Herramienta` en todos. Si cambiaste de una a otra a mitad, se nota aquí.

Borra el ejemplo de abajo cuando escribas el primero.

---

## Prompt 1

**Modelo:** Opus 5.5 xMedium
**Herramienta:** Claude Code

```
/init
```

**Qué salió:** 
Creó el fichero CLAUDE.md

## Prompt 2

**Modelo:** Opus 5.5 xMedium
**Herramienta:** Claude Code

```
/mcp
```

**Qué salió:** 
Listó los MCP servers. entre ellos en Local MCPs el atlassian. Me autentiqué y se quedó listo


## Prompt 3

**Modelo:** Opus 5.5 xMedium
**Herramienta:** Claude Code

```
quiero una skill que se llame /priority-ticket que traiga el ticket que tenga yo assignado de prioridad más alta  que esté en "To Do" (por hacer), que resuma los criterios de aceptación y entra en plan mode proponiendo como implementarse. Si se aprueba el plan, lo mueve a "en curso"
```

**Qué salió:** 
Me creó la carpeta en la raiz del proyecto .claude/skills/priority-ticket con un fichero SKILL.md
reescribió la descripción 
me indicó que habia añadido un parámetro para poder indicar el código del proyecto
me pidió reiniciar la session de claude porque se habia creaco esa carpera de .claude nueva


## Prompt 4

**Modelo:** Opus 5.5 xMedium
**Herramienta:** Claude Code

```
quiero una skill que se llame /comit que haga un commit convencional (`tipo(scope): descripción`) a partir de los cambios preparados.
```

**Qué salió:** 
me creó el skill similar al anterior. Hice un error de sintaxis ya que le puse comit y me avisó de que me habia mantenido el nombre (solo con una "m"). ahora le diré que me renombre la carpeta.

## Prompt 5

**Modelo:** Opus 5.5 xMedium
**Herramienta:** Claude Code

```
me equivoqué con el nombre de la skill, queria decir /commit y no /comit. cámbialo.
```

**Qué salió:** 
me cambió la carpeta con el nombre correcto.
me recuerda que debo salir de la session para recargar las skills
en la descripción y pasos del /commit añadió muchas cosas por su cuenta que revisé y tenian sentido


## Prompt 6

**Modelo:** Opus 5.5 xMedium
**Herramienta:** Claude Code

```
me gustaria que crearas un subagente "adversarial-reviewer" que sea capaz de revisar un pull request para intentar romperlo, no debe aprobarlo ni editar nada.

```

**Qué salió:** 
creó un fichero .md con el nombre del agente en la carpeta .claude/agents
incluyó muchas instrucciones y lo que debia haceer, lo que no y como devolver el resultado.
me indica cómo usarlo: pídelo directamente, por ejemplo: "revisa el PR #3 con adversarial-reviewer".


## Prompt 7

**Modelo:** Opus 5.5 xMedium
**Herramienta:** Claude Code

```
Quiero que prepares un hook que formatee el codigo del frontend cada vez que el agente edite un archivo. El frontend no trae formateador así que quiero que instales Prettier en "frontend/" y lo ejecutes sobre "frontend/src/".
```

**Qué salió:** 
hizo muchas cosas... al final indicó que habia creado el hook y que lo habia probado y que funcionaba

añadió un script para ejecutar como npm run format (prettier --write src/) con los valores por defecto.

me dijo que habia cambiado estilos de comillas simples por dobles y puntos y comas y me preguntó si queria volver atrás como en la plantilla.

le dije que sí para dejarlo como antes con comillas simples


## Prompt 8

**Modelo:** Opus 5.5 xMedium
**Herramienta:** Claude Code

```
Prefiero usar las comillas simples y sin punto y coma como venia en la plantilla. ajusta la configuración del pretty y ejecuta el formateo.
```

**Qué salió:** 
me hizo caso y configuró un par de settings en un .json de prettierrc y aplicó el formateo dejando las comillas simples.


## Prompt 9

**Modelo:** Opus 5.5 xMedium
**Herramienta:** Claude Code

```
Te indico unas reglas de proceso, al final del CLAUDE.md crea una rama nueva antes de tocar código. al cerrar usa /commit y haz el pull request con `gh pr create`. después, que el subagente revisor  se ejecute contra ese pull request. En la ventana de chat muestrame solo la URL del pull request.
```

**Qué salió:** 
modificó el CLAUDE.md para añadir las reglas del proceso indicadas.
me avisó de que el resultado del subagente de revisión no se mostraria por ningún sitio al haberle indicado que solo postrara la URL del PR. Me sugirió opciones que le voy a indicar en otro prompt

## Prompt 10

**Modelo:** Opus 5.5 xMedium
**Herramienta:** Claude Code

```
Si que me gustaría ver el resultado del revisor. la opción de añadirlos como comentarios al pull request me pacece bien. Ajusta las reglas del proceso.
```

**Qué salió:** 
me indica que ha cambiado las reglas del proceso para añadir un paso de añadir el informe del revisor como comentario al PR.


## Prompt 11

**Modelo:** Opus 5.5 xMedium
**Herramienta:** Claude Code

```
crea un enlace (ln -s) de CLAUDE.md hacia AGENTS.md para que otras herramientas puedas usar las instrucciones
```

**Qué salió:** 
creó el symlink correctamente.


## Prompt 12

**Modelo:** Opus 5.5 xMedium
**Herramienta:** Claude Code

```
/exit
```

**Qué salió:** 
salio al bash



## Prompt 13

**Modelo:** Opus 5.5 xMedium
**Herramienta:** Claude Code

```
/priority-ticket
```

**Qué salió:** 
el Plan con opciones para ejecutar
 