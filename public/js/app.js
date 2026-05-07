const app = {
  currentUser: null,
  currentView: 'dashboard',

  async init() {
    // Auth tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.getElementById('login-form').classList.toggle('hidden', target !== 'login');
        document.getElementById('signup-form').classList.toggle('hidden', target !== 'signup');
      });
    });

    // Login form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const errEl = document.getElementById('login-error');
      try {
        const { user, token } = await api.login(email, password);
        api.setToken(token);
        localStorage.setItem('tf_user', JSON.stringify(user));
        this.currentUser = user;
        this.showApp();
      } catch(e) {
        errEl.textContent = e.message;
        errEl.classList.remove('hidden');
      }
    });

    // Signup form
    document.getElementById('signup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const errEl = document.getElementById('signup-error');
      try {
        const { user, token } = await api.signup(name, email, password);
        api.setToken(token);
        localStorage.setItem('tf_user', JSON.stringify(user));
        this.currentUser = user;
        this.showApp();
      } catch(e) {
        errEl.textContent = e.message;
        errEl.classList.remove('hidden');
      }
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
      api.clearToken();
      this.currentUser = null;
      document.getElementById('app-layout').classList.add('hidden');
      document.getElementById('auth-screen').classList.remove('hidden');
    });

    // Modal close
    document.getElementById('modal-close').addEventListener('click', () => ui.modal.hide());
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-overlay')) ui.modal.hide();
    });

    // Nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => this.navigate(item.dataset.view));
    });

    // Check existing session
    const token = api.getToken();
    if (token) {
      try {
        this.currentUser = await api.me();
        localStorage.setItem('tf_user', JSON.stringify(this.currentUser));
        this.showApp();
        return;
      } catch {
        api.clearToken();
      }
    }

    document.getElementById('auth-screen').classList.remove('hidden');
  },

  showApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-layout').classList.remove('hidden');

    // Set user info
    const name = this.currentUser?.name || '';
    const email = this.currentUser?.email || '';
    document.getElementById('user-name-sidebar').textContent = name;
    document.getElementById('user-email-sidebar').textContent = email;
    document.getElementById('user-avatar').textContent = ui.initials(name);

    this.navigate('dashboard');
  },

  navigate(view, id) {
    this.currentView = view;
    const views = ['dashboard', 'projects', 'my-tasks', 'project-detail'];

    // Hide all views
    views.forEach(v => document.getElementById(`view-${v}`)?.classList.add('hidden'));

    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === view);
    });

    const viewEl = document.getElementById(`view-${view}`);
    if (viewEl) viewEl.classList.remove('hidden');

    switch(view) {
      case 'dashboard': renderDashboard(); break;
      case 'projects': renderProjects(); break;
      case 'my-tasks': renderMyTasks(); break;
      case 'project-detail': renderProjectDetail(id); break;
    }
  }
};

app.init();
