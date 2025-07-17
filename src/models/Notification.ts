import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  _id: String,
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['ANNOUNCEMENT', 'ASSIGNMENT', 'EXAM', 'ATTENDANCE', 'FEE', 'GENERAL', 'URGENT'],
    default: 'GENERAL'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  recipients: [{
    userId: { type: String, required: true },
    userRole: { type: String, enum: ['admin', 'teacher', 'student', 'parent'], required: true },
    readAt: { type: Date, default: null },
    isRead: { type: Boolean, default: false }
  }],
  createdBy: { type: String, required: true },
  createdByRole: { type: String, enum: ['admin', 'teacher'], required: true },
  createdByName: { type: String, required: true },
  targetAudience: {
    type: String,
    enum: ['ALL', 'STUDENTS', 'TEACHERS', 'PARENTS', 'SPECIFIC_GRADE', 'SPECIFIC_CLASS'],
    default: 'ALL'
  },
  targetGradeId: { type: Number, ref: 'Grade' },
  targetClassId: { type: Number, ref: 'Class' },
  attachments: [{
    fileName: { type: String },
    fileUrl: { type: String },
    fileType: { type: String },
    fileSize: { type: Number }
  }],
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  actionUrl: { type: String }, // Optional URL for action buttons
  actionText: { type: String }, // Text for action button
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

NotificationSchema.index({ 'recipients.userId': 1, 'recipients.userRole': 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ isActive: 1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);