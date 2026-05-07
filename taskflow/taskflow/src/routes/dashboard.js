const express = require('express');
const db = require('../db');
const { authenticate } = require('../auth');

const router = express.Router();
router.use(authenticate);

// GET /api/dashboard - overview stats for the logged-in user
router.get('/', (req, res) => {
  const userId = req.user.id;

  const projectCount = db.prepare(`
    SELECT COUNT(*) as count FROM project_members WHERE user_id = ?
  `).get(userId).count;

  const taskStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Todo' THEN 1 ELSE 0 END) as todo,
      SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'Done' THEN 1 ELSE 0 END) as done,
      SUM(CASE WHEN due_date < DATE('now') AND status != 'Done' THEN 1 ELSE 0 END) as overdue
    FROM tasks t
    JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = ?
  `).get(userId);

  const myTasks = db.prepare(`
    SELECT t.*, p.name as project_name, u.name as assignee_name
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE t.assigned_to = ? AND t.status != 'Done'
    ORDER BY t.due_date ASC NULLS LAST, CASE t.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END
    LIMIT 10
  `).all(userId);

  const overdueTasks = db.prepare(`
    SELECT t.*, p.name as project_name, u.name as assignee_name
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = ?
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE t.due_date < DATE('now') AND t.status != 'Done'
    ORDER BY t.due_date ASC
    LIMIT 5
  `).all(userId);

  const recentProjects = db.prepare(`
    SELECT p.*, pm.role,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'Done') as done_count
    FROM projects p
    JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
    ORDER BY p.created_at DESC
    LIMIT 5
  `).all(userId);

  res.json({
    projectCount,
    taskStats,
    myTasks,
    overdueTasks,
    recentProjects
  });
});

module.exports = router;
