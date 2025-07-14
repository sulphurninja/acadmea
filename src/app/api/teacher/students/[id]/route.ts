import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Teacher from '@/models/Teacher';
import Class from '@/models/Class';
import Student from '@/models/Student';
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

      // Get teacher info
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
      }

      // Get student
      const student = await Student.findById(studentId);
      if (!student) {
        return NextResponse.json({ message: 'Student not found' }, { status: 404 });
      }

      // Verify teacher has access to this student's class
      const hasAccess = await verifyTeacherStudentAccess(teacherId, student.classId);
      if (!hasAccess) {
        return NextResponse.json({ message: 'Access denied to this student' }, { status: 403 });
      }

      // Get class info
      const classInfo = await Class.findById(student.classId);

      // Format response
      const studentDetails = {
        id: student._id,
        name: student.name,
        surname: student.surname,
        rollNo: student.rollNo || 'N/A',
        img: student.img || null,
        className: classInfo ? classInfo.name : 'Unknown',
        classId: student.classId,
        email: student.email || '',
        phone: student.phone || '',
        address: student.address || '',
        bloodType: student.bloodType || '',
        sex: student.sex,
        birthday: student.birthday,
        emergencyContact: student.emergencyContact || '',
        emergencyContactName: student.emergencyContactName || '',
        fatherName: student.fatherName || '',
        motherName: student.motherName || '',
        admissionDate: student.admissionDate,
        documents: student.documents || []
      };

      return NextResponse.json(studentDetails);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching student details:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to verify if a teacher has access to a student's class
async function verifyTeacherStudentAccess(teacherId: string, classId: number): Promise<boolean> {
  // Check if teacher is the class teacher
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) return false;

  // If teacher is a class teacher for this class
  if (teacher.classId) {
    const classIds = Array.isArray(teacher.classId) ? teacher.classId : [teacher.classId];
    if (classIds.some(id => id === classId)) {
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
