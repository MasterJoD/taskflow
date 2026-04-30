// ==============================
// CONFIG
// ==============================
const API = ''; // Empty = same origin (works for both local and deployed)

// ==============================
// TOAST NOTIFICATIONS
// ==============================
function toast(msg, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

// ==============================
// STATE
// ==============================
let token = localStorage.getItem('tf_token');
let currentUser = JSON.parse(localStorage.getItem('tf_user') || 'null');
let currentProjectId = null;
let currentProjectRole = null;
let currentTaskId = null;
let currentProjectMembers = [];
let currentTaskData = null;

// ==============================
// INIT
// ==============================
window.addEventListener('DOMContentLoaded', () => {
  if (token && currentUser) {
    showApp();
  } else {
    showScreen('auth-screen');
  }
});

// ==============================
// SCREEN / VIEW HELPERS
// ==============================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  const el = document.getElementById(id);
  el.classList.add('active');
  el.classList.remove('hidden');
}

function showView(name) {
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
    v.classList.add('hidden');
  });
  const el = document.getElementById('view-' + name);
  el.classList.add('active');
  el.classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const navEl = document.getElementById('nav-' + name);
  if (navEl) navEl.classList.add('active');

  if (name === 'dashboard') loadDashboard();
  if (name === 'projects') loadProjects();
}

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  // Clear errors when closing
  document.querySelectorAll(`#${id} .form-error`).forEach(e => e.classList.add('hidden'));
  document.querySelectorAll(`#${id} .form-success`).forEach(e => e.classList.add('hidden'));
}

// Close modals when clicking backdrop
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});

// ==============================
// AUTH
// ==============================
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('signup-form').classList.toggle('hidden', tab !== 'signup');
}

async function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');

  if (!email || !password) return showError(errEl, 'Please fill in all fields');

  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Signing in...';

  try {
    const res = await api('POST', '/api/auth/login', { email, password }, false);
    saveSession(res.token, res.user);
    showApp();
  } catch (err) {
    showError(errEl, err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In →';
  }
}

async function signup() {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const errEl = document.getElementById('signup-error');
  errEl.classList.add('hidden');

  if (!name || !email || !password) return showError(errEl, 'Please fill in all fields');

  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Creating account...';

  try {
    const res = await api('POST', '/api/auth/signup', { name, email, password }, false);
    saveSession(res.token, res.user);
    showApp();
  } catch (err) {
    showError(errEl, err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account →';
  }
}

function saveSession(t, user) {
  token = t;
  currentUser = user;
  localStorage.setItem('tf_token', t);
  localStorage.setItem('tf_user', JSON.stringify(user));
}

function logout() {
  if (!confirm('Log out of TaskFlow?')) return;
  token = null;
  currentUser = null;
  localStorage.removeItem('tf_token');
  localStorage.removeItem('tf_user');
  showScreen('auth-screen');
}

function showApp() {
  showScreen('app-screen');
  document.getElementById('sidebar-name').textContent = currentUser.name;
  document.getElementById('sidebar-email').textContent = currentUser.email;
  const avatar = document.getElementById('sidebar-avatar');
  avatar.textContent = currentUser.name.charAt(0).toUpperCase();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('dashboard-greeting').textContent = `${greeting}, ${currentUser.name.split(' ')[0]} 👋`;

  showView('dashboard');
}

// ==============================
// API HELPER
// ==============================
async function api(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // If 401, auto logout
  if (res.status === 401) {
    logout();
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ==============================
// DASHBOARD
// ==============================
async function loadDashboard() {
  try {
    const stats = await api('GET', '/api/tasks/dashboard');
    document.getElementById('stat-projects').textContent = stats.totalProjects;
    document.getElementById('stat-tasks').textContent = stats.totalTasks;
    document.getElementById('stat-my-tasks').textContent = stats.myTasks;
    document.getElementById('stat-overdue').textContent = stats.overdue;

    const total = stats.totalTasks || 1;
    const { todo, inProgress, done } = stats.tasksByStatus;

    document.getElementById('bar-todo-count').textContent = todo;
    document.getElementById('bar-inprogress-count').textContent = inProgress;
    document.getElementById('bar-done-count').textContent = done;

    document.getElementById('bar-todo').style.width = `${(todo / total) * 100}%`;
    document.getElementById('bar-inprogress').style.width = `${(inProgress / total) * 100}%`;
    document.getElementById('bar-done').style.width = `${(done / total) * 100}%`;
  } catch (err) {
    console.error('Dashboard error:', err);
  }
}

// ==============================
// PROJECTS
// ==============================
async function loadProjects() {
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = '<div class="empty-state"><div class="spinner"></div></div>';

  try {
    const projects = await api('GET', '/api/projects');

    if (projects.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">◈</div>
          <p>No projects yet.</p>
          <p style="margin-top:4px; font-size:12px">Create your first project to get started!</p>
        </div>`;
      return;
    }

    grid.innerHTML = '';
    for (const p of projects) {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.onclick = () => openProject(p._id);

      card.innerHTML = `
        <div class="project-card-header">
          <div class="project-card-name">${escHtml(p.name)}</div>
          <span class="role-badge ${p.role}">${p.role}</span>
        </div>
        <div class="project-card-desc">${escHtml(p.description || 'No description added yet.')}</div>
        <div class="project-card-footer">
          <span class="project-owner">by ${escHtml(p.ownerName)}</span>
          <span class="project-task-count" id="task-count-${p._id}">loading...</span>
        </div>
      `;
      grid.appendChild(card);

      // Load task count async
      api('GET', `/api/tasks?projectId=${p._id}`)
        .then(tasks => {
          const el = document.getElementById(`task-count-${p._id}`);
          if (el) el.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
        })
        .catch(() => {
          const el = document.getElementById(`task-count-${p._id}`);
          if (el) el.textContent = '';
        });
    }
  } catch (err) {
    grid.innerHTML = '<div class="empty-state">Error loading projects. Please refresh.</div>';
  }
}

async function createProject() {
  const name = document.getElementById('new-project-name').value.trim();
  const description = document.getElementById('new-project-desc').value.trim();
  const errEl = document.getElementById('create-project-error');
  errEl.classList.add('hidden');

  if (!name) return showError(errEl, 'Project name is required');

  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Creating...';

  try {
    await api('POST', '/api/projects', { name, description });
    closeModal('create-project-modal');
    document.getElementById('new-project-name').value = '';
    document.getElementById('new-project-desc').value = '';
    toast('Project created!');
    loadProjects();
  } catch (err) {
    showError(errEl, err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Project';
  }
}

async function deleteProject() {
  if (!currentProjectId) return;
  if (!confirm('Delete this project and ALL its tasks? This cannot be undone.')) return;

  try {
    await api('DELETE', `/api/projects/${currentProjectId}`);
    toast('Project deleted', 'error');
    showView('projects');
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ==============================
// PROJECT DETAIL
// ==============================
async function openProject(id) {
  currentProjectId = id;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  showView('project-detail');

  // Show loading state
  document.getElementById('project-detail-name').textContent = 'Loading...';
  document.getElementById('project-detail-desc').textContent = '';
  document.getElementById('members-strip').innerHTML = '';
  ['todo', 'inprogress', 'done'].forEach(col => {
    document.getElementById(`col-${col}`).innerHTML = '<div class="task-loading">Loading...</div>';
  });

  try {
    const project = await api('GET', `/api/projects/${id}`);
    currentProjectRole = project.role;
    currentProjectMembers = project.members;

    document.getElementById('project-detail-name').textContent = project.name;
    document.getElementById('project-detail-desc').textContent = project.description || '';

    // Show/hide admin actions
    const adminActions = document.getElementById('admin-actions');
    adminActions.style.display = project.role === 'admin' ? 'flex' : 'none';

    // Show/hide delete project button
    const delBtn = document.getElementById('delete-project-btn');
    if (delBtn) delBtn.style.display = project.role === 'admin' ? 'inline-flex' : 'none';

    renderMembers(project.members);
    loadTasks(id);
  } catch (err) {
    document.getElementById('project-detail-name').textContent = 'Error loading project';
    console.error(err);
  }
}

function renderMembers(members) {
  const strip = document.getElementById('members-strip');
  strip.innerHTML = members.map(m => `
    <div class="member-chip">
      <div class="user-avatar" style="background:${colorFromName(m.name)}">${(m.name || '?').charAt(0).toUpperCase()}</div>
      <span class="member-chip-name">${escHtml(m.name || 'Unknown')}</span>
      <span class="member-chip-role">${m.role}</span>
      ${currentProjectRole === 'admin' && m.role !== 'admin'
        ? `<button class="remove-member-btn" onclick="removeMember('${m.userId}', event)" title="Remove">✕</button>`
        : ''}
    </div>
  `).join('');
}

async function removeMember(userId, e) {
  e.stopPropagation();
  if (!confirm('Remove this member from the project?')) return;
  try {
    await api('DELETE', `/api/projects/${currentProjectId}/members/${userId}`);
    toast('Member removed');
    openProject(currentProjectId);
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function loadTasks(projectId) {
  ['todo', 'inprogress', 'done'].forEach(col => {
    document.getElementById(`col-${col}`).innerHTML = '';
    document.getElementById(`col-count-${col}`).textContent = '0';
  });

  try {
    const tasks = await api('GET', `/api/tasks?projectId=${projectId}`);
    const colMap = { 'todo': 'todo', 'in-progress': 'inprogress', 'done': 'done' };
    const counts = { todo: 0, inprogress: 0, done: 0 };

    tasks.forEach(task => {
      const colKey = colMap[task.status] || 'todo';
      counts[colKey]++;
      document.getElementById(`col-${colKey}`).appendChild(buildTaskCard(task));
    });

    Object.entries(counts).forEach(([col, count]) => {
      document.getElementById(`col-count-${col}`).textContent = count;
    });

    populateAssigneeDropdown();
  } catch (err) {
    console.error('Task load error:', err);
  }
}

function buildTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.onclick = () => openTask(task);

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.dueDate && task.dueDate < today && task.status !== 'done';
  const dueText = task.dueDate
    ? `<span class="task-due ${isOverdue ? 'overdue' : ''}">${isOverdue ? '⚠ ' : '📅 '}${formatDate(task.dueDate)}</span>`
    : '';

  const assigneeText = task.assigneeName
    ? `<span class="task-assignee">@${escHtml(task.assigneeName.split(' ')[0])}</span>`
    : '';

  const descPreview = task.description
    ? `<div class="task-card-desc">${escHtml(task.description.substring(0, 70))}${task.description.length > 70 ? '...' : ''}</div>`
    : '';

  card.innerHTML = `
    <div class="task-card-title">${escHtml(task.title)}</div>
    ${descPreview}
    <div class="task-card-meta">
      <span class="priority-tag priority-${task.priority}">${task.priority}</span>
      ${dueText}
      ${assigneeText}
    </div>
  `;
  return card;
}

// ==============================
// TASK MODAL
// ==============================
function openTask(task) {
  currentTaskId = task._id;
  currentTaskData = task;

  document.getElementById('task-detail-title').textContent = task.title;
  document.getElementById('task-detail-desc').textContent = task.description || 'No description provided.';
  document.getElementById('task-detail-assignee').textContent = task.assigneeName || 'Unassigned';

  const priorityEl = document.getElementById('task-detail-priority');
  priorityEl.textContent = capitalize(task.priority);
  priorityEl.className = `priority-tag priority-${task.priority}`;

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.dueDate && task.dueDate < today && task.status !== 'done';
  const dueEl = document.getElementById('task-detail-due');
  dueEl.textContent = task.dueDate ? formatDate(task.dueDate) : 'No due date';
  dueEl.className = isOverdue ? 'overdue-text' : '';

  document.getElementById('task-detail-status').value = task.status;

  // Admin buttons
  const adminActions = document.getElementById('task-detail-admin-actions');
  adminActions.classList.toggle('hidden', currentProjectRole !== 'admin');

  openModal('task-detail-modal');
}

async function updateTaskStatus() {
  const newStatus = document.getElementById('task-detail-status').value;
  try {
    await api('PUT', `/api/tasks/${currentTaskId}`, { status: newStatus });
    toast('Status updated!');
    closeModal('task-detail-modal');
    loadTasks(currentProjectId);
    loadDashboard();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteCurrentTask() {
  if (!confirm('Delete this task? This cannot be undone.')) return;
  try {
    await api('DELETE', `/api/tasks/${currentTaskId}`);
    toast('Task deleted', 'error');
    closeModal('task-detail-modal');
    loadTasks(currentProjectId);
    loadDashboard();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ==============================
// CREATE TASK
// ==============================
function populateAssigneeDropdown() {
  const sel = document.getElementById('new-task-assignee');
  sel.innerHTML = '<option value="">Unassigned</option>';
  currentProjectMembers.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.userId;
    opt.textContent = m.name || m.email || 'Unknown';
    sel.appendChild(opt);
  });
}

async function createTask() {
  const title = document.getElementById('new-task-title').value.trim();
  const description = document.getElementById('new-task-desc').value.trim();
  const assigneeId = document.getElementById('new-task-assignee').value;
  const priority = document.getElementById('new-task-priority').value;
  const dueDate = document.getElementById('new-task-due').value;
  const errEl = document.getElementById('create-task-error');
  errEl.classList.add('hidden');

  if (!title) return showError(errEl, 'Task title is required');

  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Adding...';

  try {
    await api('POST', '/api/tasks', {
      projectId: currentProjectId,
      title,
      description,
      assigneeId: assigneeId || null,
      priority,
      dueDate: dueDate || null,
    });

    closeModal('create-task-modal');
    document.getElementById('new-task-title').value = '';
    document.getElementById('new-task-desc').value = '';
    document.getElementById('new-task-due').value = '';
    toast('Task created!');
    loadTasks(currentProjectId);
    loadDashboard();
  } catch (err) {
    showError(errEl, err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Add Task';
  }
}

// ==============================
// INVITE MEMBER
// ==============================
async function inviteMember() {
  const email = document.getElementById('invite-email').value.trim();
  const errEl = document.getElementById('invite-error');
  const successEl = document.getElementById('invite-success');
  errEl.classList.add('hidden');
  successEl.classList.add('hidden');

  if (!email) return showError(errEl, 'Email is required');

  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Inviting...';

  try {
    const res = await api('POST', `/api/projects/${currentProjectId}/invite`, { email });
    successEl.textContent = `${res.user.name} has been added to the project!`;
    successEl.classList.remove('hidden');
    document.getElementById('invite-email').value = '';

    setTimeout(() => {
      closeModal('invite-modal');
      openProject(currentProjectId);
    }, 1500);
  } catch (err) {
    showError(errEl, err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send Invite';
  }
}

// ==============================
// UTILS
// ==============================
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function colorFromName(name) {
  const colors = ['#e8572a', '#2a6ee8', '#22a06b', '#d97706', '#7c3aed', '#db2777'];
  if (!name) return colors[0];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}
