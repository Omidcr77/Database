import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './lib/db.js';
import User from './models/User.js';
import Customer from './models/Customer.js';
import Transaction from './models/Transaction.js';

dotenv.config();

async function run() {
  await connectDB();
  console.log('Seeding database...');

  // Clear minimal data for idempotency in sample env
  const existingAdmin = await User.findOne({ username: 'admin' });
  if (!existingAdmin) {
    await User.create({
      username: 'admin',
      password: 'Admin123!',
      name: 'Admin User',
      role: 'admin'
    });
    console.log('Created admin user admin / Admin123!');
  } else {
    console.log('Admin already exists');
  }

  const admin = await User.findOne({ username: 'admin' });

  const customersCount = await Customer.countDocuments();
  if (customersCount === 0) {
    const c1 = await Customer.create({ firstName: 'Alice', lastName: 'Smith', phone: '555-1001', category: 'Customer', createdBy: admin._id, note: 'VIP' });
    const c2 = await Customer.create({ firstName: 'Bob', lastName: 'Johnson', phone: '555-1002', category: 'Customer', createdBy: admin._id });
    const c3 = await Customer.create({ firstName: 'Charlie', lastName: 'Lee', phone: '555-1003', category: 'Customer', createdBy: admin._id });

    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    const twoDays = new Date(Date.now() - 2 * 86400000);

    await Transaction.create({ customerId: c1._id, type: 'sale', amount: 500, description: 'Phone sale', date: twoDays, createdBy: admin._id });
    await Transaction.create({ customerId: c1._id, type: 'receipt', amount: 200, description: 'Partial payment', date: yesterday, createdBy: admin._id });
    await Transaction.create({ customerId: c2._id, type: 'sale', amount: 300, description: 'Accessory sale', date: today, createdBy: admin._id });
    await Transaction.create({ customerId: c3._id, type: 'sale', amount: 150, description: 'Charger', date: today, createdBy: admin._id });

    // Recalc balances
    const byCustomer = [c1, c2, c3];
    for (const c of byCustomer) {
      const agg = await Transaction.aggregate([
        { $match: { customerId: c._id } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } }
      ]);
      const sale = agg.find((a) => a._id === 'sale')?.total || 0;
      const receipt = agg.find((a) => a._id === 'receipt')?.total || 0;
      const balance = sale - receipt;
      await Customer.findByIdAndUpdate(c._id, { balance });
    }

    console.log('Seeded 3 customers with sample transactions.');
  } else {
    console.log('Customers already exist, skipping customers/transactions seeding.');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
