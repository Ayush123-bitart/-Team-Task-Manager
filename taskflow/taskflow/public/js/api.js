const API_BASE = '/api';

const api = {
  getToken() { return localStorage.getItem('tf_token'); },
  setToken(t) { localStorage.setItem('tf_token', t); },
  clearToken() { localStorage.removeItem('tf_token'); localStorage.removeItem('tf_user'); },

  async req(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const token = this.getToken();
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(API_BASE + path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  get(path) { return this.req('GET', path); },
  post(path, body) { return this.req('POST', path, body); },
  put(path, body) { return this.req('PUT', path, body); },
  patch(path, body) { return this.req('PATCH', path, body); },
  delete(path) { return this.req('DELETE', path); },

  // Auth
  login(email, password) { return this.post('/auth/login', { email, password }); },
  signup(name, email, password) { return this.post('/auth/signup', { name, email, password }); },
  me() { return this.get('/auth/me'); },

  // Dashboard
  dashboard() { return this.get('/dashboard'); },

  // Projects
  getProjects() { return this.get('/projects'); },
  getProject(id) { return this.get(`/projects/${id}`); },
  createProject(data) { return this.post('/projects', data); },
  updateProject(id, data) { return this.put(`/projects/${id}`, data); },
  deleteProject(id) { return this.delete(`/projects/${id}`); },
  addMember(projectId, email, role) { return this.post(`/projects/${projectId}/members`, { email, memberRole: role }); },
  updateMemberRole(projectId, userId, role) { return this.put(`/projects/${projectId}/members/${userId}`, { role }); },
  removeMember(projectId, userId) { return this.delete(`/projects/${projectId}/members/${userId}`); },

  // Tasks
  getTasks(projectId, filters = {}) {
    const q = new URLSearchParams(filters).toString();
    return this.get(`/projects/${projectId}/tasks${q ? '?' + q : ''}`);
  },
  createTask(projectId, data) { return this.post(`/projects/${projectId}/tasks`, data); },
  updateTask(projectId, taskId, data) { return this.put(`/projects/${projectId}/tasks/${taskId}`, data); },
  updateTaskStatus(projectId, taskId, status) { return this.patch(`/projects/${projectId}/tasks/${taskId}/status`, { status }); },
  deleteTask(projectId, taskId) { return this.delete(`/projects/${projectId}/tasks/${taskId}`); },
};
