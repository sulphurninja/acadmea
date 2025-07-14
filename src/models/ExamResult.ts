import mongoose from 'mongoose';

const ExamResultSchema = new mongoose.Schema({
  examId: { type: Number, ref: 'Exam', required: true },
  studentId: { type: String, ref: 'Student', required: true },
  marks: { type: Number, min: 0 },
  isAbsent: { type: Boolean, default: false },
  isGraded: { type: Boolean, default: false },
  remarks: { type: String },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, ref: 'Teacher', required: true },
  updatedAt: { type: Date },
  updatedBy: { type: String, ref: 'Teacher' }
});

// Compound index to ensure unique exam + student combination
ExamResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });

export default mongoose.models.ExamResult || mongoose.model('ExamResult', ExamResultSchema);
