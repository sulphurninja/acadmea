// models/Timetable.ts
import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
  // This is the section ID (which is in the Class model)
  sectionId: { type: Number, ref: 'Class', required: true },
  day: { type: String, required: true }, // e.g., "Monday"
  startTime: { type: String, required: true }, // "08:00"
  endTime: { type: String, required: true },   // "09:00"
  subject: { type: String, required: true },
  teacherName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema);
