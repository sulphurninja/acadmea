import mongoose from 'mongoose';

const ExamResultSchema = new mongoose.Schema({
  _id: { type: Number, required: true },
  examId: { type: Number, ref: 'Exam', required: true },
  studentId: { type: String, ref: 'Student', required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, default: 100 },
  grade: { type: String, default: '' }, // A+, A, B+, etc.
  percentage: { type: Number, default: 0 },
  rank: { type: Number },
  feedback: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
  gradedAt: { type: Date },
  gradedBy: { type: String, ref: 'Teacher' }
}, {
  timestamps: true
});

const ExamResult = mongoose.models.ExamResult || mongoose.model('ExamResult', ExamResultSchema);
export default ExamResult;
