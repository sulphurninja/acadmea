import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Teacher from '@/models/Teacher';
import Subject from '@/models/Subject';
import Assignment from '@/models/Assignment';

// GET: Fetch a specific assignment
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

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

      if (decoded.role !== 'teacher') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const teacherId = decoded.id;
      const assignmentId = Number(params.id);

      // Verify the assignment exists
      const assignment = await Assignment.findById(assignmentId)
        .populate('subjectId', 'name gradeId')
        .exec();

      if (!assignment) {
        return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
      }

      // Verify teacher teaches this subject
      const teacher = await Teacher.findById(teacherId);
      if (!teacher || !teacher.subjects || !teacher.subjects.includes(assignment.subjectId._id)) {
        return NextResponse.json(
          { message: 'You do not have access to this assignment' },
          { status: 403 }
        );
      }

      // Format the response
      const formattedAssignment = {
        id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        startDate: assignment.startDate,
        dueDate: assignment.dueDate,
        subject: {
          id: assignment.subjectId._id,
          name: assignment.subjectId.name,
          gradeId: assignment.subjectId.gradeId
        }
      };

      return NextResponse.json(formattedAssignment);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update an assignment
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

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

      if (decoded.role !== 'teacher') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const teacherId = decoded.id;
      const assignmentId = Number(params.id);
      const data = await request.json();

      // Verify the assignment exists
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
      }

      // Verify teacher teaches this subject
      const teacher = await Teacher.findById(teacherId);
      if (!teacher || !teacher.subjects || !teacher.subjects.includes(assignment.subjectId)) {
        return NextResponse.json(
          { message: 'You do not have access to update this assignment' },
          { status: 403 }
        );
      }

      // Update the assignment
      if (data.title) assignment.title = data.title;
      if (data.description) assignment.description = data.description;
      if (data.startDate) assignment.startDate = new Date(data.startDate);
      if (data.dueDate) assignment.dueDate = new Date(data.dueDate);
      // Note: We don't allow changing the subject ID after creation

      await assignment.save();

      return NextResponse.json({
        message: 'Assignment updated successfully',
        assignmentId
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete an assignment
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

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

      if (decoded.role !== 'teacher') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const teacherId = decoded.id;
      const assignmentId = Number(params.id);

      // Verify the assignment exists
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
      }

      // Verify teacher teaches this subject
      const teacher = await Teacher.findById(teacherId);
      if (!teacher || !teacher.subjects || !teacher.subjects.includes(assignment.subjectId)) {
        return NextResponse.json(
          { message: 'You do not have access to delete this assignment' },
          { status: 403 }
        );
      }

      // Delete the assignment
      await Assignment.findByIdAndDelete(assignmentId);

      return NextResponse.json({
        message: 'Assignment deleted successfully'
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
