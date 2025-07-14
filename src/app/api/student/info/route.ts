import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';
import Class from '@/models/Class';
import Grade from '@/models/Grade';
import Attendance from '@/models/Attendance';

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

      // Get the student data
      const student = await Student.findById(studentId)
        .populate('classId', 'name')
        .populate({
          path: 'classId',
          populate: {
            path: 'gradeId',
            model: 'Grade',
            select: 'level'
          }
        });

      if (!student) {
        return NextResponse.json({ message: 'Student not found' }, { status: 404 });
      }

      // Calculate attendance rate
      const attendanceRecords = await Attendance.find({
        studentId,
        date: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
        }
      });

      let attendanceRate = 0;
      if (attendanceRecords.length > 0) {
        const presentCount = attendanceRecords.filter(record =>
          record.status === 'PRESENT'
        ).length;
        attendanceRate = Math.round((presentCount / attendanceRecords.length) * 100);
      }

      // Format the response
      const studentInfo = {
        id: student._id,
        name: student.name,
        surname: student.surname,
        studentId: student.studentId || student._id,
        className: student.classId ? student.classId.name : 'Unassigned',
        grade: student.classId && student.classId.gradeId ? student.classId.gradeId.level : 0,
        attendanceRate
      };

      return NextResponse.json(studentInfo);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching student info:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
