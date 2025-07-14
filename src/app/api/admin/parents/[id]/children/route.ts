import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';

// Get all children for a specific parent
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    // Authenticate admin
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

      if (decoded.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      // Get all children for this parent with more detailed information
      const children = await Student.find({ parentId: params.id })
        .select('_id name surname username email phone classId gradeId rollNo')
        .populate('classId', 'name')
        .populate('gradeId', 'level')
        .sort({ name: 1 });

      return NextResponse.json(children);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching children:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
