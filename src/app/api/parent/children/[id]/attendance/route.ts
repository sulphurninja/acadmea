import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';

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

      if (decoded.role !== 'parent') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const parentId = decoded.id;
      const { id } = params;

      // Verify this child belongs to this parent
      const child = await Student.findById(id);
      if (!child || child.parentId !== parentId) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 });
      }

      // Get query parameters
      const url = new URL(request.url);
      const startDate = url.searchParams.get('startDate') ||
                        new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
      const endDate = url.searchParams.get('endDate') || new Date().toISOString();

      // Get attendance records
      const attendanceRecords = await Attendance.find({
        studentId: id,
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }).sort({ date: -1 });

      // Calculate statistics
      const totalDays = attendanceRecords.length;
      const presentDays = attendanceRecords.filter(record =>
        record.status === 'PRESENT'
      ).length;
      const absentDays = attendanceRecords.filter(record =>
        record.status === 'ABSENT'
      ).length;
      const lateDays = attendanceRecords.filter(record =>
        record.status === 'LATE'
      ).length;
      const excusedDays = attendanceRecords.filter(record =>
        record.status === 'EXCUSED'
      ).length;

      const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      // Group by month for chart data
      const monthlyData = attendanceRecords.reduce((acc, record) => {
        const month = record.date.toISOString().substring(0, 7); // YYYY-MM
        if (!acc[month]) {
          acc[month] = { present: 0, absent: 0, late: 0, excused: 0 };
        }
        acc[month][record.status.toLowerCase()]++;
        return acc;
      }, {} as Record<string, any>);

      const chartData = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        ...data
      }));

      return NextResponse.json({
        child: {
          name: `${child.name} ${child.surname}`,
          rollNo: child.rollNo,
          className: child.classId
        },
        statistics: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          excusedDays,
          attendanceRate
        },
        records: attendanceRecords,
        chartData
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
