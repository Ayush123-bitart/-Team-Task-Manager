async function renderDashboard() {
  const view = document.getElementById('view-dashboard');
  ui.loading(view);
  try {
    const data = await api.dashboard();
    const { projectCount, taskStats, myTasks, overdueTasks, recentProjects } = data;

    view.innerHTML = `
      <div class="view-header">
        <div>
          <h2>Dashboard</h2>
          <p>Welcome back, ${ui.escapeHtml(app.currentUser?.name || '')}</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card accent">
          <div class="stat-label">Projects</div>
          <div class="stat-value">${projectCount}</div>
          <div class="stat-sub">You're a member of</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Tasks</div>
          <div class="stat-value">${taskStats.total}</div>
          <div class="stat-sub">Across all projects</div>
        </div>
        <div class="stat-card green">
          <div class="stat-label">Completed</div>
          <div class="stat-value">${taskStats.done}</div>
          <div class="stat-sub">Tasks done</div>
        </div>
        <div class="stat-card yellow">
          <div class="stat-label">In Progress</div>
          <div class="stat-value">${taskStats.in_progress}</div>
          <div class="stat-sub">Active tasks</div>
        </div>
        <div class="stat-card red">
          <div class="stat-label">Overdue</div>
          <div class="stat-value">${taskStats.overdue}</div>
          <div class="stat-sub">Need attention</div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="section-title">My Tasks</div>
          ${myTasks.length ? `<div class="task-list">${myTasks.map(t => `
            <div class="task-item" onclick="app.navigate('project-detail', ${t.project_id})">
              <div class="task-status-dot ${ui.statusDotClass(t.status)}"></div>
              <span class="task-item-title">${ui.escapeHtml(t.title)}</span>
              <div class="task-item-meta">
                <span class="priority ${t.priority}">${t.priority}</span>
                <span class="task-project-badge">${ui.escapeHtml(t.project_name)}</span>
                ${t.due_date ? `<span class="due-date ${ui.isOverdue(t.due_date) ? 'overdue' : ''}">${ui.formatDate(t.due_date)}</span>` : ''}
              </div>
            </div>
          `).join('')}</div>` : '<p class="text-muted text-small">No tasks assigned to you.</p>'}
        </div>

        <div class="card">
          <div class="section-title">Overdue Tasks ${overdueTasks.length ? `<span style="color:var(--red)">(${overdueTasks.length})</span>` : ''}</div>
          ${overdueTasks.length ? `<div class="task-list">${overdueTasks.map(t => `
            <div class="task-item" onclick="app.navigate('project-detail', ${t.project_id})">
              <div class="task-status-dot ${ui.statusDotClass(t.status)}"></div>
              <span class="task-item-title">${ui.escapeHtml(t.title)}</span>
              <div class="task-item-meta">
                <span class="overdue-tag">Due ${ui.formatDate(t.due_date)}</span>
                <span class="task-project-badge">${ui.escapeHtml(t.project_name)}</span>
              </div>
            </div>
          `).join('')}</div>` : '<p class="text-muted text-small">No overdue tasks. 🎉</p>'}
        </div>

        <div class="card" style="grid-column: 1 / -1;">
          <div class="section-title">Recent Projects</div>
          ${recentProjects.length ? `<div class="projects-grid" style="margin-top:0">${recentProjects.map(p => {
            const pct = p.task_count ? Math.round((p.done_count / p.task_count) * 100) : 0;
            return `<div class="project-card" onclick="app.navigate('project-detail', ${p.id})">
              <div class="project-card-header">
                <span class="project-name">${ui.escapeHtml(p.name)}</span>
                <span class="role-badge ${p.role}">${p.role}</span>
              </div>
              <div class="project-desc">${ui.escapeHtml(p.description || 'No description')}</div>
              <div class="project-progress">
                <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
                <div class="progress-text">${p.done_count}/${p.task_count} tasks done</div>
              </div>
            </div>`;
          }).join('')}</div>` : '<p class="text-muted text-small">No projects yet.</p>'}
        </div>
      </div>
    `;
  } catch(e) {
    view.innerHTML = `<p class="text-muted">Failed to load dashboard: ${e.message}</p>`;
  }
}
