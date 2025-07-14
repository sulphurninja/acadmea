import mongoose from 'mongoose';

const LessonSchema = new mongoose.Schema({
  _id: Number,
  name: { type: String, required: true },
  day: { type: String, enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'], required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  subjectId: { type: Number, ref: 'Subject', required: true },
  classId: { type: Number, ref: 'Class', required: true },
  teacherId: { type: String, ref: 'Teacher', required: true }
});

export default mongoose.models.Lesson || mongoose.model('Lesson', LessonSchema);
