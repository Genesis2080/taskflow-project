const { Router } = require('express');
const { getTasks, createTask, deleteTask } = require('../controllers/task.controller');

const router = Router();

router.get('/',      getTasks);    // GET    /api/v1/tasks
router.post('/',     createTask);  // POST   /api/v1/tasks
router.delete('/:id', deleteTask); // DELETE /api/v1/tasks/:id

module.exports = router;