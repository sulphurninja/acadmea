import mongoose from 'mongoose';

const TeacherSchema = new mongoose.Schema({
  _id: String,
  username: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  address: { type: String, required: true },
  img: String,
  bloodType: String,
  sex: { type: String, enum: ['MALE', 'FEMALE'], required: true },
  birthday: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  subjects: [{ type: Number, ref: 'Subject' }],
  classId: [{ type: Number, ref: 'Class' }],
});

export default mongoose.models.Teacher || mongoose.model('Teacher', TeacherSchema);
