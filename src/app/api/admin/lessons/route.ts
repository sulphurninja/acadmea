import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Lesson from '@/models/Lesson';
import Teacher from '@/models/Teacher';
import Class from '@/models/Class';
import Subject from '@/models/Subject';

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    // Get the token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify and decode the token
    try {
      const decoded: any = jwtDecode(token);

      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        return NextResponse.json({ message: 'Token expired' }, { status: 401 });
      }

      // Ensure the user is a teacher
      if (decoded.role !== 'teacher') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const teacherId = decoded.id;

      // Get the teacher's lessons
      const lessons = await Lesson.find({ teacherId })
        .populate('subjectId', 'name')
        .populate('classId', 'name')
        .sort({ day: 1, startTime: 1 });

      if (!lessons || lessons.length === 0) {
        return NextResponse.json([]);
      }

      // Transform to a more friendly format for the frontend
      const formattedLessons = lessons.map(lesson => {
        const startTime = new Date(lesson.startTime);
        const endTime = new Date(lesson.endTime);

        return {
          id: lesson._id,
          name: lesson.name,
          subject: lesson.subjectId ? (lesson.subjectId as any).name : 'Unknown Subject',
          class: lesson.classId ? (lesson.classId as any).name : 'Unknown Class',
          day: lesson.day,
          startTime: `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`,
          endTime: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`,
          room: lesson.room || 'Not specified'
        };
      });

      return NextResponse.json(formattedLessons);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching teacher schedule:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
