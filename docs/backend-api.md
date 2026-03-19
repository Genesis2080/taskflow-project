# Herramientas del ecosistema backend

## Axios

Librería JavaScript para hacer peticiones HTTP desde el navegador o Node.js.
Es una alternativa a `fetch` con ventajas prácticas: interceptores de
petición/respuesta, cancelación de peticiones, transformación automática de
JSON y manejo de errores más explícito (lanza error automáticamente si el
status es 4xx o 5xx, cosa que `fetch` nativo no hace).

**Por qué se usa:** en proyectos grandes, los interceptores permiten añadir
tokens de autenticación a todas las peticiones desde un único punto, o
redirigir al login si el servidor responde 401, sin repetir lógica en
cada llamada.

---

## Postman

Aplicación de escritorio para probar, documentar y automatizar APIs REST.
Permite construir peticiones HTTP con cualquier método, cabecera y body,
organizar colecciones de pruebas y compartirlas en equipo.

**Por qué se usa:** antes de integrar el frontend con el backend, permite
verificar que cada endpoint responde exactamente lo esperado. También
genera documentación de la API de forma automática a partir de las
colecciones guardadas.

---

## Sentry

Plataforma de monitorización de errores en tiempo real. Se integra en el
backend con una línea de código y captura automáticamente todas las
excepciones no controladas, incluyendo el stack trace completo, el contexto
del usuario y la frecuencia del error.

**Por qué se usa:** en producción, `console.error` no es suficiente porque
nadie está mirando los logs constantemente. Sentry envía alertas al equipo
en el momento en que ocurre un error, permitiendo detectar y corregir
problemas antes de que afecten a muchos usuarios.

---

## Swagger (OpenAPI)

Estándar para describir APIs REST mediante un fichero de especificación
(YAML o JSON). Herramientas como `swagger-ui-express` generan una
interfaz web interactiva a partir de esa especificación, donde cualquier
persona del equipo puede leer y probar los endpoints sin instalar nada.

**Por qué se usa:** es el estándar de la industria para documentar APIs.
Un equipo de frontend puede trabajar contra la especificación Swagger
antes de que el backend esté terminado, acordando el contrato de la API
desde el principio.