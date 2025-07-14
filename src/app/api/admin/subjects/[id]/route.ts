import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Subject from '@/models/Subject';

// Get a specific subject
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    // Authenticate
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

      const subject = await Subject.findById(params.id)
        .populate('gradeId', 'level');

      if (!subject) {
        return NextResponse.json({ message: 'Subject not found' }, { status: 404 });
      }

      // Format the subject data
      const formattedSubject = {
        id: subject._id,
        name: subject.name,
        description: subject.description,
        grade: subject.gradeId ? subject.gradeId.level : null,
        gradeId: subject.gradeId ? subject.gradeId._id : null,
        isCore: subject.isCore,
        passingMarks: subject.passingMarks,
        fullMarks: subject.fullMarks,
        hasTheory: subject.hasTheory,
        hasPractical: subject.hasPractical
      };

      return NextResponse.json(formattedSubject);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching subject:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a subject
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
      console.log("Updating subject with data:", data);

      // Validate required fields
      if (!data.name || !data.gradeId) {
        return NextResponse.json(
          { message: 'Subject name and class are required' },
          { status: 400 }
        );
      }

      // Check if another subject has this name in the same grade
      const existingSubject = await Subject.findOne({
        name: data.name,
        gradeId: data.gradeId,
        _id: { $ne: params.id }
      });

      if (existingSubject) {
        return NextResponse.json(
          { message: 'Another subject with this name already exists for this class' },
          { status: 400 }
        );
      }

      // Update the subject
      const updatedSubject = await Subject.findByIdAndUpdate(
        params.id,
        {
          name: data.name,
          description: data.description,
          gradeId: data.gradeId,
          isCore: data.isCore,
          passingMarks: data.passingMarks,
          fullMarks: data.fullMarks,
          hasTheory: data.hasTheory,
          hasPractical: data.hasPractical,
          theoryCutOff: data.theoryCutOff || 33,
          practicalCutOff: data.practicalCutOff || 33
        },
        { new: true }
      ).populate('gradeId', 'level');

      if (!updatedSubject) {
        return NextResponse.json({ message: 'Subject not found' }, { status: 404 });
      }

      // Format the response
      const formattedSubject = {
        id: updatedSubject._id,
        name: updatedSubject.name,
        description: updatedSubject.description,
        grade: updatedSubject.gradeId ? updatedSubject.gradeId.level : null,
        gradeId: updatedSubject.gradeId ? updatedSubject.gradeId._id : null,
        isCore: updatedSubject.isCore,
        passingMarks: updatedSubject.passingMarks,
        fullMarks: updatedSubject.fullMarks,
        hasTheory: updatedSubject.hasTheory,
        hasPractical: updatedSubject.hasPractical
      };

      return NextResponse.json({
        message: 'Subject updated successfully',
        subject: formattedSubject
      });

    } catch (error) {
      console.error('JWT verification or subject update error:', error);
      return NextResponse.json({ message: 'Invalid token or update failed', error: error.message }, { status: 401 });
    }
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// Delete a subject
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

      // Check if the subject is associated with any teacher
      // This would require checking the Teacher model's subjects array
      // We'll skip this check for now, but you might want to add it later

      // Delete the subject
      const deletedSubject = await Subject.findByIdAndDelete(params.id);

      if (!deletedSubject) {
        return NextResponse.json({ message: 'Subject not found' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Subject deleted successfully' });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
