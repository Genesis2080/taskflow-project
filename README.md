# TaskFlow - Gestor de Tareas con Modo Día/Noche

TaskFlow es un **gestor de tareas web** construido con **HTML, Tailwind CSS y JavaScript puro**, que permite organizar tus tareas de manera eficiente. Su diseño moderno incluye **modo día/noche**, filtros de tareas, y persistencia de datos usando `localStorage`.

---

## 🎯 Características principales

- **Añadir tareas**: escribe una nueva tarea y asigna categoría y prioridad.
- **Completar o eliminar tareas**: cada tarea puede marcarse como completada o eliminarse individualmente.
- **Filtros de tareas**: visualiza todas, pendientes o completadas.
- **Modo día/noche**: cambia todo el tema de la interfaz con un botón, incluyendo fondo, contenedor, botones, inputs y filtros.
- **Persistencia**: las tareas y el modo oscuro se guardan en `localStorage`.
- **Interfaz moderna**: animaciones suaves, hover elegante en tareas y botones, colores vivos para filtros activos.
- **Diseño responsive**: se adapta a cualquier pantalla.

---

## 🛠 Tecnologías usadas

- **HTML5**
- **JavaScript ES6**
- **Tailwind CSS** (CDN)
- CSS personalizado para **gradientes y animaciones**.

---

## 📁 Estructura del proyecto


taskflow-project/

│

├─ index.html # Interfaz principal

├─ style.css # Estilos personalizados y animaciones

├─ app.js # Lógica de tareas y modo oscuro

├─ tailwind.config.js # Configuración de Tailwind CSS

└─ README.md # Este archivo



---

## ⚡ Uso

1. Clona el repositorio:

  - git clone https://github.com/Genesis2080/taskflow-project.git

2. Abre index.html en tu navegador.

3. Añadir tarea:

  - Escribe el nombre de la tarea en el input.

  - Selecciona categoría y prioridad.

  - Haz clic en Añadir o presiona Enter.

4. Completar tarea:

  - Haz clic en el botón ✔ junto a la tarea.

5. Eliminar tarea:

  - Haz clic en el botón ✖ junto a la tarea.

6. Filtrar tareas:

  - Selecciona Todas, Pendientes o Completadas.

7. Modo noche/día:

  - Haz clic en el botón 🌙 Modo noche para alternar.
  
El tema completo de la interfaz cambia (fondo, contenedor, botones, inputs, filtros).

La selección se guarda en localStorage para mantener la preferencia.


---

## 🎨 Estilo y animaciones

Hover elegante: al pasar el cursor sobre cada tarea, se levanta ligeramente y muestra sombra.

Botones de filtro activos: se resaltan en azul para indicar el filtro seleccionado.

Transiciones suaves: cambio de temas y estados de botones/tareas con animaciones.

Gradientes dinámicos: fondo de la página cambia según el tema seleccionado.


---

## 📌 Notas

El proyecto usa Tailwind CSS vía CDN, por lo que no requiere compilación.

localStorage guarda:

Las tareas y sus estados (completadas o pendientes).

El estado del modo oscuro.
