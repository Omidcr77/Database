import { api } from './api.js';
import { showToast, confirmModal, formModal, escapeHtml } from './ui.js';
import { formatDate, getLang, t } from './i18n.js';
import { auth, requireRole } from './auth.js';

let state = {
  items: [],
  viewItems: [],
  selected: null,
  tx: [],
  loading: false,
  savedFilters: [],
  filters: {
    balance: 'all', // all | they_owe | we_owe | high
    sort: 'recent'  // recent | balance_desc | balance_asc
  },
  lastUpdated: null
};

function applyFilters() {
  const { balance, sort } = state.filters;
  let items = [...state.items];

  if (balance === 'they_owe') {
    items = items.filter((c) => c.balance > 0);
  } else if (balance === 'we_owe') {
    items = items.filter((c) => c.balance < 0);
  } else if (balance === 'high') {
    items = items.filter((c) => Math.abs(c.balance) >= 1000);
  }

  if (sort === 'balance_desc') {
    items.sort((a, b) => (b.balance || 0) - (a.balance || 0));
  } else if (sort === 'balance_asc') {
    items.sort((a, b) => (a.balance || 0) - (b.balance || 0));
  } else {
    items.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }

  state.viewItems = items;
}

function renderStatus() {
  const el = document.getElementById('customer-status');
  if (!el) return;
  const count = state.viewItems.length;
  const ts = state.lastUpdated ? formatDate(state.lastUpdated) : '';
  el.textContent = `${count} ${t('customers_title') || 'Customers'}${ts ? ` • ${t('last_updated') || 'Updated'} ${ts}` : ''}`;
}

function normalizeDigits(str) {
  const map = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };
  return String(str ?? '').replace(/[۰-۹٠-٩]/g, (d) => map[d] || d);
}

function parseNumeric(val) {
  if (typeof val === 'number') return val;
  const s = normalizeDigits(String(val)).replace(/,/g, '').trim();
  if (!s) return NaN;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

function canEdit() {
  return requireRole('admin', 'manager');
}

function renderGrid() {
  const grid = document.getElementById('customer-grid');
  grid.innerHTML = '';

  if (state.loading) {
    grid.innerHTML = renderSkeletons(6);
    document.getElementById('customer-empty').classList.add('hidden');
    return;
  }

  const items = state.viewItems;

  if (!items.length) {
    document.getElementById('customer-empty').classList.remove('hidden');
    return;
  }
  document.getElementById('customer-empty').classList.add('hidden');
  
  items.forEach((c) => {
    const card = document.createElement('div');
    card.className = 'p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-lg';
    const fullName = escapeHtml(c.fullName || (c.firstName + ' ' + c.lastName));
    const safePhone = escapeHtml(c.phone || t('no_phone'));
    const safeCategory = escapeHtml(c.category || t('category_customer'));
    const safePhoto = escapeHtml(c.photoUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(c.fullName || (c.firstName + ' ' + c.lastName)));
    const balanceClass = c.balance >= 0
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
      : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
    const balanceLabel = `${t('balance_word')}: ${formatCurrency(c.balance)}`;
    const updated = c.updatedAt ? formatDate(c.updatedAt) : '';
    card.innerHTML = `
      <div class="flex items-start gap-3">
        <img src="${safePhoto}" 
             class="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-600" />
        <div class="flex-1 min-w-0 space-y-1">
          <div class="flex items-center gap-2">
            <div class="font-semibold text-gray-900 dark:text-white truncate">${fullName}</div>
            <span class="text-xs text-gray-500 dark:text-gray-400 truncate">${safePhone}</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2 py-1 rounded-full text-xs font-medium ${balanceClass}">
              ${balanceLabel}
            </span>
            <span class="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs">${safeCategory}</span>
            ${updated ? `<span class="text-[11px] text-gray-500 dark:text-gray-400">${t('last_updated') || 'Updated'} ${updated}</span>` : ''}
          </div>
        </div>
        <div class="flex flex-col gap-2">
          ${canEdit() ? `
            <button data-del class="p-2 rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors duration-200" title="${t('delete')}">
              <i class="fas fa-trash"></i>
            </button>` : ''
          }
          <button data-open class="p-2 rounded-full text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200" title="${t('open')}">
            <i class="fas fa-external-link-alt"></i>
          </button>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div class="space-y-2">
          <label class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <i class="fas fa-layer-group text-gray-400"></i>
            ${t('category_lbl') || 'Category'}
          </label>
          <select data-inline-category class="form-input w-full py-2 text-sm">
            <option value="Customer" ${c.category === 'Customer' ? 'selected' : ''}>${t('category_customer')}</option>
            <option value="Investor" ${c.category === 'Investor' ? 'selected' : ''}>${t('category_investor')}</option>
            <option value="Employee" ${c.category === 'Employee' ? 'selected' : ''}>${t('category_employee')}</option>
            <option value="Other" ${c.category === 'Other' ? 'selected' : ''}>${t('category_other')}</option>
          </select>
        </div>
        <div class="space-y-2">
          <label class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <i class="fas fa-sticky-note text-gray-400"></i>
            ${t('notes') || 'Notes'}
          </label>
          <div class="flex gap-2">
            <textarea data-inline-note class="form-input text-sm h-16 flex-1" placeholder="${t('notes') || 'Notes'}"></textarea>
            <button data-save-note class="btn-secondary text-xs px-3 py-2 self-start whitespace-nowrap">${t('save_changes')}</button>
          </div>
        </div>
      </div>
    `;
    card.querySelector('[data-open]').addEventListener('click', () => openCustomer(c));
    const delBtn = card.querySelector('[data-del]');
    if (delBtn) delBtn.addEventListener('click', async () => {
      if (!(await confirmModal(t('confirm_delete_customer') || 'Are you sure you want to delete this customer?'))) return;
      try {
        await api.del(`/api/customers/${c._id}`);
        showToast(t('customer_deleted_success') || 'Customer deleted successfully', 'success');
        await load();
      } catch (error) {
        showToast(t('failed_delete_customer') || 'Failed to delete customer', 'error');
      }
    });
    const catSel = card.querySelector('[data-inline-category]');
    if (catSel) catSel.addEventListener('change', async () => {
      try {
        await api.patch(`/api/customers/${c._id}`, { category: catSel.value });
        showToast(t('save_changes') || 'Saved', 'success');
        await load();
      } catch (err) {
        showToast(err.message || 'Failed to update category', 'error');
      }
    });
    const noteArea = card.querySelector('[data-inline-note]');
    const saveNote = card.querySelector('[data-save-note]');
    if (noteArea && saveNote) {
      noteArea.value = c.note || '';
      saveNote.addEventListener('click', async () => {
        try {
          await api.patch(`/api/customers/${c._id}`, { note: noteArea.value });
          showToast(t('save_changes') || 'Saved', 'success');
          await load();
        } catch (err) {
          showToast(err.message || 'Failed to update note', 'error');
        }
      });
    }
    grid.appendChild(card);
  });
}

function formatCurrency(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
}

function renderSkeletons(count = 6) {
  return Array.from({ length: count }).map(() => `
    <div class="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 animate-pulse space-y-3">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        <div class="flex-1 space-y-2">
          <div class="h-3 rounded bg-gray-200 dark:bg-gray-700 w-1/2"></div>
          <div class="h-3 rounded bg-gray-200 dark:bg-gray-700 w-1/3"></div>
          <div class="h-3 rounded bg-gray-200 dark:bg-gray-700 w-1/4"></div>
        </div>
      </div>
      <div class="h-8 rounded bg-gray-200 dark:bg-gray-700"></div>
      <div class="h-16 rounded bg-gray-200 dark:bg-gray-700"></div>
    </div>
  `).join('');
}

async function loadTx(customerId) {
  try {
    const data = await api.get(`/api/customers/${customerId}/transactions`);
    // Ensure newest first (handle unsorted responses)
    state.tx = [...data.items].sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
    renderTx();
    renderTimeline();
  } catch (error) {
    console.error('Failed to load transactions:', error);
    showToast(t('failed_load_tx') || 'Failed to load transactions', 'error');
  }
}

function renderTx() {
  const tbody = document.getElementById('tx-table');
  tbody.innerHTML = '';
  
  if (state.tx.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="6" class="py-8 text-center text-gray-500 dark:text-gray-400">
        <i class="fas fa-receipt text-3xl mb-2 opacity-50"></i>
        <div>${t('no_transactions') || 'No transactions found'}</div>
      </td>
    `;
    tbody.appendChild(tr);
    return;
  }
  
  state.tx.forEach((tx) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150';
    const typeClass = tx.type === 'sale' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                     'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    const safeBill = escapeHtml(tx.billNumber || '');
    const safeOnBehalf = escapeHtml(tx.onBehalf || '');
    const safeDesc = escapeHtml(tx.description || '-');
    const safeUser = escapeHtml(tx.createdBy && tx.createdBy.username ? tx.createdBy.username : '-');

    const extraInfo = (tx.type === 'sale' && tx.billNumber)
      ? ` <span class="text-xs text-gray-500 dark:text-gray-400">#${safeBill}</span>`
      : (tx.type === 'receipt' && tx.onBehalf
        ? ` <span class=\"text-xs text-gray-500 dark:text-gray-400\">(on behalf: ${safeOnBehalf})</span>`
        : '');

    tr.innerHTML = `
      <td class="py-3 px-3 text-sm">${formatDate(tx.date)}</td>
      <td class="py-3 px-3">
        <span class="px-2 py-1 rounded-full text-xs font-medium ${typeClass}">${tx.type}</span>
      </td>
      <td class="py-3 px-3 text-sm text-gray-700 dark:text-gray-300">${safeUser}</td>
      <td class="py-3 px-3 font-medium">${formatCurrency(tx.amount)}</td>
      <td class="py-3 px-3 text-sm text-gray-600 dark:text-gray-400">${safeDesc}${extraInfo}</td>
      <td class="py-3 px-3 text-right">
        <button data-print class="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200 mr-1" title="${t('print')}">
          <i class="fas fa-print text-xs"></i>
        </button>
        ${canEdit() ? `
          <button data-del class="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200" title="${t('delete')}">
            <i class="fas fa-trash text-xs"></i>
          </button>
        ` : ''}
      </td>
    `;
    const btn = tr.querySelector('[data-del]');
    if (btn) btn.addEventListener('click', async () => {
      if (!(await confirmModal(t('confirm_delete_tx') || 'Are you sure you want to delete this transaction?'))) return;
      try {
        await api.del(`/api/transactions/${tx._id}`);
        showToast(t('tx_deleted_success') || 'Transaction deleted successfully', 'success');
        await loadTx(state.selected._id);
        await load();
      } catch (error) {
        showToast(t('failed_delete_tx') || 'Failed to delete transaction', 'error');
      }
    });
    const pbtn = tr.querySelector('[data-print]');
    if (pbtn) pbtn.addEventListener('click', () => {
      import('./print.js').then((m) => {
        const balance = state.items.find(ci => ci._id === state.selected._id)?.balance ?? 0;
        m.printTx(tx, state.selected, balance);
      }).catch(() => showToast(t('print_module_failed') || 'Print module failed to load', 'error'));
    });
    tbody.appendChild(tr);
  });
}

function renderTimeline() {
  const list = document.getElementById('timeline-list');
  if (!list) return;
  list.innerHTML = '';
  const events = [];

  // Transactions
  state.tx.forEach((tx) => {
    events.push({
      date: tx.date ? new Date(tx.date) : new Date(),
      type: tx.type === 'sale' ? 'sale' : 'receipt',
      title: tx.type === 'sale' ? (t('add_sale') || 'Sale') : (t('add_receipt') || 'Receipt'),
      amount: tx.amount,
      description: tx.description || '',
      meta: tx.type === 'sale' ? (tx.billNumber ? `#${tx.billNumber}` : '') : (tx.onBehalf ? tx.onBehalf : ''),
      user: tx.createdBy?.username || ''
    });
  });

  // Note as an event
  if (state.selected?.note) {
    events.push({
      date: state.selected.updatedAt ? new Date(state.selected.updatedAt) : new Date(),
      type: 'note',
      title: t('notes') || 'Note',
      description: state.selected.note,
      user: '',
      amount: null
    });
  }

  if (!events.length) {
    list.innerHTML = `<div class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2"><i class="fas fa-clock"></i>${t('no_transactions') || 'No activity yet'}</div>`;
    return;
  }

  events.sort((a, b) => b.date - a.date);
  const groups = events.reduce((acc, ev) => {
    const key = ev.date.toISOString().slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  Object.entries(groups).forEach(([day, evs]) => {
    const container = document.createElement('div');
    container.className = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4';
    container.innerHTML = `<div class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">${formatDate(day)}</div>`;
    const inner = document.createElement('div');
    inner.className = 'space-y-3';
    evs.forEach((ev) => {
      const color = ev.type === 'sale' ? 'text-emerald-500' : ev.type === 'receipt' ? 'text-rose-500' : 'text-blue-500';
      const amount = ev.amount != null ? `<div class="font-semibold">${formatCurrency(ev.amount)}</div>` : '';
      const meta = ev.meta ? `<div class="text-xs text-gray-500">${escapeHtml(ev.meta)}</div>` : '';
      const user = ev.user ? `<div class="text-xs text-gray-500">${escapeHtml(ev.user)}</div>` : '';
      const desc = ev.description ? `<div class="text-sm text-gray-600 dark:text-gray-300">${escapeHtml(ev.description)}</div>` : '';
      const icon = ev.type === 'sale' ? 'fa-arrow-trend-up' : ev.type === 'receipt' ? 'fa-arrow-trend-down' : 'fa-note-sticky';
      const block = document.createElement('div');
      block.className = 'flex gap-3 items-start';
      block.innerHTML = `
        <div class="mt-1 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${color}">
          <i class="fas ${icon}"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <div class="font-medium text-gray-800 dark:text-gray-100">${ev.title}</div>
            ${amount}
          </div>
          ${desc}
          ${meta}
          ${user}
        </div>
      `;
      inner.appendChild(block);
    });
    container.appendChild(inner);
    list.appendChild(container);
  });
}

function bindModal() {
  const modal = document.getElementById('customer-modal');
  document.getElementById('customer-modal-close').onclick = () => modal.classList.add('hidden');
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
  
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => {
        b.classList.remove('bg-primary-600', 'text-white');
        b.classList.add('bg-gray-200', 'dark:bg-gray-700');
      });
      btn.classList.remove('bg-gray-200', 'dark:bg-gray-700');
      btn.classList.add('bg-primary-600', 'text-white');
      document.querySelectorAll('.tab').forEach((t) => t.classList.add('hidden'));
      document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
    });
  });
  
  document.getElementById('add-sale-btn').onclick = () => openTxForm('sale');
  document.getElementById('add-receipt-btn').onclick = () => openTxForm('receipt');
  document.getElementById('cust-save').onclick = saveCustomer;
  document.getElementById('cust-delete').onclick = async () => {
    if (!(await confirmModal(t('confirm_delete_customer') || 'Are you sure you want to delete this customer?'))) return;
    try {
      await api.del(`/api/customers/${state.selected._id}`);
      modal.classList.add('hidden');
      showToast(t('customer_deleted_success') || 'Customer deleted successfully', 'success');
      await load();
    } catch (error) {
      showToast(t('failed_delete_customer') || 'Failed to delete customer', 'error');
    }
  };
  document.getElementById('cust-share').onclick = async () => {
    const url = `${location.origin}/#customer=${state.selected._id}`;
    try { 
      await navigator.clipboard.writeText(url); 
      showToast(t('link_copied') || 'Customer link copied to clipboard', 'success');
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('', 'success');
    }
  };
}

async function openTxForm(type) {
  const title = type === 'sale' ? '' : '';
  const today = new Date().toISOString().slice(0, 10);
  const lang = getLang();
  const values = await formModal({
    title,
    submitText: t('create'),
    fields: (() => {
      const f = [
        { name: 'amount', label: t('amount_lbl'), type: 'number', required: true, step: '0.01', min: 0 },
        { name: 'date', label: t('date_lbl'), type: 'date', required: true, value: lang === 'fa' ? '' : today }
      ];
      if (type === 'sale') f.push({ name: 'billNumber', label: t('bill_no_lbl'), type: 'text', placeholder: t('optional') });
      if (type === 'receipt') f.push({ name: 'onBehalf', label: t('on_behalf_lbl'), type: 'text', placeholder: t('optional_payer') });
      f.push({ name: 'description', label: t('note_lbl'), type: 'text', placeholder: t('optional') });
      return f;
    })()
  });
  if (!values) return;
  try {
    const amt = parseNumeric(values.amount);
    if (!Number.isFinite(amt) || amt < 0) {
      showToast(t('invalid_amount') || 'Invalid amount', 'error');
      return;
    }
    const dateStr = normalizeDigits(values.date || '');
    const safeDate = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
    await api.post(`/api/customers/${state.selected._id}/transactions`, {
      type,
      amount: amt,
      description: values.description || '',
      billNumber: type === 'sale' ? (values.billNumber || '') : undefined,
      onBehalf: type === 'receipt' ? (values.onBehalf || '') : undefined,
      date: safeDate
    });
    showToast('', 'success');
    await loadTx(state.selected._id);
    await load();
  } catch (e) {
    showToast(e.message || '', 'error');
  }
}

function fillProfileForm(c) {
  document.getElementById('cust-first').value = c.firstName || '';
  document.getElementById('cust-last').value = c.lastName || '';
  document.getElementById('cust-idnum').value = c.idNumber || '';
  document.getElementById('cust-phone').value = c.phone || '';
  document.getElementById('cust-address').value = c.address || '';
  document.getElementById('cust-photo').value = c.photoUrl || '';
  const prev = document.getElementById('cust-avatar-preview');
  if (prev) {
    prev.src = (c.photoUrl && c.photoUrl.trim()) ? c.photoUrl : 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent((c.firstName || '') + ' ' + (c.lastName || ''));
  }
  document.getElementById('cust-category').value = c.category || 'Customer';
  document.getElementById('cust-note').value = c.note || '';
}

async function saveCustomer() {
  const updates = {
    firstName: document.getElementById('cust-first').value.trim(),
    lastName: document.getElementById('cust-last').value.trim(),
    idNumber: document.getElementById('cust-idnum').value.trim(),
    phone: document.getElementById('cust-phone').value.trim(),
    address: document.getElementById('cust-address').value.trim(),
    photoUrl: document.getElementById('cust-photo').value.trim(),
    category: document.getElementById('cust-category').value,
    note: document.getElementById('cust-note').value
  };
  
  try {
    await api.patch(`/api/customers/${state.selected._id}`, updates);
    showToast('', 'success');
    await load();
  } catch (error) {
    showToast('', 'error');
  }
}

export async function openCustomer(c) {
  state.selected = c;
  const name = c.fullName || (c.firstName + ' ' + c.lastName);
  document.getElementById('customer-modal-title').textContent = t('customer_lbl') || 'Customer';
  document.getElementById('customer-modal').classList.remove('hidden');
  // Meta section
  const photoEl = document.getElementById('customer-meta-photo');
  if (photoEl) photoEl.src = (c.photoUrl && c.photoUrl.trim()) ? c.photoUrl : 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(name || '');
  const nameEl = document.getElementById('customer-meta-name');
  if (nameEl) nameEl.textContent = name;
  const phoneEl = document.getElementById('customer-meta-phone');
  if (phoneEl) phoneEl.textContent = c.phone || t('no_phone') || '';
  const addrEl = document.getElementById('customer-meta-address');
  if (addrEl) addrEl.textContent = c.address || '';
  const catEl = document.getElementById('customer-meta-category');
  if (catEl) catEl.textContent = c.category || t('category_customer');
  const balEl = document.getElementById('customer-meta-balance');
  if (balEl) {
    const cls = c.balance >= 0
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
      : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
    balEl.className = `px-3 py-2 rounded-lg text-sm font-semibold ${cls}`;
    balEl.textContent = `${t('balance_word') || 'Balance'}: ${formatCurrency(c.balance || 0)}`;
  }
  // Populate profile quick info card
  const profileName = document.getElementById('profile-name-display');
  if (profileName) profileName.textContent = name;
  const profilePhone = document.getElementById('profile-phone-display');
  if (profilePhone) profilePhone.textContent = c.phone || '';
  const profileRole = document.getElementById('profile-role-display');
  if (profileRole) profileRole.textContent = c.category || t('category_customer');
  
  // Permissions
  const canEditCustomer = canEdit();
  document.getElementById('add-sale-btn').classList.toggle('hidden', !canEditCustomer);
  document.getElementById('add-receipt-btn').classList.toggle('hidden', !canEditCustomer);
  document.getElementById('cust-save').classList.toggle('hidden', !canEditCustomer);
  document.getElementById('cust-delete').classList.toggle('hidden', !canEditCustomer);
  
  fillProfileForm(c);
  await loadTx(c._id);
}

export async function load() {
  const search = document.getElementById('customer-search').value.trim();
  const category = document.getElementById('customer-category').value;
  
  try {
    state.loading = true;
    renderGrid();
    const data = await api.get(`/api/customers?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`);
    state.items = data.items;
    state.lastUpdated = new Date();
    applyFilters();
    state.loading = false;
    renderGrid();
    renderStatus();
  } catch (error) {
    console.error(':', error);
    showToast('', 'error');
    state.loading = false;
  }
}

export function initCustomers() {
  bindModal();
  document.getElementById('customer-refresh').addEventListener('click', load);
  document.getElementById('customer-search').addEventListener('input', () => setTimeout(load, 300));
  document.getElementById('customer-category').addEventListener('change', load);
  initSavedFilters();
  const emptyAdd = document.getElementById('empty-add-customer');
  if (emptyAdd) emptyAdd.addEventListener('click', () => document.getElementById('add-customer-btn').click());
  const emptyImport = document.getElementById('empty-import-csv');
  if (emptyImport) emptyImport.addEventListener('click', () => {
    const reportsBtn = Array.from(document.querySelectorAll('.nav-btn')).find((b) => b.dataset.section === 'reports');
    reportsBtn?.click();
    const importInput = document.getElementById('import-file');
    importInput?.focus();
  });
  initFilterPills();
  // Avatar upload wiring in customer modal
  const fileInput = document.getElementById('cust-avatar-file');
  const uploadBtn = document.getElementById('cust-avatar-upload');
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
        document.getElementById('cust-photo').value = res.url;
        const prev = document.getElementById('cust-avatar-preview');
        if (prev) prev.src = res.url;
        showToast('', 'success');
      } catch (err) {
        showToast(err.message || '', 'error');
      }
    };
    reader.readAsDataURL(file);
  });
  document.getElementById('add-customer-btn').addEventListener('click', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const lang = getLang();
    const values = await formModal({
      title: t('add_customer'),
      submitText: t('create'),
      fields: [
        { name: 'firstName', label: t('first_name'), type: 'text', required: true },
        { name: 'lastName', label: t('last_name'), type: 'text', required: true },
        { name: 'phone', label: t('phone_lbl'), type: 'text', placeholder: t('optional') },
        { name: 'address', label: t('address'), type: 'text', placeholder: t('optional') },
        { name: 'photoUrl', label: t('upload_photo'), type: 'file', accept: 'image/*', upload: true },
        { name: 'openingBalance', label: t('opening_balance'), type: 'number', step: '0.01', min: 0, placeholder: t('optional') },
        { name: 'openingDirection', label: t('balance_direction'), type: 'select', options: [
          { value: 'they_owe', label: t('they_owe') },
          { value: 'we_owe', label: t('we_owe') }
        ], value: 'they_owe' },
        { name: 'openingDate', label: t('opening_date'), type: 'date', value: lang === 'fa' ? '' : today }
      ]
    });
    if (!values) return;
    try {
      const opening = parseNumeric(values.openingBalance);
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || '',
        address: values.address || '',
        photoUrl: values.photoUrl || '',
        // Optional opening balance data handled by backend
        ...(Number.isFinite(opening) && opening > 0 ? {
          openingBalance: opening,
          openingDirection: values.openingDirection || 'they_owe',
          openingDate: values.openingDate ? new Date(values.openingDate).toISOString() : undefined
        } : {})
      };
      await api.post('/api/customers', payload);
      showToast('', 'success');
      await load();
    } catch (error) {
      showToast('', 'error');
    }
  });
}

function initSavedFilters() {
  const select = document.getElementById('customer-saved-filters');
  const saveBtn = document.getElementById('save-filter-btn');
  const deleteBtn = document.getElementById('delete-filter-btn');
  if (!select || !saveBtn || !deleteBtn) return;

  const loadFilters = () => {
    try {
      state.savedFilters = JSON.parse(localStorage.getItem('customerFilters') || '[]');
    } catch {
      state.savedFilters = [];
    }
    select.innerHTML = `<option value="">${t('all_categories') || 'Select filter'}</option>` + state.savedFilters.map((f, idx) => `<option value="${idx}">${escapeHtml(f.name)}</option>`).join('');
  };

  const applyFilter = (f) => {
    if (!f) return;
    document.getElementById('customer-search').value = f.search || '';
    document.getElementById('customer-category').value = f.category || '';
    load();
  };

  loadFilters();
  select.addEventListener('change', () => {
    const idx = select.value;
    if (idx === '') return;
    const f = state.savedFilters[Number(idx)];
    applyFilter(f);
  });

  saveBtn.addEventListener('click', () => {
    const name = prompt('Name this filter');
    if (!name) return;
    const search = document.getElementById('customer-search').value.trim();
    const category = document.getElementById('customer-category').value;
    state.savedFilters.push({ name, search, category });
    localStorage.setItem('customerFilters', JSON.stringify(state.savedFilters));
    loadFilters();
    select.value = state.savedFilters.length - 1;
  });

  deleteBtn.addEventListener('click', () => {
    const idx = select.value;
    if (idx === '') return;
    state.savedFilters.splice(Number(idx), 1);
    localStorage.setItem('customerFilters', JSON.stringify(state.savedFilters));
    loadFilters();
  });
}

function initFilterPills() {
  const balanceBtns = document.querySelectorAll('[data-balance]');
  const sortBtns = document.querySelectorAll('[data-sort]');
  const setActive = (group, key, value) => {
    group.forEach((btn) => {
      const isActive = btn.dataset[key] === value;
      btn.classList.toggle('bg-primary-600', isActive);
      btn.classList.toggle('text-white', isActive);
      btn.classList.toggle('border-transparent', isActive);
    });
  };

  balanceBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.filters.balance = btn.dataset.balance;
      setActive(balanceBtns, 'balance', state.filters.balance);
      applyFilters();
      renderGrid();
      renderStatus();
    });
  });

  sortBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.filters.sort = btn.dataset.sort;
      setActive(sortBtns, 'sort', state.filters.sort);
      applyFilters();
      renderGrid();
      renderStatus();
    });
  });

  setActive(balanceBtns, 'balance', state.filters.balance);
  setActive(sortBtns, 'sort', state.filters.sort);
}
