import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import VideoLesson from '@/models/VideoLesson';
import mongoose from 'mongoose';

// Get all video lessons with filtering options
export async function GET(request: Request) {
  try {
    await connectToDatabase();

    // Authenticate user
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

      // Get URL params for pagination and filtering
      const url = new URL(request.url);
      const classId = url.searchParams.get('classId');
      const subjectId = url.searchParams.get('subjectId');
      const searchQuery = url.searchParams.get('search');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      // Build query
      const query: any = {};
      if (classId) query.classId = parseInt(classId);
      if (subjectId) query.subjectId = parseInt(subjectId);
      if (searchQuery) query.title = { $regex: searchQuery, $options: 'i' };

      // Get total count for pagination
      const total = await VideoLesson.countDocuments(query);

      // Get video lessons with pagination
      const lessons = await VideoLesson.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('subjectId', 'name')
        .populate('classId', 'name');

      // Format the response
      const formattedLessons = lessons.map(lesson => ({
        id: lesson._id,
        title: lesson.title,
        description: lesson.description,
        subject: lesson.subjectId ? lesson.subjectId.name : null,
        subjectId: lesson.subjectId,
        class: lesson.classId ? lesson.classId.name : null,
        classId: lesson.classId,
        duration: lesson.duration,
        videoUrl: lesson.videoUrl,
        thumbnailUrl: lesson.thumbnailUrl,
        createdAt: lesson.createdAt,
        isPublished: lesson.isPublished,
        views: lesson.views
      }));

      return NextResponse.json({
        lessons: formattedLessons,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });

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

    // Authenticate admin
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

      // Only admins and teachers can upload video lessons
      if (decoded.role !== 'admin' && decoded.role !== 'teacher') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const data = await request.json();

      // Validate required fields
      if (!data.title || !data.videoUrl || !data.subjectId || !data.classId) {
        return NextResponse.json(
          { message: 'Title, video URL, subject and class are required' },
          { status: 400 }
        );
      }

      // Create the new video lesson
      const newLesson = new VideoLesson({
        title: data.title,
        description: data.description || '',
        subjectId: parseInt(data.subjectId),
        classId: parseInt(data.classId),
        duration: data.duration || 0,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl || '',
        isPublished: data.isPublished !== undefined ? data.isPublished : true
      });

      await newLesson.save();

      return NextResponse.json(
        {
          message: 'Video lesson created successfully',
          lesson: {
            id: newLesson._id,
            title: newLesson.title,
            description: newLesson.description,
            subjectId: newLesson.subjectId,
            classId: newLesson.classId,
            duration: newLesson.duration,
            videoUrl: newLesson.videoUrl,
            thumbnailUrl: newLesson.thumbnailUrl,
            createdAt: newLesson.createdAt,
            isPublished: newLesson.isPublished,
            views: newLesson.views
          }
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('JWT verification or lesson creation error:', error);
      return NextResponse.json({
        message: 'Invalid token or lesson creation failed',
        error: error.message
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating video lesson:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
