import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Exam from '@/models/Exam';

// DELETE: Delete an exam
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

      if (decoded.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const examId = Number(params.id);

      // Check if exam exists
      const exam = await Exam.findById(examId);
      if (!exam) {
        return NextResponse.json({ message: 'Exam not found' }, { status: 404 });
      }

      // Continue from previous code...

      // Delete the exam
      await Exam.findByIdAndDelete(examId);

      return NextResponse.json({
        message: 'Exam deleted successfully'
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Get a single exam by ID
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

      if (decoded.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const examId = Number(params.id);

      // Fetch the exam with related data
      const exam = await Exam.findById(examId)
        .populate('subjectId', 'name')
        .populate('gradeId', 'level name');

      if (!exam) {
        return NextResponse.json({ message: 'Exam not found' }, { status: 404 });
      }

      // Format response
      const formattedExam = {
        id: exam._id,
        title: exam.title,
        description: exam.description || "",
        examDate: exam.examDate,
        subject: {
          id: exam.subjectId?._id || null,
          name: exam.subjectId?.name || "Unknown Subject"
        },
        grade: {
          id: exam.gradeId?._id || null,
          level: exam.gradeId?.level || 0,
          name: exam.gradeId?.name || `Class ${exam.gradeId?.level || 'Unknown'}`
        },
        maxMarks: exam.maxMarks,
        duration: exam.duration,
        examType: exam.examType,
        status: exam.status,
        createdAt: exam.createdAt
      };

      return NextResponse.json({ exam: formattedExam });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update an exam
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

      if (decoded.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const examId = Number(params.id);
      const data = await request.json();

      // Check if exam exists
      const exam = await Exam.findById(examId);
      if (!exam) {
        return NextResponse.json({ message: 'Exam not found' }, { status: 404 });
      }

      // Update exam
      const updatedExam = await Exam.findByIdAndUpdate(
        examId,
        {
          title: data.title,
          description: data.description || '',
          examDate: new Date(data.examDate),
          subjectId: data.subjectId,
          gradeId: data.gradeId,
          maxMarks: data.maxMarks,
          duration: data.duration,
          examType: data.examType,
          status: data.status
        },
        { new: true }
      );

      return NextResponse.json({
        message: 'Exam updated successfully',
        exam: {
          id: updatedExam._id,
          title: updatedExam.title
        }
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error updating exam:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
