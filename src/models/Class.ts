import mongoose from 'mongoose';

// Represents a section (e.g., IX-A, IX-B) of a class
const ClassSchema = new mongoose.Schema({
  _id: Number,
  name: { type: String, unique: true, required: true }, // e.g., "IX-A"
  capacity: { type: Number, required: true },
  supervisorId: { type: String, ref: 'Teacher' }, // Class teacher
  gradeId: { type: Number, ref: 'Grade', required: true } // Reference to the class level
});

export default mongoose.models.Class || mongoose.model('Class', ClassSchema);
