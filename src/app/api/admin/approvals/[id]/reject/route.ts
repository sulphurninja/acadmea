import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';
import Parent from '@/models/Parent';
import mongoose from 'mongoose';

// Reject and delete a pending user
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    // Authenticate admin
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
      const decoded: any = jwtDecode(token);

      if (decoded.exp * 1000 < Date.now()) {
        return NextResponse.json({ message: 'Token expired' }, { status: 401 });
      }

      if (decoded.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      // Start a session for transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Find the user
        const user = await User.findById(params.id);

        if (!user) {
          return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Delete the user based on role and associated profile
        if (user.role === 'teacher') {
          await Teacher.findByIdAndDelete(params.id, { session });
        } else if (user.role === 'student') {
          await Student.findByIdAndDelete(params.id, { session });
        } else if (user.role === 'parent') {
          await Parent.findByIdAndDelete(params.id, { session });
        }

        // Delete the user account itself
        await User.findByIdAndDelete(params.id, { session });

        await session.commitTransaction();
        session.endSession();

        // TODO: Notify the user that their account request was rejected

        return NextResponse.json({ message: 'User rejected and removed successfully' });

      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error rejecting user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
