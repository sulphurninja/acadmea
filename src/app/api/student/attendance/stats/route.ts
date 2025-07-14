import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/Attendance';
import Subject from '@/models/Subject';

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    // Authenticate student
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
      const url = new URL(request.url);
      const month = parseInt(url.searchParams.get('month') || new Date().getMonth().toString());
      const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());

      // Get attendance records for the specified period
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const attendanceRecords = await Attendance.find({
        studentId,
        date: { $gte: startDate, $lte: endDate }
      }).populate('subjectId', 'name');

      // Calculate overall stats
      const totalDays = attendanceRecords.length;
      const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
      const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;
      const lateDays = attendanceRecords.filter(r => r.status === 'late').length;
      const excusedDays = attendanceRecords.filter(r => r.status === 'excused').length;

      const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      // Calculate monthly attendance for the last 6 months
      const monthlyAttendance = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(year, month - i, 1);
        const monthEnd = new Date(year, month - i + 1, 0);

        const monthRecords = await Attendance.find({
          studentId,
          date: { $gte: monthStart, $lte: monthEnd }
        });

        const monthPresent = monthRecords.filter(r => r.status === 'present').length;
        const monthTotal = monthRecords.length;
        const monthRate = monthTotal > 0 ? Math.round((monthPresent / monthTotal) * 100) : 0;

        monthlyAttendance.push({
          month: monthStart.toLocaleString('default', { month: 'short' }),
          rate: monthRate
        });
      }

      // Calculate subject-wise attendance
      const subjects = await Subject.find();
      const subjectWise = await Promise.all(
        subjects.map(async (subject) => {
          const subjectRecords = attendanceRecords.filter(r =>
            r.subjectId && r.subjectId._id.toString() === subject._id.toString()
          );

          const present = subjectRecords.filter(r => r.status === 'present').length;
          const total = subjectRecords.length;
          const rate = total > 0 ? Math.round((present / total) * 100) : 0;

          return {
            subject: subject.name,
            rate,
            present,
            total
          };
        })
      );

      // Filter out subjects with no records
      const validSubjectWise = subjectWise.filter(s => s.total > 0);

      const stats = {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        excusedDays,
        attendanceRate,
        monthlyAttendance,
        subjectWise: validSubjectWise
      };

      return NextResponse.json(stats);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
