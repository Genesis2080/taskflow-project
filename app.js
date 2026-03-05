const taskInput = document.getElementById("taskInput")
const addBtn = document.getElementById("addBtn")
const taskList = document.getElementById("taskList")
const taskCounter = document.getElementById("taskCounter")
const filterButtons = document.querySelectorAll(".filters button")
const darkModeBtn = document.getElementById("darkModeBtn")

let tasks = JSON.parse(localStorage.getItem("tasks")) || []
let currentFilter = "all"

// Guardar en LocalStorage
function saveTasks(){
    localStorage.setItem("tasks", JSON.stringify(tasks))
}

// Actualizar contador de tareas pendientes
function updateCounter(){
    const pending = tasks.filter(task => !task.completed).length
    taskCounter.textContent = pending
}

// Renderizar lista
function renderTasks(){
    taskList.innerHTML=""
    let filteredTasks = tasks

    if(currentFilter==="pending") filteredTasks = tasks.filter(t=>!t.completed)
    if(currentFilter==="completed") filteredTasks = tasks.filter(t=>t.completed)

    filteredTasks.forEach(task => {
        const li = document.createElement("li")
        li.className = `flex justify-between items-center p-3 rounded bg-gray-100 dark:bg-gray-700 transition ${task.completed?'line-through opacity-60':''}`

        li.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="font-medium text-gray-800 dark:text-gray-100">${task.text}</span>
          <span class="px-2 py-1 text-xs rounded bg-blue-200 text-blue-800 dark:bg-blue-600 dark:text-white">${task.category}</span>
          <span class="px-2 py-1 text-xs rounded ${
            task.priority==='urgente' ? 'bg-red-500 text-white' :
            task.priority==='progreso' ? 'bg-yellow-400 text-black' :
            'bg-green-500 text-white'
          }">
            ${task.priority==='urgente' ? 'Urgente' : task.priority==='progreso' ? 'En progreso' : 'Opcional'}
          </span>
        </div>
        <div class="flex gap-2">
          <button class="complete-btn px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 dark:bg-green-400 dark:hover:bg-green-500 transition">✔</button>
          <button class="delete-btn px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 dark:bg-red-400 dark:hover:bg-red-500 transition">✖</button>
        </div>
        `
        // Eventos botones
        li.querySelector(".complete-btn").onclick = ()=>{
            task.completed = !task.completed
            saveTasks()
            renderTasks()
        }
        li.querySelector(".delete-btn").onclick = ()=>{
            tasks.splice(tasks.indexOf(task),1)
            saveTasks()
            renderTasks()
        }

        taskList.appendChild(li)
    })

    updateCounter()
}

// Añadir tarea
function addTask(){
    const text = taskInput.value.trim()
    if(!text) return
    tasks.push({text, category:"General", priority:"progreso", completed:false})
    taskInput.value=""
    saveTasks()
    renderTasks()
}

addBtn.addEventListener("click", addTask)
taskInput.addEventListener("keypress", e=>{if(e.key==="Enter") addTask()})

// Filtros
filterButtons.forEach(button=>{
    button.onclick=()=>{
        currentFilter = button.dataset.filter
        renderTasks()
    }
})

// Modo oscuro
darkModeBtn.onclick = ()=>{
    document.documentElement.classList.toggle("dark")
}

renderTasks()