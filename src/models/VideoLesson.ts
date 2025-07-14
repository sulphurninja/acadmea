import mongoose from 'mongoose';

const VideoLessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  subjectId: { type: Number, ref: 'Subject', required: true },
  classId: { type: Number, ref: 'Class', required: true },
  duration: { type: Number, default: 0 }, // Duration in minutes
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  isPublished: { type: Boolean, default: true },
  views: { type: Number, default: 0 }
});

export default mongoose.models.VideoLesson || mongoose.model('VideoLesson', VideoLessonSchema);
