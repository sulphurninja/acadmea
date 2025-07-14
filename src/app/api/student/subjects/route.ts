import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Subject from '@/models/Subject';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';

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

      // Fetch subjects for the student's grade
      const subjects = await Subject.find({ gradeId: gradeId })
        .sort({ name: 1 });

      // Get teacher for each subject
      const formattedSubjects = await Promise.all(subjects.map(async (subject) => {
        // Find teacher who teaches this subject
        let teacherName = "Unassigned";

        try {
          const teacher = await Teacher.findOne({
            subjects: { $in: [subject._id] }
          });

          if (teacher) {
            teacherName = `${teacher.name} ${teacher.surname}`;
          }
        } catch (error) {
          console.error("Error finding teacher for subject:", error);
        }

        return {
          id: subject._id,
          name: subject.name,
          description: subject.description || "",
          teacherName: teacherName,
          // Adding a placeholder progress value - in a real app this would come from actual progress data
          progress: Math.floor(Math.random() * (100 - 30) + 30) // Random progress between 30-100%
        };
      }));

      return NextResponse.json({
        subjects: formattedSubjects,
        total: formattedSubjects.length
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching subjects for student:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
