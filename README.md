# TaskFlow — Gestor de Tareas

> Aplicación web de productividad construida con **HTML, Tailwind CSS y JavaScript puro (ES6+)**. Sin frameworks, sin dependencias externas, sin compilación.

---

## ✨ Características

### Gestión de tareas
- **Añadir tareas** con nombre (hasta 120 caracteres), categoría y prioridad.
- **Completar o eliminar** cada tarea individualmente con sus botones de acción.
- **Edición inline** — doble clic sobre el texto de cualquier tarea para editarla directamente. `Enter` o clic fuera guarda los cambios; `Escape` los descarta.
- **Filtros** — visualiza todas las tareas, solo las pendientes o solo las completadas.
- **Categorías**: General, Trabajo, Estudio, Personal.
- **Prioridades**: Urgente 🔴, En progreso 🟡, Opcional 🟢.

### Fechas límite
- Campo de **fecha límite opcional** en el formulario de nueva tarea.
- **Badge de estado** en cada tarea que indica los días restantes, con cuatro niveles de urgencia:
  - 🟢 **OK** — 7 o más días
  - 🟡 **Advertencia** — 2 a 6 días
  - 🔴 **Crítico** — hoy o mañana
  - ⬛ **Vencida** — fecha superada (badge parpadeante)
- **Borde lateral de color** en el card de cada tarea como indicador visual rápido.

### Estadísticas de productividad
Panel desplegable accesible desde el botón **Estadísticas** con:
- **Tareas completadas hoy.**
- **Racha de días activos** consecutivos con al menos una tarea completada 🔥.
- **Mini gráfico de barras** de los últimos 7 días (el día actual se resalta).
- **Barra de progreso global** con el porcentaje de tareas completadas sobre el total.

### Sonido de completado
- **Acorde Do mayor arpegiado** (Do5 → Mi5 → Sol5 → Do6) al marcar una tarea como completada.
- **Descenso sutil de dos notas** al desmarcarla.
- Implementado con la **Web Audio API** sin ninguna dependencia de audio. El contexto se precalienta en el primer clic del usuario para cumplir la política de autoplay de los navegadores.

### Undo al eliminar
- Al pulsar ✖, la tarea desaparece pero **no se borra definitivamente**.
- Aparece un **toast** en la parte inferior de la pantalla con el botón **Deshacer** y una barra de progreso que indica cuánto tiempo queda.
- El usuario tiene **5 segundos** para deshacer. Si no actúa, el borrado se confirma.
- Si se elimina otra tarea mientras hay un undo pendiente, la anterior se confirma automáticamente y se abre un nuevo toast.
- La tarea restaurada vuelve a su **posición original** en la lista.

### Experiencia y diseño
- **Modo día/noche** — alterna el tema completo (fondo, card, inputs, botones, badges). La preferencia se guarda en `localStorage`.
- **Animaciones de entrada** en cada tarea al renderizarse.
- **Validación de formulario** con feedback visual en el campo de texto.
- **Contador de tareas pendientes** siempre visible en el pie del card.
- **Scroll personalizado** en la lista de tareas.
- **Diseño responsive** — se adapta a cualquier tamaño de pantalla.

---

## 🛠 Tecnologías

| Tecnología | Uso |
|---|---|
| HTML5 | Estructura semántica y accesibilidad (`role`, `aria-label`, `aria-live`) |
| JavaScript ES6+ | Lógica de la aplicación, Web Audio API, localStorage |
| Tailwind CSS (CDN) | Utilidades de layout y espaciado |
| CSS personalizado | Animaciones, dark mode, badges, toast, gráfico de barras |
| Google Fonts | Tipografías DM Sans y Syne |

---

## 📁 Estructura del proyecto

```
taskflow-project/
│
├── index.html          # Interfaz principal y estructura HTML
├── style.css           # Estilos personalizados, animaciones y dark mode
├── app.js              # Toda la lógica de la aplicación
├── tailwind.config.js  # Configuración de Tailwind CSS
└── README.md           # Este archivo
```

---

## ⚡ Instalación y uso

### 1. Clonar el repositorio

```bash
git clone https://github.com/Genesis2080/taskflow-project.git
cd taskflow-project
```

### 2. Abrir en el navegador

No se requiere servidor ni compilación. Abre directamente `index.html` en cualquier navegador moderno.

---

## 📖 Guía de uso

### Añadir una tarea
1. Escribe el nombre de la tarea en el input principal.
2. Selecciona una **categoría** y una **prioridad**.
3. Opcionalmente, establece una **fecha límite** con el selector de fecha.
4. Haz clic en **+ Añadir tarea** o pulsa `Enter`.

### Editar una tarea
- Haz **doble clic** sobre el texto de cualquier tarea para editarlo inline.
- `Enter` o clic fuera → **guarda** los cambios.
- `Escape` → **descarta** los cambios.

### Completar / desmarcar
- Haz clic en **✔** para marcar una tarea como completada (sonará un acorde).
- Haz clic de nuevo en **✔** para devolverla a pendiente.

### Eliminar con undo
- Haz clic en **✖** para iniciar el borrado.
- Aparece un toast con la opción **Deshacer** durante 5 segundos.
- Si no pulsas Deshacer, la tarea se elimina definitivamente.

### Filtrar tareas
Usa los botones de la barra de filtros:
- **Todas** — muestra todas las tareas.
- **Pendientes** — solo las no completadas.
- **Completadas** — solo las marcadas como hechas.

### Ver estadísticas
- Haz clic en el botón **📊 Estadísticas** para abrir el panel desplegable.
- El panel muestra las tareas de hoy, la racha activa, el historial de 7 días y el progreso global.

### Cambiar tema
- Haz clic en el botón **🌙 Noche** / **☀️ Día** en la esquina superior derecha.

---

## 💾 Persistencia (localStorage)

| Clave | Contenido |
|---|---|
| `taskflow_tasks` | Array completo de tareas con todos sus campos |
| `taskflow_darkMode` | Booleano con la preferencia de tema |
| `taskflow_completedDays` | Objeto `{ "YYYY-MM-DD": count }` para el historial de estadísticas |

---

## 🧪 Ejemplos de uso

Los siguientes escenarios ilustran cómo TaskFlow encaja en flujos de trabajo reales.

---

### Ejemplo 1 — Jornada de trabajo típica

Llegas por la mañana y quieres organizar el día:

1. Añades tres tareas:

   | Tarea | Categoría | Prioridad | Fecha límite |
   |---|---|---|---|
   | Entregar informe Q2 | Trabajo | 🔴 Urgente | hoy |
   | Revisar pull requests | Trabajo | 🟡 En progreso | mañana |
   | Comprar café de oficina | Personal | 🟢 Opcional | — |

2. La primera tarea aparece con **borde rojo** y badge **"Vence hoy"** parpadeante.
3. Completas "Entregar informe Q2" → suena el **acorde de completado** y el badge pasa a tachado.
4. Al final del día abres **📊 Estadísticas** y ves que llevas **3 días de racha** y has completado el 66 % de las tareas del día.

---

### Ejemplo 2 — Corrección de un error al eliminar

Tienes 5 tareas en lista y eliminas "Preparar presentación" por equivocación:

```
[✔] Enviar factura               ← completada
[✖] Preparar presentación        ← clic accidental en ✖
[ ] Llamar al cliente
[ ] Revisar contrato
[ ] Actualizar portfolio
```

1. La tarea desaparece de la lista al instante.
2. Aparece el toast en la parte inferior:
   ```
   ███████████░░░░░  "Preparar presentación" eliminada   [Deshacer]
   ```
3. Pulsas **Deshacer** antes de que expiren los 5 segundos.
4. La tarea vuelve exactamente a su **segunda posición**, como si nada hubiera pasado.

---

### Ejemplo 3 — Edición inline de una tarea mal escrita

Añadiste "Emviar propuesta al cliente" con una errata:

1. Haz **doble clic** sobre el texto de la tarea — el texto se convierte en un input editable.
2. Corrige la errata: `Emviar` → `Enviar`.
3. Pulsa `Enter` — el texto se actualiza en la lista y se guarda en `localStorage` sin recargar la página.

Si cambias de opinión a mitad de la edición, pulsa `Escape` para descartar y recuperar el texto original.

---

### Ejemplo 4 — Seguimiento de un proyecto de estudio

Estás preparando un examen durante una semana:

1. Creas tareas diarias con fechas límite escalonadas:

   ```
   [ ] Leer capítulo 1-3     📅 lunes    → 🟢 5d restantes
   [ ] Hacer ejercicios T1   📅 martes   → 🟢 6d restantes
   [ ] Repasar apuntes       📅 miércoles
   [ ] Simulacro de examen   📅 jueves   → 🟡 3d restantes
   [ ] Revisión final        📅 viernes  → 🔴 Mañana
   ```

2. Cada día completas las tareas correspondientes → la **racha sube** en el panel de estadísticas.
3. Si llegas al jueves sin haber hecho los ejercicios del martes, su badge aparece en **rojo parpadeante** como recordatorio visual inmediato.
4. Al final de la semana, el panel muestra el **gráfico de barras** con picos en los días más productivos y el **100 % de completado** si terminaste todo.

---

### Ejemplo 5 — Uso en modo oscuro en entorno nocturno

1. Haz clic en **🌙 Noche** — toda la interfaz cambia a tonos oscuros (fondo, card, inputs, badges).
2. La preferencia queda guardada: la próxima vez que abras la app, arrancará directamente en modo oscuro.
3. Para volver al tema claro, haz clic en **☀️ Día**.

---

## 📌 Notas técnicas

- El proyecto usa **Tailwind CSS vía CDN** — no requiere instalación ni compilación.
- El **sonido de completado** usa osciladores nativos del navegador (`OscillatorNode` + `GainNode`). No se descarga ningún archivo de audio.
- Las **fechas límite** se calculan en días naturales respecto a la medianoche local, por lo que son independientes de la zona horaria del servidor.
- El **undo** elimina la tarea del array inmediatamente (la lista se actualiza al instante), pero la mantiene en memoria hasta que expira el timeout o el usuario confirma. Esto evita el parpadeo de "eliminar y restaurar" que ocurriría si se esperase al timeout para borrarla.