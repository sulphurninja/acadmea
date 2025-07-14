import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import VideoLesson from '@/models/VideoLesson';

// Get a single video lesson
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

      const lesson = await VideoLesson.findById(params.id)
        .populate('subjectId', 'name')
        .populate('classId', 'name');

      if (!lesson) {
        return NextResponse.json(
          { message: 'Video lesson not found' },
          { status: 404 }
        );
      }

      // Increment view count if the viewer is a student
      if (decoded.role === 'student') {
        lesson.views += 1;
        await lesson.save();
      }

      return NextResponse.json({
        lesson: {
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
        }
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching video lesson:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a video lesson
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    // Authenticate admin or teacher
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

      if (decoded.role !== 'admin' && decoded.role !== 'teacher') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const data = await request.json();
      const lesson = await VideoLesson.findById(params.id);

      if (!lesson) {
        return NextResponse.json(
          { message: 'Video lesson not found' },
          { status: 404 }
        );
      }

      // Update fields
      if (data.title) lesson.title = data.title;
      if (data.description !== undefined) lesson.description = data.description;
      if (data.subjectId) lesson.subjectId = parseInt(data.subjectId);
      if (data.classId) lesson.classId = parseInt(data.classId);
      if (data.duration !== undefined) lesson.duration = data.duration;
      if (data.videoUrl) lesson.videoUrl = data.videoUrl;
      if (data.thumbnailUrl !== undefined) lesson.thumbnailUrl = data.thumbnailUrl;
      if (data.isPublished !== undefined) lesson.isPublished = data.isPublished;

      await lesson.save();

      return NextResponse.json({
        message: 'Video lesson updated successfully',
        lesson: {
          id: lesson._id,
          title: lesson.title,
          description: lesson.description,
          subjectId: lesson.subjectId,
          classId: lesson.classId,
          duration: lesson.duration,
          videoUrl: lesson.videoUrl,
          thumbnailUrl: lesson.thumbnailUrl,
          createdAt: lesson.createdAt,
          isPublished: lesson.isPublished,
          views: lesson.views
        }
      });

    } catch (error) {
      console.error('JWT verification or lesson update error:', error);
      return NextResponse.json({ message: 'Invalid token or update failed' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error updating video lesson:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a video lesson
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

      // Only admin can delete
      if (decoded.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const lesson = await VideoLesson.findByIdAndDelete(params.id);

      if (!lesson) {
        return NextResponse.json(
          { message: 'Video lesson not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Video lesson deleted successfully'
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error deleting video lesson:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
