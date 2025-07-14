import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import ExamResult from '@/models/ExamResult';
import Exam from '@/models/Exam';
import Subject from '@/models/Subject';

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
      const studentId = params.id;

      // Get the student
      const student = await Student.findById(studentId);
      if (!student) {
        return NextResponse.json({ message: 'Student not found' }, { status: 404 });
      }

      // Verify teacher has access to this student
      const hasAccess = await verifyTeacherStudentAccess(teacherId, studentId);
      if (!hasAccess) {
        return NextResponse.json({ message: 'Access denied to this student' }, { status: 403 });
      }

      // Get all exam results for this student
      const examResults = await ExamResult.find({ studentId });

      // Get exam details for each result
      const results = await Promise.all(
        examResults.map(async (result) => {
          const exam = await Exam.findById(result.examId).populate('subjectId');

          if (!exam) {
            return null; // Skip if exam not found
          }

          return {
            exam: {
              id: exam._id,
              title: exam.title,
              examDate: exam.examDate,
              subjectName: exam.subjectId ? exam.subjectId.name : 'Unknown Subject',
              maxMarks: exam.maxMarks,
              examType: exam.examType
            },
            marks: result.marks,
            percentage: (result.marks / exam.maxMarks) * 100,
            status: result.status,
            remarks: result.remarks
          };
        })
      );

      // Filter out null values and sort by date (most recent first)
      const validResults = results
        .filter(result => result !== null)
        .sort((a, b) => new Date(b.exam.examDate).getTime() - new Date(a.exam.examDate).getTime());

      return NextResponse.json(validResults);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching student exams:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to verify teacher access to a student
async function verifyTeacherStudentAccess(teacherId: string, studentId: string): Promise<boolean> {
  // Get the student
  const student = await Student.findById(studentId);
  if (!student) return false;

  // Get the teacher
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) return false;

  // If teacher is a class teacher for this student's class
  if (teacher.classId) {
    const classIds = Array.isArray(teacher.classId) ? teacher.classId : [teacher.classId];
    if (classIds.some(id => id?.toString() === student.classId.toString())) {
      return true;
    }
  }

  // If teacher teaches a subject to this student's class
  if (teacher.subjects && teacher.subjects.length > 0) {
    const studentClassSubjects = await Subject.find({
      gradeId: student.gradeId
    });

    const teacherSubjectIds = teacher.subjects.map(id => id.toString());
    const studentClassSubjectIds = studentClassSubjects.map(s => s._id.toString());

    // Check if teacher teaches any subject for this student's class
    const hasCommonSubject = teacherSubjectIds.some(id =>
      studentClassSubjectIds.includes(id)
    );

    if (hasCommonSubject) {
      return true;
    }
  }

  return false;
}
