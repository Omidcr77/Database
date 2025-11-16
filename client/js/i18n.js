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
    username: 'Username',
    full_name: 'Full Name',
    avatar_url: 'Avatar URL',
    sales_trend: 'Sales Trend',
    last_7_days: 'Last 7 days',
    last_30_days: 'Last 30 days',
    total_customers: 'Total Customers',
    total_sales: 'Total Sales',
    money_lent: 'Money Lent',
    receivables: 'Receivables',
    total_profit: 'Total Profit',
    customers_title: 'Customers',
    search_customers: 'Search customers...',
    all_categories: 'All Categories',
    category_customer: 'Customer',
    category_investor: 'Investor',
    category_employee: 'Employee',
    category_other: 'Other',
    refresh: 'Refresh',
    no_customers: 'No customers found.',
    export_data: 'Export Data',
    export_type: 'Export Type',
    export_customers: 'Customers',
    export_transactions: 'Transactions',
    export_profitloss: 'Profit/Loss',
    from_date: 'From Date',
    to_date: 'To Date',
    download_csv: 'Download CSV',
    import_data: 'Import Data',
    import_type: 'Import Type',
    csv_file: 'CSV File',
    upload_csv: 'Upload CSV',
    first_name: 'First Name',
    last_name: 'Last Name',
    id_number: 'ID Number',
    address: 'Address',
    notes: 'Notes',
    share: 'Share',
    delete: 'Delete',
    open: 'Open',
    print: 'Print',
    blocked: 'blocked',
    block: 'Block',
    unblock: 'Unblock',
    role: 'Role',
    temporary_password: 'Temporary Password',
    role_viewer: 'viewer',
    role_manager: 'manager',
    role_admin: 'admin',
    create: 'Create',
    optional: 'Optional',
    optional_payer: 'Optional (payer name)',
    no_phone: 'No phone',
    balance_word: 'Balance',
    opening_balance: 'Opening Balance',
    balance_direction: 'Balance Direction',
    they_owe: 'They owe us',
    we_owe: 'We owe them',
    opening_date: 'Opening Date',
    sign_in_title: 'Please sign in to continue',
    welcome_back: 'Welcome back',
    toggle_theme: 'Toggle theme',
    remember_me: 'Remember me',
    forgot_password: 'Forgot password?',
    sign_in: 'Sign in',
    signing_in: 'Signing in...',
    username_required: 'Username is required.',
    password_required: 'Password is required.',
    signed_in_success: 'Signed in successfully.',
    login_failed: 'Login failed. Please check your credentials.',
    hide_password: 'Hide password',
    show_password: 'Show password',
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
    username: 'نام کاربری',
    full_name: 'نام کامل',
    avatar_url: 'پیوند عکس',
    sales_trend: 'روند فروش',
    last_7_days: '۷ روز گذشته',
    last_30_days: '۳۰ روز گذشته',
    total_customers: 'مجموع مشتریان',
    total_sales: 'مجموع فروش',
    money_lent: 'پول قرض‌داده',
    receivables: 'حساب‌های دریافتنی',
    total_profit: 'سود کل',
    customers_title: 'مشتریان',
    search_customers: 'جست‌وجوی مشتری...',
    all_categories: 'همه دسته‌ها',
    category_customer: 'مشتری',
    category_investor: 'سرمایه‌گذار',
    category_employee: 'کارمند',
    category_other: 'سایر',
    refresh: 'تازه‌سازی',
    no_customers: 'هیچ مشتری پیدا نشد.',
    export_data: 'برون‌بری داده',
    export_type: 'نوع برون‌بری',
    export_customers: 'مشتریان',
    export_transactions: 'تراکنش‌ها',
    export_profitloss: 'سود/زیان',
    from_date: 'از تاریخ',
    to_date: 'تا تاریخ',
    download_csv: 'دانلود CSV',
    import_data: 'درون‌ریزی داده',
    import_type: 'نوع درون‌ریزی',
    csv_file: 'فایل CSV',
    upload_csv: 'بارگذاری CSV',
    first_name: 'نام',
    last_name: 'تخلص',
    id_number: 'نمبر تذکره',
    address: 'آدرس',
    notes: 'یادداشت',
    share: 'اشتراک',
    delete: 'حذف',
    open: 'بازکردن',
    print: 'چاپ',
    blocked: 'مسدود',
    block: 'مسدود کردن',
    unblock: 'رفع انسداد',
    role: 'نقش',
    temporary_password: 'گذرواژه موقتی',
    role_viewer: 'بیننده',
    role_manager: 'مدیر',
    role_admin: 'ادمین',
    create: 'ایجاد',
    optional: 'اختیاری',
    optional_payer: 'اختیاری (نام پرداخت‌کننده)',
    no_phone: 'بدون شماره',
    balance_word: 'بیلانس',
    sign_in_title: 'برای ادامه وارد شوید',
    welcome_back: 'خوش آمدید',
    toggle_theme: 'تغییر تم',
    remember_me: 'مرا به خاطر بسپار',
    forgot_password: 'رمز عبور را فراموش کرده‌اید؟',
    sign_in: 'ورود',
    signing_in: 'در حال ورود...',
    username_required: 'نام کاربری لازم است.',
    password_required: 'رمز عبور لازم است.',
    signed_in_success: 'با موفقیت وارد شدید.',
    login_failed: 'ورود ناموفق بود. اطلاعات خود را بررسی کنید.',
    hide_password: 'پنهان کردن رمز',
    show_password: 'نمایش رمز',
  }
};

// Inject Dari translations for opening balance feature
try {
  if (dictionaries && dictionaries.fa) {
    dictionaries.fa.opening_balance = 'بیلانس ابتدایی';
    dictionaries.fa.balance_direction = 'جهت بیلانس';
    dictionaries.fa.they_owe = 'به ما مقروض اند';
    dictionaries.fa.we_owe = 'ما به آنها مقروضیم';
    dictionaries.fa.opening_date = 'تاریخ آغاز';
  }
} catch {}

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
