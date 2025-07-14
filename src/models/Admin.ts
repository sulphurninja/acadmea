import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  _id: String,
  username: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  superAdmin: { type: Boolean, default: false }, // Whether this admin can create other admins
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
