import mongoose from 'mongoose';

const FeeStructureSchema = new mongoose.Schema({
  _id: Number,
  gradeId: { type: Number, ref: 'Grade', required: true },
  academicYear: { type: String, required: true }, // e.g., "2023-2024"
  tuitionFee: { type: Number, required: true, default: 0 },
  admissionFee: { type: Number, default: 0 },
  examFee: { type: Number, default: 0 },
  libraryFee: { type: Number, default: 0 },
  sportsFee: { type: Number, default: 0 },
  miscFee: { type: Number, default: 0 },
  dueDate: { type: Date, required: true },
  lateFeePenalty: { type: Number, default: 0 },
  installmentAllowed: { type: Boolean, default: true },
  installments: [{
    name: String, // e.g., "First Installment", "Second Installment"
    amount: Number,
    dueDate: Date
  }],
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, ref: 'Admin' }
});

// Compound index for unique grade + academic year
FeeStructureSchema.index({ gradeId: 1, academicYear: 1 }, { unique: true });

export default mongoose.models.FeeStructure || mongoose.model('FeeStructure', FeeStructureSchema);
