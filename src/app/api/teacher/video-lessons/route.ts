import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import VideoLesson from '@/models/VideoLesson';
import Teacher from '@/models/Teacher';

// Get video lessons for teacher
export async function GET(request: Request) {
  try {
    await connectToDatabase();

    // Authenticate teacher
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

      // Get URL params for optional filtering
      const { searchParams } = new URL(request.url);
      const classId = searchParams.get('classId');
      const subjectId = searchParams.get('subjectId');

      // Build query based on filters
      const query: any = {};
      if (classId) query.classId = parseInt(classId);
      if (subjectId) query.subjectId = parseInt(subjectId);

      // Find lessons based on query
      const videoLessons = await VideoLesson.find(query)
        .sort({ createdAt: -1 });

      return NextResponse.json(videoLessons);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching video lessons for teacher:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
