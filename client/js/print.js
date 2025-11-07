// Requires jsPDF UMD to be loaded on the page (window.jspdf)

function formatCurrency(n) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
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

  // 58mm thermal-like receipt size: width 58mm, height auto
  const doc = new jsPDF({ unit: 'mm', format: [58, 120] });
  const line = (y, text, size = 8, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const maxWidth = 52; // 58mm - margins
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, 3, y);
    return y + (lines.length * (size * 0.45 + 1.5));
  };

  let y = 6;
  y = line(y, 'Sells & Prefunds DB', 10, true);
  y = line(y, (tx.type === 'sale' ? 'SALE' : 'RECEIPT'), 9, true);
  y += 1;

  // Customer / header info
  const name = customer.fullName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
  const category = customer.category || 'Customer';
  y = line(y, `Customer: ${name}`);
  if (customer.phone) y = line(y, `Phone: ${customer.phone}`);
  y = line(y, `Category: ${category}`);
  y = line(y, `Date: ${new Date(tx.date).toLocaleString()}`);
  if (tx.createdBy && tx.createdBy.username) y = line(y, `User: ${tx.createdBy.username}`);
  y += 2;

  // Transaction details
  y = line(y, `Amount: ${formatCurrency(tx.amount)}`, 10, true);
  if (tx.type === 'sale' && tx.billNumber) y = line(y, `Bill #: ${tx.billNumber}`);
  if (tx.type === 'receipt' && tx.onBehalf) y = line(y, `On behalf: ${tx.onBehalf}`);
  if (tx.description) y = line(y, `Note: ${tx.description}`);
  y += 2;

  // Balance summary
  y = line(y, `Total Balance: ${formatCurrency(balance)}`, 10, true);
  y += 4;
  y = line(y, 'Thank you!', 9, true);

  // Save
  const fnameSafe = (name || 'customer').replace(/[^a-z0-9-_]+/gi, '_');
  const file = `${tx.type}_${fnameSafe}_${new Date(tx.date).toISOString().slice(0,10)}.pdf`;
  doc.save(file);
}

