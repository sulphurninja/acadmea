import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Exam from '@/models/Exam';
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

      if (decoded.role !== 'student') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const studentId = decoded.id;

      // Get student info to find grade
      const student = await Student.findById(studentId);
      if (!student) {
        return NextResponse.json({ message: 'Student not found' }, { status: 404 });
      }

      // Get student's grade/class
      const gradeId = student.gradeId;
      if (!gradeId) {
        return NextResponse.json({ message: 'Student not assigned to a grade' }, { status: 400 });
      }

      // Get URL parameters
      const url = new URL(request.url);
      const upcoming = url.searchParams.get('upcoming') === 'true';
      const subjectId = url.searchParams.get('subjectId');

      // Build query
      let query: any = {
        gradeId: gradeId
      };

      // Add subject filter if provided
      if (subjectId) {
        query.subjectId = Number(subjectId);
      }

      // Filter by time if needed
      if (upcoming) {
        query.examDate = { $gte: new Date() };
        query.status = { $in: ['SCHEDULED', 'ONGOING'] };
      }

      // Fetch exams
      const exams = await Exam.find(query)
        .sort({ examDate: 1 })
        .populate('subjectId', 'name')
        .populate('gradeId', 'level name');

      // Format response
      const formattedExams = exams.map(exam => ({
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
        status: exam.status
      }));

      return NextResponse.json({ exams: formattedExams });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching exams for student:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
