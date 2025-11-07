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
  const customer = await Customer.findById(id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  res.json({ customer });
}

export async function createCustomer(req, res) {
  const data = req.body;
  if (!data.firstName || !data.lastName) return res.status(400).json({ message: 'First/last name required' });
  data.createdBy = req.user._id;
  const customer = await Customer.create(data);
  realtime.emitCustomer('created', customer);
  realtime.emitStatsUpdated();
  res.status(201).json({ customer });
}

export async function updateCustomer(req, res) {
  const { id } = req.params;
  const updates = { ...req.body };
  const customer = await Customer.findByIdAndUpdate(id, updates, { new: true });
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  realtime.emitCustomer('updated', customer);
  res.json({ customer });
}

export async function deleteCustomer(req, res) {
  const { id } = req.params;
  const customer = await Customer.findByIdAndDelete(id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  await Transaction.deleteMany({ customerId: id });
  realtime.emitCustomer('deleted', { _id: id });
  realtime.emitStatsUpdated();
  res.json({ message: 'Deleted' });
}

export { recalcBalance };
