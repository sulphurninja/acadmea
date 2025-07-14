import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';

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

      // Get URL parameters
      const url = new URL(request.url);
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const month = url.searchParams.get('month');
      const year = url.searchParams.get('year');

      // Build query
      let query: any = { studentId };

      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      } else if (month && year) {
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0);

        query.date = {
          $gte: startDate,
          $lte: endDate
        };
      }

      // Fetch attendance records
      const attendanceRecords = await Attendance.find(query)
        .sort({ date: -1 });

      // Calculate summary statistics
      const present = attendanceRecords.filter(record => record.status === 'PRESENT').length;
      const absent = attendanceRecords.filter(record => record.status === 'ABSENT').length;
      const late = attendanceRecords.filter(record => record.status === 'LATE').length;
      const leave = attendanceRecords.filter(record => record.status === 'EXCUSED').length;
      const total = attendanceRecords.length;

      // Format attendance records
      const formattedRecords = attendanceRecords.map(record => ({
        id: record._id,
        date: record.date,
        status: record.status,
        notes: record.notes || ''
      }));

      return NextResponse.json({
        summary: {
          present,
          absent,
          late,
          leave,
          total
        },
        records: formattedRecords
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
