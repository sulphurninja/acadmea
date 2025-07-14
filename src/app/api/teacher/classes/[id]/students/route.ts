import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Class from '@/models/Class';

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
      const classId = params.id;

      // Verify teacher has access to this class
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
      }

      // Check if teacher teaches this class
      const hasAccess = await verifyTeacherClassAccess(teacherId, classId);
      if (!hasAccess) {
        return NextResponse.json({ message: 'Access denied to this class' }, { status: 403 });
      }

      // Get students in this class
      const students = await Student.find({ classId }).select('_id name surname rollNo img');

      // Format student data for the response
      const formattedStudents = students.map(student => ({
        id: student._id,
        name: student.name,
        surname: student.surname,
        rollNo: student.rollNo || 'N/A',
        img: student.img || null
      }));

      return NextResponse.json(formattedStudents);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching class students:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to verify if a teacher has access to a class
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
    // In a real app, you'd have a more specific check for subjects assigned to this class
    return true; // Simplified for this example
  }

  return false;
}
