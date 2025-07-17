import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import Notification from '@/models/Notification';
import { v4 as uuidv4 } from 'uuid';
import connectToDatabase from '@/lib/db';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type');

    const query: any = {
      isActive: true,
      $or: [
        { 'recipients.userId': decoded.id, 'recipients.userRole': decoded.role },
        { targetAudience: 'ALL' },
        { targetAudience: decoded.role.toUpperCase() + 'S' }
      ]
    };

    if (type) {
      query.type = type;
    }

    if (unreadOnly) {
      query['recipients.userId'] = decoded.id;
      query['recipients.isRead'] = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await Notification.countDocuments(query);

    // Format notifications for the user
    const formattedNotifications = notifications.map(notification => {
      const userRecipient = notification.recipients.find(
        (r: any) => r.userId === decoded.id && r.userRole === decoded.role
      );

      return {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        isRead: userRecipient?.isRead || false,
        readAt: userRecipient?.readAt,
        createdBy: notification.createdByName,
        createdByRole: notification.createdByRole,
        createdAt: notification.createdAt,
        actionUrl: notification.actionUrl,
        actionText: notification.actionText,
        attachments: notification.attachments || []
      };
    });

    return NextResponse.json({
      notifications: formattedNotifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded: any = jwtDecode(token);
    if (decoded.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    // Only admins and teachers can create notifications
    if (!['admin', 'teacher'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const {
      title,
      message,
      type = 'GENERAL',
      priority = 'MEDIUM',
      targetAudience = 'ALL',
      targetGradeId,
      targetClassId,
      expiresAt,
      actionUrl,
      actionText,
      attachments = []
    } = data;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    // Generate recipients based on target audience
    const recipients = await generateRecipients(
      targetAudience,
      targetGradeId,
      targetClassId,
      decoded.id
    );

    const notification = new Notification({
      _id: uuidv4(),
      title,
      message,
      type,
      priority,
      recipients,
      createdBy: decoded.id,
      createdByRole: decoded.role,
      createdByName: decoded.name || decoded.username,
      targetAudience,
      targetGradeId,
      targetClassId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      actionUrl,
      actionText,
      attachments
    });

    await notification.save();

    return NextResponse.json({
      message: 'Notification created successfully',
      notification: {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        recipientCount: recipients.length
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateRecipients(
  targetAudience: string,
  targetGradeId?: number,
  targetClassId?: number,
  excludeUserId?: string
) {
  const recipients = [];

  switch (targetAudience) {
    case 'ALL':
      // Get all users except the creator
      const [students, teachers, parents] = await Promise.all([
        import('@/models/Student').then(m => m.default.find({}).lean()),
        import('@/models/Teacher').then(m => m.default.find({}).lean()),
        import('@/models/Parent').then(m => m.default.find({}).lean())
      ]);

      students.forEach((student: any) => {
        if (student._id !== excludeUserId) {
          recipients.push({
            userId: student._id,
            userRole: 'student',
            isRead: false
          });
        }
      });

      teachers.forEach((teacher: any) => {
        if (teacher._id !== excludeUserId) {
          recipients.push({
            userId: teacher._id,
            userRole: 'teacher',
            isRead: false
          });
        }
      });

      parents.forEach((parent: any) => {
        if (parent._id !== excludeUserId) {
          recipients.push({
            userId: parent._id,
            userRole: 'parent',
            isRead: false
          });
        }
      });
      break;

    case 'STUDENTS':
      const allStudents = await import('@/models/Student').then(m => 
        m.default.find(targetGradeId ? { gradeId: targetGradeId } : {}).lean()
      );
      
      allStudents.forEach((student: any) => {
        recipients.push({
          userId: student._id,
          userRole: 'student',
          isRead: false
        });
      });
      break;

    case 'TEACHERS':
      const allTeachers = await import('@/models/Teacher').then(m => 
        m.default.find({}).lean()
      );
      
      allTeachers.forEach((teacher: any) => {
        if (teacher._id !== excludeUserId) {
          recipients.push({
            userId: teacher._id,
            userRole: 'teacher',
            isRead: false
          });
        }
      });
      break;

    case 'PARENTS':
      const allParents = await import('@/models/Parent').then(m => 
        m.default.find({}).lean()
      );
      
      allParents.forEach((parent: any) => {
        recipients.push({
          userId: parent._id,
          userRole: 'parent',
          isRead: false
        });
      });
      break;

    case 'SPECIFIC_GRADE':
      if (targetGradeId) {
        const gradeStudents = await import('@/models/Student').then(m => 
          m.default.find({ gradeId: targetGradeId }).lean()
        );
        
        gradeStudents.forEach((student: any) => {
          recipients.push({
            userId: student._id,
            userRole: 'student',
            isRead: false
          });
        });
      }
      break;

    case 'SPECIFIC_CLASS':
      if (targetClassId) {
        const classStudents = await import('@/models/Student').then(m => 
          m.default.find({ classId: targetClassId }).lean()
        );
        
        classStudents.forEach((student: any) => {
          recipients.push({
            userId: student._id,
            userRole: 'student',
            isRead: false
          });
        });
      }
      break;
  }

  return recipients;
}