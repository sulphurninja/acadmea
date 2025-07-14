import mongoose from 'mongoose';

const ForumCategorySchema = new mongoose.Schema({
  _id: String,
  name: { type: String, required: true },
  description: { type: String },
  icon: { type: String },
  color: { type: String, default: '#3B82F6' },
  gradeIds: [{ type: String, ref: 'Grade' }],
  subjectIds: [{ type: String, ref: 'Subject' }],
  moderatorIds: [{ type: String, ref: 'Teacher' }],
  isActive: { type: Boolean, default: true },
  allowStudentPosts: { type: Boolean, default: true },
  requireModeration: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.ForumCategory || mongoose.model('ForumCategory', ForumCategorySchema);
