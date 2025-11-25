import Transaction from '../models/Transaction.js';
import { recalcBalance } from './customerController.js';
import { realtime } from '../sockets.js';
import mongoose from 'mongoose';

export async function listTransactions(req, res) {
  const { id } = req.params; // customer id
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid customer id' });
  const { from, to, type } = req.query;
  const q = { customerId: id };
  if (type && ['sale', 'receipt'].includes(type)) q.type = type;
  if (from || to) {
    q.date = {};
    if (from) {
      const d = new Date(from);
      if (!isNaN(d)) q.date.$gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!isNaN(d)) q.date.$lte = d;
    }
  }
  const items = await Transaction.find(q)
    .sort({ date: -1, createdAt: -1 })
    .populate('createdBy', 'username');
  res.json({ items });
}

export async function createTransaction(req, res) {
  const { id } = req.params; // customer id
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid customer id' });
  const { type, amount, date, description, billNumber, onBehalf } = req.body;
  if (!['sale', 'receipt'].includes(type)) return res.status(400).json({ message: 'Invalid type' });
  const amt = typeof amount === 'number' ? amount : parseFloat(amount);
  if (!Number.isFinite(amt) || amt < 0) return res.status(400).json({ message: 'Invalid amount' });
  const parsedDate = date ? new Date(date) : new Date();
  const safeDate = isNaN(parsedDate) ? new Date() : parsedDate;
  const tx = await Transaction.create({
    customerId: id,
    type,
    amount: amt,
    date: safeDate,
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
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid transaction id' });
  const tx = await Transaction.findByIdAndDelete(id);
  if (!tx) return res.status(404).json({ message: 'Transaction not found' });
  const balance = await recalcBalance(tx.customerId);
  realtime.emitTransaction('deleted', { _id: id, customerId: tx.customerId, balance });
  realtime.emitStatsUpdated();
  res.json({ message: 'Deleted', balance });
}
