async function renderProjects() {
  const view = document.getElementById('view-projects');
  ui.loading(view);
  try {
    const projects = await api.getProjects();
    view.innerHTML = `
      <div class="view-header">
        <div>
          <h2>Projects</h2>
          <p>${projects.length} project${projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button class="btn-primary" onclick="showCreateProject()">+ New Project</button>
      </div>
      ${projects.length ? `
        <div class="projects-grid">
          ${projects.map(p => {
            const pct = p.task_count ? Math.round((p.done_count / p.task_count) * 100) : 0;
            return `<div class="project-card" onclick="app.navigate('project-detail', ${p.id})">
              <div class="project-card-header">
                <span class="project-name">${ui.escapeHtml(p.name)}</span>
                <span class="role-badge ${p.role}">${p.role}</span>
              </div>
              <div class="project-desc">${ui.escapeHtml(p.description || 'No description provided.')}</div>
              <div class="project-progress">
                <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
                <div class="progress-text">${p.done_count}/${p.task_count} tasks completed</div>
              </div>
              <div class="project-meta">
                <span class="project-meta-item">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  ${p.member_count} member${p.member_count !== 1 ? 's' : ''}
                </span>
                <span class="project-meta-item">
                  <svg viewBox="0 0 24 24"><path d="M9 11l3 3 5-5"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                  ${p.task_count} task${p.task_count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>`;
          }).join('')}
        </div>
      ` : `
        <div class="no-projects-hero">
          <svg viewBox="0 0 24 24" style="width:64px;height:64px;stroke:var(--text-3);margin-bottom:16px"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button class="btn-primary" onclick="showCreateProject()">+ Create Project</button>
        </div>
      `}
    `;
  } catch(e) {
    view.innerHTML = `<p class="text-muted">Error: ${e.message}</p>`;
  }
}

function showCreateProject() {
  ui.modal.show('New Project', `
    <div class="field">
      <label>Project Name *</label>
      <input type="text" id="proj-name" placeholder="e.g. Website Redesign" autofocus />
    </div>
    <div class="field">
      <label>Description</label>
      <textarea id="proj-desc" placeholder="What is this project about?"></textarea>
    </div>
    <div id="proj-error" class="form-error hidden"></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="ui.modal.hide()">Cancel</button>
      <button class="btn-primary" onclick="submitCreateProject()">Create Project</button>
    </div>
  `);
  setTimeout(() => document.getElementById('proj-name')?.focus(), 50);
}

async function submitCreateProject() {
  const name = document.getElementById('proj-name').value.trim();
  const description = document.getElementById('proj-desc').value.trim();
  const errEl = document.getElementById('proj-error');
  if (!name) { errEl.textContent = 'Project name is required'; errEl.classList.remove('hidden'); return; }

  try {
    const project = await api.createProject({ name, description });
    ui.modal.hide();
    ui.toast('Project created!', 'success');
    app.navigate('project-detail', project.id);
  } catch(e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
  }
}
