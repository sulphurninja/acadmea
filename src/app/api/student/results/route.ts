import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Exam from '@/models/Exam';
import Student from '@/models/Student';
import ExamResult from '@/models/ExamResult';
import Subject from '@/models/Subject';

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

      // Verify student exists
      const student = await Student.findById(studentId);
      if (!student) {
        return NextResponse.json({ message: 'Student not found' }, { status: 404 });
      }

      // Get URL parameters
      const url = new URL(request.url);
      const subjectId = url.searchParams.get('subjectId');
      const examType = url.searchParams.get('examType');

      // Find exams for this student's grade
      let examQuery: any = {
        gradeId: student.gradeId,
        status: { $in: ['COMPLETED', 'PUBLISHED'] }
      };

      if (subjectId) {
        examQuery.subjectId = Number(subjectId);
      }

      if (examType) {
        examQuery.examType = examType;
      }

      // Fetch exams
      const exams = await Exam.find(examQuery)
        .sort({ examDate: -1 })
        .populate('subjectId', 'name')
        .populate('gradeId', 'level name');

      // Fetch student's results for these exams
      const examIds = exams.map(exam => exam._id);
      const results = await ExamResult.find({
        examId: { $in: examIds },
        studentId: studentId
      });

      // Format response
      const formattedResults = exams.map(exam => {
        const result = results.find(r => r.examId.toString() === exam._id.toString());

        // Calculate percentage and grade
        let percentage = null;
        let grade = null;

        if (result && !result.isAbsent && result.marks !== null) {
          percentage = (result.marks / exam.maxMarks) * 100;

          // Assign grade based on percentage
          if (percentage >= 90) grade = 'A+';
          else if (percentage >= 80) grade = 'A';
          else if (percentage >= 70) grade = 'B+';
          else if (percentage >= 60) grade = 'B';
          else if (percentage >= 50) grade = 'C+';
          else if (percentage >= 40) grade = 'C';
          else if (percentage >= 33) grade = 'D';
          else grade = 'F';
        }

        return {
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
          obtainedMarks: result ? result.marks : null,
          percentage: percentage,
          letterGrade: grade,
          isAbsent: result ? result.isAbsent : false,
          remarks: result ? result.remarks : '',
          examType: exam.examType,
          status: result ? (result.isAbsent ? 'ABSENT' : 'COMPLETED') : 'NO_RESULT'
        };
      });

      return NextResponse.json({ results: formattedResults });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching student results:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
