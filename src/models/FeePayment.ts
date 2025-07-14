import mongoose from 'mongoose';

const FeePaymentSchema = new mongoose.Schema({
  _id: Number,
  studentId: { type: String, ref: 'Student', required: true },
  academicYear: { type: String, required: true },
  feeType: {
    type: String,
    enum: ['TUITION', 'ADMISSION', 'EXAM', 'LIBRARY', 'SPORTS', 'MISC', 'INSTALLMENT'],
    required: true
  },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  paymentDate: { type: Date },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'],
    default: 'PENDING'
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE', 'UPI'],
    required: function() { return this.status === 'PAID'; }
  },
  transactionId: { type: String },
  receiptNumber: { type: String },
  lateFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  remarks: { type: String },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, ref: 'Admin' },
  paidBy: { type: String, ref: 'Parent' }
});

export default mongoose.models.FeePayment || mongoose.model('FeePayment', FeePaymentSchema);
