const taskInput = document.getElementById("taskInput")
const addBtn = document.getElementById("addBtn")
const taskList = document.getElementById("taskList")

let tasks = JSON.parse(localStorage.getItem("tasks")) || []

function saveTasks(){
localStorage.setItem("tasks", JSON.stringify(tasks))
}

function renderTasks(){

taskList.innerHTML=""

tasks.forEach((task,index)=>{

const li=document.createElement("li")

if(task.completed){
li.classList.add("completed")
}

li.innerHTML=`

<span>${task.text}</span>

<div class="task-buttons">

<button class="complete-btn">✓</button>
<button class="delete-btn">✕</button>

</div>

`

const completeBtn = li.querySelector(".complete-btn")
const deleteBtn = li.querySelector(".delete-btn")

completeBtn.onclick=()=>{
tasks[index].completed=!tasks[index].completed
saveTasks()
renderTasks()
}

deleteBtn.onclick=()=>{
tasks.splice(index,1)
saveTasks()
renderTasks()
}

taskList.appendChild(li)

})

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

renderTasks()