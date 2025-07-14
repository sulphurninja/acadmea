import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Assignment from '@/models/Assignment';
import Student from '@/models/Student';
import Subject from '@/models/Subject';
import AssignmentSubmission from '@/models/AssignmentSubmission';

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    // Get the token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
      const decoded: any = jwtDecode(token);

      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        return NextResponse.json({ message: 'Token expired' }, { status: 401 });
      }

      // Ensure the user is a student
      if (decoded.role !== 'student') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const studentId = decoded.id;

      // Get student info to get their class
      const student = await Student.findById(studentId);
      if (!student) {
        return NextResponse.json({ message: 'Student not found' }, { status: 404 });
      }

      // Get all assignments for the student's class
      const assignments = await Assignment.find({
        classId: student.classId,
        startDate: { $lte: new Date() }, // Only assignments that have started
        dueDate: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } // Not too old
      })
        .populate('subjectId', 'name')
        .populate('teacherId', 'name surname')
        .sort({ dueDate: 1 });

      // Get student's submissions
      const submissions = await AssignmentSubmission.find({
        studentId,
        assignmentId: { $in: assignments.map(a => a._id) }
      });

      // Map submission status to assignments
      const submissionMap = new Map();
      submissions.forEach(sub => {
        submissionMap.set(sub.assignmentId.toString(), {
          status: sub.grade !== undefined ? 'graded' : 'submitted',
          grade: sub.grade,
          submittedAt: sub.submittedAt
        });
      });

      // Format the assignments with submission status
      const formattedAssignments = assignments.map(assignment => {
        const submissionInfo = submissionMap.get(assignment._id.toString());

        let status = 'pending';
        if (submissionInfo) {
          status = submissionInfo.status;
        } else if (new Date(assignment.dueDate) < new Date()) {
          status = 'overdue';
        }

        return {
          id: assignment._id,
          title: assignment.title,
          description: assignment.description,
          subject: assignment.subjectId ? assignment.subjectId.name : 'Unknown Subject',
          subjectId: assignment.subjectId ? assignment.subjectId._id : null,
          teacher: assignment.teacherId ?
            `${assignment.teacherId.name} ${assignment.teacherId.surname}` :
            'Unknown Teacher',
          teacherId: assignment.teacherId ? assignment.teacherId._id : null,
          startDate: assignment.startDate,
          dueDate: assignment.dueDate,
          status,
          grade: submissionInfo?.grade,
          maxGrade: assignment.maxGrade || 100,
          submittedAt: submissionInfo?.submittedAt
        };
      });

      return NextResponse.json(formattedAssignments);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching student assignments:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
