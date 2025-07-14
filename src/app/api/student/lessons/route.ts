import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';
import Lesson from '@/models/Lesson';
import VideoLesson from '@/models/VideoLesson';

// Get lessons for a specific student
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

      // Ensure the user is a student
      if (decoded.role !== 'student') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const studentId = decoded.id;

      // Find the student to get their class
      const student = await Student.findById(studentId);
      if (!student) {
        return NextResponse.json({ message: 'Student not found' }, { status: 404 });
      }

      // Get all lessons for the student's class
      const classLessons = await Lesson.find({ classId: student.classId })
        .populate('subjectId', 'name')
        .populate('teacherId', 'name surname')
        .sort({ day: 1, startTime: 1 });

      // Get all video lessons for the student's class
      const videoLessons = await VideoLesson.find({
        classId: student.classId,
        isPublished: true
      })
        .populate('subjectId', 'name')
        .populate('teacherId', 'name surname')
        .sort({ createdAt: -1 });

      // Format class schedule
      const formattedSchedule = classLessons.map(lesson => {
        const startTime = new Date(lesson.startTime);
        const endTime = new Date(lesson.endTime);

        return {
          id: lesson._id,
          name: lesson.name,
          subject: lesson.subjectId ? (lesson.subjectId as any).name : 'Unknown Subject',
          teacher: lesson.teacherId ?
            `${(lesson.teacherId as any).name} ${(lesson.teacherId as any).surname}` :
            'Unassigned',
          day: lesson.day,
          startTime: `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`,
          endTime: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`,
          room: lesson.room || 'Not specified',
          type: 'schedule'
        };
      });

      // Format video lessons
      const formattedVideoLessons = videoLessons.map(lesson => {
        return {
          id: lesson._id,
          title: lesson.title,
          description: lesson.description,
          subject: lesson.subjectId ? (lesson.subjectId as any).name : 'Unknown Subject',
          teacher: lesson.teacherId ?
            `${(lesson.teacherId as any).name} ${(lesson.teacherId as any).surname}` :
            'Unknown Teacher',
          duration: lesson.duration,
          videoUrl: lesson.videoUrl,
          thumbnailUrl: lesson.thumbnailUrl,
          createdAt: lesson.createdAt,
          views: lesson.views,
          type: 'video'
        };
      });

      // URL parameter to filter type of lessons to return
      const url = new URL(request.url);
      const lessonType = url.searchParams.get('type');

      if (lessonType === 'schedule') {
        return NextResponse.json(formattedSchedule);
      } else if (lessonType === 'video') {
        return NextResponse.json(formattedVideoLessons);
      } else {
        // Return both by default
        return NextResponse.json({
          schedule: formattedSchedule,
          videos: formattedVideoLessons
        });
      }

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching student lessons:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
