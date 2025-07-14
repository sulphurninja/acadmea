import mongoose from 'mongoose';

const AssignmentSubmissionSchema = new mongoose.Schema({
  assignmentId: { type: String, ref: 'Assignment', required: true },
  studentId: { type: String, ref: 'Student', required: true },
  submittedAt: { type: Date, default: Date.now },
  files: [{ type: String }],
  comments: { type: String },
  grade: { type: Number },
  feedback: { type: String },
  gradedBy: { type: String, ref: 'Teacher' },
  gradedAt: { type: Date }
});

// Compound index to ensure a student can only submit once per assignment
AssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export default mongoose.models.AssignmentSubmission ||
  mongoose.model('AssignmentSubmission', AssignmentSubmissionSchema);
