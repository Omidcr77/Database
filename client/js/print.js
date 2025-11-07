// Requires jsPDF UMD to be loaded on the page (window.jspdf)
import { formatDateTime, t, getLang } from './i18n.js';

function formatCurrency(n) {
  try {
    const locale = getLang() === 'fa' ? 'fa-AF' : undefined;
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(n);
  } catch {
    return `$${Number(n).toFixed(2)}`;
  }
}

export async function printTx(tx, customer, balance) {
  const ensureJsPDF = async () => {
    if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
    // Fallback dynamic loader if script tag missing
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return window.jspdf.jsPDF;
  };

  const jsPDF = await ensureJsPDF();

  // For Dari, load a Unicode font that supports Persian glyphs (Vazirmatn)
  async function ensurePersianFont(doc) {
    if (getLang() !== 'fa') return 'helvetica';
    try {
      const tryUrls = [
        'https://cdn.jsdelivr.net/npm/vazirmatn@33.003/fonts/ttf/Vazirmatn-Regular.ttf',
        'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/ttf/Vazirmatn-Regular.ttf',
        'https://cdn.jsdelivr.net/npm/vazirmatn@latest/fonts/ttf/Vazirmatn-Regular.ttf'
      ];
      let ok = false;
      for (const url of tryUrls) {
        try {
          const resp = await fetch(url, { mode: 'cors' });
          if (!resp.ok) continue;
          const buf = await resp.arrayBuffer();
          const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          doc.addFileToVFS('Vazirmatn-Regular.ttf', b64);
          doc.addFont('Vazirmatn-Regular.ttf', 'Vazirmatn', 'normal');
          ok = true; break;
        } catch { /* try next */ }
      }
      if (ok) return 'Vazirmatn';
    } catch { /* ignore */ }
    return 'helvetica';
  }

  // 58mm thermal-like receipt size: width 58mm, height auto
  const doc = new jsPDF({ unit: 'mm', format: [58, 120] });
  const fontName = await ensurePersianFont(doc);
  const isFa = getLang() === 'fa';
  const line = (y, text, size = 8, bold = false) => {
    doc.setFont(fontName, bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const maxWidth = 52; // 58mm - margins
    const lines = doc.splitTextToSize(text, maxWidth);
    const x = isFa ? 55 : 3; // align right for RTL
    const align = isFa ? 'right' : 'left';
    doc.text(lines, x, y, { align });
    return y + (lines.length * (size * 0.45 + 1.5));
  };

  let y = 6;
  y = line(y, t('app_title'), 10, true);
  y = line(y, (tx.type === 'sale' ? t('sale') : t('receipt')), 9, true);
  y += 1;

  // Customer / header info
  const name = customer.fullName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
  const category = customer.category || 'Customer';
  y = line(y, `${t('customer_lbl')}: ${name}`);
  if (customer.phone) y = line(y, `${t('phone_lbl')}: ${customer.phone}`);
  y = line(y, `${t('category_lbl')}: ${category}`);
  y = line(y, `${t('date_lbl')}: ${formatDateTime(tx.date)}`);
  // Exclude user/created-by from printout per request
  y += 2;

  // Transaction details
  y = line(y, `${t('amount_lbl')}: ${formatCurrency(tx.amount)}`, 10, true);
  if (tx.type === 'sale' && tx.billNumber) y = line(y, `${t('bill_no_lbl')}: ${tx.billNumber}`);
  if (tx.type === 'receipt' && tx.onBehalf) y = line(y, `${t('on_behalf_lbl')}: ${tx.onBehalf}`);
  if (tx.description) y = line(y, `${t('note_lbl')}: ${tx.description}`);
  y += 2;

  // Balance summary
  y = line(y, `${t('total_balance_lbl')}: ${formatCurrency(balance)}`, 10, true);
  y += 4;
  y = line(y, t('thanks_lbl'), 9, true);

  // Save
  const fnameSafe = (name || 'customer').replace(/[^a-z0-9-_]+/gi, '_');
  const file = `${tx.type}_${fnameSafe}_${new Date(tx.date).toISOString().slice(0,10)}.pdf`;
  doc.save(file);
}
