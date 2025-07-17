import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import Notification from '@/models/Notification';
import connectToDatabase from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded: any = jwtDecode(token);
    if (decoded.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    const notificationId = params.id;

    const result = await Notification.updateOne(
      {
        _id: notificationId,
        'recipients.userId': decoded.id,
        'recipients.userRole': decoded.role
      },
      {
        $set: {
          'recipients.$.isRead': true,
          'recipients.$.readAt': new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}