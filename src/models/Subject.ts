import mongoose from 'mongoose';

const SubjectSchema = new mongoose.Schema({
  _id: Number,
  name: { type: String, required: true },
  description: { type: String },
  gradeId: { type: Number, ref: 'Grade', required: true },
  // Replace credits with more relevant fields for Indian schools
  isCore: { type: Boolean, default: true }, // Whether it's a core subject or optional
  passingMarks: { type: Number, default: 33 }, // Standard passing marks in CBSE (usually 33%)
  fullMarks: { type: Number, default: 100 }, // Standard full marks
  hasTheory: { type: Boolean, default: true },
  hasPractical: { type: Boolean, default: false },
  theoryCutOff: { type: Number, default: 33 }, // Theory passing percentage cutoff
  practicalCutOff: { type: Number, default: 33 } // Practical passing percentage cutoff
});

export default mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);
