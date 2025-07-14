import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';
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

      if (decoded.role !== 'parent') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const parentId = decoded.id;
      const { id } = params;

      // Verify this child belongs to this parent
      const child = await Student.findById(id)
        .populate('classId', 'name')
        .populate('gradeId', 'level name');

      if (!child || child.parentId !== parentId) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 });
      }

      // Get exam results with populated exam and subject details
      const examResults = await ExamResult.find({
        studentId: id,
        isGraded: true
      })
      .populate({
        path: 'examId',
        populate: {
          path: 'subjectId',
          model: 'Subject'
        }
      })
      .sort({ createdAt: -1 });

      // Process results by subject
      const subjectPerformance = examResults.reduce((acc, result) => {
        const exam = result.examId as any;
        const subject = exam.subjectId;

        if (!acc[subject._id]) {
          acc[subject._id] = {
            subjectName: subject.name,
            results: [],
            totalMarks: 0,
            totalMaxMarks: 0,
            averagePercentage: 0
          };
        }

        acc[subject._id].results.push({
          examTitle: exam.title,
          examType: exam.examType,
          examDate: exam.examDate,
          marks: result.marks,
          maxMarks: exam.maxMarks,
          percentage: Math.round((result.marks / exam.maxMarks) * 100),
          isAbsent: result.isAbsent,
          remarks: result.remarks
        });

        if (!result.isAbsent) {
          acc[subject._id].totalMarks += result.marks;
          acc[subject._id].totalMaxMarks += exam.maxMarks;
        }

        return acc;
      }, {} as Record<string, any>);

      // Calculate average percentage for each subject
      Object.values(subjectPerformance).forEach((subject: any) => {
        if (subject.totalMaxMarks > 0) {
          subject.averagePercentage = Math.round((subject.totalMarks / subject.totalMaxMarks) * 100);
        }
      });

      // Get overall statistics
      const totalExams = examResults.length;
      const completedExams = examResults.filter(r => !r.isAbsent).length;
      const totalMarks = examResults.reduce((sum, r) => sum + (r.isAbsent ? 0 : r.marks), 0);
      const totalMaxMarks = examResults.reduce((sum, r) => {
        const exam = r.examId as any;
        return sum + (r.isAbsent ? 0 : exam.maxMarks);
      }, 0);
      const overallPercentage = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0;

      // Get upcoming exams
      const upcomingExams = await Exam.find({
        gradeId: child.gradeId,
        examDate: { $gte: new Date() },
        status: 'SCHEDULED'
      })
      .populate('subjectId', 'name')
      .sort({ examDate: 1 });

      return NextResponse.json({
        child: {
          name: `${child.name} ${child.surname}`,
          rollNo: child.rollNo,
          className: child.classId?.name,
          grade: child.gradeId?.name
        },
        statistics: {
          totalExams,
          completedExams,
          overallPercentage,
          totalSubjects: Object.keys(subjectPerformance).length
        },
        subjectPerformance: Object.values(subjectPerformance),
        upcomingExams: upcomingExams.map(exam => ({
          title: exam.title,
          subject: exam.subjectId.name,
          date: exam.examDate,
          maxMarks: exam.maxMarks,
          duration: exam.duration,
          examType: exam.examType
        }))
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching performance:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
