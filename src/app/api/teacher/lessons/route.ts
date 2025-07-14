import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import VideoLesson from '@/models/VideoLesson';
import Teacher from '@/models/Teacher';
import mongoose from 'mongoose';

// Get all video lessons for a teacher
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

      // Get the teacher data
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
      }

      // Get all video lessons created by this teacher
      const lessons = await VideoLesson.find({ teacherId })
        .populate('subjectId', 'name')
        .populate('classId', 'name')
        .sort({ createdAt: -1 });

      // Transform data for the response
      const transformedLessons = lessons.map(lesson => ({
        id: lesson._id,
        title: lesson.title,
        description: lesson.description,
        subject: lesson.subjectId ? (lesson.subjectId as any).name : 'Unknown Subject',
        class: lesson.classId ? (lesson.classId as any).name : 'Unknown Class',
        teacher: `${teacher.name} ${teacher.surname}`,
        duration: lesson.duration,
        videoUrl: lesson.videoUrl,
        thumbnailUrl: lesson.thumbnailUrl,
        createdAt: lesson.createdAt,
        views: lesson.views,
        isPublished: lesson.isPublished
      }));

      return NextResponse.json(transformedLessons);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching video lessons:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new video lesson
export async function POST(request: Request) {
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

      // Verify teacher exists
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
      }

      // Get request data
      const data = await request.json();

      // Validate required fields
      if (!data.title || !data.subjectId || !data.classId || !data.videoUrl) {
        return NextResponse.json(
          { message: 'Missing required fields: title, subjectId, classId, videoUrl' },
          { status: 400 }
        );
      }

      // Create new video lesson
      const videoLesson = new VideoLesson({
        title: data.title,
        description: data.description || '',
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: teacherId,
        duration: data.duration || 0,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl || '',
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
        views: 0,
        createdAt: new Date()
      });

      await videoLesson.save();

      // Return the created lesson with populated fields
      const createdLesson = await VideoLesson.findById(videoLesson._id)
        .populate('subjectId', 'name')
        .populate('classId', 'name');

      const responseData = {
        id: createdLesson._id,
        title: createdLesson.title,
        description: createdLesson.description,
        subject: createdLesson.subjectId ? (createdLesson.subjectId as any).name : 'Unknown Subject',
        class: createdLesson.classId ? (createdLesson.classId as any).name : 'Unknown Class',
        teacher: `${teacher.name} ${teacher.surname}`,
        duration: createdLesson.duration,
        videoUrl: createdLesson.videoUrl,
        thumbnailUrl: createdLesson.thumbnailUrl,
        createdAt: createdLesson.createdAt,
        views: createdLesson.views,
        isPublished: createdLesson.isPublished
      };

      return NextResponse.json(
        { message: 'Video lesson created successfully', lesson: responseData },
        { status: 201 }
      );

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating video lesson:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
