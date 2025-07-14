import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Exam from '@/models/Exam';
import Teacher from '@/models/Teacher';
import ExamResult from '@/models/ExamResult';

export async function POST(
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
      const examId = Number(params.id);

      // Get exam details
      const exam = await Exam.findById(examId);
      if (!exam) {
        return NextResponse.json({ message: 'Exam not found' }, { status: 404 });
      }

      // Check if teacher has access to this exam
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
      }

      // Verify teacher teaches this subject
      if (!teacher.subjects.includes(exam.subjectId)) {
        return NextResponse.json({ message: 'Access denied to this exam' }, { status: 403 });
      }

      // Check if exam is already published
      if (exam.status === 'PUBLISHED') {
        return NextResponse.json(
          { message: 'Exam is already published' },
          { status: 400 }
        );
      }

      // Verify all students have been graded
      const resultsCount = await ExamResult.countDocuments({
        examId,
        isGraded: true
      });

      // Update exam status to PUBLISHED
      await Exam.findByIdAndUpdate(examId, {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedBy: teacherId
      });

      return NextResponse.json({
        message: 'Exam results published successfully',
        gradedStudents: resultsCount
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error publishing exam results:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
