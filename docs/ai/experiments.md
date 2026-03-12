# AI Experiments

## Overview

En este documento se registrarán los distintos experimentos realizados utilizando herramientas de inteligencia artificial durante el desarrollo del proyecto.

Se incluirán pruebas, resultados obtenidos y observaciones sobre el comportamiento de los modelos.

# Experimento #1

Se han planteado tres pequeños problemas de programación y los he resuelto primero sin la ayuda de la IA, y después, con la ayuda de la IA.

Los problemas en cuestión son:

1. Contador de vocales

Escribe un programa que reciba una cadena de texto y cuente cuántas vocales contiene.

Requisitos:

Debe contar a, e, i, o, u.

Debe funcionar tanto con mayúsculas como minúsculas.

Ignora acentos para simplificar (trata solo aeiou).

---

2. Número mayor en una lista

Crea un programa que encuentre el número más grande en una lista de números sin usar funciones predefinidas como max().

Ejemplo:

Entrada:

[3, 7, 2, 9, 5]

Salida:

9

---

3. FizzBuzz modificado

Escribe un programa que imprima los números del 1 al 30, pero:

Si el número es divisible por 3, imprime "Fizz".

Si es divisible por 5, imprime "Buzz".

Si es divisible por 3 y 5, imprime "FizzBuzz".

En cualquier otro caso imprime el número.

Ejemplo parcial:

1
2
Fizz
4
Buzz
Fizz
...

---

A continuación se explica cuáles han sido los resultados.

## **Resolución sin usar IA**

Tiempo invertido:

Resolver los problemas sin ayuda de IA suele requerir más tiempo. Primero es necesario analizar el enunciado, pensar en la lógica del algoritmo y después implementarlo. Si surge algún error, el proceso de depuración puede alargarse porque tienes que encontrar el error por tu propia cuenta. 

Calidad del código

La calidad del código puede ser más variable. Si el programador tiene buenos hábitos de programación, el resultado puede ser claro y bien estructurado. Sin embargo, también es posible que el código contenga ineficiencias, repeticiones o errores pequeños que tardan en detectarse.

Comprensión del problema

La comprensión suele ser más profunda, porque el programador se ve obligado a analizar el problema paso a paso, diseñar la solución y entender cada parte del código. Este proceso favorece el aprendizaje y la capacidad de resolver problemas similares en el futuro.

## **Resolución con ayuda de IA**

Tiempo invertido

El tiempo necesario suele reducirse significativamente. La IA puede proponer una solución casi inmediata, sugerir estructuras de código o señalar errores. Para problemas simples como estos, el tiempo podría reducirse, ya que el usuario solo necesita adaptar o revisar el código generado.

Calidad del código

La calidad del código suele ser correcta y funcional desde el principio, con estructuras claras y soluciones estándar. Sin embargo, en algunos casos puede generar código innecesariamente complejo o poco adaptado al contexto específico, lo que requiere revisión por parte del programador.

Comprensión del problema

La comprensión puede ser más superficial si el usuario se limita a copiar la solución sin analizarla. No obstante, si se utiliza la IA como herramienta de apoyo (por ejemplo, para explicar cada paso o sugerir mejoras), también puede ayudar a acelerar el aprendizaje.

## Conclusión

Resolver problemas sin IA favorece una comprensión más profunda y el desarrollo de habilidades de resolución de problemas, aunque requiere más tiempo. Por otro lado, el uso de IA permite ahorrar tiempo y obtener soluciones rápidas, pero existe el riesgo de depender demasiado de ella y comprender menos el proceso. Por ello, la forma más efectiva de aprendizaje suele ser combinar ambos enfoques: intentar resolver el problema primero y utilizar la IA posteriormente para revisar, mejorar o entender mejor la solución.

---

# Experimento #2

En este caso, se realizan modificaciones en el propio proyecto, y se compara el proceso cuando interviene y cuando no interviene la IA.

---

## Tarea 1

Durante el desarrollo del proyecto se detectó que parte del código que pertenecía al archivo .css se había duplicado accidentalmente dentro del archivo .html.

Para solucionarlo, se revisaron ambos archivos y se eliminó del archivo .html todo el código que correspondía a la estructura CSS. De esta forma, se restableció la separación correcta entre estructura (HTML) y estilos (CSS), mejorando la organización del proyecto y evitando posibles conflictos.

---

## Comparación: sin usar IA vs usando IA
Sin usar IA

Tiempo invertido:
Sin ayuda de IA, detectar el problema probablemente habría llevado más tiempo. Habría sido necesario revisar manualmente ambos archivos para encontrar por qué la página no se comportaba como se esperaba. Este proceso podría implicar buscar en foros, consultar documentación o probar diferentes cambios hasta encontrar el error.

Calidad de la solución:
La solución final podría ser correcta, pero el proceso sería más lento y posiblemente se cometerían más pruebas y errores antes de identificar exactamente qué parte del código estaba mal ubicada.

Comprensión del problema:
La comprensión suele ser mayor, ya que el desarrollador analiza con detalle la estructura del proyecto y aprende a identificar errores relacionados con la separación entre HTML y CSS.

Usando IA

Tiempo invertido:
Con ayuda de IA, el problema se puede identificar mucho más rápido. Al mostrar el código o describir el error, la IA puede señalar que hay código HTML dentro de un archivo CSS, indicando que debe eliminarse o moverse al archivo correcto. Esto reduce considerablemente el tiempo de búsqueda del error.

Calidad de la solución:
La IA puede ofrecer una solución clara y directa, ayudando a reorganizar correctamente los archivos. Esto suele resultar en un código más limpio y bien estructurado desde el principio.

Comprensión del problema:
La comprensión dependerá del uso que se haga de la IA. Si solo se aplica la solución sin analizarla, el aprendizaje puede ser menor. Sin embargo, si se revisa la explicación y se entiende el motivo del error, la IA puede servir como herramienta de aprendizaje que acelera la resolución de problemas.