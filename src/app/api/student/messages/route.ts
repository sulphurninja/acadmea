import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';

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
      if (decoded.role !== 'student') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const studentId = decoded.id;

      // Get messages for the student
      const messages = await Message.find({
        $or: [
          { recipientId: studentId },
          { senderId: studentId }
        ]
      })
      .populate('senderId', 'name surname img role')
      .populate('recipientId', 'name surname')
      .sort({ createdAt: -1 });

      const formattedMessages = messages.map(message => ({
        id: message._id,
        subject: message.subject,
        content: message.content,
        sender: {
          name: message.senderId?.name || 'Unknown',
          surname: message.senderId?.surname || '',
          role: message.senderId?.role || 'user',
          image: message.senderId?.img
        },
        recipient: {
          name: message.recipientId?.name || 'Unknown',
          surname: message.recipientId?.surname || ''
        },
        timestamp: message.createdAt,
        isRead: message.isRead || false,
        isStarred: message.isStarred || false,
        attachments: message.attachments || []
      }));

      return NextResponse.json(formattedMessages);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
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
      if (decoded.role !== 'student') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const studentId = decoded.id;
      const { recipientId, subject, content } = await request.json();

      const newMessage = new Message({
        senderId: studentId,
        recipientId,
        subject,
        content,
        isRead: false,
        createdAt: new Date()
      });

      await newMessage.save();

      return NextResponse.json({ message: 'Message sent successfully' });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
