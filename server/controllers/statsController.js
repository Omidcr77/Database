import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';

export async function overview(req, res) {
  const [totalCustomers, salesCount, receivablesAgg, nonInvestorSalesAgg, investorReceiptsAgg] = await Promise.all([
    Customer.countDocuments({}),
    Transaction.countDocuments({ type: 'sale' }),
    Customer.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
    // Sum of sales for non-investors
    Transaction.aggregate([
      { $match: { type: 'sale' } },
      { $lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'cust' } },
      { $unwind: '$cust' },
      { $match: { 'cust.category': { $ne: 'Investor' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    // Sum of receipts for investors (money provided by investors)
    Transaction.aggregate([
      { $match: { type: 'receipt' } },
      { $lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'cust' } },
      { $unwind: '$cust' },
      { $match: { 'cust.category': 'Investor' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const totalMoneyLent = (nonInvestorSalesAgg[0]?.total || 0) + (investorReceiptsAgg[0]?.total || 0);

  // For display we still show gross receipts (all receipts)
  const receiptsSumAgg = await Transaction.aggregate([{ $match: { type: 'receipt' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  const totalReceipts = receiptsSumAgg[0]?.total || 0;
  const totalReceivables = receivablesAgg[0]?.total || 0;
  const totalProfit = totalReceipts - totalMoneyLent; // simple definition
  res.json({
    totalCustomers,
    totalSalesCount: salesCount,
    totalMoneyLent,
    totalReceivables,
    totalProfit
  });
}

export async function salesTrend(req, res) {
  const range = Number(req.query.range || 7);
  const days = [7, 30].includes(range) ? range : 7;
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  const items = await Transaction.aggregate([
    { $match: { type: 'sale', date: { $gte: from } } },
    { $group: { _id: { $dateToString: { date: '$date', format: '%Y-%m-%d' } }, total: { $sum: '$amount' } } },
    { $sort: { _id: 1 } }
  ]);
  // normalize to all days
  const map = new Map(items.map((i) => [i._id, i.total]));
  const labels = [];
  const data = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    labels.push(key);
    data.push(map.get(key) || 0);
  }
  res.json({ labels, data });
}
