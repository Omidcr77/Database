import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';
import { realtime } from '../sockets.js';

async function recalcBalance(customerId) {
  const [cust, agg] = await Promise.all([
    Customer.findById(customerId).lean(),
    Transaction.aggregate([
      { $match: { customerId: new mongoose.Types.ObjectId(customerId) } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ])
  ]);
  const sale = agg.find((a) => a._id === 'sale')?.total || 0;
  const receipt = agg.find((a) => a._id === 'receipt')?.total || 0;
  // For Investors, receipts increase what we owe them (liability)
  const isInvestor = cust?.category === 'Investor';
  const balance = isInvestor ? (receipt - sale) : (sale - receipt);
  await Customer.findByIdAndUpdate(customerId, { balance });
  return balance;
}

export async function listCustomers(req, res) {
  const { search = '', category, page = 1, limit = 20 } = req.query;
  const q = {};
  if (search) {
    q.$or = [
      { firstName: new RegExp(search, 'i') },
      { lastName: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
      { idNumber: new RegExp(search, 'i') }
    ];
  }
  if (category) q.category = category;
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Customer.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Customer.countDocuments(q)
  ]);
  res.json({ items, total, page: Number(page), limit: Number(limit) });
}

export async function getCustomer(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid customer id' });
  const customer = await Customer.findById(id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  res.json({ customer });
}

export async function createCustomer(req, res) {
  const src = req.body || {};
  if (!src.firstName || !src.lastName) return res.status(400).json({ message: 'First/last name required' });

  // Extract optional opening balance inputs (do not persist on customer document)
  const openingBalanceRaw = src.openingBalance;
  const openingDirection = src.openingDirection; // 'they_owe' | 'we_owe'
  const openingDate = src.openingDate;

  const data = { ...src, createdBy: req.user._id };
  // Never accept client-provided balance; it's derived
  delete data.balance;
  delete data.openingBalance;
  delete data.openingDirection;
  delete data.openingDate;

  const customer = await Customer.create(data);

  // Handle optional opening balance by recording a first transaction
  let createdOpeningTx = null;
  const amt = typeof openingBalanceRaw === 'number' ? openingBalanceRaw : parseFloat(openingBalanceRaw);
  if (Number.isFinite(amt) && amt > 0) {
    const dir = openingDirection === 'we_owe' ? 'we_owe' : 'they_owe';
    const type = dir === 'they_owe' ? 'sale' : 'receipt';
    createdOpeningTx = await Transaction.create({
      customerId: customer._id,
      type,
      amount: amt,
      description: 'Opening Balance',
      billNumber: type === 'sale' ? '' : undefined,
      onBehalf: type === 'receipt' ? '' : undefined,
      createdBy: req.user._id,
      date: openingDate ? new Date(openingDate) : new Date()
    });
    await recalcBalance(customer._id);
  }

  // Re-fetch to include computed balance
  const fresh = await Customer.findById(customer._id);
  realtime.emitCustomer('created', fresh);
  realtime.emitStatsUpdated();
  res.status(201).json({ customer: fresh, openingTransaction: createdOpeningTx || undefined, balance: fresh.balance });
}

export async function updateCustomer(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid customer id' });
  const src = { ...(req.body || {}) };
  const allowed = ['firstName','lastName','idNumber','phone','address','photoUrl','category','note'];
  const updates = {};
  for (const k of allowed) if (k in src) updates[k] = src[k];
  const customer = await Customer.findByIdAndUpdate(id, updates, { new: true });
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  realtime.emitCustomer('updated', customer);
  res.json({ customer });
}

export async function deleteCustomer(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid customer id' });
  const customer = await Customer.findByIdAndDelete(id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  await Transaction.deleteMany({ customerId: id });
  realtime.emitCustomer('deleted', { _id: id });
  realtime.emitStatsUpdated();
  res.json({ message: 'Deleted' });
}

export { recalcBalance };
