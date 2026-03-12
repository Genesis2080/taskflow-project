document.addEventListener("DOMContentLoaded", () => {
  const taskInput = document.getElementById("taskInput");
  const addBtn = document.getElementById("addBtn");
  const taskList = document.getElementById("taskList");
  const taskCounter = document.getElementById("taskCounter");
  const filterButtons = document.querySelectorAll(".filters button");
  const categorySelector = document.getElementById("categorySelector");
  const prioritySelector = document.getElementById("prioritySelector");
  const darkModeBtn = document.getElementById("darkModeBtn");
  const html = document.documentElement;
  const body = document.body;
  const container = document.querySelector(".container-day, .container-night");

  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let currentFilter = "all";

  // Inicializar modo oscuro según localStorage
  if(localStorage.getItem("darkMode") === "true") {
    html.classList.add("dark");
    body.classList.replace("bg-day", "bg-night");
    container.classList.replace("container-day", "container-night");
  }

  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  function updateCounter() {
    taskCounter.textContent = tasks.filter(t => !t.completed).length;
  }

  function updateActiveFilter() {
    filterButtons.forEach(btn => btn.classList.remove("bg-blue-500", "text-white", "dark:bg-blue-600"));
    const activeBtn = Array.from(filterButtons).find(btn => btn.dataset.filter === currentFilter);
    if(activeBtn) {
      activeBtn.classList.add("bg-blue-500", "text-white", "dark:bg-blue-600");
    }
  }

  function renderTasks() {
    taskList.innerHTML = "";
    let filtered = tasks;
    if(currentFilter === "pending") filtered = tasks.filter(t => !t.completed);
    if(currentFilter === "completed") filtered = tasks.filter(t => t.completed);

    filtered.forEach(task => {
      const li = document.createElement("li");
      li.className = `task-item flex justify-between items-center p-3 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition ${task.completed ? 'line-through opacity-60' : ''}`;
      li.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="font-medium">${task.text}</span>
          <span class="px-2 py-1 text-xs rounded bg-blue-200 text-blue-800 dark:bg-blue-600 dark:text-white">${task.category}</span>
          <span class="px-2 py-1 text-xs rounded ${
            task.priority === 'urgente' ? 'bg-red-500 text-white' :
            task.priority === 'progreso' ? 'bg-yellow-400 text-black' : 'bg-green-500 text-white'
          }">${task.priority === 'urgente' ? 'Urgente' : task.priority === 'progreso' ? 'En progreso' : 'Opcional'}</span>
        </div>
        <div class="flex gap-2">
          <button class="complete-btn px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 dark:bg-green-400 dark:hover:bg-green-500 transition">✔</button>
          <button class="delete-btn px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 dark:bg-red-400 dark:hover:bg-red-500 transition">✖</button>
        </div>
      `;
      li.querySelector(".complete-btn").onclick = () => {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
      };
      li.querySelector(".delete-btn").onclick = () => {
        tasks.splice(tasks.indexOf(task), 1);
        saveTasks();
        renderTasks();
      };
      taskList.appendChild(li);
      setTimeout(() => li.classList.add("show"), 10);
    });

    updateCounter();
  }

  function addTask() {
    const text = taskInput.value.trim();
    if(!text) return;
    const category = categorySelector.value;
    const priority = prioritySelector.value;
    tasks.push({text, category, priority, completed: false});
    taskInput.value = "";
    saveTasks();
    renderTasks();
  }

  addBtn.addEventListener("click", addTask);
  taskInput.addEventListener("keypress", e => { if(e.key === "Enter") addTask(); });

  filterButtons.forEach(btn => {
    btn.onclick = () => {
      currentFilter = btn.dataset.filter;
      renderTasks();
      updateActiveFilter();
    };
  });

  // BOTÓN MODO OSCURO FUNCIONAL
  darkModeBtn.addEventListener("click", () => {
    const isDark = html.classList.toggle("dark");
    localStorage.setItem("darkMode", isDark);

    // Cambiar clases del body y contenedor
    if(isDark) {
      body.classList.replace("bg-day", "bg-night");
      container.classList.replace("container-day", "container-night");
    } else {
      body.classList.replace("bg-night", "bg-day");
      container.classList.replace("container-night", "container-day");
    }
  });

  // Render inicial
  renderTasks();
  updateActiveFilter();
});

// Crear una funcion que calcule el radio de un circulo
function calcularRadio(area) {
  return Math.sqrt(area / Math.PI);
}