import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  studentId: { type: String, ref: 'Student', required: true },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
    default: 'PRESENT'
  },
  notes: { type: String },
  recordedBy: { type: String, ref: 'Teacher' },
  createdAt: { type: Date, default: Date.now }
});

// Compound index to ensure unique attendance records
AttendanceSchema.index({ studentId: 1, lessonId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
