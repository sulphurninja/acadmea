import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import ForumPost from '@/models/ForumPost';
import ForumTopic from '@/models/ForumTopic';

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
      const topicId = url.searchParams.get('topicId');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const skip = (page - 1) * limit;

      if (!topicId) {
        return NextResponse.json({ message: 'Topic ID required' }, { status: 400 });
      }

      const posts = await ForumPost.find({
        topicId,
        isApproved: true,
        parentPostId: null // Only get main posts, not replies
      })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit);

      // Get replies for each post
      const postsWithReplies = await Promise.all(
        posts.map(async (post) => {
          const replies = await ForumPost.find({
            parentPostId: post._id,
            isApproved: true
          }).sort({ createdAt: 1 });

          return {
            ...post.toObject(),
            replies
          };
        })
      );

      const totalPosts = await ForumPost.countDocuments({
        topicId,
        isApproved: true,
        parentPostId: null
      });

      return NextResponse.json({
        posts: postsWithReplies,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts
        }
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching forum posts:', error);
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

      const { topicId, content, parentPostId } = await request.json();

      if (!topicId || !content) {
        return NextResponse.json(
          { message: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Check if topic exists and is not locked
      const topic = await ForumTopic.findById(topicId);
      if (!topic) {
        return NextResponse.json({ message: 'Topic not found' }, { status: 404 });
      }

      if (topic.isLocked) {
        return NextResponse.json({ message: 'Topic is locked' }, { status: 403 });
      }

      // Get user info
      let authorName;
      if (userRole === 'teacher') {
        const Teacher = (await import('@/models/Teacher')).default;
        const teacher = await Teacher.findById(userId);
        authorName = `${teacher.name} ${teacher.surname}`;
      } else {
        const Student = (await import('@/models/Student')).default;
        const student = await Student.findById(userId);
        authorName = `${student.name} ${student.surname}`;
      }

      const postId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const post = new ForumPost({
        _id: postId,
        topicId,
        content,
        authorId: userId,
        authorRole: userRole,
        authorName,
        parentPostId: parentPostId || null,
        isApproved: true // Auto-approve for now
      });

      await post.save();

      // Update topic stats
      await ForumTopic.findByIdAndUpdate(topicId, {
        $inc: { replies: 1 },
        lastReplyAt: new Date(),
        lastReplyBy: userId,
        lastReplyByName: authorName
      });

      return NextResponse.json({ post }, { status: 201 });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating forum post:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
