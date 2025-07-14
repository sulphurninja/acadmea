import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import VideoLesson from '@/models/VideoLesson';
import Student from '@/models/Student';

// Get video lessons for student
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

      // Get student details to find their class
      const student = await Student.findOne({ userId: decoded.id });

      if (!student) {
        return NextResponse.json({ message: 'Student profile not found' }, { status: 404 });
      }

      // Find lessons for student's class that are published
      const videoLessons = await VideoLesson.find({
        classId: student.classId,
        isPublished: true
      }).sort({ createdAt: -1 });

      return NextResponse.json(videoLessons);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching video lessons for student:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
