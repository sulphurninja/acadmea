import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Parent from '@/models/Parent';

// GET - Fetch all conversations for a user
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

      const userId = decoded.id;
      const userRole = decoded.role;

      // Find all conversations where the user is a participant
      const conversations = await Conversation.find({
        'participants.userId': userId,
        isActive: true
      })
        .sort({ updatedAt: -1 })
        .limit(50);

      // Get unread message counts for each conversation
      const conversationsWithUnread = await Promise.all(
        conversations.map(async (conv) => {
          const unreadCount = await Message.countDocuments({
            conversationId: conv._id,
            receiverId: userId,
            isRead: false
          });

          return {
            ...conv.toObject(),
            unreadCount
          };
        })
      );

      return NextResponse.json({
        conversations: conversationsWithUnread,
        totalUnread: conversationsWithUnread.reduce((sum, conv) => sum + conv.unreadCount, 0)
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new conversation
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

      const { receiverId, receiverRole, subject, content, category, studentId } = await request.json();

      // Validate required fields
      if (!receiverId || !receiverRole || !subject || !content) {
        return NextResponse.json(
          { message: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Get sender and receiver information
      let senderInfo, receiverInfo;

      if (senderRole === 'teacher') {
        senderInfo = await Teacher.findById(senderId);
      } else if (senderRole === 'parent') {
        senderInfo = await Parent.findById(senderId);
      }

      if (receiverRole === 'teacher') {
        receiverInfo = await Teacher.findById(receiverId);
      } else if (receiverRole === 'parent') {
        receiverInfo = await Parent.findById(receiverId);
      }

      if (!senderInfo || !receiverInfo) {
        return NextResponse.json(
          { message: 'Sender or receiver not found' },
          { status: 404 }
        );
      }

      // Create conversation ID
      const conversationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create the conversation
      const conversation = new Conversation({
        _id: conversationId,
        participants: [
          {
            userId: senderId,
            role: senderRole,
            name: senderRole === 'teacher' ?
              `${senderInfo.name} ${senderInfo.surname}` :
              `${senderInfo.name} ${senderInfo.surname}`,
            joinedAt: new Date()
          },
          {
            userId: receiverId,
            role: receiverRole,
            name: receiverRole === 'teacher' ?
              `${receiverInfo.name} ${receiverInfo.surname}` :
              `${receiverInfo.name} ${receiverInfo.surname}`,
            joinedAt: new Date()
          }
        ],
        subject,
        category: category || 'GENERAL',
        studentId,
        lastMessage: {
          content,
          senderId,
          senderName: senderRole === 'teacher' ?
            `${senderInfo.name} ${senderInfo.surname}` :
            `${senderInfo.name} ${senderInfo.surname}`,
          createdAt: new Date()
        },
        isActive: true
      });

      await conversation.save();

      // Create the first message
      const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const message = new Message({
        _id: messageId,
        conversationId,
        senderId,
        senderRole,
        receiverId,
        receiverRole,
        subject,
        content,
        category: category || 'GENERAL',
        studentId,
        isRead: false,
        priority: 'MEDIUM'
      });

      await message.save();

      return NextResponse.json({
        conversation: conversation.toObject(),
        message: message.toObject()
      }, { status: 201 });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
