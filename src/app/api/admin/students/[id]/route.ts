import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';
import User from '@/models/User';
import mongoose from 'mongoose';

// Get a specific student
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

      const student = await Student.findById(params.id)
        .populate('classId', 'name')
        .populate('gradeId', 'level')
        .populate('parentId', 'name surname');

      if (!student) {
        return NextResponse.json({ message: 'Student not found' }, { status: 404 });
      }

      return NextResponse.json(student);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a student
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

      // Validate required fields
      if (!data.name || !data.surname || !data.username || !data.classId || !data.gradeId) {
        return NextResponse.json(
          { message: 'Name, surname, username, class, and section are required' },
          { status: 400 }
        );
      }

      // Start a transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // If username is being changed, check if it's already taken
        if (data.username) {
          const existingUser = await User.findOne({
            username: data.username,
            _id: { $ne: params.id }
          });

          if (existingUser) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json(
              { message: 'Username already exists' },
              { status: 400 }
            );
          }
        }

        // Update the student profile
        const updateData: any = {
          name: data.name,
          surname: data.surname,
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          sex: data.sex,
          birthday: data.birthday,
          classId: data.classId,
          gradeId: data.gradeId,
          parentId: data.parentId || null,
          username: data.username,
          rollNo: data.rollNo || ''
        };

        const updatedStudent = await Student.findByIdAndUpdate(
          params.id,
          updateData,
          { new: true, session }
        );

        if (!updatedStudent) {
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json({ message: 'Student not found' }, { status: 404 });
        }

        // Update the user if a password change is requested
        if (data.password) {
          const user = await User.findById(params.id);
          if (user) {
            user.username = data.username; // Make sure username is updated in User model too
            user.password = data.password; // This will be hashed by pre-save middleware
            await user.save({ session });
          } else {
            // If user doesn't exist for some reason, create it
            const newUser = new User({
              _id: params.id,
              username: data.username,
              password: data.password,
              role: 'student',
              isActive: true
            });
            await newUser.save({ session });
          }
        } else {
          // Update just the username if needed
          await User.findByIdAndUpdate(
            params.id,
            { username: data.username },
            { session }
          );
        }

        await session.commitTransaction();
        session.endSession();

        return NextResponse.json({
          message: 'Student updated successfully',
          student: updatedStudent
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
    console.error('Error updating student:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a student
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
        // Delete the student profile
        const deletedStudent = await Student.findByIdAndDelete(
          params.id,
          { session }
        );

        if (!deletedStudent) {
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json({ message: 'Student not found' }, { status: 404 });
        }

        // Delete the user account
        await User.findByIdAndDelete(params.id, { session });

        await session.commitTransaction();
        session.endSession();

        return NextResponse.json({ message: 'Student deleted successfully' });
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
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
