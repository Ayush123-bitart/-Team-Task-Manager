let currentProject = null;
let currentProjectTab = 'tasks';

async function renderProjectDetail(projectId) {
  const view = document.getElementById('view-project-detail');
  ui.loading(view);
  try {
    currentProject = await api.getProject(projectId);
    renderProjectDetailContent();
  } catch(e) {
    view.innerHTML = `<p class="text-muted">Error: ${e.message}</p>`;
  }
}

function renderProjectDetailContent() {
  const p = currentProject;
  const isAdmin = p.role === 'Admin';
  const view = document.getElementById('view-project-detail');

  view.innerHTML = `
    <button class="back-btn" onclick="app.navigate('projects')">
      <svg viewBox="0 0 24 24"><path d="M19 12H5M5 12l7-7M5 12l7 7"/></svg>
      Back to Projects
    </button>
    <div class="project-detail-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <h2 style="font-size:22px">${ui.escapeHtml(p.name)}</h2>
          <span class="role-badge ${p.role}">${p.role}</span>
        </div>
        ${p.description ? `<p style="color:var(--text-2);font-size:13px">${ui.escapeHtml(p.description)}</p>` : ''}
        <p style="color:var(--text-3);font-size:12px;margin-top:4px">${p.members.length} member${p.members.length !== 1 ? 's' : ''}</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${isAdmin ? `
          <button class="btn-secondary btn-sm" onclick="showEditProject()">Edit</button>
          <button class="btn-danger btn-sm" onclick="confirmDeleteProject()">Delete</button>
        ` : ''}
      </div>
    </div>

    <div class="project-detail-tabs">
      <button class="detail-tab ${currentProjectTab === 'tasks' ? 'active' : ''}" onclick="switchProjectTab('tasks')">Tasks</button>
      <button class="detail-tab ${currentProjectTab === 'members' ? 'active' : ''}" onclick="switchProjectTab('members')">Members (${p.members.length})</button>
    </div>

    <div id="project-tab-content"></div>
  `;

  renderProjectTab();
}

function switchProjectTab(tab) {
  currentProjectTab = tab;
  document.querySelectorAll('.detail-tab').forEach(t => t.classList.toggle('active', t.textContent.trim().startsWith(tab === 'tasks' ? 'Tasks' : 'Members')));
  renderProjectTab();
}

async function renderProjectTab() {
  const container = document.getElementById('project-tab-content');
  if (!container) return;
  if (currentProjectTab === 'tasks') await renderTasksTab(container);
  else renderMembersTab(container);
}

async function renderTasksTab(container) {
  ui.loading(container);
  try {
    const tasks = await api.getTasks(currentProject.id);
    const isAdmin = currentProject.role === 'Admin';
    container.innerHTML = `
      <div class="tasks-toolbar">
        <button class="btn-primary btn-sm" onclick="showCreateTask()">+ Add Task</button>
        <select class="filter-select" id="filter-status" onchange="filterTasks()">
          <option value="">All Status</option>
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
        <select class="filter-select" id="filter-priority" onchange="filterTasks()">
          <option value="">All Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>
      ${tasks.length ? `
        <div class="tasks-table-wrap">
          <table class="tasks-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.map(t => `
                <tr>
                  <td class="task-title-cell">${ui.escapeHtml(t.title)}</td>
                  <td>
                    <select class="filter-select" style="font-size:11px;padding:4px 8px" onchange="quickUpdateStatus(${t.id}, this.value)">
                      <option ${t.status==='Todo'?'selected':''}>Todo</option>
                      <option ${t.status==='In Progress'?'selected':''}>In Progress</option>
                      <option ${t.status==='Done'?'selected':''}>Done</option>
                    </select>
                  </td>
                  <td><span class="priority ${t.priority}">${t.priority}</span></td>
                  <td>
                    ${t.assignee_name ? `
                      <div style="display:flex;align-items:center;gap:6px">
                        <div class="member-avatar" style="width:24px;height:24px;font-size:10px">${ui.initials(t.assignee_name)}</div>
                        <span style="font-size:12px">${ui.escapeHtml(t.assignee_name)}</span>
                      </div>` : '<span class="text-muted">—</span>'}
                  </td>
                  <td class="due-date ${t.due_date && ui.isOverdue(t.due_date) && t.status !== 'Done' ? 'overdue' : ''}">${ui.formatDate(t.due_date)}</td>
                  <td>
                    <div class="task-actions">
                      <button class="btn-ghost btn-icon" onclick="showEditTask(${JSON.stringify(t).replace(/"/g,'&quot;')})" title="Edit">
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button class="btn-ghost btn-icon" style="color:var(--red)" onclick="confirmDeleteTask(${t.id})" title="Delete">
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="empty-state">
          <svg viewBox="0 0 24 24"><path d="M9 11l3 3 5-5"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          <h3>No tasks yet</h3>
          <p>Add the first task to this project</p>
        </div>
      `}
    `;
  } catch(e) {
    container.innerHTML = `<p class="text-muted">Error loading tasks: ${e.message}</p>`;
  }
}

async function filterTasks() {
  const status = document.getElementById('filter-status')?.value;
  const priority = document.getElementById('filter-priority')?.value;
  const container = document.getElementById('project-tab-content');
  ui.loading(container);
  const filters = {};
  if (status) filters.status = status;
  if (priority) filters.priority = priority;
  const tasks = await api.getTasks(currentProject.id, filters);
  await renderTasksTab(container);
  // restore filter values
  if (document.getElementById('filter-status')) document.getElementById('filter-status').value = status;
  if (document.getElementById('filter-priority')) document.getElementById('filter-priority').value = priority;
}

async function quickUpdateStatus(taskId, status) {
  try {
    await api.updateTaskStatus(currentProject.id, taskId, status);
    ui.toast('Status updated', 'success');
  } catch(e) {
    ui.toast(e.message, 'error');
  }
}

function renderMembersTab(container) {
  const p = currentProject;
  const isAdmin = p.role === 'Admin';
  container.innerHTML = `
    ${isAdmin ? `
      <div style="margin-bottom:16px">
        <button class="btn-primary btn-sm" onclick="showAddMember()">+ Add Member</button>
      </div>
    ` : ''}
    <div class="members-table-wrap">
      <table class="members-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Role</th>
            <th>Joined</th>
            ${isAdmin ? '<th>Actions</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${p.members.map(m => `
            <tr>
              <td>
                <div class="member-cell">
                  <div class="member-avatar">${ui.initials(m.name)}</div>
                  <div>
                    <div class="member-name">${ui.escapeHtml(m.name)} ${m.id === app.currentUser?.id ? '<span style="color:var(--text-3);font-size:11px">(you)</span>' : ''}</div>
                    <div class="member-email">${ui.escapeHtml(m.email)}</div>
                  </div>
                </div>
              </td>
              <td><span class="role-badge ${m.role}">${m.role}</span></td>
              <td class="text-muted">${ui.formatDate(m.joined_at)}</td>
              ${isAdmin ? `
                <td>
                  <div class="task-actions">
                    ${m.id !== app.currentUser?.id ? `
                      <button class="btn-ghost btn-sm" onclick="changeRole(${m.id}, '${m.role === 'Admin' ? 'Member' : 'Admin'}')">
                        Make ${m.role === 'Admin' ? 'Member' : 'Admin'}
                      </button>
                      <button class="btn-ghost btn-icon" style="color:var(--red)" onclick="confirmRemoveMember(${m.id}, '${ui.escapeHtml(m.name)}')">
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                      </button>
                    ` : '<span class="text-muted text-small">—</span>'}
                  </div>
                </td>
              ` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function showCreateTask() {
  const members = currentProject.members;
  ui.modal.show('New Task', `
    <div class="field">
      <label>Title *</label>
      <input type="text" id="task-title" placeholder="Task title" autofocus />
    </div>
    <div class="field">
      <label>Description</label>
      <textarea id="task-desc" placeholder="Describe the task..."></textarea>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="field">
        <label>Status</label>
        <select id="task-status">
          <option>Todo</option>
          <option>In Progress</option>
          <option>Done</option>
        </select>
      </div>
      <div class="field">
        <label>Priority</label>
        <select id="task-priority">
          <option>Low</option>
          <option selected>Medium</option>
          <option>High</option>
        </select>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="field">
        <label>Assign To</label>
        <select id="task-assignee">
          <option value="">Unassigned</option>
          ${members.map(m => `<option value="${m.id}">${ui.escapeHtml(m.name)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Due Date</label>
        <input type="date" id="task-due" />
      </div>
    </div>
    <div id="task-error" class="form-error hidden"></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="ui.modal.hide()">Cancel</button>
      <button class="btn-primary" onclick="submitCreateTask()">Create Task</button>
    </div>
  `);
}

async function submitCreateTask() {
  const title = document.getElementById('task-title').value.trim();
  const errEl = document.getElementById('task-error');
  if (!title) { errEl.textContent = 'Title is required'; errEl.classList.remove('hidden'); return; }

  try {
    await api.createTask(currentProject.id, {
      title,
      description: document.getElementById('task-desc').value.trim(),
      status: document.getElementById('task-status').value,
      priority: document.getElementById('task-priority').value,
      assigned_to: document.getElementById('task-assignee').value || null,
      due_date: document.getElementById('task-due').value || null,
    });
    ui.modal.hide();
    ui.toast('Task created!', 'success');
    renderTasksTab(document.getElementById('project-tab-content'));
  } catch(e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
  }
}

function showEditTask(task) {
  const members = currentProject.members;
  ui.modal.show('Edit Task', `
    <div class="field">
      <label>Title *</label>
      <input type="text" id="task-title" value="${ui.escapeHtml(task.title)}" />
    </div>
    <div class="field">
      <label>Description</label>
      <textarea id="task-desc">${ui.escapeHtml(task.description || '')}</textarea>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="field">
        <label>Status</label>
        <select id="task-status">
          <option ${task.status==='Todo'?'selected':''}>Todo</option>
          <option ${task.status==='In Progress'?'selected':''}>In Progress</option>
          <option ${task.status==='Done'?'selected':''}>Done</option>
        </select>
      </div>
      <div class="field">
        <label>Priority</label>
        <select id="task-priority">
          <option ${task.priority==='Low'?'selected':''}>Low</option>
          <option ${task.priority==='Medium'?'selected':''}>Medium</option>
          <option ${task.priority==='High'?'selected':''}>High</option>
        </select>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="field">
        <label>Assign To</label>
        <select id="task-assignee">
          <option value="">Unassigned</option>
          ${members.map(m => `<option value="${m.id}" ${task.assigned_to===m.id?'selected':''}>${ui.escapeHtml(m.name)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Due Date</label>
        <input type="date" id="task-due" value="${task.due_date ? task.due_date.split('T')[0] : ''}" />
      </div>
    </div>
    <div id="task-error" class="form-error hidden"></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="ui.modal.hide()">Cancel</button>
      <button class="btn-primary" onclick="submitEditTask(${task.id})">Save Changes</button>
    </div>
  `);
}

async function submitEditTask(taskId) {
  const title = document.getElementById('task-title').value.trim();
  const errEl = document.getElementById('task-error');
  if (!title) { errEl.textContent = 'Title is required'; errEl.classList.remove('hidden'); return; }

  try {
    await api.updateTask(currentProject.id, taskId, {
      title,
      description: document.getElementById('task-desc').value.trim(),
      status: document.getElementById('task-status').value,
      priority: document.getElementById('task-priority').value,
      assigned_to: document.getElementById('task-assignee').value || null,
      due_date: document.getElementById('task-due').value || null,
    });
    ui.modal.hide();
    ui.toast('Task updated!', 'success');
    renderTasksTab(document.getElementById('project-tab-content'));
  } catch(e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
  }
}

function confirmDeleteTask(taskId) {
  ui.modal.show('Delete Task', `
    <p style="color:var(--text-2);margin-bottom:20px">Are you sure you want to delete this task? This cannot be undone.</p>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="ui.modal.hide()">Cancel</button>
      <button class="btn-danger" onclick="submitDeleteTask(${taskId})">Delete Task</button>
    </div>
  `);
}

async function submitDeleteTask(taskId) {
  try {
    await api.deleteTask(currentProject.id, taskId);
    ui.modal.hide();
    ui.toast('Task deleted', 'info');
    renderTasksTab(document.getElementById('project-tab-content'));
  } catch(e) {
    ui.toast(e.message, 'error');
  }
}

function showEditProject() {
  const p = currentProject;
  ui.modal.show('Edit Project', `
    <div class="field">
      <label>Project Name *</label>
      <input type="text" id="proj-name" value="${ui.escapeHtml(p.name)}" />
    </div>
    <div class="field">
      <label>Description</label>
      <textarea id="proj-desc">${ui.escapeHtml(p.description || '')}</textarea>
    </div>
    <div id="proj-error" class="form-error hidden"></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="ui.modal.hide()">Cancel</button>
      <button class="btn-primary" onclick="submitEditProject()">Save Changes</button>
    </div>
  `);
}

async function submitEditProject() {
  const name = document.getElementById('proj-name').value.trim();
  const errEl = document.getElementById('proj-error');
  if (!name) { errEl.textContent = 'Name required'; errEl.classList.remove('hidden'); return; }
  try {
    await api.updateProject(currentProject.id, { name, description: document.getElementById('proj-desc').value.trim() });
    ui.modal.hide();
    ui.toast('Project updated!', 'success');
    currentProject = await api.getProject(currentProject.id);
    renderProjectDetailContent();
  } catch(e) {
    errEl.textContent = e.message; errEl.classList.remove('hidden');
  }
}

function confirmDeleteProject() {
  ui.modal.show('Delete Project', `
    <p style="color:var(--text-2);margin-bottom:8px">This will permanently delete <strong>${ui.escapeHtml(currentProject.name)}</strong> and all its tasks.</p>
    <p style="color:var(--red);font-size:13px;margin-bottom:20px">This action cannot be undone.</p>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="ui.modal.hide()">Cancel</button>
      <button class="btn-danger" onclick="submitDeleteProject()">Delete Project</button>
    </div>
  `);
}

async function submitDeleteProject() {
  try {
    await api.deleteProject(currentProject.id);
    ui.modal.hide();
    ui.toast('Project deleted', 'info');
    app.navigate('projects');
  } catch(e) {
    ui.toast(e.message, 'error');
  }
}

function showAddMember() {
  ui.modal.show('Add Member', `
    <p style="color:var(--text-2);font-size:13px;margin-bottom:16px">The user must already have an account in TaskFlow.</p>
    <div class="field">
      <label>Email Address *</label>
      <input type="email" id="member-email" placeholder="member@example.com" autofocus />
    </div>
    <div class="field">
      <label>Role</label>
      <select id="member-role">
        <option value="Member">Member</option>
        <option value="Admin">Admin</option>
      </select>
    </div>
    <div id="member-error" class="form-error hidden"></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="ui.modal.hide()">Cancel</button>
      <button class="btn-primary" onclick="submitAddMember()">Add Member</button>
    </div>
  `);
}

async function submitAddMember() {
  const email = document.getElementById('member-email').value.trim();
  const role = document.getElementById('member-role').value;
  const errEl = document.getElementById('member-error');
  if (!email) { errEl.textContent = 'Email required'; errEl.classList.remove('hidden'); return; }
  try {
    await api.addMember(currentProject.id, email, role);
    ui.modal.hide();
    ui.toast('Member added!', 'success');
    currentProject = await api.getProject(currentProject.id);
    renderProjectDetailContent();
  } catch(e) {
    errEl.textContent = e.message; errEl.classList.remove('hidden');
  }
}

async function changeRole(userId, newRole) {
  try {
    await api.updateMemberRole(currentProject.id, userId, newRole);
    ui.toast('Role updated', 'success');
    currentProject = await api.getProject(currentProject.id);
    renderMembersTab(document.getElementById('project-tab-content'));
  } catch(e) {
    ui.toast(e.message, 'error');
  }
}

function confirmRemoveMember(userId, name) {
  ui.modal.show('Remove Member', `
    <p style="color:var(--text-2);margin-bottom:20px">Remove <strong>${ui.escapeHtml(name)}</strong> from this project?</p>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="ui.modal.hide()">Cancel</button>
      <button class="btn-danger" onclick="submitRemoveMember(${userId})">Remove</button>
    </div>
  `);
}

async function submitRemoveMember(userId) {
  try {
    await api.removeMember(currentProject.id, userId);
    ui.modal.hide();
    ui.toast('Member removed', 'info');
    currentProject = await api.getProject(currentProject.id);
    renderProjectDetailContent();
  } catch(e) {
    ui.toast(e.message, 'error');
  }
}
