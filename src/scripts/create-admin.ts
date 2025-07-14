import connectToDatabase from '../lib/db';
import User from '../models/User';
import Admin from '../models/Admin';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function createAdminUser() {
  try {
    await connectToDatabase();

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: adminUsername });

    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const adminId = new mongoose.Types.ObjectId().toString();

    // Create user with admin role
    const adminUser = new User({
      _id: adminId,
      username: adminUsername,
      password: adminPassword, // This will be hashed automatically by the model pre-save hook
      role: 'admin',
      isActive: true
    });

    await adminUser.save();

    // Create admin profile
    const admin = new Admin({
      _id: adminId,
      username: adminUsername
    });

    await admin.save();

    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdminUser();
