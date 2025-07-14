import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Teacher from '@/models/Teacher';
import User from '@/models/User';
import mongoose from 'mongoose';

// Get a specific teacher
export async function GET(
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

      const teacher = await Teacher.findById(params.id)
        .populate('subjects', 'name');

      if (!teacher) {
        return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
      }

      return NextResponse.json(teacher);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching teacher:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a teacher
export async function PUT(
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

      const data = await request.json();

      // Start a transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Update the teacher profile
        const updatedTeacher = await Teacher.findByIdAndUpdate(
          params.id,
          {
            name: data.name,
            surname: data.surname,
            email: data.email,
            phone: data.phone,
            address: data.address,
            img: data.img,
            bloodType: data.bloodType,
            sex: data.sex,
            birthday: data.birthday,
            subjects: data.subjects
          },
          { new: true, session }
        );

        if (!updatedTeacher) {
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
        }

        // If there's a password to update
        if (data.password) {
          const user = await User.findById(params.id);
          if (user) {
            user.password = data.password;
            await user.save({ session });
          }
        }

        await session.commitTransaction();
        session.endSession();

        return NextResponse.json({
          message: 'Teacher updated successfully',
          teacher: updatedTeacher
        });
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
    console.error('Error updating teacher:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a teacher
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

      // Start a transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Delete the teacher profile
        const deletedTeacher = await Teacher.findByIdAndDelete(
          params.id,
          { session }
        );

        if (!deletedTeacher) {
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
        }

        // Delete the user account
        await User.findByIdAndDelete(params.id, { session });

        await session.commitTransaction();
        session.endSession();

        return NextResponse.json({ message: 'Teacher deleted successfully' });
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
    console.error('Error deleting teacher:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
