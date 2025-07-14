import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import ForumTopic from '@/models/ForumTopic';

export async function GET(
  request: Request,
  { params }: { params: { topicId: string } }
) {
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

      const { topicId } = params;

      const topic = await ForumTopic.findById(topicId)
        .populate('categoryId', 'name color');

      if (!topic) {
        return NextResponse.json({ message: 'Topic not found' }, { status: 404 });
      }

      // Increment views
      await ForumTopic.findByIdAndUpdate(topicId, { $inc: { views: 1 } });

      return NextResponse.json({ topic });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching forum topic:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
