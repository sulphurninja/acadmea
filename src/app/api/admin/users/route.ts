import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

// Get a specific user
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const user = await User.findById(params.id);

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a user
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const data = await request.json();

    // If updating username, check if it already exists
    if (data.username) {
      const existingUser = await User.findOne({
        username: data.username,
        _id: { $ne: params.id }
      });

      if (existingUser) {
        return NextResponse.json(
          { message: 'Username already exists' },
          { status: 400 }
        );
      }
    }

    // Exclude password if not provided
    if (!data.password) {
      delete data.password;
    }

    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      data,
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a user
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const deletedUser = await User.findByIdAndDelete(params.id);

    if (!deletedUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Here you would also delete the corresponding profile
    // (Admin, Teacher, Student, Parent) based on the user's role

    return NextResponse.json(
      { message: 'User deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
