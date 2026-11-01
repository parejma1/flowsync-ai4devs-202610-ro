# Cuentas y acceso

## Purpose

Permitir que una persona cree su cuenta en FlowSync, inicie y cierre sesión, y consulte sus propios datos, de modo que el resto de la aplicación sepa en todo momento quién está usando el sistema y pueda negar el acceso a quien no se ha identificado.

## Requirements

### Requirement: Registro de una cuenta nueva

El sistema SHALL permitir crear una cuenta mediante `POST /api/v1/auth/signup` con un cuerpo JSON que contenga `fullName`, `email`, `password` y `passwordConfirmation`, y SHALL dejar a la persona con la sesión ya iniciada, sin necesidad de un login posterior.

#### Scenario: Registro correcto

- **WHEN** se envía `{"fullName": "Ada Lovelace", "email": "ada@example.com", "password": "secret123", "passwordConfirmation": "secret123"}` y no existe ninguna cuenta con ese email
- **THEN** la respuesta es `200` con el cuerpo `{"data": {"user": {...}, "token": "<token>"}}`, donde `user` contiene `id`, `fullName`, `email`, `initials`, `createdAt` y `updatedAt`, y `token` es una cadena opaca que empieza por `oat_` y sirve desde ese momento como credencial

#### Scenario: La respuesta nunca expone la contraseña

- **WHEN** se completa un registro correcto
- **THEN** el objeto `user` de la respuesta no contiene la contraseña ni ningún derivado de ella

#### Scenario: Nombre nulo

- **WHEN** se envía un registro válido con `"fullName": null`
- **THEN** la cuenta se crea y la respuesta devuelve `"fullName": null`

#### Scenario: Nombre como cadena vacía

- **WHEN** se envía un registro válido con `"fullName": ""`
- **THEN** la cuenta se crea y la respuesta devuelve `"fullName": null`

#### Scenario: Espacios alrededor del email

- **WHEN** se envía un registro válido con `"email": "  ada@example.com  "`
- **THEN** la cuenta se crea con el email `ada@example.com`, sin los espacios

### Requirement: Validación de los datos de registro

El sistema SHALL rechazar un registro cuyos datos no cumplan las reglas con una respuesta `422` y un cuerpo `{"errors": [...]}`, donde cada error lleva `message`, `rule`, `field` y, si aplica, `meta`, y SHALL informar de todos los errores detectados a la vez, no solo del primero. Las reglas son: `fullName` MUST estar presente en el cuerpo (puede valer `null`); `email` MUST ser una dirección válida de como mucho 254 caracteres y no estar ya registrada; `password` MUST tener entre 8 y 32 caracteres; `passwordConfirmation` MUST cumplir la misma longitud y ser idéntica a `password`.

#### Scenario: Falta la clave del nombre

- **WHEN** se envía un registro sin la clave `fullName`, aunque el resto de campos sean válidos
- **THEN** la respuesta es `422` con un error `{"rule": "required", "field": "fullName"}` y no se crea la cuenta

#### Scenario: Cuerpo vacío

- **WHEN** se envía `{}`
- **THEN** la respuesta es `422` con un error `required` para cada uno de `fullName`, `email`, `password` y `passwordConfirmation`

#### Scenario: Varios campos inválidos a la vez

- **WHEN** se envía `{"fullName": null, "email": "nope", "password": "short", "passwordConfirmation": "other"}`
- **THEN** la respuesta es `422` e incluye un error `email` sobre `email`, un error `minLength` con `"meta": {"min": 8}` sobre `password` y otro igual sobre `passwordConfirmation`

#### Scenario: Contraseña demasiado larga

- **WHEN** se envía un registro cuya contraseña y confirmación tienen 33 caracteres
- **THEN** la respuesta es `422` con un error `maxLength` y `"meta": {"max": 32}` sobre `password` y otro sobre `passwordConfirmation`

#### Scenario: La confirmación no coincide

- **WHEN** se envía un registro con `"password": "secret123"` y `"passwordConfirmation": "secret124"`
- **THEN** la respuesta es `422` con un error `{"rule": "sameAs", "field": "passwordConfirmation", "meta": {"otherField": "password"}}`

#### Scenario: Email ya registrado

- **WHEN** ya existe una cuenta con el email `Ada@Example.com` y se intenta registrar otra con exactamente `Ada@Example.com`
- **THEN** la respuesta es `422` con un error `{"rule": "database.unique", "field": "email"}` y no se crea la cuenta

#### Scenario: El mismo email con distintas mayúsculas cuenta como otro

- **WHEN** ya existe una cuenta con el email `Ada@Example.com` y se registra otra con `ada@example.com`
- **THEN** la segunda cuenta se crea igualmente, como una cuenta distinta e independiente de la primera

### Requirement: Iniciales del usuario

El sistema SHALL devolver junto a cada usuario un campo `initials`, en mayúsculas, calculado a partir de su nombre o, si no tiene nombre, de su email. El nombre se trocea por cada espacio simple, sin recortarlo antes, así que con espacios dobles o iniciales las iniciales pueden salir de menos de dos letras o vacías.

#### Scenario: Nombre con dos o más palabras

- **WHEN** el usuario se llama `ana maria lopez`
- **THEN** `initials` vale `AM` (primera letra de los dos primeros trozos separados por un espacio)

#### Scenario: Nombre de una sola palabra

- **WHEN** el usuario se llama `grace`
- **THEN** `initials` vale `GR` (dos primeras letras)

#### Scenario: Nombre con espacios irregulares

- **WHEN** el usuario se registra por la API con el nombre `Ada  Lovelace` (dos espacios)
- **THEN** `initials` vale `AD`, porque el segundo trozo está vacío y se usan las dos primeras letras del primero

#### Scenario: Usuario sin nombre

- **WHEN** el usuario no tiene nombre y su email es `p3@example.com`
- **THEN** `initials` vale `PE` (primera letra de lo que va antes de la `@` y primera letra de lo que va después)

### Requirement: Inicio de sesión

El sistema SHALL permitir iniciar sesión mediante `POST /api/v1/auth/login` con `email` y `password`, y SHALL emitir un token nuevo en cada inicio de sesión correcto.

#### Scenario: Credenciales correctas

- **WHEN** existe una cuenta con email `ada@example.com` y contraseña `secret123`, y se envía `{"email": "ada@example.com", "password": "secret123"}`
- **THEN** la respuesta es `200` con `{"data": {"user": {...}, "token": "<token>"}}`, con la misma forma que el registro

#### Scenario: Varias sesiones simultáneas

- **WHEN** la misma persona inicia sesión dos veces y obtiene dos tokens
- **THEN** ambos tokens son válidos a la vez de forma independiente

#### Scenario: El email distingue mayúsculas

- **WHEN** solo existe una cuenta con el email `Ada@Example.com` y se intenta iniciar sesión con `ada@example.com` y la contraseña correcta
- **THEN** el inicio de sesión se rechaza como credenciales incorrectas

### Requirement: Rechazo de credenciales incorrectas sin revelar si la cuenta existe

El sistema SHALL responder exactamente igual cuando el email no está registrado que cuando la contraseña es incorrecta: `400` con `{"errors": [{"message": "Invalid user credentials"}]}`, sin campo `field` ni `rule`.

#### Scenario: Contraseña incorrecta

- **WHEN** existe la cuenta `ada@example.com` y se envía con la contraseña `wrong`
- **THEN** la respuesta es `400` con `{"errors": [{"message": "Invalid user credentials"}]}` y no se emite ningún token

#### Scenario: Email no registrado

- **WHEN** se envía un email que no corresponde a ninguna cuenta
- **THEN** la respuesta es idéntica a la de contraseña incorrecta

### Requirement: Validación de los datos de inicio de sesión

El sistema SHALL rechazar con `422` y el mismo formato de errores que el registro un inicio de sesión en el que falte el email, el email no sea una dirección válida de como mucho 254 caracteres, o falte la contraseña. La contraseña de inicio de sesión no tiene requisito de longitud: cualquier valor no vacío pasa a la comprobación de credenciales.

#### Scenario: Cuerpo vacío

- **WHEN** se envía `{}` al inicio de sesión
- **THEN** la respuesta es `422` con un error `required` sobre `email` y otro sobre `password`

#### Scenario: Email mal formado y contraseña vacía

- **WHEN** se envía `{"email": "bad", "password": ""}`
- **THEN** la respuesta es `422` con un error `email` sobre `email` y un error `required` sobre `password`

### Requirement: Consulta del propio perfil

El sistema SHALL devolver los datos del usuario autenticado mediante `GET /api/v1/account/profile` cuando la petición lleva la cabecera `Authorization: Bearer <token>` con un token válido.

#### Scenario: Perfil con token válido

- **WHEN** se pide el perfil con un token válido
- **THEN** la respuesta es `200` con `{"data": {"id", "fullName", "email", "initials", "createdAt", "updatedAt"}}` del usuario dueño del token

### Requirement: Denegación de acceso sin credencial válida

El sistema SHALL responder `401` con `{"errors": [{"message": "Unauthorized access"}]}` a cualquier petición a las operaciones de cuenta protegidas (consultar perfil y cerrar sesión) que no traiga token, traiga uno inexistente o traiga uno ya revocado.

#### Scenario: Sin token

- **WHEN** se pide el perfil sin cabecera `Authorization`
- **THEN** la respuesta es `401` con `{"errors": [{"message": "Unauthorized access"}]}`

#### Scenario: Token inventado

- **WHEN** se pide el perfil con `Authorization: Bearer garbage`
- **THEN** la respuesta es `401` con el mismo cuerpo

#### Scenario: Cerrar sesión sin token

- **WHEN** se llama a `POST /api/v1/account/logout` sin token
- **THEN** la respuesta es `401` con el mismo cuerpo

### Requirement: Cierre de sesión

El sistema SHALL revocar, mediante `POST /api/v1/account/logout` autenticado, exactamente el token con el que se hace la petición, y SHALL dejar intactos los demás tokens del mismo usuario.

#### Scenario: Cierre correcto

- **WHEN** se llama a cerrar sesión con un token válido
- **THEN** la respuesta es `200` con `{"message": "Logged out successfully"}`, sin envoltorio `data`

#### Scenario: El token revocado deja de valer

- **WHEN** se ha cerrado sesión con un token y después se usa ese mismo token para pedir el perfil o para volver a cerrar sesión
- **THEN** la respuesta es `401`

#### Scenario: Las otras sesiones siguen abiertas

- **WHEN** un usuario tiene dos tokens y cierra sesión con uno de ellos
- **THEN** el otro token sigue permitiendo consultar el perfil

### Requirement: Los tokens no caducan por tiempo

El sistema SHALL mantener válido un token hasta que se revoque con un cierre de sesión; no hay caducidad por tiempo ni por inactividad.

#### Scenario: Token antiguo

- **WHEN** se usa un token emitido hace tiempo que nunca se ha revocado
- **THEN** el sistema lo sigue aceptando

### Requirement: Respuestas siempre en JSON

El sistema SHALL responder en JSON a las operaciones de cuentas y acceso, también los errores, independientemente de la cabecera `Accept` que envíe el cliente.

#### Scenario: Cliente que pide HTML

- **WHEN** se pide el perfil sin token y con `Accept: text/html`
- **THEN** la respuesta es igualmente `401` con cuerpo JSON `{"errors": [{"message": "Unauthorized access"}]}`

### Requirement: Acceso a las pantallas según el estado de sesión

La aplicación web SHALL mostrar las pantallas de inicio de sesión (`/login`) y registro (`/register`) solo a quien no tiene sesión, y la pantalla de perfil (`/profile`) solo a quien sí la tiene, redirigiendo en cada caso a la pantalla que corresponde.

#### Scenario: Visitante sin sesión entra a una pantalla protegida

- **WHEN** una persona sin sesión abre `/profile`
- **THEN** la aplicación la lleva a `/login`

#### Scenario: Usuario con sesión entra a login o registro

- **WHEN** una persona con sesión iniciada abre `/login` o `/register`
- **THEN** la aplicación la lleva a `/profile`

#### Scenario: Dirección desconocida

- **WHEN** se abre cualquier dirección que no sea `/login`, `/register` ni `/profile`
- **THEN** la aplicación redirige a `/profile`, y de ahí a `/login` si no hay sesión

#### Scenario: Comprobando la sesión guardada

- **WHEN** se abre la aplicación con una sesión guardada de una visita anterior y todavía no se ha confirmado con el servidor que sigue siendo válida
- **THEN** se muestra solo un indicador de carga a pantalla completa (anunciado como «Cargando…» a lectores de pantalla), sin redirigir todavía a ninguna parte

### Requirement: Pantalla de registro

La aplicación web SHALL ofrecer en `/register` un formulario titulado «Crea tu cuenta» con los campos «Nombre completo (opcional)», «Email», «Contraseña» (con la ayuda «Entre 8 y 32 caracteres.») y «Repite la contraseña», un botón «Crear cuenta» y un enlace «Inicia sesión» que lleva a `/login`; y SHALL dejar a la persona con la sesión iniciada en `/profile` cuando el registro tiene éxito.

#### Scenario: Registro correcto desde la pantalla

- **WHEN** una persona sin sesión rellena el formulario con datos válidos y pulsa «Crear cuenta»
- **THEN** queda con la sesión iniciada y ve su pantalla de perfil

#### Scenario: Envío en curso

- **WHEN** se ha pulsado «Crear cuenta» y el servidor aún no ha respondido
- **THEN** el botón muestra «Creando cuenta…» y está deshabilitado

#### Scenario: Nombre en blanco

- **WHEN** se deja el nombre vacío o solo con espacios y se crea la cuenta
- **THEN** la cuenta se crea sin nombre

#### Scenario: Espacios alrededor del nombre

- **WHEN** se escribe el nombre ` Ada Lovelace ` con espacios al principio y al final
- **THEN** la cuenta se crea con el nombre `Ada Lovelace`, sin esos espacios

#### Scenario: Campos vacíos

- **WHEN** se pulsa el botón de enviar de login o registro con campos obligatorios vacíos
- **THEN** el navegador no bloquea el envío; los datos llegan al servidor y su respuesta se muestra, por ejemplo «Falta rellenar el email.» bajo «Email»

#### Scenario: Contraseñas distintas detectadas antes de enviar

- **WHEN** «Contraseña» y «Repite la contraseña» no coinciden y se pulsa «Crear cuenta», aunque además haya otros campos inválidos
- **THEN** solo aparece «Las contraseñas no coinciden.» bajo «Repite la contraseña» y no se envía nada al servidor

### Requirement: Mensajes de error comprensibles en los formularios

La aplicación web SHALL mostrar en castellano los errores que devuelve el servidor, colocando cada error de validación bajo el campo al que se refiere y usando un aviso general en la parte superior del formulario para los errores que no corresponden a ningún campo visible. Si un campo tiene varios errores, solo se muestra el primero.

#### Scenario: Email ya registrado

- **WHEN** se intenta crear una cuenta con un email ya registrado
- **THEN** bajo «Email» aparece «Ese email ya está registrado. Inicia sesión en su lugar.» y no aparece aviso general

#### Scenario: Errores de formato y longitud

- **WHEN** el servidor rechaza un email mal formado y una contraseña corta
- **THEN** bajo «Email» aparece «Introduce una dirección de email válida.» y bajo «Contraseña» aparece «la contraseña debe tener al menos 8 caracteres.»; para el exceso de longitud el texto es del tipo «la contraseña no puede superar los 32 caracteres.» y para un campo ausente «Falta rellenar el email.»

#### Scenario: Error de un campo que no está en pantalla

- **WHEN** el servidor devuelve errores de validación y al menos uno de ellos es de un campo que el formulario no muestra
- **THEN** el aviso general de la parte superior muestra el mensaje del primer error de la lista (que puede no ser el del campo oculto), y los errores de campos visibles se siguen mostrando bajo su campo

#### Scenario: Regla sin traducción

- **WHEN** el servidor devuelve un error de validación con una regla para la que no hay frase preparada
- **THEN** se muestra «Revisa» seguido del campo, por ejemplo «Revisa el email.»; si el campo tampoco es conocido, «Revisa el campo.»

#### Scenario: Servidor inaccesible

- **WHEN** se envía un formulario y no se puede contactar con el servidor
- **THEN** el aviso general muestra «No se pudo conectar con el servidor. Comprueba que el backend está arrancado.» y el botón vuelve a estar disponible

#### Scenario: Fallo interno del servidor

- **WHEN** el servidor responde con un código distinto de 400, 401 y 422 (por ejemplo 404, 429 o 500), o con un 422 sin errores, o con un cuerpo que no es JSON
- **THEN** el aviso general muestra «Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento.»

#### Scenario: Cualquier 400 o 401

- **WHEN** el servidor responde a un formulario con un 400, sea cual sea su cuerpo, o con un 401
- **THEN** el aviso general muestra, respectivamente, «El email o la contraseña no son correctos.» o «Tu sesión ha caducado. Vuelve a iniciar sesión.»

### Requirement: Pantalla de inicio de sesión

La aplicación web SHALL ofrecer en `/login` un formulario titulado «Inicia sesión» con los campos «Email» y «Contraseña», un botón «Entrar» y un enlace «Crea una» que lleva a `/register`; y SHALL llevar a la persona a `/profile` con la sesión iniciada cuando las credenciales son correctas.

#### Scenario: Inicio de sesión correcto desde la pantalla

- **WHEN** una persona con cuenta introduce su email y contraseña y pulsa «Entrar»
- **THEN** queda con la sesión iniciada y ve su pantalla de perfil

#### Scenario: Envío en curso

- **WHEN** se ha pulsado «Entrar» y el servidor aún no ha respondido
- **THEN** el botón muestra «Entrando…» y está deshabilitado

#### Scenario: Credenciales incorrectas

- **WHEN** se introduce un email no registrado o una contraseña equivocada
- **THEN** el aviso general muestra «El email o la contraseña no son correctos.», sin señalar cuál de los dos falla

### Requirement: Pantalla de perfil

La aplicación web SHALL mostrar en `/profile` un círculo con las iniciales del usuario, su nombre (o «Sin nombre» si no tiene), su email, la fecha de alta como «Miembro desde» en formato largo en castellano (por ejemplo, «1 de noviembre de 2026»), calculada en la zona horaria del navegador, y un botón «Cerrar sesión».

#### Scenario: Usuario con nombre

- **WHEN** una persona llamada «Ada Lovelace» con email `ada@example.com` abre su perfil
- **THEN** ve «AL» en el círculo, «Ada Lovelace» como título, `ada@example.com` debajo y su fecha de alta junto a «Miembro desde»

#### Scenario: Usuario sin nombre

- **WHEN** una persona que se registró sin nombre abre su perfil
- **THEN** ve «Sin nombre» en lugar del nombre y las iniciales calculadas a partir de su email

### Requirement: Cierre de sesión desde la pantalla

La aplicación web SHALL cerrar la sesión en el navegador en cuanto se pulsa «Cerrar sesión», sin esperar a la respuesta del servidor y tanto si confirma la revocación del token como si falla, y SHALL llevar a la persona a `/login` al instante, sin mostrar ningún aviso de error.

#### Scenario: Cierre normal

- **WHEN** una persona con sesión pulsa «Cerrar sesión»
- **THEN** la persona pasa de inmediato a `/login` sin aviso y, en segundo plano, su token queda revocado en el servidor

#### Scenario: El servidor no responde al cerrar sesión

- **WHEN** se pulsa «Cerrar sesión» y el servidor no está disponible
- **THEN** la sesión se cierra igualmente en el navegador y la persona acaba en `/login` sin aviso

### Requirement: Persistencia de la sesión entre visitas

La aplicación web SHALL recordar la sesión en el navegador de modo que recargar la página o volver más tarde no obligue a iniciar sesión de nuevo, siempre que el servidor siga aceptando el token; y SHALL explicar en la pantalla de inicio de sesión por qué se ha perdido una sesión cuando no se puede restaurar.

#### Scenario: Recarga con sesión válida

- **WHEN** una persona con sesión iniciada recarga la página
- **THEN** tras el indicador de carga sigue viendo su perfil, sin pasar por el login

#### Scenario: El servidor ya no acepta el token

- **WHEN** se abre la aplicación con una sesión guardada cuyo token ha sido revocado
- **THEN** la sesión guardada se descarta y la pantalla de inicio de sesión muestra «Tu sesión ha caducado. Vuelve a iniciar sesión.»

#### Scenario: El servidor no está disponible al abrir la aplicación

- **WHEN** se abre la aplicación con una sesión guardada y no se puede contactar con el servidor
- **THEN** se muestra la pantalla de inicio de sesión con «No se pudo conectar con el servidor. Comprueba que el backend está arrancado.», pero la sesión guardada se conserva, de modo que al recargar con el servidor ya disponible la persona vuelve a su perfil sin iniciar sesión

#### Scenario: Error del servidor al restaurar la sesión

- **WHEN** se abre la aplicación con una sesión guardada y el servidor responde con un error que no es 401 (por ejemplo, un 500)
- **THEN** se muestra la pantalla de inicio de sesión con «Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento.» y la sesión guardada se conserva igual que cuando el servidor no responde

#### Scenario: Dónde se ve el aviso de sesión perdida

- **WHEN** hay un aviso de sesión perdida y la persona pasa de `/login` a `/register` y vuelve
- **THEN** el aviso no aparece en la pantalla de registro y vuelve a verse al regresar a `/login`

#### Scenario: El aviso de sesión perdida desaparece

- **WHEN** la pantalla de inicio de sesión muestra el motivo de una sesión perdida y la persona inicia sesión con éxito
- **THEN** el aviso deja de mostrarse; y si en lugar de eso el intento falla, el aviso pasa a mostrar el error de ese intento
