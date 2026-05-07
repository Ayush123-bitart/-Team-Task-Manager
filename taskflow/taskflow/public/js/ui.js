const ui = {
  toast(msg, type = 'info', duration = 3000) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => el.remove(), duration);
  },

  modal: {
    show(title, bodyHTML, opts = {}) {
      document.getElementById('modal-title').textContent = title;
      document.getElementById('modal-body').innerHTML = bodyHTML;
      document.getElementById('modal-overlay').classList.remove('hidden');
      if (opts.onShow) opts.onShow();
    },
    hide() {
      document.getElementById('modal-overlay').classList.add('hidden');
    }
  },

  loading(container) {
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  },

  initials(name = '') {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  },

  formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  isOverdue(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date(new Date().toDateString());
  },

  statusDotClass(status) {
    return status === 'Todo' ? 'todo' : status === 'In Progress' ? 'in-progress' : 'done';
  },

  statusBadgeClass(status) {
    return status.replace(' ', '-');
  },

  escapeHtml(str = '') {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
};
