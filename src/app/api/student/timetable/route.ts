import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';
import Class from '@/models/Class';
import Timetable from '@/models/timetable';
import { format } from 'date-fns';

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
      const day = url.searchParams.get('day');

      // Get student info to find their class
      const student = await Student.findById(studentId);
      if (!student) {
        return NextResponse.json({ message: 'Student not found' }, { status: 404 });
      }

      const classId = student.classId;
      if (!classId) {
        return NextResponse.json({ message: 'Student not assigned to a class' }, { status: 400 });
      }

      // Build query for timetable
      let query: any = { sectionId: parseInt(classId.toString()) };

      if (day === 'today') {
        // Get day name for today (Monday, Tuesday, etc.)
        const today = new Date();
        const dayName = format(today, 'EEEE'); // e.g., "Monday"
        query.day = dayName;
      } else if (day) {
        query.day = day;
      }

      // Fetch timetable entries
      const timetableEntries = await Timetable.find(query)
        .sort({ day: 1, startTime: 1 });

      // Format response
      const formattedClasses = timetableEntries.map(entry => ({
        id: entry._id,
        subject: entry.subject,
        teacher: entry.teacherName,
        day: entry.day,
        time: entry.startTime,
        room: entry.room || "Main Building",
        duration: 45 // Default duration in minutes
      }));

      return NextResponse.json({ classes: formattedClasses });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching student timetable:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
