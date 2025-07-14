import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Exam from '@/models/Exam';
import Teacher from '@/models/Teacher';

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
      const examId = Number(params.id);

      // Get teacher info to check permissions
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
      }

      // Fetch the exam
      const exam = await Exam.findById(examId)
        .populate('subjectId', 'name')
        .populate('gradeId', 'level');

      if (!exam) {
        return NextResponse.json({ message: 'Exam not found' }, { status: 404 });
      }

      // Check if the teacher teaches this subject
      const teacherSubjects = teacher.subjects || [];
      if (!teacherSubjects.includes(exam.subjectId._id)) {
        return NextResponse.json({ message: 'Access denied to this exam' }, { status: 403 });
      }

      // Format response
      const formattedExam = {
        id: exam._id,
        title: exam.title,
        description: exam.description,
        examDate: exam.examDate,
        subject: exam.subjectId ? {
          id: exam.subjectId._id,
          name: exam.subjectId.name
        } : null,
        grade: exam.gradeId ? {
          id: exam.gradeId._id,
          level: exam.gradeId.level
        } : null,
        maxMarks: exam.maxMarks,
        duration: exam.duration,
        examType: exam.examType,
        status: exam.status
      };

      return NextResponse.json(formattedExam);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching exam details:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
