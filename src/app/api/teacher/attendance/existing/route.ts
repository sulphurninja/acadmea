import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
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

      if (decoded.role !== 'teacher') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const url = new URL(request.url);
      const classId = url.searchParams.get('classId');
      const date = url.searchParams.get('date');
      const subjectId = url.searchParams.get('subjectId');
      const period = url.searchParams.get('period');

      if (!classId || !date) {
        return NextResponse.json({ message: 'Class ID and date are required' }, { status: 400 });
      }

      const query: any = {
        classId: parseInt(classId),
        date: new Date(date)
      };

      if (subjectId) query.subjectId = parseInt(subjectId);
      if (period) query.period = parseInt(period);

      const existingAttendance = await Attendance.find(query);

      return NextResponse.json(existingAttendance);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching existing attendance:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
