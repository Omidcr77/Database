import { api } from './api.js';
import { showToast, confirmModal, formModal } from './ui.js';
import { formatDate } from './i18n.js';
import { auth, requireRole } from './auth.js';

let state = {
  items: [],
  selected: null,
  tx: []
};

function canEdit() {
  return requireRole('admin', 'manager');
}

function renderGrid() {
  const grid = document.getElementById('customer-grid');
  grid.innerHTML = '';
  if (!state.items.length) {
    document.getElementById('customer-empty').classList.remove('hidden');
    return;
  }
  document.getElementById('customer-empty').classList.add('hidden');
  
  state.items.forEach((c) => {
    const card = document.createElement('div');
    card.className = 'p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md';
    card.innerHTML = `
      <div class="flex items-center gap-3 mb-3">
        <img src="${c.photoUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(c.fullName || (c.firstName + ' ' + c.lastName))}" 
             class="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-600" />
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-gray-900 dark:text-white truncate">${c.fullName || (c.firstName + ' ' + c.lastName)}</div>
          <div class="text-xs text-gray-500 truncate">${c.phone || 'No phone'}</div>
          <div class="text-xs mt-1">
            <span class="px-2 py-1 rounded-full ${c.balance >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}">
              Balance: ${formatCurrency(c.balance)}
            </span>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <span class="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          ${c.category || 'Customer'}
        </span>
        <div class="flex items-center gap-2">
          ${canEdit() ? `
            <button data-del class="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200" title="Delete">
              <i class="fas fa-trash text-xs"></i>
            </button>
          ` : ''}
          <button data-open class="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200" title="Open">
            <i class="fas fa-external-link-alt text-xs"></i>
          </button>
        </div>
      </div>
    `;
    card.querySelector('[data-open]').addEventListener('click', () => openCustomer(c));
    const delBtn = card.querySelector('[data-del]');
    if (delBtn) delBtn.addEventListener('click', async () => {
      if (!(await confirmModal('Are you sure you want to delete this customer?'))) return;
      try {
        await api.del(`/api/customers/${c._id}`);
        showToast('Customer deleted successfully', 'success');
        await load();
      } catch (error) {
        showToast('Failed to delete customer', 'error');
      }
    });
    grid.appendChild(card);
  });
}

function formatCurrency(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
}

async function loadTx(customerId) {
  try {
    const data = await api.get(`/api/customers/${customerId}/transactions`);
    state.tx = data.items;
    renderTx();
  } catch (error) {
    console.error('Failed to load transactions:', error);
    showToast('Failed to load transactions', 'error');
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
        <div>No transactions found</div>
      </td>
    `;
    tbody.appendChild(tr);
    return;
  }
  
  state.tx.forEach((t) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150';
    const typeClass = t.type === 'sale' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                     'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    
    const extraInfo = (t.type === 'sale' && t.billNumber)
      ? ` <span class="text-xs text-gray-500 dark:text-gray-400">#${t.billNumber}</span>`
      : (t.type === 'receipt' && t.onBehalf
        ? ` <span class=\"text-xs text-gray-500 dark:text-gray-400\">(on behalf: ${t.onBehalf})</span>`
        : '');

    tr.innerHTML = `
      <td class="py-3 px-3 text-sm">${formatDate(t.date)}</td>
      <td class="py-3 px-3">
        <span class="px-2 py-1 rounded-full text-xs font-medium ${typeClass}">${t.type}</span>
      </td>
      <td class="py-3 px-3 text-sm text-gray-700 dark:text-gray-300">${t.createdBy && t.createdBy.username ? t.createdBy.username : '-'}</td>
      <td class="py-3 px-3 font-medium">${formatCurrency(t.amount)}</td>
      <td class="py-3 px-3 text-sm text-gray-600 dark:text-gray-400">${t.description || '-'}${extraInfo}</td>
      <td class="py-3 px-3 text-right">
        <button data-print class="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200 mr-1" title="Print">
          <i class="fas fa-print text-xs"></i>
        </button>
        ${canEdit() ? `
          <button data-del class="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200" title="Delete">
            <i class="fas fa-trash text-xs"></i>
          </button>
        ` : ''}
      </td>
    `;
    const btn = tr.querySelector('[data-del]');
    if (btn) btn.addEventListener('click', async () => {
      if (!(await confirmModal('Are you sure you want to delete this transaction?'))) return;
      try {
        await api.del(`/api/transactions/${t._id}`);
        showToast('Transaction deleted successfully', 'success');
        await loadTx(state.selected._id);
        await load();
      } catch (error) {
        showToast('Failed to delete transaction', 'error');
      }
    });
    const pbtn = tr.querySelector('[data-print]');
    if (pbtn) pbtn.addEventListener('click', () => {
      import('./print.js').then((m) => {
        const balance = state.items.find(ci => ci._id === state.selected._id)?.balance ?? 0;
        m.printTx(t, state.selected, balance);
      }).catch(() => showToast('Print module failed to load', 'error'));
    });
    tbody.appendChild(tr);
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
    if (!(await confirmModal('Are you sure you want to delete this customer?'))) return;
    try {
      await api.del(`/api/customers/${state.selected._id}`);
      modal.classList.add('hidden');
      showToast('Customer deleted successfully', 'success');
      await load();
    } catch (error) {
      showToast('Failed to delete customer', 'error');
    }
  };
  document.getElementById('cust-share').onclick = async () => {
    const url = `${location.origin}/#customer=${state.selected._id}`;
    try { 
      await navigator.clipboard.writeText(url); 
      showToast('Customer link copied to clipboard', 'success');
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('Customer link copied to clipboard', 'success');
    }
  };
}

async function openTxForm(type) {
  const title = type === 'sale' ? 'Add Sale' : 'Add Receipt';
  const today = new Date().toISOString().slice(0, 10);
  const values = await formModal({
    title,
    submitText: 'Add',
    fields: (() => {
      const f = [
        { name: 'amount', label: 'Amount', type: 'number', required: true, step: '0.01', min: 0 },
        { name: 'date', label: 'Date', type: 'date', required: true, value: today }
      ];
      if (type === 'sale') f.push({ name: 'billNumber', label: 'Bill Number', type: 'text', placeholder: 'Optional' });
      if (type === 'receipt') f.push({ name: 'onBehalf', label: 'On Behalf', type: 'text', placeholder: 'Optional (payer name)' });
      f.push({ name: 'description', label: 'Description', type: 'text', placeholder: 'Optional' });
      return f;
    })()
  });
  if (!values) return;
  try {
    await api.post(`/api/customers/${state.selected._id}/transactions`, {
      type,
      amount: Number(values.amount),
      description: values.description || '',
      billNumber: type === 'sale' ? (values.billNumber || '') : undefined,
      onBehalf: type === 'receipt' ? (values.onBehalf || '') : undefined,
      date: values.date ? new Date(values.date).toISOString() : new Date().toISOString()
    });
    showToast('Transaction added successfully', 'success');
    await loadTx(state.selected._id);
    await load();
  } catch (e) {
    showToast(e.message || 'Failed to add transaction', 'error');
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
    showToast('Customer updated successfully', 'success');
    await load();
  } catch (error) {
    showToast('Failed to update customer', 'error');
  }
}

export async function openCustomer(c) {
  state.selected = c;
  document.getElementById('customer-modal-title').textContent = `${c.fullName || (c.firstName + ' ' + c.lastName)} — Balance: ${formatCurrency(c.balance)}`;
  document.getElementById('customer-modal').classList.remove('hidden');
  
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
    const data = await api.get(`/api/customers?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`);
    state.items = data.items;
    renderGrid();
  } catch (error) {
    console.error('Failed to load customers:', error);
    showToast('Failed to load customers', 'error');
  }
}

export function initCustomers() {
  bindModal();
  document.getElementById('customer-refresh').addEventListener('click', load);
  document.getElementById('customer-search').addEventListener('input', () => setTimeout(load, 300));
  document.getElementById('customer-category').addEventListener('change', load);
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
        showToast('Photo uploaded', 'success');
      } catch (err) {
        showToast(err.message || 'Upload failed', 'error');
      }
    };
    reader.readAsDataURL(file);
  });
  document.getElementById('add-customer-btn').addEventListener('click', async () => {
    const values = await formModal({
      title: 'Add Customer',
      submitText: 'Create',
      fields: [
        { name: 'firstName', label: 'First Name', type: 'text', required: true },
        { name: 'lastName', label: 'Last Name', type: 'text', required: true },
        { name: 'phone', label: 'Phone', type: 'text', placeholder: 'Optional' },
        { name: 'address', label: 'Address', type: 'text', placeholder: 'Optional' },
        { name: 'balance', label: 'Total Balance (initial)', type: 'number', step: '0.01' },
        { name: 'photoUrl', label: 'Profile Photo', type: 'file', accept: 'image/*', upload: true }
      ]
    });
    if (!values) return;
    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || '',
        address: values.address || '',
        photoUrl: values.photoUrl || '',
        balance: values.balance === '' || values.balance === undefined ? 0 : Number(values.balance)
      };
      await api.post('/api/customers', payload);
      showToast('Customer added successfully', 'success');
      await load();
    } catch (error) {
      showToast('Failed to add customer', 'error');
    }
  });
}
