const { Router } = require('express');
const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/task.controller');

const router = Router();

router.get('/',       getTasks);     // GET    /api/v1/tasks
router.get('/:id',    getTask);      // GET    /api/v1/tasks/:id
router.post('/',      createTask);   // POST   /api/v1/tasks
router.put('/:id',    updateTask);   // PUT    /api/v1/tasks/:id
router.delete('/:id', deleteTask);   // DELETE /api/v1/tasks/:id

module.exports = router;