import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Subject from '@/models/Subject';
import Teacher from '@/models/Teacher';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

      if (decoded.role !== 'student') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const subjectId = params.id;

      // Validate subject ID
      if (!subjectId) {
        return NextResponse.json({ message: 'Subject ID is required' }, { status: 400 });
      }

      // First, check if the subject exists
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return NextResponse.json({ message: 'Subject not found' }, { status: 404 });
      }

      // Find teacher who teaches this subject
      const teacher = await Teacher.findOne({
        subjects: { $in: [subjectId] }
      });

      if (!teacher) {
        return NextResponse.json({
          message: 'No teacher assigned to this subject',
          name: 'Unassigned',
          surname: 'Teacher'
        }, { status: 200 });
      }

      // Return teacher information
      return NextResponse.json({
        id: teacher._id,
        name: teacher.name,
        surname: teacher.surname,
        email: teacher.email,
        phone: teacher.phone
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching teacher for subject:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
