import { api } from './api.js';
import { showToast } from './ui.js';

export function initReports() {
  document.getElementById('export-btn').addEventListener('click', async () => {
    const type = document.getElementById('export-type').value;
    const from = document.getElementById('export-from').value;
    const to = document.getElementById('export-to').value;
    const qs = new URLSearchParams({ type, from, to });
    const res = await fetch(`/api/reports/export?${qs.toString()}`, { credentials: 'include' });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('import-btn').addEventListener('click', async () => {
    const file = document.getElementById('import-file').files[0];
    if (!file) return showToast('Choose a CSV file', 'error');
    const type = document.getElementById('import-type').value;
    const text = await file.text();
    try {
      await api.post(`/api/reports/import?type=${encodeURIComponent(type)}`, { csv: text });
      showToast('Import complete', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  });
}

