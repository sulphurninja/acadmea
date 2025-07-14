import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import ForumTopic from '@/models/ForumTopic';
import ForumCategory from '@/models/ForumCategory';

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

      const url = new URL(request.url);
      const categoryId = url.searchParams.get('categoryId');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const skip = (page - 1) * limit;

      let query: any = { isApproved: true };
      if (categoryId) {
        query.categoryId = categoryId;
      }

      const topics = await ForumTopic.find(query)
        .populate('categoryId', 'name color')
        .sort({ isSticky: -1, lastReplyAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalTopics = await ForumTopic.countDocuments(query);

      return NextResponse.json({
        topics,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalTopics / limit),
          totalTopics
        }
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching forum topics:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

      const userId = decoded.id;
      const userRole = decoded.role;

      if (userRole !== 'student' && userRole !== 'teacher') {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 });
      }

      const { title, content, categoryId, tags, subjectId } = await request.json();

      if (!title || !content || !categoryId) {
        return NextResponse.json(
          { message: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Get user info
      let authorName, gradeId;
      if (userRole === 'teacher') {
        const Teacher = (await import('@/models/Teacher')).default;
        const teacher = await Teacher.findById(userId);
        authorName = `${teacher.name} ${teacher.surname}`;
      } else {
        const Student = (await import('@/models/Student')).default;
        const student = await Student.findById(userId).populate('gradeId');
        authorName = `${student.name} ${student.surname}`;
        gradeId = student.gradeId._id;
      }

      // Check if category allows student posts
      const category = await ForumCategory.findById(categoryId);
      if (!category) {
        return NextResponse.json({ message: 'Category not found' }, { status: 404 });
      }

      if (userRole === 'student' && !category.allowStudentPosts) {
        return NextResponse.json({ message: 'Students not allowed to post in this category' }, { status: 403 });
      }

      const topicId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const topic = new ForumTopic({
        _id: topicId,
        title,
        content,
        categoryId,
        authorId: userId,
        authorRole: userRole,
        authorName,
        gradeId,
        subjectId,
        tags: tags || [],
        isApproved: !category.requireModeration || userRole === 'teacher',
        lastReplyAt: new Date()
      });

      await topic.save();

      return NextResponse.json({ topic }, { status: 201 });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating forum topic:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
