import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import ForumCategory from '@/models/ForumCategory';

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

      const userRole = decoded.role;
      const userId = decoded.id;

      // Get categories based on user role
      let categories;
      if (userRole === 'teacher') {
        categories = await ForumCategory.find({ isActive: true })
          .populate('gradeIds', 'name')
          .populate('subjectIds', 'name')
          .sort({ name: 1 });
      } else if (userRole === 'student') {
        // Students can only see categories for their grade
        const Student = (await import('@/models/Student')).default;
        const student = await Student.findById(userId).populate('gradeId');

        if (student) {
          categories = await ForumCategory.find({
            isActive: true,
            gradeIds: { $in: [student.gradeId._id] }
          })
          .populate('gradeIds', 'name')
          .populate('subjectIds', 'name')
          .sort({ name: 1 });
        } else {
          categories = [];
        }
      } else {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 });
      }

      return NextResponse.json({ categories });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching forum categories:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
