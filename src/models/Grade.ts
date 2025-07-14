import mongoose from 'mongoose';

// Represents a class level (e.g., Class IX, Class X)
const GradeSchema = new mongoose.Schema({
  _id: Number,
  level: { type: Number, unique: true, required: true },
  name: { type: String, default: function() { return `Class ${this.level}`; } }
});

export default mongoose.models.Grade || mongoose.model('Grade', GradeSchema);
