import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Grade from '@/models/Grade';


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

      // Fetch all grades
      const grades = await Grade.find().sort({ level: 1 });

      // Format the response
      const formattedGrades = grades.map(grade => ({
        _id: grade._id,
        level: grade.level,
        name: grade.name
      }));

      return NextResponse.json({ grades: formattedGrades });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
// Create a new grade (admin only)
export async function POST(request: Request) {
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

      const data = await request.json();

      // Validate required fields
      if (!data.level) {
        return NextResponse.json(
          { message: 'Grade level is required' },
          { status: 400 }
        );
      }

      // Check if grade level already exists
      const existingGrade = await Grade.findOne({ level: data.level });

      if (existingGrade) {
        return NextResponse.json(
          { message: 'A grade with this level already exists' },
          { status: 400 }
        );
      }

      // Generate a new grade ID
      const lastGrade = await Grade.findOne().sort({ _id: -1 });
      const gradeId = lastGrade ? parseInt(lastGrade._id) + 1 : 1;

      // Create the new grade
      const newGrade = new Grade({
        _id: gradeId,
        level: data.level,
        name: data.name || `Grade ${data.level}`
      });

      await newGrade.save();

      return NextResponse.json(
        {
          message: 'Grade created successfully',
          grade: {
            id: newGrade._id,
            level: newGrade.level,
            name: newGrade.name
          }
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating grade:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
