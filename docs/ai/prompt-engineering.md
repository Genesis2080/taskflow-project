# Prompt Engineering

## Overview

En este documento se documentan diferentes **estrategias de prompt engineering** utilizadas al trabajar con herramientas de inteligencia artificial durante el desarrollo del proyecto.

El objetivo es identificar qué tipos de prompts producen **mejores resultados al generar código, refactorizar funciones, documentar proyectos o resolver errores**.

Cada prompt incluye:

- el **prompt utilizado**
- una explicación de **por qué funciona bien**

---

# 10 Prompts útiles

A continuación se muestran diez prompts que han resultado especialmente útiles durante el desarrollo del proyecto.

---

## 1. Definir un rol (Role Prompting)

### Prompt

```text
Actúa como un desarrollador senior especializado en HTML y JavaScript.

Refactoriza la siguiente función para mejorar:
- legibilidad
- mantenibilidad
- manejo de errores

[código]
```

### Por qué funciona bien

Definir un **rol experto** hace que el modelo priorice buenas prácticas de desarrollo como:

- Clean Code
- nombres de variables más claros
- separación de responsabilidades
- mejor manejo de errores

Esto suele producir **código de mayor calidad y más mantenible**.

---

## 2. Few-shot prompting (con ejemplos)

### Prompt

```text
Refactoriza el código siguiendo este estilo.

Ejemplo:

Antes:
function getData(){
fetch('/api').then(r=>r.json()).then(d=>console.log(d))
}

Después:
async function getData() {
  const response = await fetch('/api');
  const data = await response.json();
  console.log(data);
}

Ahora aplica el mismo estilo al siguiente código:

[código]
```

### Por qué funciona bien

El **few-shot prompting** proporciona ejemplos que permiten al modelo entender el patrón esperado.

Esto ayuda a que el modelo aprenda:

- el **formato**
- el **estilo de programación**
- la **estructura del código**

El resultado suele ser **más consistente y alineado con el estilo deseado**.

---

## 3. Razonamiento paso a paso

### Prompt

```text
Analiza el siguiente código paso a paso:

1. Explica qué hace la función
2. Identifica posibles problemas
3. Propón mejoras
4. Devuelve una versión refactorizada

[código]
```

### Por qué funciona bien

Solicitar **razonamiento paso a paso** ayuda a que el modelo:

- analice el problema con mayor profundidad
- reduzca errores
- genere soluciones más razonadas

Esto suele producir **refactorizaciones más correctas y justificadas**.

---

## 4. Uso de restricciones claras

### Prompt

```text
Genera una función en JavaScript que:

- use async/await
- tenga manejo de errores
- tenga comentarios JSDoc
- no use librerías externas
- tenga un máximo de 30 líneas

La función debe obtener datos de una API REST.
```

### Por qué funciona bien

Las **restricciones claras** reducen la ambigüedad del prompt.

Al especificar exactamente qué se espera, el modelo puede generar una solución **más precisa y alineada con los requisitos**.

---

## 5. Generación automática de documentación

### Prompt

```text
Actúa como un ingeniero de software experto en documentación.

Genera documentación en formato Markdown para el siguiente archivo.

Incluye:
- descripción general
- funciones principales
- parámetros
- ejemplos de uso

[código]
```

### Por qué funciona bien

Este prompt funciona bien porque:

- define un **rol especializado**
- especifica el **formato de salida**
- indica claramente **qué secciones deben incluirse**

Esto permite generar **documentación clara, estructurada y reutilizable**.

---

## 6. Generación de tests

### Prompt

```text
Actúa como un QA engineer experto en testing.

Escribe tests unitarios para este código utilizando Jest.

Requisitos:
- cubrir casos normales
- cubrir edge cases
- cubrir manejo de errores

[código]
```

### Por qué funciona bien

Este prompt especifica:

- un **rol especializado**
- una **herramienta concreta (Jest)**
- el nivel de **cobertura esperado**

Como resultado, el modelo suele generar **tests más completos y útiles**.

---

## 7. Explicación para aprendizaje

### Prompt

```text
Explica este código como si estuvieras enseñando a un desarrollador junior.

Incluye:
- explicación paso a paso
- qué problema resuelve
- posibles mejoras

[código]
```

### Por qué funciona bien

Este prompt ajusta el **nivel pedagógico de la explicación**.

El modelo adapta la respuesta para que sea:

- más clara
- más didáctica
- más fácil de entender

Esto resulta especialmente útil para **aprender nuevas tecnologías o conceptos**.

---

## 8. Optimización de rendimiento

### Prompt

```text
Actúa como un experto en optimización de rendimiento.

Analiza el siguiente código y:

1. Identifica posibles cuellos de botella
2. Propón optimizaciones
3. Devuelve una versión optimizada

[código]
```

### Por qué funciona bien

Al definir un rol enfocado en **performance**, el modelo centra su análisis en:

- eficiencia
- uso de recursos
- posibles mejoras de rendimiento

Esto permite identificar optimizaciones que podrían pasar desapercibidas.

---

## 9. Respuestas con formato estructurado

### Prompt

```text
Devuelve la respuesta en el siguiente formato:

Problemas encontrados:
- ...

Solución propuesta:
- ...

Código refactorizado:
```javascript
[código]
```
```

### Por qué funciona bien

Forzar un **formato estructurado** mejora la claridad de la respuesta.

Esto hace que el resultado sea:

- más fácil de leer
- más fácil de reutilizar
- más organizado

---

## 10. Prompt para debugging

### Prompt

```text
Actúa como un ingeniero experto en debugging.

Analiza el siguiente error:

Error:
[paste error]

Código relacionado:
[código]

Explica:
1. qué está causando el error
2. cómo solucionarlo
3. muestra el código corregido
```

### Por qué funciona bien

Este prompt combina tres elementos clave:

- **contexto**
- **mensaje de error**
- **código relacionado**

Al proporcionar toda esta información, el modelo puede **diagnosticar el problema con mayor precisión y proponer una solución adecuada**.