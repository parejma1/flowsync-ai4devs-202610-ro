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
el objetivo de hoy es que me ayudes a crear una spec (especificación) de una parte de lo que hace hoy la aplicación que ya está construida y que funciona. Necesito solo la especificación del módulo de cuentas y acceso y nada más. Explora y revisa el código tanto el backend como el frontend que ya funciona de extremo a extremo. la espec la dejarás en la carpeta docs/spec-viva/ y el nombre de fichero será jmp.md. Si no existe la carpeta la puedes crear. El formato que quiero que uses en la spec es el siguiente:
  Arriba, un ## Purpose de una o dos frases: para qué existe esta capability.
  Debajo, ## Requirements, y colgando de él ### Requirement: en los que el sistema SHALL hacer algo.
  Bajo cada requisito, al menos un #### Scenario: de cuatro almohadillas, con dos viñetas: - WHEN y - THEN. No hay casilla para el GIVEN: la precondición se mete dentro del WHEN.
  En castellano, salvo las mayúsculas de la RFC.
  Además te impongo estas 3 reglas a seguir: 1) Nada de ADDED, MODIFIED ni REMOVED. Eso es el vocabulario de un delta, y esto no es un delta: es la verdad actual del sistema. Si tu archivo tiene una de esas secciones, has escrito otra cosa.
  2) Solo comportamiento observable desde fuera. Ni un nombre de clase, ni un nombre de archivo, ni una ruta de código. En la API, observable es la petición y la respuesta. En la pantalla, observable es lo que una persona ve y puede hacer. 3) No toques el código. Ni siquiera para arreglar lo que encuentres.
```

**Qué salió:**
creo el fichero jmp.md en la ruta indicada dentro de docs.
hizo un commit
intentó lanzar un PR que falló y revisó la razón. me dijo que gh apuntaba al upstream y no a mi fork. abrió un fork y creó un PR.
También lanzó el adversarial reviewer y actualizó el fichero de spec jmp.md con varios errores que detectó. 

## Prompt 2

**Modelo:** Opus 5.5 xMedium
**Herramienta:** Claude Code

```
tomando la spec que acabas de construir dime cuantos requisitos han salido
```

**Qué salió:**
Me hizo un resumen y contó 18 requisitos con 62 escenarios en total. 11 requisitos de API y 7 de Web



## Prompt 3

**Modelo:** Opus 5.5 xMedium
**Herramienta:** Claude Code

```
identifica las posibles incoherencias que detectes entre el código y la especificación. Mira de clasificarlas en si es un Bug o una falta de contrato en la especificación.
```

**Qué salió:**
me indicó que cruzó los 18 requisitos con el código y con lo que vió al probar la API con curl. Hay varias incoherencias que son comportamientos que la spec recoge fielmente pero que no deberían ser así (Bugs). Otras son huecos donde la spec no dice nada o se queda corta (Faltas de contrato). 
Encontró además un error de la propia spec relacionado con el requisito de las Iniciales del usuario.



