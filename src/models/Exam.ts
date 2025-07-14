import mongoose from 'mongoose';

const ExamSchema = new mongoose.Schema({
  _id: Number,
  title: { type: String, required: true },
  description: { type: String },
  examDate: { type: Date, required: true },
  subjectId: { type: Number, ref: 'Subject', required: true },
  gradeId: { type: Number, ref: 'Grade', required: true }, // Academic grade level
  maxMarks: { type: Number, required: true },
  duration: { type: Number, required: true }, // in minutes
  examType: {
    type: String,
    enum: ['UNIT_TEST', 'MIDTERM', 'FINAL', 'QUIZ', 'ASSIGNMENT'],
    required: true
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'],
    default: 'SCHEDULED'
  },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, ref: 'Admin', required: true }
});

export default mongoose.models.Exam || mongoose.model('Exam', ExamSchema);
