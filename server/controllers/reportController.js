import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import { toCSV, fromCSV } from '../utils/csv.js';
import { recalcBalance } from './customerController.js';

export async function exportCSV(req, res) {
  const { type, from, to } = req.query;
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  const safe = (v) => {
    if (v == null) return '';
    const s = String(v);
    // Prevent CSV formula injection when opened in Excel
    return /^[=+\-@]/.test(s) ? `'${s}` : s;
  };

  if (type === 'customers') {
    const customers = await Customer.find().lean();
    const records = customers.map((c) => ({
      id: c._id.toString(),
      firstName: safe(c.firstName),
      lastName: safe(c.lastName),
      fullName: safe(`${c.firstName} ${c.lastName}`),
      phone: safe(c.phone || ''),
      address: safe(c.address || ''),
      category: safe(c.category),
      idNumber: safe(c.idNumber || ''),
      balance: c.balance,
      photoUrl: safe(c.photoUrl || ''),
      note: safe(c.note || ''),
      createdAt: c.createdAt?.toISOString() || ''
    }));
    const csv = toCSV(records);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');
    return res.send(csv);
  }

  if (type === 'sales') {
    const q = {};
    if (fromDate || toDate) q.date = {};
    if (fromDate) q.date.$gte = fromDate;
    if (toDate) q.date.$lte = toDate;
    const txs = await Transaction.find(q).lean();
    const records = txs.map((t) => ({
      id: t._id.toString(),
      customerId: t.customerId.toString(),
      type: t.type,
      amount: t.amount,
      description: safe(t.description || ''),
      billNumber: safe(t.billNumber || ''),
      onBehalf: safe(t.onBehalf || ''),
      date: t.date?.toISOString() || '',
      createdBy: t.createdBy?.toString() || ''
    }));
    const csv = toCSV(records);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    return res.send(csv);
  }

  if (type === 'profitloss') {
    const q = {};
    if (fromDate || toDate) q.date = {};
    if (fromDate) q.date.$gte = fromDate;
    if (toDate) q.date.$lte = toDate;
    const [salesAgg, receiptsAgg] = await Promise.all([
      Transaction.aggregate([{ $match: { ...q, type: 'sale' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: { ...q, type: 'receipt' } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);
    const sales = salesAgg[0]?.total || 0;
    const receipts = receiptsAgg[0]?.total || 0;
    const records = [
      { metric: 'Total Sales', amount: sales },
      { metric: 'Total Receipts', amount: receipts },
      { metric: 'Profit/Loss (Receipts - Sales)', amount: receipts - sales }
    ];
    const csv = toCSV(records);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="profitloss.csv"');
    return res.send(csv);
  }

  res.status(400).json({ message: 'Invalid type' });
}

export async function importCSV(req, res) {
  const { type } = req.query;
  const { csv } = req.body || {};
  if (!csv) return res.status(400).json({ message: 'CSV text required' });
  const rows = fromCSV(csv);

  if (type === 'customers') {
    // Upsert by id or fullName
    let created = 0;
    let updated = 0;
    for (const r of rows) {
      const data = {
        firstName: r.firstName || (r.fullName ? r.fullName.split(' ')[0] : ''),
        lastName: r.lastName || (r.fullName ? r.fullName.split(' ').slice(1).join(' ') : ''),
        phone: r.phone || '',
        address: r.address || '',
        category: r.category || 'Customer',
        idNumber: r.idNumber || '',
        photoUrl: r.photoUrl || '',
        note: r.note || ''
      };
      try {
        const existing = r.id ? await Customer.findById(r.id).catch(() => null) : null;
        if (existing) {
          await Customer.findByIdAndUpdate(existing._id, data);
          updated++;
        } else if (data.firstName && data.lastName) {
          await Customer.create({ ...data, createdBy: req.user._id });
          created++;
        }
      } catch (_e) { /* skip bad row */ }
    }
    return res.json({ message: 'Customers imported', created, updated });
  }

  if (type === 'sales') {
    let created = 0;
    const affected = new Set();
    for (const r of rows) {
      try {
        if (!r.customerId || !r.type || !r.amount) continue;
        const amount = Number(r.amount);
        if (!(amount >= 0) || !['sale', 'receipt'].includes(r.type)) continue;
        await Transaction.create({
          customerId: r.customerId,
          type: r.type === 'receipt' ? 'receipt' : 'sale',
          amount,
          description: r.description || '',
          billNumber: r.billNumber || '',
          onBehalf: r.onBehalf || '',
          date: r.date ? new Date(r.date) : new Date(),
          createdBy: req.user._id
        });
        created++;
        affected.add(String(r.customerId));
      } catch (_e) { /* skip bad row */ }
    }
    // Recalc balances for affected customers and emit stats
    for (const cid of affected) {
      try { await recalcBalance(cid); } catch {}
    }
    return res.json({ message: 'Transactions imported', created, affected: affected.size });
  }

  res.status(400).json({ message: 'Invalid type' });
}
