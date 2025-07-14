import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Exam from '@/models/Exam';
import Teacher from '@/models/Teacher';
import Subject from '@/models/Subject';
import Class from '@/models/Class';

// GET: Fetch exams for a teacher
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
      const upcoming = url.searchParams.get('upcoming') === 'true';
      const past = url.searchParams.get('past') === 'true';

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

      // Filter by time
      const now = new Date();
      if (upcoming) {
        query.examDate = { $gte: now };
      } else if (past) {
        query.examDate = { $lt: now };
      }

      // If class filter is applied
      if (classId) {
        // Verify teacher has access to this class
        const hasAccess = await verifyTeacherClassAccess(teacherId, classId);
        if (!hasAccess) {
          return NextResponse.json({ message: 'Access denied to this class' }, { status: 403 });
        }

        // Get class grade level
        const classInfo = await Class.findById(classId);
        if (!classInfo) {
          return NextResponse.json({ message: 'Class not found' }, { status: 404 });
        }

        // Filter exams by grade level
        query.gradeId = classInfo.gradeId;
      }

      // Fetch exams
      const exams = await Exam.find(query)
        .sort({ examDate: -1 })
        .populate('subjectId', 'name')
        .populate('gradeId', 'level');

      // Format response
      const formattedExams = exams.map(exam => ({
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
      }));

      return NextResponse.json(formattedExams);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to verify teacher access to a class
async function verifyTeacherClassAccess(teacherId: string, classId: string): Promise<boolean> {
  // Check if teacher is the class teacher
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) return false;

  // If teacher is a class teacher for this class
  if (teacher.classId) {
    const classIds = Array.isArray(teacher.classId) ? teacher.classId : [teacher.classId];
    if (classIds.some(id => id?.toString() === classId)) {
      return true;
    }
  }

  // Check if teacher teaches a subject in this class
  if (teacher.subjects && teacher.subjects.length > 0) {
    // Get the class grade
    const classInfo = await Class.findById(classId);
    if (!classInfo) return false;

    // Check if teacher teaches any subject for this grade
    const teacherSubjects = await Subject.find({
      _id: { $in: teacher.subjects },
      gradeId: classInfo.gradeId
    });

    return teacherSubjects.length > 0;
  }

  return false;
}
