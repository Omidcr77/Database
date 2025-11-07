import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    type: { type: String, enum: ['sale', 'receipt'], required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    billNumber: { type: String, default: '' }, // for sales
    onBehalf: { type: String, default: '' },   // for receipts
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, required: true }
  },
  { timestamps: true }
);

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
