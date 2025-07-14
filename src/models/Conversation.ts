import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  _id: String,
  participants: [{
    userId: { type: String, required: true },
    role: { type: String, enum: ['parent', 'teacher', 'admin'], required: true },
    name: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now }
  }],
  subject: { type: String, required: true },
  category: {
    type: String,
    enum: ['GENERAL', 'ACADEMIC', 'DISCIPLINE', 'ATTENDANCE', 'FEES', 'HEALTH', 'TRANSPORT', 'OTHER'],
    default: 'GENERAL'
  },
  studentId: { type: String, ref: 'Student' },
  lastMessage: {
    content: { type: String },
    senderId: { type: String },
    senderName: { type: String },
    createdAt: { type: Date }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
