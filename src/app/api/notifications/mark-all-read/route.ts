import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import Notification from '@/models/Notification';
import connectToDatabase from '@/lib/db';

export async function POST(request: NextRequest) {
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

    const result = await Notification.updateMany(
      {
        'recipients.userId': decoded.id,
        'recipients.userRole': decoded.role,
        'recipients.isRead': false
      },
      {
        $set: {
          'recipients.$.isRead': true,
          'recipients.$.readAt': new Date()
        }
      }
    );

    return NextResponse.json({ 
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}