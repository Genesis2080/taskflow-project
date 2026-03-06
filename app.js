// app.js
document.addEventListener("DOMContentLoaded", () => {
  const taskInput = document.getElementById("taskInput")
  const addBtn = document.getElementById("addBtn")
  const taskList = document.getElementById("taskList")
  const taskCounter = document.getElementById("taskCounter")
  const filterButtons = document.querySelectorAll(".filters button")
  const categorySelector = document.getElementById("categorySelector")
  const prioritySelector = document.getElementById("prioritySelector")
  const darkModeBtn = document.getElementById("darkModeBtn")
  const body = document.body
  const container = document.querySelector("div.w-full.max-w-sm")

  // Estado inicial de tareas y filtro
  let tasks = JSON.parse(localStorage.getItem("tasks")) || []
  let currentFilter = "all"

  // Inicializar modo oscuro desde localStorage
  if(localStorage.getItem("darkMode") === "true") {
    body.classList.add("dark")
    body.classList.add("gradient-night")
    body.classList.remove("gradient-day")
    container.classList.add("container-night")
    container.classList.remove("container-day")
  } else {
    body.classList.add("gradient-day")
    container.classList.add("container-day")
  }

  // Guardar tareas
  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks))
  }

  // Actualizar contador de tareas pendientes
  function updateCounter() {
    taskCounter.textContent = tasks.filter(t => !t.completed).length
  }

  // Renderizar tareas
  function renderTasks() {
    taskList.innerHTML = ""
    let filtered = tasks
    if(currentFilter === "pending") filtered = tasks.filter(t => !t.completed)
    if(currentFilter === "completed") filtered = tasks.filter(t => t.completed)

    filtered.forEach(task => {
      const li = document.createElement("li")
      li.className = `task-item flex justify-between items-center p-3 rounded-lg bg-gray-700 dark:bg-gray-800 text-gray-100 transition ${task.completed ? 'line-through opacity-60' : ''}`
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
      `
      li.querySelector(".complete-btn").onclick = () => {
        task.completed = !task.completed
        saveTasks()
        renderTasks()
      }
      li.querySelector(".delete-btn").onclick = () => {
        tasks.splice(tasks.indexOf(task), 1)
        saveTasks()
        renderTasks()
      }
      taskList.appendChild(li)
    })
    updateCounter()
  }

  // Añadir tarea
  function addTask() {
    const text = taskInput.value.trim()
    if(!text) return
    const category = categorySelector.value
    const priority = prioritySelector.value
    tasks.push({text, category, priority, completed: false})
    taskInput.value = ""
    saveTasks()
    renderTasks()
  }

  // Event listeners
  addBtn.addEventListener("click", addTask)
  taskInput.addEventListener("keypress", e => { if(e.key === "Enter") addTask() })
  filterButtons.forEach(btn => { btn.onclick = () => { currentFilter = btn.dataset.filter; renderTasks() } })

  // Botón de modo oscuro
  darkModeBtn.addEventListener("click", () => {
    const isDark = body.classList.toggle("dark")
    body.classList.toggle("gradient-night", isDark)
    body.classList.toggle("gradient-day", !isDark)
    container.classList.toggle("container-night", isDark)
    container.classList.toggle("container-day", !isDark)
    localStorage.setItem("darkMode", isDark)
  })

  // Render inicial
  renderTasks()
})