import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Announcement from '@/models/Announcement';
import Student from '@/models/Student';

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    // Authenticate student
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

      // Get student info to filter relevant announcements
      const student = await Student.findById(studentId)
        .populate('classId')
        .populate('gradeId');

      if (!student) {
        return NextResponse.json({ message: 'Student not found' }, { status: 404 });
      }

      // Get announcements relevant to the student
      const announcements = await Announcement.find({
        $or: [
          { targetAudience: 'all' },
          { targetAudience: 'students' },
          { targetGrades: student.gradeId?._id },
          { targetClasses: student.classId?._id }
        ],
        isActive: true
      })
      .sort({ createdAt: -1 })
      .limit(20);

      const formattedAnnouncements = announcements.map(announcement => ({
        id: announcement._id,
        title: announcement.title,
        description: announcement.description,
        date: announcement.createdAt,
        priority: announcement.priority || 'medium'
      }));

      return NextResponse.json(formattedAnnouncements);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
