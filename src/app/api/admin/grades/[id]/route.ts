import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Grade from '@/models/Grade';
import Class from '@/models/Class';
import Subject from '@/models/Subject';
import Student from '@/models/Student';
import mongoose from 'mongoose';

// Get a specific grade
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

      const grade = await Grade.findById(params.id);

      if (!grade) {
        return NextResponse.json({ message: 'Grade not found' }, { status: 404 });
      }

      return NextResponse.json(grade);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching grade:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a grade
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
      if (!data.level) {
        return NextResponse.json(
          { message: 'Grade level is required' },
          { status: 400 }
        );
      }

      // Check if another grade has this level
      const existingGrade = await Grade.findOne({
        level: data.level,
        _id: { $ne: params.id }
      });

      if (existingGrade) {
        return NextResponse.json(
          { message: 'A grade with this level already exists' },
          { status: 400 }
        );
      }

      const updatedGrade = await Grade.findByIdAndUpdate(
        params.id,
        { level: data.level, name: data.name },
        { new: true }
      );

      if (!updatedGrade) {
        return NextResponse.json({ message: 'Grade not found' }, { status: 404 });
      }

      return NextResponse.json({
        message: 'Grade updated successfully',
        grade: updatedGrade
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error updating grade:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a grade
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

      // Check if there are classes using this grade
      const associatedClasses = await Class.countDocuments({ gradeId: params.id });
      if (associatedClasses > 0) {
        return NextResponse.json(
          { message: 'Cannot delete grade: there are classes using this grade' },
          { status: 400 }
        );
      }

      // Check if there are students in this grade
      const associatedStudents = await Student.countDocuments({ gradeId: params.id });
      if (associatedStudents > 0) {
        return NextResponse.json(
          { message: 'Cannot delete grade: there are students in this grade' },
          { status: 400 }
        );
      }

      // Check if there are subjects for this grade
      const associatedSubjects = await Subject.countDocuments({ gradeId: params.id });
      if (associatedSubjects > 0) {
        return NextResponse.json(
          { message: 'Cannot delete grade: there are subjects associated with this grade' },
          { status: 400 }
        );
      }

      const deletedGrade = await Grade.findByIdAndDelete(params.id);

      if (!deletedGrade) {
        return NextResponse.json({ message: 'Grade not found' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Grade deleted successfully' });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error deleting grade:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
