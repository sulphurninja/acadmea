import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  _id: String,
  conversationId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  senderRole: { type: String, enum: ['parent', 'teacher', 'admin'], required: true },
  receiverId: { type: String, required: true },
  receiverRole: { type: String, enum: ['parent', 'teacher', 'admin'], required: true },
  subject: { type: String, required: true },
  content: { type: String, required: true },
  attachments: [{
    fileName: { type: String },
    fileUrl: { type: String },
    fileType: { type: String },
    fileSize: { type: Number }
  }],
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  category: {
    type: String,
    enum: ['GENERAL', 'ACADEMIC', 'DISCIPLINE', 'ATTENDANCE', 'FEES', 'HEALTH', 'TRANSPORT', 'OTHER'],
    default: 'GENERAL'
  },
  studentId: { type: String, ref: 'Student' }, // Related student if applicable
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index for efficient conversation queries
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, receiverId: 1 });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
