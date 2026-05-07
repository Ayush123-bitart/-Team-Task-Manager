async function renderMyTasks() {
  const view = document.getElementById('view-my-tasks');
  ui.loading(view);
  try {
    const data = await api.dashboard();
    const { myTasks, taskStats } = data;
    view.innerHTML = `
      <div class="view-header">
        <div>
          <h2>My Tasks</h2>
          <p>Tasks assigned to you</p>
        </div>
      </div>

      <div class="stats-grid" style="margin-bottom:24px">
        <div class="stat-card">
          <div class="stat-label">Total</div>
          <div class="stat-value">${myTasks.length}</div>
        </div>
        <div class="stat-card yellow">
          <div class="stat-label">In Progress</div>
          <div class="stat-value">${myTasks.filter(t=>t.status==='In Progress').length}</div>
        </div>
        <div class="stat-card red">
          <div class="stat-label">Overdue</div>
          <div class="stat-value">${myTasks.filter(t=>t.due_date && ui.isOverdue(t.due_date)).length}</div>
        </div>
      </div>

      ${myTasks.length ? `
        <div class="card" style="padding:0;overflow:hidden">
          <div class="tasks-table-wrap">
            <table class="tasks-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Go To</th>
                </tr>
              </thead>
              <tbody>
                ${myTasks.map(t => `
                  <tr>
                    <td class="task-title-cell">${ui.escapeHtml(t.title)}</td>
                    <td><span class="task-project-badge">${ui.escapeHtml(t.project_name)}</span></td>
                    <td><span class="status-badge ${ui.statusBadgeClass(t.status)}">${t.status}</span></td>
                    <td><span class="priority ${t.priority}">${t.priority}</span></td>
                    <td class="due-date ${t.due_date && ui.isOverdue(t.due_date) ? 'overdue' : ''}">${ui.formatDate(t.due_date)}</td>
                    <td>
                      <button class="btn-ghost btn-sm" onclick="app.navigate('project-detail', ${t.project_id})">
                        Open →
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : `
        <div class="empty-state">
          <svg viewBox="0 0 24 24"><path d="M9 11l3 3 5-5"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          <h3>No tasks assigned</h3>
          <p>You don't have any tasks assigned to you yet</p>
        </div>
      `}
    `;
  } catch(e) {
    view.innerHTML = `<p class="text-muted">Error: ${e.message}</p>`;
  }
}
