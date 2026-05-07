const express = require('express');
const db = require('../db');
const { authenticate } = require('../auth');

const router = express.Router({ mergeParams: true });
router.use(authenticate);

function getMembership(projectId, userId) {
  return db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, userId);
}

// GET /api/projects/:projectId/tasks
router.get('/', (req, res) => {
  const m = getMembership(req.params.projectId, req.user.id);
  if (!m) return res.status(403).json({ error: 'Access denied' });

  const { status, priority, assigned_to } = req.query;
  let query = `
    SELECT t.*, u.name as assignee_name, u.email as assignee_email,
           c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users c ON t.created_by = c.id
    WHERE t.project_id = ?
  `;
  const params = [req.params.projectId];
  if (status) { query += ' AND t.status = ?'; params.push(status); }
  if (priority) { query += ' AND t.priority = ?'; params.push(priority); }
  if (assigned_to) { query += ' AND t.assigned_to = ?'; params.push(assigned_to); }
  query += ' ORDER BY CASE t.priority WHEN "High" THEN 1 WHEN "Medium" THEN 2 ELSE 3 END, t.due_date ASC NULLS LAST';

  res.json(db.prepare(query).all(...params));
});

// POST /api/projects/:projectId/tasks
router.post('/', (req, res) => {
  const m = getMembership(req.params.projectId, req.user.id);
  if (!m) return res.status(403).json({ error: 'Access denied' });

  const { title, description, status, priority, assigned_to, due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Task title is required' });

  // Validate assigned_to is a project member
  if (assigned_to) {
    const member = getMembership(req.params.projectId, assigned_to);
    if (!member) return res.status(400).json({ error: 'Assigned user is not a project member' });
  }

  const validStatus = ['Todo', 'In Progress', 'Done'].includes(status) ? status : 'Todo';
  const validPriority = ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Medium';

  const result = db.prepare(`
    INSERT INTO tasks (project_id, title, description, status, priority, assigned_to, due_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.projectId, title, description || null, validStatus, validPriority, assigned_to || null, due_date || null, req.user.id);

  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users c ON t.created_by = c.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(task);
});

// GET /api/projects/:projectId/tasks/:id
router.get('/:id', (req, res) => {
  const m = getMembership(req.params.projectId, req.user.id);
  if (!m) return res.status(403).json({ error: 'Access denied' });

  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.email as assignee_email, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users c ON t.created_by = c.id
    WHERE t.id = ? AND t.project_id = ?
  `).get(req.params.id, req.params.projectId);

  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// PUT /api/projects/:projectId/tasks/:id
router.put('/:id', (req, res) => {
  const m = getMembership(req.params.projectId, req.user.id);
  if (!m) return res.status(403).json({ error: 'Access denied' });

  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND project_id = ?').get(req.params.id, req.params.projectId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  // Members can only edit tasks assigned to them or created by them; Admins can edit all
  if (m.role === 'Member' && task.created_by !== req.user.id && task.assigned_to !== req.user.id)
    return res.status(403).json({ error: 'You can only edit tasks you created or are assigned to' });

  const { title, description, status, priority, assigned_to, due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Task title is required' });

  if (assigned_to) {
    const member = getMembership(req.params.projectId, assigned_to);
    if (!member) return res.status(400).json({ error: 'Assigned user is not a project member' });
  }

  const validStatus = ['Todo', 'In Progress', 'Done'].includes(status) ? status : task.status;
  const validPriority = ['Low', 'Medium', 'High'].includes(priority) ? priority : task.priority;

  db.prepare(`
    UPDATE tasks SET title=?, description=?, status=?, priority=?, assigned_to=?, due_date=?, updated_at=CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, description || null, validStatus, validPriority, assigned_to || null, due_date || null, req.params.id);

  const updated = db.prepare(`
    SELECT t.*, u.name as assignee_name, c.name as creator_name
    FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id LEFT JOIN users c ON t.created_by = c.id
    WHERE t.id = ?
  `).get(req.params.id);

  res.json(updated);
});

// PATCH /api/projects/:projectId/tasks/:id/status - quick status update
router.patch('/:id/status', (req, res) => {
  const m = getMembership(req.params.projectId, req.user.id);
  if (!m) return res.status(403).json({ error: 'Access denied' });

  const { status } = req.body;
  if (!['Todo', 'In Progress', 'Done'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });

  db.prepare('UPDATE tasks SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND project_id=?').run(status, req.params.id, req.params.projectId);
  res.json({ message: 'Status updated', status });
});

// DELETE /api/projects/:projectId/tasks/:id
router.delete('/:id', (req, res) => {
  const m = getMembership(req.params.projectId, req.user.id);
  if (!m) return res.status(403).json({ error: 'Access denied' });

  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND project_id = ?').get(req.params.id, req.params.projectId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (m.role === 'Member' && task.created_by !== req.user.id)
    return res.status(403).json({ error: 'Only Admins or task creators can delete tasks' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
