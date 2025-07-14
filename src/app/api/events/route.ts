import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import Teacher from '@/models/Teacher';
import Class from '@/models/Class';

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

      // Get URL parameters
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '5');
      const upcoming = url.searchParams.get('upcoming') === 'true';

      let query: any = {};

      // If upcoming=true, only show events that haven't started yet or are currently happening
      if (upcoming) {
        const now = new Date();
        query.endTime = { $gte: now };
      }

      // If user is a teacher, filter events that are relevant to their classes
      if (decoded.role === 'teacher') {
        const teacherId = decoded.id;

        // Get the teacher's assigned classes
        const teacher = await Teacher.findById(teacherId);
        if (teacher) {
          // Get classes taught by this teacher
          const teacherClassIds = [];

          // Add classes where teacher is class teacher
          if (teacher.classId) {
            const classIds = Array.isArray(teacher.classId) ? teacher.classId : [teacher.classId];
            teacherClassIds.push(...classIds.filter(Boolean));
          }

          // For specific class events, we only show events for classes the teacher is involved with
          if (teacherClassIds.length > 0) {
            query.$or = [
              { classId: { $in: teacherClassIds } }, // Class-specific events
              { classId: null }                      // School-wide events
            ];
          }
        }
      }

      // Fetch events
      const events = await Event.find(query)
        .sort({ startTime: 1 })
        .limit(limit)
        .populate('classId', 'name');

      // Format the response
      const formattedEvents = events.map(event => ({
        id: event._id,
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        class: event.classId ? {
          id: event.classId._id,
          name: event.classId.name
        } : null,
        isNew: new Date(event.startTime) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // New if created in the last 7 days
      }));

      return NextResponse.json(formattedEvents);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
