import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import Teacher from '@/models/Teacher';
import Parent from '@/models/Parent';

// POST - Send a message
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

      const senderId = decoded.id;
      const senderRole = decoded.role;

      const { conversationId, receiverId, receiverRole, content, priority } = await request.json();

      // Validate required fields
      if (!conversationId || !receiverId || !content) {
        return NextResponse.json(
          { message: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Verify conversation exists and user is participant
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
      }

      const isParticipant = conversation.participants.some(p => p.userId === senderId);

      if (!isParticipant) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 });
      }

      // Get sender info
      let senderInfo;
      if (senderRole === 'teacher') {
        senderInfo = await Teacher.findById(senderId);
      } else if (senderRole === 'parent') {
        senderInfo = await Parent.findById(senderId);
      }

      if (!senderInfo) {
        return NextResponse.json({ message: 'Sender not found' }, { status: 404 });
      }

      // Create the message
      const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const message = new Message({
        _id: messageId,
        conversationId,
        senderId,
        senderRole,
        receiverId,
        receiverRole,
        subject: conversation.subject,
        content,
        category: conversation.category,
        studentId: conversation.studentId,
        isRead: false,
        priority: priority || 'MEDIUM'
      });

      await message.save();

      // Update conversation's last message
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: {
          content,
          senderId,
          senderName: `${senderInfo.name} ${senderInfo.surname}`,
          createdAt: new Date()
        },
        updatedAt: new Date()
      });

      return NextResponse.json({
        message: message.toObject()
      }, { status: 201 });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
