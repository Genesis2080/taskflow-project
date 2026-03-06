const taskInput = document.getElementById("taskInput")
const addBtn = document.getElementById("addBtn")
const taskList = document.getElementById("taskList")
const taskCounter = document.getElementById("taskCounter")
const filterButtons = document.querySelectorAll(".filters button")
const darkModeBtn = document.getElementById("darkModeBtn")
const themeSelector = document.getElementById("themeSelector")
const categorySelector = document.getElementById("categorySelector")
const prioritySelector = document.getElementById("prioritySelector")

let tasks = JSON.parse(localStorage.getItem("tasks")) || []
let currentFilter = "all"

/* =========================
Guardar preferencias
========================= */

const savedTheme = localStorage.getItem("theme")
const savedDark = localStorage.getItem("darkMode")

if(savedTheme){
document.body.classList.remove("theme-default","theme-warm","theme-cool")
document.body.classList.add(`theme-${savedTheme}`)
themeSelector.value = savedTheme
}

if(savedDark === "true"){
document.documentElement.classList.add("dark")
}

/* =========================
Funciones tareas
========================= */

function saveTasks(){
localStorage.setItem("tasks", JSON.stringify(tasks))
}

function updateCounter(){
taskCounter.textContent = tasks.filter(t=>!t.completed).length
}

function renderTasks(){

taskList.innerHTML=""

let filtered = tasks

if(currentFilter==="pending") filtered=tasks.filter(t=>!t.completed)
if(currentFilter==="completed") filtered=tasks.filter(t=>t.completed)

filtered.forEach(task=>{

const li=document.createElement("li")

li.className=`flex justify-between items-center p-3 rounded-lg
bg-gray-100 dark:bg-gray-700
transition
${task.completed?'line-through opacity-60':''}`

li.innerHTML=`

<div class="flex items-center gap-3">

<span class="font-medium text-gray-800 dark:text-gray-100">
${task.text}
</span>

<span class="px-2 py-1 text-xs rounded
bg-blue-200 text-blue-800
dark:bg-blue-600 dark:text-white">
${task.category}
</span>

<span class="px-2 py-1 text-xs rounded
${
task.priority==='urgente'?'bg-red-500 text-white':
task.priority==='progreso'?'bg-yellow-400 text-black':
'bg-green-500 text-white'
}">
${task.priority==='urgente'?'Urgente':task.priority==='progreso'?'En progreso':'Opcional'}
</span>

</div>

<div class="flex gap-2">

<button class="complete-btn px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600 dark:bg-green-400 dark:hover:bg-green-500 transition">
✔
</button>

<button class="delete-btn px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 dark:bg-red-400 dark:hover:bg-red-500 transition">
✖
</button>

</div>
`

li.querySelector(".complete-btn").onclick=()=>{
task.completed=!task.completed
saveTasks()
renderTasks()
}

li.querySelector(".delete-btn").onclick=()=>{
tasks.splice(tasks.indexOf(task),1)
saveTasks()
renderTasks()
}

taskList.appendChild(li)

})

updateCounter()
}

/* =========================
Añadir tarea
========================= */

function addTask(){

const text=taskInput.value.trim()
if(!text) return

const category=categorySelector.value
const priority=prioritySelector.value

tasks.push({
text,
category,
priority,
completed:false
})

taskInput.value=""

saveTasks()
renderTasks()

}

addBtn.addEventListener("click", addTask)

taskInput.addEventListener("keypress", e=>{
if(e.key==="Enter") addTask()
})

/* =========================
Filtros
========================= */

filterButtons.forEach(btn=>{
btn.onclick=()=>{
currentFilter=btn.dataset.filter
renderTasks()
}
})

/* =========================
Modo oscuro global
========================= */

darkModeBtn.onclick=()=>{

document.documentElement.classList.toggle("dark")

const darkActive = document.documentElement.classList.contains("dark")

localStorage.setItem("darkMode", darkActive)

}

/* =========================
Cambio de tema
========================= */

themeSelector.onchange = e=>{

const theme = e.target.value

document.body.classList.remove(
"theme-default",
"theme-warm",
"theme-cool"
)

document.body.classList.add(`theme-${theme}`)

localStorage.setItem("theme", theme)

}

/* ========================= */

renderTasks()