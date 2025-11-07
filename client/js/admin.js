import { api } from './api.js';
import { requireRole } from './auth.js';
import { showToast, formModal } from './ui.js';
import { t } from './i18n.js';

export const adminPanel = {
  async load() {
    if (!requireRole('admin')) return;
    const data = await api.get('/api/users');
    const list = document.getElementById('users-list');
    list.innerHTML = '';
    data.users.forEach((u) => {
      const div = document.createElement('div');
      div.className = 'p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex justify-between items-center';
      div.innerHTML = `
        <div>
          <div class="font-semibold">${u.username} ${u.isBlocked ? '<span class=\'text-xs text-red-600\'>(' + t('blocked') + ')</span>' : ''}</div>
          <div class="text-xs text-gray-500">${u.name || ''} • ${u.role}</div>
        </div>
        <div class="flex gap-2 items-center">
          <select data-role class="form-input text-xs w-28 p-1">
            <option ${u.role==='viewer'?'selected':''}>${t('role_viewer')}</option>
            <option ${u.role==='manager'?'selected':''}>${t('role_manager')}</option>
            <option ${u.role==='admin'?'selected':''}>${t('role_admin')}</option>
          </select>
          <button data-block class="px-2 py-1 text-xs rounded ${u.isBlocked ? 'bg-green-600' : 'bg-yellow-600'} text-white">${u.isBlocked ? t('unblock') : t('block')}</button>
          <button data-del class="px-2 py-1 text-xs rounded bg-red-600 text-white">${t('delete')}</button>
        </div>
      `;
      div.querySelector('[data-role]').addEventListener('change', async (e) => {
        await api.patch(`/api/users/${u._id}`, { role: e.target.value });
        showToast(t('role') + ' updated', 'success');
        await this.load();
      });
      div.querySelector('[data-block]').addEventListener('click', async () => {
        await api.patch(`/api/users/${u._id}/block`, {});
        showToast(t('block') + ' status changed', 'success');
        await this.load();
      });
      div.querySelector('[data-del]').addEventListener('click', async () => {
        await api.del(`/api/users/${u._id}`);
        showToast('User deleted', 'success');
        await this.load();
      });
      list.appendChild(div);
    });

    document.getElementById('user-add').onclick = async () => {
      const values = await formModal({
        title: t('add_user'),
        submitText: t('create'),
        fields: [
          { name: 'username', label: t('username'), required: true },
          { name: 'password', label: t('temporary_password'), type: 'password', required: true },
          { name: 'role', label: t('role'), type: 'select', options: [
            { value: 'viewer', label: t('role_viewer') },
            { value: 'manager', label: t('role_manager') },
            { value: 'admin', label: t('role_admin') }
          ] }
        ],
        initial: { role: 'viewer' }
      });
      if (!values) return;
      await api.post('/api/users', values);
      showToast('User created', 'success');
      await this.load();
    };
  }
};

