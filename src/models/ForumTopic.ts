import mongoose from 'mongoose';

const ForumTopicSchema = new mongoose.Schema({
  _id: String,
  title: { type: String, required: true },
  content: { type: String, required: true },
  categoryId: { type: String, ref: 'ForumCategory', required: true },
  authorId: { type: String, required: true },
  authorRole: { type: String, enum: ['student', 'teacher'], required: true },
  authorName: { type: String, required: true },
  gradeId: { type: String, ref: 'Grade' },
  subjectId: { type: String, ref: 'Subject' },
  tags: [{ type: String }],
  isSticky: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  replies: { type: Number, default: 0 },
  lastReplyAt: { type: Date },
  lastReplyBy: { type: String },
  lastReplyByName: { type: String },
  attachments: [{
    fileName: { type: String },
    fileUrl: { type: String },
    fileType: { type: String },
    fileSize: { type: Number }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ForumTopicSchema.index({ categoryId: 1, createdAt: -1 });
ForumTopicSchema.index({ authorId: 1 });
ForumTopicSchema.index({ isSticky: -1, lastReplyAt: -1 });

export default mongoose.models.ForumTopic || mongoose.model('ForumTopic', ForumTopicSchema);
