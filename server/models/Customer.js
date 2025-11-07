import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['idCard', 'passport', 'other'], default: 'other' },
    label: { type: String, default: '' },
    url: { type: String, default: '' }
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    photoUrl: { type: String, default: '' },
    idNumber: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    documents: [documentSchema],
    category: { type: String, enum: ['Customer', 'Investor', 'Employee', 'Other'], default: 'Customer' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    balance: { type: Number, default: 0 },
    note: { type: String, default: '' }
  },
  { timestamps: true }
);

customerSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;

