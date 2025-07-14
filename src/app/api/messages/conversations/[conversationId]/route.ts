import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';

// GET - Fetch messages for a specific conversation
export async function GET(
  request: Request,
  { params }: { params: { conversationId: string } }
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

      const userId = decoded.id;
      const { conversationId } = params;

      // Verify user is participant in this conversation
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
      }

      const isParticipant = conversation.participants.some(p => p.userId === userId);

      if (!isParticipant) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 });
      }

      // Get messages for this conversation
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const skip = (page - 1) * limit;

      const messages = await Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalMessages = await Message.countDocuments({ conversationId });

      // Mark messages as read for the current user
      await Message.updateMany(
        {
          conversationId,
          receiverId: userId,
          isRead: false
        },
        {
          $set: { isRead: true, readAt: new Date() }
        }
      );

      return NextResponse.json({
        conversation: conversation.toObject(),
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalMessages / limit),
          totalMessages
        }
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
