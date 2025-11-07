import { api } from './api.js';
import { showToast } from './ui.js';

export const auth = {
  currentUser: null,
  async me() {
    try {
      const data = await api.get('/api/auth/me');
      this.currentUser = data.user;
      return this.currentUser;
    } catch {
      this.currentUser = null;
      throw new Error('Not authenticated');
    }
  },
  async logout() {
    await api.post('/api/auth/logout', {});
    this.currentUser = null;
    window.location.href = '/login.html';
  }
};

export function requireRole(...roles) {
  const user = auth.currentUser;
  if (!user) return false;
  return roles.includes(user.role);
}

