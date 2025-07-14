import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/Attendance';
import Teacher from '@/models/Teacher';

export async function POST(request: Request) {
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
      const { classId, date, subjectId, period, attendance } = await request.json();

      // Verify teacher has access to this class
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
      }

      // Check if attendance already exists for this date/class/subject/period
      const existingAttendance = await Attendance.find({
        classId,
        date: new Date(date),
        ...(subjectId && { subjectId }),
        ...(period && { period })
      });

      // Delete existing records if updating
      if (existingAttendance.length > 0) {
        await Attendance.deleteMany({
          classId,
          date: new Date(date),
          ...(subjectId && { subjectId }),
          ...(period && { period })
        });
      }

      // Create new attendance records
      const attendanceRecords = attendance.map((record: any) => ({
        studentId: record.studentId,
        classId,
        teacherId,
        date: new Date(date),
        status: record.status,
        remarks: record.remarks || '',
        ...(subjectId && { subjectId }),
        ...(period && { period })
      }));

      await Attendance.insertMany(attendanceRecords);

      return NextResponse.json({
        message: 'Attendance saved successfully',
        recordsCreated: attendanceRecords.length
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error saving attendance:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
