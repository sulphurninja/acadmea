import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Parent from '@/models/Parent';
import User from '@/models/User';
import Student from '@/models/Student';
import mongoose from 'mongoose';

// Get a specific parent
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

      const parent = await Parent.findById(params.id);

      if (!parent) {
        return NextResponse.json({ message: 'Parent not found' }, { status: 404 });
      }

      return NextResponse.json(parent);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching parent:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a parent
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
      if (!data.name || !data.surname || !data.phone || !data.username) {
        return NextResponse.json(
          { message: 'Name, surname, phone, and username are required' },
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

        // Update the parent profile
        const updateData = {
          name: data.name,
          surname: data.surname,
          phone: data.phone,
          username: data.username,
          email: data.email || '',
          address: data.address || ''
        };

        const updatedParent = await Parent.findByIdAndUpdate(
          params.id,
          updateData,
          { new: true, session }
        );

        if (!updatedParent) {
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json({ message: 'Parent not found' }, { status: 404 });
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
              role: 'parent',
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
          message: 'Parent updated successfully',
          parent: updatedParent
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
    console.error('Error updating parent:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a parent
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
        // Check if there are students using this parent
        const associatedStudents = await Student.countDocuments({ parentId: params.id });
        if (associatedStudents > 0) {
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json(
            { message: 'Cannot delete parent: there are students associated with this parent. Please reassign or delete the students first.' },
            { status: 400 }
          );
        }

        // Delete the parent profile
        const deletedParent = await Parent.findByIdAndDelete(
          params.id,
          { session }
        );

        if (!deletedParent) {
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json({ message: 'Parent not found' }, { status: 404 });
        }

        // Delete the user account
        await User.findByIdAndDelete(params.id, { session });

        await session.commitTransaction();
        session.endSession();

        return NextResponse.json({ message: 'Parent deleted successfully' });
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
    console.error('Error deleting parent:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
