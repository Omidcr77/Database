import { api } from './api.js';
import { showToast } from './ui.js';
import { getLang } from './i18n.js';

export function initReports() {
  // If in Dari, attach Jalali pickers to From/To and store gregorian in hidden alts
  if (getLang() === 'fa' && window.jQuery && typeof jQuery.fn.persianDatepicker === 'function') {
    const from = document.getElementById('export-from');
    const to = document.getElementById('export-to');
    if (from) {
      from.setAttribute('type', 'text');
      const altFrom = document.createElement('input');
      altFrom.type = 'hidden';
      altFrom.id = 'export-from-alt';
      from.insertAdjacentElement('afterend', altFrom);
      jQuery(from).persianDatepicker({
        format: 'YYYY/MM/DD',
        altField: '#export-from-alt',
        altFormat: 'YYYY-MM-DD',
        initialValue: false,
      });
    }
    if (to) {
      to.setAttribute('type', 'text');
      const altTo = document.createElement('input');
      altTo.type = 'hidden';
      altTo.id = 'export-to-alt';
      to.insertAdjacentElement('afterend', altTo);
      jQuery(to).persianDatepicker({
        format: 'YYYY/MM/DD',
        altField: '#export-to-alt',
        altFormat: 'YYYY-MM-DD',
        initialValue: false,
      });
    }
  }

  document.getElementById('export-btn').addEventListener('click', async () => {
    const type = document.getElementById('export-type').value;
    let from = document.getElementById('export-from').value;
    let to = document.getElementById('export-to').value;
    if (getLang() === 'fa') {
      from = document.getElementById('export-from-alt')?.value || from;
      to = document.getElementById('export-to-alt')?.value || to;
    }
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
