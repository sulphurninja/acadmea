import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Exam from '@/models/Exam';
import Teacher from '@/models/Teacher';
import ExamResult from '@/models/ExamResult';
import Student from '@/models/Student';

export async function GET(request: Request) {
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

      // Get URL parameters
      const url = new URL(request.url);
      const subjectId = url.searchParams.get('subjectId');
      const classId = url.searchParams.get('classId');
      const status = url.searchParams.get('status');

      // Get teacher info to find subjects they teach
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
      }

      // Get subjects taught by the teacher
      let teacherSubjects = teacher.subjects || [];

      // If specific subject filter is applied, check if teacher teaches it
      if (subjectId) {
        if (!teacherSubjects.includes(Number(subjectId))) {
          return NextResponse.json({ message: 'Access denied to this subject' }, { status: 403 });
        }
        teacherSubjects = [Number(subjectId)];
      }

      // Build query
      let query: any = {
        subjectId: { $in: teacherSubjects }
      };

      // Filter by status if provided
      if (status && status !== 'all') {
        query.status = status;
      }

      // Fetch exams
      const exams = await Exam.find(query)
        .sort({ examDate: -1 })
        .populate('subjectId', 'name')
        .populate('gradeId', 'level');

      // Format response with additional grading stats
      const formattedExams = await Promise.all(exams.map(async exam => {
        // Find all students in the relevant class/grade
        const studentCount = await Student.countDocuments({ gradeId: exam.gradeId._id });

        // Find how many students have been graded for this exam
        const gradedCount = await ExamResult.countDocuments({
          examId: exam._id,
          isGraded: true
        });

        return {
          id: exam._id,
          title: exam.title,
          description: exam.description,
          examDate: exam.examDate,
          subject: {
            id: exam.subjectId?._id || null,
            name: exam.subjectId?.name || "Unknown Subject"
          },
          grade: {
            id: exam.gradeId?._id || null,
            level: exam.gradeId?.level || 0
          },
          maxMarks: exam.maxMarks,
          duration: exam.duration,
          examType: exam.examType,
          status: exam.status,
          gradedCount: gradedCount,
          totalStudents: studentCount
        };
      }));

      return NextResponse.json(formattedExams);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching exam reports:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
