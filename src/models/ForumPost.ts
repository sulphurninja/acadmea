import mongoose from 'mongoose';

const ForumPostSchema = new mongoose.Schema({
  _id: String,
  topicId: { type: String, ref: 'ForumTopic', required: true },
  content: { type: String, required: true },
  authorId: { type: String, required: true },
  authorRole: { type: String, enum: ['student', 'teacher'], required: true },
  authorName: { type: String, required: true },
  parentPostId: { type: String, ref: 'ForumPost' }, // For replies
  isApproved: { type: Boolean, default: true },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  attachments: [{
    fileName: { type: String },
    fileUrl: { type: String },
    fileType: { type: String },
    fileSize: { type: Number }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ForumPostSchema.index({ topicId: 1, createdAt: 1 });
ForumPostSchema.index({ authorId: 1 });
ForumPostSchema.index({ parentPostId: 1 });

export default mongoose.models.ForumPost || mongoose.model('ForumPost', ForumPostSchema);
