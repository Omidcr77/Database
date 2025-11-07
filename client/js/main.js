import { api } from './api.js';
import { auth } from './auth.js';
import { dashboard } from './dashboard.js';
import { initCustomers, load as loadCustomers } from './customers.js';
import { initReports } from './reports.js';
import { initProfile, renderProfile } from './profile.js';
import { adminPanel } from './admin.js';
import { initSocket, on } from './socket.js';
import { showToast, initTheme } from './ui.js';

async function init() {
  initTheme();
  
  // Enhanced theme toggle with icon switching
  document.getElementById('theme-toggle').onclick = () => {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  // Auth check
  try {
    await auth.me();
  } catch {
    window.location.href = '/login.html';
    return;
  }

  document.getElementById('user-display').textContent = `${auth.currentUser.username} (${auth.currentUser.role})`;
  document.getElementById('logout-btn').onclick = () => auth.logout();

  // Permissions based UI
  const isAdmin = auth.currentUser.role === 'admin';
  document.getElementById('admin-tab').classList.toggle('hidden', !isAdmin);
  document.getElementById('add-customer-btn').classList.toggle('hidden', !(isAdmin || auth.currentUser.role === 'manager'));

  // Enhanced navigation with icons
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const sec = btn.dataset.section;
      document.querySelectorAll('.section').forEach((s) => s.classList.add('hidden'));
      document.getElementById('section-' + sec).classList.remove('hidden');
      if (sec === 'dashboard') dashboard.load();
      if (sec === 'customers') loadCustomers();
      if (sec === 'reports') {/* nothing */}
      if (sec === 'profile') renderProfile();
      if (sec === 'admin') adminPanel.load();
    });
  });

  // Init sections
  initCustomers();
  initReports();
  initProfile();
  await dashboard.load();

  // Socket
  initSocket();
  on('customer:created', async () => { await loadCustomers(); });
  on('customer:updated', async () => { await loadCustomers(); });
  on('customer:deleted', async () => { await loadCustomers(); });
  on('transaction:created', async () => { await loadCustomers(); });
  on('transaction:deleted', async () => { await loadCustomers(); });
  on('stats:updated', async () => { await dashboard.load(); });

  // Handle shared customer link
  if (location.hash.startsWith('#customer=')) {
    const id = location.hash.split('=')[1];
    try {
      const { customer } = await api.get(`/api/customers/${id}`);
      const sectionBtn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.dataset.section==='customers');
      sectionBtn?.click();
      const module = await import('./customers.js');
      module.openCustomer(customer);
    } catch {}
  }
}

init().catch((e) => { 
  console.error(e); 
  showToast(e.message || 'Initialization failed', 'error'); 
});
