import Transaction from '../models/Transaction.js';
import { recalcBalance } from './customerController.js';
import { realtime } from '../sockets.js';

export async function listTransactions(req, res) {
  const { id } = req.params; // customer id
  const { from, to, type } = req.query;
  const q = { customerId: id };
  if (type && ['sale', 'receipt'].includes(type)) q.type = type;
  if (from || to) q.date = {};
  if (from) q.date.$gte = new Date(from);
  if (to) q.date.$lte = new Date(to);
  const items = await Transaction.find(q).sort({ date: -1, createdAt: -1 });
  res.json({ items });
}

export async function createTransaction(req, res) {
  const { id } = req.params; // customer id
  const { type, amount, date, description, billNumber, onBehalf } = req.body;
  if (!['sale', 'receipt'].includes(type)) return res.status(400).json({ message: 'Invalid type' });
  if (typeof amount !== 'number') return res.status(400).json({ message: 'Amount required' });
  const tx = await Transaction.create({
    customerId: id,
    type,
    amount,
    date: date ? new Date(date) : new Date(),
    description: description || '',
    billNumber: type === 'sale' ? (billNumber || '') : '',
    onBehalf: type === 'receipt' ? (onBehalf || '') : '',
    createdBy: req.user._id
  });
  const balance = await recalcBalance(id);
  realtime.emitTransaction('created', { ...tx.toObject(), balance });
  realtime.emitStatsUpdated();
  res.status(201).json({ transaction: tx, balance });
}

export async function deleteTransaction(req, res) {
  const { id } = req.params; // transaction id
  const tx = await Transaction.findByIdAndDelete(id);
  if (!tx) return res.status(404).json({ message: 'Transaction not found' });
  const balance = await recalcBalance(tx.customerId);
  realtime.emitTransaction('deleted', { _id: id, customerId: tx.customerId, balance });
  realtime.emitStatsUpdated();
  res.json({ message: 'Deleted', balance });
}
