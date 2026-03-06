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

/* =======================
PREFERENCIAS
======================= */

const savedTheme = localStorage.getItem("theme")
const savedDark = localStorage.getItem("darkMode")

if(savedTheme){
document.body.classList.remove("theme-default","theme-warm","theme-cool")
document.body.classList.add(`theme-${savedTheme}`)
themeSelector.value = savedTheme
}

if(savedDark==="true"){
document.documentElement.classList.add("dark")
document.body.classList.add("theme-night")
}

/* =======================
FUNCIONES
======================= */

function saveTasks(){
localStorage.setItem("tasks", JSON.stringify(tasks))
}

function updateCounter(){
taskCounter.textContent = tasks.filter(t=>!t.completed).length
}

/* =======================
RENDER
======================= */

function renderTasks(){

taskList.innerHTML=""

let filtered = tasks

if(currentFilter==="pending") filtered=tasks.filter(t=>!t.completed)
if(currentFilter==="completed") filtered=tasks.filter(t=>t.completed)

filtered.forEach((task,index)=>{

const li=document.createElement("li")

li.draggable=true
li.dataset.index=index

li.className=`task-item flex justify-between items-center p-3 rounded-lg
bg-gray-100 dark:bg-gray-700
transition
${task.completed?'line-through opacity-60':''}`

const categoryColors={
Trabajo:"bg-blue-500",
Estudio:"bg-purple-500",
Personal:"bg-green-500",
General:"bg-gray-500"
}

li.innerHTML=`

<div class="flex items-center gap-3">

<span class="font-medium text-gray-800 dark:text-gray-100">
${task.text}
</span>

<span class="px-2 py-1 text-xs text-white rounded ${categoryColors[task.category] || 'bg-gray-500'}">
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

<button class="complete-btn px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition">
✔
</button>

<button class="delete-btn px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition">
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
tasks.splice(index,1)
saveTasks()
renderTasks()
}

/* Drag events */

li.addEventListener("dragstart",dragStart)
li.addEventListener("dragover",dragOver)
li.addEventListener("drop",dropItem)

taskList.appendChild(li)

/* Animación */

setTimeout(()=>{
li.classList.add("show")
},50)

})

updateCounter()

}

/* =======================
DRAG & DROP
======================= */

let draggedIndex=null

function dragStart(e){
draggedIndex=this.dataset.index
}

function dragOver(e){
e.preventDefault()
}

function dropItem(){

const targetIndex=this.dataset.index

const draggedTask=tasks.splice(draggedIndex,1)[0]

tasks.splice(targetIndex,0,draggedTask)

saveTasks()
renderTasks()

}

/* =======================
AÑADIR
======================= */

function addTask(){

const text=taskInput.value.trim()
if(!text) return

tasks.push({
text,
category:categorySelector.value,
priority:prioritySelector.value,
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

/* =======================
FILTROS
======================= */

filterButtons.forEach(btn=>{
btn.onclick=()=>{
currentFilter=btn.dataset.filter
renderTasks()
}
})

/* =======================
MODO NOCHE GLOBAL
======================= */

darkModeBtn.onclick=()=>{

document.documentElement.classList.toggle("dark")
document.body.classList.toggle("theme-night")

const darkActive=document.documentElement.classList.contains("dark")

localStorage.setItem("darkMode",darkActive)

}

/* =======================
CAMBIO TEMA
======================= */

themeSelector.onchange=e=>{

if(document.documentElement.classList.contains("dark")) return

document.body.classList.remove("theme-default","theme-warm","theme-cool")

document.body.classList.add(`theme-${e.target.value}`)

localStorage.setItem("theme",e.target.value)

}

renderTasks()