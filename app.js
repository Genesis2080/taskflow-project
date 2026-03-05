const taskInput = document.getElementById("taskInput")
const addBtn = document.getElementById("addBtn")
const taskList = document.getElementById("taskList")
const taskCounter = document.getElementById("taskCounter")
const filterButtons = document.querySelectorAll(".filters button")
const darkModeBtn = document.getElementById("darkModeBtn")

let tasks = JSON.parse(localStorage.getItem("tasks")) || []
let currentFilter = "all"

function saveTasks(){
localStorage.setItem("tasks", JSON.stringify(tasks))
}

function updateCounter(){

const pending = tasks.filter(task => !task.completed).length
taskCounter.textContent = pending

}

function renderTasks(){

taskList.innerHTML=""

let filteredTasks = tasks

if(currentFilter==="pending"){
filteredTasks = tasks.filter(task=>!task.completed)
}

if(currentFilter==="completed"){
filteredTasks = tasks.filter(task=>task.completed)
}

filteredTasks.forEach((task,index)=>{

const li=document.createElement("li")

if(task.completed){
li.classList.add("completed")
}

li.innerHTML=`

<span>${task.text}</span>

<div class="task-buttons">
<button class="complete-btn">✔</button>
<button class="delete-btn">✖</button>
</div>

`

const completeBtn = li.querySelector(".complete-btn")
const deleteBtn = li.querySelector(".delete-btn")

completeBtn.onclick=()=>{
task.completed=!task.completed
saveTasks()
renderTasks()
}

deleteBtn.onclick=()=>{
tasks.splice(tasks.indexOf(task),1)
saveTasks()
renderTasks()
}

taskList.appendChild(li)

})

updateCounter()

}

function addTask(){

const text = taskInput.value.trim()

if(text==="") return

tasks.push({
text:text,
completed:false
})

taskInput.value=""

saveTasks()
renderTasks()

}

addBtn.addEventListener("click",addTask)

taskInput.addEventListener("keypress",(e)=>{
if(e.key==="Enter") addTask()
})

filterButtons.forEach(button=>{

button.onclick=()=>{
currentFilter = button.dataset.filter
renderTasks()
}

})

darkModeBtn.onclick=()=>{
document.body.classList.toggle("dark-mode")
}

renderTasks()