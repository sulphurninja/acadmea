import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Exam from '@/models/Exam';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';
import ExamResult from '@/models/ExamResult';

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

      // Get exam details
      const exam = await Exam.findById(examId)
        .populate('gradeId', 'level');

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

      // Get all students for this grade
      const students = await Student.find({ gradeId: exam.gradeId })
        .sort({ rollNo: 1, name: 1 });

      // Get existing results for this exam
      const examResults = await ExamResult.find({ examId });

      // Map results to students
      const studentsWithResults = students.map(student => {
        const result = examResults.find(r => r.studentId === student._id.toString());

        return {
          id: student._id,
          name: student.name,
          surname: student.surname,
          rollNo: student.rollNo || '',
          img: student.img,
          marks: result ? result.marks : null,
          isAbsent: result ? result.isAbsent : false,
          remarks: result ? result.remarks : '',
        };
      });

      return NextResponse.json({
        students: studentsWithResults,
        exam: {
          id: exam._id,
          title: exam.title,
          subject: exam.subjectId,
          grade: exam.gradeId?.level || 0,
          maxMarks: exam.maxMarks
        }
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching students for exam:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
