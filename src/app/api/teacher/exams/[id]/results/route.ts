import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Exam from '@/models/Exam';
import Teacher from '@/models/Teacher';
import ExamResult from '@/models/ExamResult';
import Student from '@/models/Student';

// GET: Fetch exam results for a specific exam
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

      return NextResponse.json({ students: studentsWithResults });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching exam results:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Save exam results
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
      const data = await request.json();

      if (!data.results || !Array.isArray(data.results)) {
        return NextResponse.json({ message: 'Invalid data format' }, { status: 400 });
      }

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

      // Check if exam is in a state that allows editing results
      if (exam.status === 'PUBLISHED') {
        return NextResponse.json(
          { message: 'Cannot edit results for a published exam' },
          { status: 400 }
        );
      }

      // Process each result
      const updatedResults = await Promise.all(data.results.map(async (result: any) => {
        const { studentId, marks, isAbsent, remarks } = result;

        // Validate student exists
        const student = await Student.findById(studentId);
        if (!student) {
          throw new Error(`Student with ID ${studentId} not found`);
        }

        // Check if a result already exists for this student
        const existingResult = await ExamResult.findOne({
          examId,
          studentId
        });

        // Determine if the result is graded
        const isGraded = isAbsent || marks !== null;

        if (existingResult) {
          // Update existing result
          return await ExamResult.findByIdAndUpdate(
            existingResult._id,
            {
              marks: isAbsent ? null : marks,
              isAbsent,
              remarks,
              isGraded,
              updatedAt: new Date(),
              updatedBy: teacherId
            },
            { new: true }
          );
        } else {
          // Create new result
          const newResult = new ExamResult({
            examId,
            studentId,
            marks: isAbsent ? null : marks,
            isAbsent,
            remarks,
            isGraded,
            createdAt: new Date(),
            createdBy: teacherId,
            updatedAt: new Date(),
            updatedBy: teacherId
          });

          return await newResult.save();
        }
      }));

      // Update exam status to ONGOING if it was SCHEDULED
      if (exam.status === 'SCHEDULED') {
        await Exam.findByIdAndUpdate(examId, { status: 'ONGOING' });
      }

      return NextResponse.json({
        message: 'Exam results saved successfully',
        count: updatedResults.length
      });

    } catch (error) {
      console.error('Error saving exam results:', error);
      return NextResponse.json(
        { message: error instanceof Error ? error.message : 'Failed to save results' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in exam results API:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
