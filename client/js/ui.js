import { api } from './api.js';
import { getLang } from './i18n.js';

export function escapeHtml(value) {
  const s = String(value ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container') || (() => {
    const c = document.createElement('div');
    c.id = 'toast-container';
    c.className = 'fixed top-4 right-4 space-y-2 z-50';
    document.body.appendChild(c);
    return c;
  })();
  const div = document.createElement('div');
  
  let bgColor = 'bg-gray-800';
  let icon = 'fas fa-info-circle';
  
  if (type === 'error') {
    bgColor = 'bg-red-600';
    icon = 'fas fa-exclamation-circle';
  } else if (type === 'success') {
    bgColor = 'bg-green-600';
    icon = 'fas fa-check-circle';
  } else if (type === 'warning') {
    bgColor = 'bg-amber-500';
    icon = 'fas fa-exclamation-triangle';
  }
  
  div.className = `flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white ${bgColor} animate-in slide-in-from-right-full duration-300`;
  div.innerHTML = `
    <i class="${icon}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(div);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    div.classList.add('opacity-0', 'transition-opacity', 'duration-300');
    setTimeout(() => div.remove(), 300);
  }, 4000);
}

function ensureModalRoot() {
  let root = document.getElementById('modal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'modal-root';
    document.body.appendChild(root);
  }
  return root;
}

export function confirmModal(message, { title = 'Please confirm', okText = 'Confirm', cancelText = 'Cancel' } = {}) {
  return new Promise((resolve) => {
    const root = ensureModalRoot();
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    overlay.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm border border-gray-200 dark:border-gray-700">
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div class="font-semibold">${title}</div>
          <button class="text-gray-500 hover:text-gray-700 dark:text-gray-300" data-close>&times;</button>
        </div>
        <div class="px-4 py-4 text-sm text-gray-700 dark:text-gray-200">${message}</div>
        <div class="px-4 py-3 flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700">
          <button class="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600" data-cancel>${cancelText}</button>
          <button class="px-3 py-1.5 rounded bg-red-600 text-white" data-ok>${okText}</button>
        </div>
      </div>`;
    const cleanup = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { cleanup(); resolve(false); } });
    overlay.querySelector('[data-close]').addEventListener('click', () => { cleanup(); resolve(false); });
    overlay.querySelector('[data-cancel]').addEventListener('click', () => { cleanup(); resolve(false); });
    overlay.querySelector('[data-ok]').addEventListener('click', () => { cleanup(); resolve(true); });
    root.appendChild(overlay);
  });
}

export function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
}

export function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

export function formModal({ title = 'Form', submitText = 'Save', fields = [], initial = {} }) {
  return new Promise((resolve) => {
    const root = ensureModalRoot();
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    const controls = fields.map((f, i) => {
      const id = `fm_${Date.now()}_${i}`;
      const baseCls = 'w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
      const value = (initial[f.name] ?? f.value ?? '');
      let control = '';
      if (f.type === 'select') {
        const opts = (f.options || []).map(o => `<option value="${o.value}">${o.label}</option>`).join('');
        control = `<select id="${id}" class="${baseCls}">${opts}</select>`;
      } else if (f.type === 'textarea') {
        control = `<textarea id="${id}" rows="3" class="${baseCls}" placeholder="${f.placeholder || ''}">${value}</textarea>`;
      } else if (f.type === 'date' && getLang() === 'fa') {
        const altId = `${id}_alt`;
        control = `
          <input id="${id}" type="text" class="${baseCls}" placeholder="${f.placeholder || ''}" data-jalali data-alt="#${altId}"/>
          <input id="${altId}" type="hidden" value="${value || ''}" />`;
      } else if (f.type === 'file') {
        const accept = f.accept ? ` accept="${f.accept}"` : '';
        control = `<input id="${id}" type="file" class="${baseCls}"${accept}/>`;
      } else {
        const extra = f.step ? ` step="${f.step}"` : '';
        const min = f.min !== undefined ? ` min="${f.min}"` : '';
        control = `<input id="${id}" type="${f.type || 'text'}" class="${baseCls}" placeholder="${f.placeholder || ''}" value="${value}"${extra}${min}/>`;
      }
      return `<div><label class="block text-xs text-gray-600 dark:text-gray-300 mb-1">${f.label}${f.required ? ' <span class=\'text-red-500\'>*</span>' : ''}</label>${control}</div>`;
    }).join('');
    overlay.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div class="font-semibold">${title}</div>
          <button class="text-gray-500 hover:text-gray-700 dark:text-gray-300" data-close>&times;</button>
        </div>
        <div class="px-4 py-4 space-y-3">${controls}</div>
        <div class="px-4 py-3 flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700">
          <button class="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600" data-cancel>Cancel</button>
          <button class="px-3 py-1.5 rounded bg-primary-600 hover:bg-primary-700 text-white" data-submit>${submitText}</button>
        </div>
      </div>`;
    const cleanup = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { cleanup(); resolve(null); } });
    overlay.querySelector('[data-close]').addEventListener('click', () => { cleanup(); resolve(null); });
    overlay.querySelector('[data-cancel]').addEventListener('click', () => { cleanup(); resolve(null); });
    const readAsDataURL = (file) => new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

    // Initialize Jalali pickers if language is fa and plugin is present
    if (getLang() === 'fa' && window.jQuery && typeof jQuery.fn.persianDatepicker === 'function') {
      overlay.querySelectorAll('[data-jalali]').forEach((el) => {
        const alt = el.getAttribute('data-alt');
        jQuery(el).persianDatepicker({
          format: 'YYYY/MM/DD',
          altField: alt || undefined,
          altFormat: 'YYYY-MM-DD',
          initialValue: true,
        });
      });
    }

    overlay.querySelector('[data-submit]').addEventListener('click', async () => {
      const inputs = overlay.querySelectorAll('input, select, textarea');
      const values = {};
      let invalid = false;
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        const el = inputs[i];
        if (f.type === 'file') {
          const file = el.files && el.files[0];
          if (f.required && !file) invalid = true;
          if (file && f.upload) {
            try {
              const dataUrl = await readAsDataURL(file);
              let res;
              try { res = await api.post('/api/uploads/image', { data: dataUrl }); }
              catch (err1) {
                try { res = await api.post('/api/upload-image', { data: dataUrl }); }
                catch (err2) { res = await api.post('/uploads/image', { data: dataUrl }); }
              }
              values[f.name] = res.url;
            } catch (e) {
              invalid = true;
            }
          } else {
            values[f.name] = '';
          }
        } else if (f.type === 'date' && getLang() === 'fa') {
          // Use alt gregorian value if available
          const altSel = el.getAttribute('data-alt');
          let v = '';
          if (altSel) {
            const altEl = overlay.querySelector(altSel);
            v = altEl ? altEl.value : '';
          } else {
            v = el.value;
          }
          // If alt is empty but visible value exists (Jalali), keep it and allow submit
          if (f.required && !v && el.value) {
            v = el.value;
          }
          if (f.required && !v) invalid = true;
          values[f.name] = v;
        } else {
          let v = el.value;
          if (f.type === 'number') {
            // Keep raw string to allow localized digits; caller will parse
            if (f.required && (v === '' || v === undefined || v === null)) invalid = true;
          } else if (f.required && (v === '' || v === undefined || v === null)) {
            invalid = true;
          }
          values[f.name] = v;
        }
      }
      if (invalid) return;
      cleanup();
      resolve(values);
    });
    root.appendChild(overlay);
  });
}
