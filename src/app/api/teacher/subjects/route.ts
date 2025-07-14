import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Teacher from '@/models/Teacher';
import Subject from '@/models/Subject';

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

      if (decoded.role !== 'teacher') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const teacherId = decoded.id;

      // Get teacher to find their subjects
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
      }

      if (!teacher.subjects || teacher.subjects.length === 0) {
        return NextResponse.json([]);
      }

      // Get subjects taught by this teacher
      const subjects = await Subject.find({ _id: { $in: teacher.subjects } })
        .sort({ name: 1 })
        .select('_id name description gradeId');

      // Format the response
      const formattedSubjects = subjects.map(subject => ({
        id: subject._id,
        name: subject.name,
        description: subject.description,
        gradeId: subject.gradeId
      }));

      return NextResponse.json(formattedSubjects);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching teacher subjects:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
