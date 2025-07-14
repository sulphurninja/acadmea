import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Parent from '@/models/Parent';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();
    const {
      username,
      name,
      surname,
      email,
      phone,
      address,
      password,
      sex,
      birthday,
      userType,
    } = data;

  
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ message: 'Username already exists' }, { status: 400 });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create user based on userType
      const userId = new mongoose.Types.ObjectId().toString();

      const user = new User({
        _id: userId,
        username,
        password,
        role: userType,
        isActive: userType === 'student' || userType === 'parent' // Teachers require admin approval
      });

      await user.save({ session });

      // Create specific user profile based on role
      const dobDate = new Date(birthday);

      if (userType === 'student') {
        // For students, we need parent and class info, but for this demo
        // we're setting placeholders that would be filled in a complete implementation
        const student = new Student({
          _id: userId,
          username,
          name,
          surname,
          email,
          phone,
          address,
          sex,
          birthday: dobDate,
          // These would be properly set in a real implementation
          parentId: "placeholder",
          classId: 1,
          gradeId: 1
        });
        await student.save({ session });
      }

      else if (userType === 'teacher') {
        const teacher = new Teacher({
          _id: userId,
          username,
          name,
          surname,
          email,
          phone,
          address,
          sex,
          birthday: dobDate,
          subjects: [] // To be assigned by admin later
        });
        await teacher.save({ session });
      }

      else if (userType === 'parent') {
        // In a real app, you would have a Parent model
        // For this example, we'll assume it exists
        const parent = new Parent({
          _id: userId,
          username,
          name,
          surname,
          email,
          phone,
          address
        });
        await parent.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      return NextResponse.json({ message: 'Registration successful' });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
