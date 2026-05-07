const express = require('express');
const db = require('../db');
const { authenticate } = require('../auth');

const router = express.Router();
router.use(authenticate);

// Helper: get user's role in a project
function getRole(projectId, userId) {
  const m = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, userId);
  return m ? m.role : null;
}

// GET /api/projects - list all projects user is member of
router.get('/', (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, pm.role, u.name as owner_name,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'Done') as done_count
    FROM projects p
    JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
    JOIN users u ON p.owner_id = u.id
    ORDER BY p.created_at DESC
  `).all(req.user.id);
  res.json(projects);
});

// POST /api/projects - create project (creator becomes Admin)
router.post('/', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });

  const insertProject = db.prepare('INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)');
  const insertMember = db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)');

  const transaction = db.transaction(() => {
    const result = insertProject.run(name, description || null, req.user.id);
    insertMember.run(result.lastInsertRowid, req.user.id, 'Admin');
    return result.lastInsertRowid;
  });

  const id = transaction();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json({ ...project, role: 'Admin' });
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  const role = getRole(req.params.id, req.user.id);
  if (!role) return res.status(403).json({ error: 'Access denied' });

  const project = db.prepare(`
    SELECT p.*, u.name as owner_name
    FROM projects p JOIN users u ON p.owner_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, pm.role, pm.joined_at
    FROM project_members pm JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
    ORDER BY pm.role DESC, u.name
  `).all(req.params.id);

  res.json({ ...project, role, members });
});

// PUT /api/projects/:id - Admin only
router.put('/:id', (req, res) => {
  const role = getRole(req.params.id, req.user.id);
  if (role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });

  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });

  db.prepare('UPDATE projects SET name = ?, description = ? WHERE id = ?').run(name, description || null, req.params.id);
  res.json(db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id));
});

// DELETE /api/projects/:id - Admin only
router.delete('/:id', (req, res) => {
  const role = getRole(req.params.id, req.user.id);
  if (role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });

  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ message: 'Project deleted' });
});

// POST /api/projects/:id/members - Admin: add member by email
router.post('/:id/members', (req, res) => {
  const role = getRole(req.params.id, req.user.id);
  if (role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });

  const { email, memberRole } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'User not found. They must sign up first.' });

  const existing = db.prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, user.id);
  if (existing) return res.status(409).json({ error: 'User is already a member' });

  const assignedRole = ['Admin', 'Member'].includes(memberRole) ? memberRole : 'Member';
  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(req.params.id, user.id, assignedRole);
  res.status(201).json({ ...user, role: assignedRole });
});

// PUT /api/projects/:id/members/:userId - Admin: change role
router.put('/:id/members/:userId', (req, res) => {
  const role = getRole(req.params.id, req.user.id);
  if (role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });

  const { role: newRole } = req.body;
  if (!['Admin', 'Member'].includes(newRole)) return res.status(400).json({ error: 'Role must be Admin or Member' });

  db.prepare('UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?').run(newRole, req.params.id, req.params.userId);
  res.json({ message: 'Role updated' });
});

// DELETE /api/projects/:id/members/:userId - Admin: remove member
router.delete('/:id/members/:userId', (req, res) => {
  const role = getRole(req.params.id, req.user.id);
  if (role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });

  if (parseInt(req.params.userId) === req.user.id)
    return res.status(400).json({ error: "You can't remove yourself" });

  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
  res.json({ message: 'Member removed' });
});

module.exports = router;
