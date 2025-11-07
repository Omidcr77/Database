import { api } from './api.js';
import { auth } from './auth.js';
import { showToast, formModal } from './ui.js';

export function initProfile() {
  document.getElementById('profile-save').addEventListener('click', async () => {
    const u = auth.currentUser;
    const updates = {
      name: document.getElementById('profile-name').value,
      phone: document.getElementById('profile-phone').value,
      avatarUrl: document.getElementById('profile-avatar').value
    };
    const data = await api.patch(`/api/users/${u._id}`, updates);
    showToast('Profile updated', 'success');
    auth.currentUser = data.user;
    renderProfile();
  });

  // Password changes handled via modal trigger; inline form removed

  // Avatar uploader
  const fileInput = document.getElementById('user-avatar-file');
  const uploadBtn = document.getElementById('user-avatar-upload');
  if (uploadBtn) uploadBtn.addEventListener('click', () => fileInput?.click());
  if (fileInput) fileInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        let res;
        try { res = await api.post('/api/uploads/image', { data: reader.result }); }
        catch (err1) {
          try { res = await api.post('/api/upload-image', { data: reader.result }); }
          catch (err2) { res = await api.post('/uploads/image', { data: reader.result }); }
        }
        document.getElementById('profile-avatar').value = res.url;
        const prev = document.getElementById('user-avatar-preview');
        if (prev) prev.src = res.url;
        showToast('Photo uploaded', 'success');
      } catch (err) {
        showToast(err.message || 'Upload failed', 'error');
      }
    };
    reader.readAsDataURL(file);
  });

  // Open change password modal
  const openPwdBtn = document.getElementById('open-change-password');
  if (openPwdBtn) openPwdBtn.addEventListener('click', async () => {
    const values = await formModal({
      title: 'Change Password',
      submitText: 'Update Password',
      fields: [
        { name: 'currentPassword', label: 'Current Password', type: 'password', required: true },
        { name: 'newPassword', label: 'New Password', type: 'password', required: true }
      ]
    });
    if (!values) return;
    try {
      const u = auth.currentUser;
      await api.patch(`/api/users/${u._id}/password`, values);
      showToast('Password changed', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to change password', 'error');
    }
  });
}

export function renderProfile() {
  const u = auth.currentUser;
  document.getElementById('profile-username').value = u.username;
  document.getElementById('profile-name').value = u.name || '';
  document.getElementById('profile-phone').value = u.phone || '';
  document.getElementById('profile-avatar').value = u.avatarUrl || '';
  const prev = document.getElementById('user-avatar-preview');
  if (prev) prev.src = (u.avatarUrl && u.avatarUrl.trim()) ? u.avatarUrl : 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(u.name || u.username);
}
