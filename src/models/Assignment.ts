import mongoose from 'mongoose';

const AssignmentSchema = new mongoose.Schema({
  _id: Number,
  title: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  subjectId: { type: Number, ref: 'Subject', required: true }
});

export default mongoose.models.Assignment || mongoose.model('Assignment', AssignmentSchema);
