const dictionaries = {
  en: {
    nav_dashboard: 'Dashboard',
    nav_customers: 'Customers',
    nav_reports: 'Reports',
    nav_profile: 'Profile',
    nav_admin: 'Admin',
    logout: 'Logout',
    transaction_history: 'Transaction History',
    th_date: 'Date',
    th_type: 'Type',
    th_user: 'User',
    th_amount: 'Amount',
    th_description: 'Description',
    add_sale: 'Add Sale',
    add_receipt: 'Add Receipt',
    add_customer: 'Add Customer',
    my_profile: 'My Profile',
    upload_photo: 'Upload Photo',
    change_password: 'Change Password',
    save_changes: 'Save Changes',
    user_management: 'User Management',
    add_user: 'Add User',
    app_title: 'Sells & Prefunds DB',
    sale: 'SALE',
    receipt: 'RECEIPT',
    customer_lbl: 'Customer',
    phone_lbl: 'Phone',
    category_lbl: 'Category',
    date_lbl: 'Date',
    amount_lbl: 'Amount',
    bill_no_lbl: 'Bill #',
    on_behalf_lbl: 'On behalf',
    note_lbl: 'Note',
    total_balance_lbl: 'Total Balance',
    thanks_lbl: 'Thank you!',
  },
  fa: {
    nav_dashboard: 'داشبورد',
    nav_customers: 'مشتریان',
    nav_reports: 'گزارش‌ها',
    nav_profile: 'پروفایل',
    nav_admin: 'مدیریت',
    logout: 'خروج',
    transaction_history: 'سابقه تراکنش',
    th_date: 'تاریخ',
    th_type: 'نوع',
    th_user: 'کاربر',
    th_amount: 'مبلغ',
    th_description: 'توضیحات',
    add_sale: 'افزودن فروش',
    add_receipt: 'افزودن رسید',
    add_customer: 'افزودن مشتری',
    my_profile: 'پروفایل من',
    upload_photo: 'اپلود عکس',
    change_password: 'تغییر رمز عبور',
    save_changes: 'ذخیره تغییرات',
    user_management: 'مدیریت کاربران',
    add_user: 'افزودن کاربر',
    app_title: 'سامانه فروش و پیش‌پرداخت',
    sale: 'فروش',
    receipt: 'رسید',
    customer_lbl: 'مشتری',
    phone_lbl: 'تلفن',
    category_lbl: 'دسته‌بندی',
    date_lbl: 'تاریخ',
    amount_lbl: 'مبلغ',
    bill_no_lbl: 'شماره بل',
    on_behalf_lbl: 'از جانب',
    note_lbl: 'یادداشت',
    total_balance_lbl: 'جمع بیلانس',
    thanks_lbl: 'سپاس!',
  }
};

let current = localStorage.getItem('lang') || 'en';

export function setLang(lang) {
  current = (lang === 'fa' ? 'fa' : 'en');
  localStorage.setItem('lang', current);
  // Toggle direction for Dari (RTL)
  document.documentElement.setAttribute('dir', current === 'fa' ? 'rtl' : 'ltr');
  applyTranslations();
}

export function getLang() { return current; }

export function t(key) {
  return (dictionaries[current] && dictionaries[current][key]) || dictionaries.en[key] || key;
}

export function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    const attr = el.getAttribute('data-i18n-attr');
    if (attr) el.setAttribute(attr, t(key));
    else el.textContent = t(key);
  });
  // Sync language selector if present
  const sel = document.getElementById('lang-select');
  if (sel) sel.value = current;
}

// Date/time formatting using Afghan (Persian) calendar for Dari
export function formatDate(date) {
  const d = (date instanceof Date) ? date : new Date(date);
  const locale = current === 'fa' ? 'fa-AF-u-ca-persian' : undefined;
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'numeric', day: 'numeric' }).format(d);
}

export function formatDateTime(date) {
  const d = (date instanceof Date) ? date : new Date(date);
  const locale = current === 'fa' ? 'fa-AF-u-ca-persian' : undefined;
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d);
}

export const i18n = { t, setLang, getLang, applyTranslations, formatDate, formatDateTime };

// Initialize direction on module load
document.documentElement.setAttribute('dir', current === 'fa' ? 'rtl' : 'ltr');
