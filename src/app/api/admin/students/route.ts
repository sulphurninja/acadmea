import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';
import User from '@/models/User';
import Class from '@/models/Class';
import Parent from '@/models/Parent';
import mongoose from 'mongoose';

// Get all students
export async function GET(request: Request) {
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

      // Get URL params for pagination and filtering
      const url = new URL(request.url);
      const classId = url.searchParams.get('classId');
      const gradeId = url.searchParams.get('gradeId');
      const searchQuery = url.searchParams.get('search');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '50');

      // Build query
      const query: any = {};
      if (classId) query.classId = parseInt(classId);
      if (gradeId) query.gradeId = parseInt(gradeId);
      if (searchQuery) {
        query.$or = [
          { name: { $regex: searchQuery, $options: 'i' } },
          { surname: { $regex: searchQuery, $options: 'i' } },
          { username: { $regex: searchQuery, $options: 'i' } }
        ];
      }

      // Get total count for pagination
      const total = await Student.countDocuments(query);

      // Get students with pagination
      const students = await Student.find(query)
        .sort({ surname: 1, name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('classId', 'name')
        .populate('gradeId', 'level')
        .populate('parentId', 'name surname');

      return NextResponse.json({
        students,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new student
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
      if (!data.username || !data.password || !data.name || !data.surname ||
          !data.classId || !data.gradeId || !data.parentId) {
        return NextResponse.json(
          { message: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Start a transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Check if username already exists
        const existingUser = await User.findOne({ username: data.username });
        if (existingUser) {
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json(
            { message: 'Username already exists' },
            { status: 400 }
          );
        }

        // Verify that class and parent exist
        const classExists = await Class.findById(data.classId);
        if (!classExists) {
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json(
            { message: 'Class not found' },
            { status: 404 }
          );
        }

        const parentExists = await Parent.findById(data.parentId);
        if (!parentExists) {
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json(
            { message: 'Parent not found' },
            { status: 404 }
          );
        }

        // Create a new student ID
        const studentId = new mongoose.Types.ObjectId().toString();

        // Create the student profile
        const newStudent = new Student({
          _id: studentId,
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || '',
          rollNo: data.rollNo || '',
          img: data.img || '',
          bloodType: data.bloodType || '',
          sex: data.sex || 'MALE',
          birthday: data.birthday || new Date(),
          parentId: data.parentId,
          classId: data.classId,
          gradeId: data.gradeId
        });

        await newStudent.save({ session });

        // Create the user account
        const newUser = new User({
          _id: studentId,
          username: data.username,
          password: data.password,
          role: 'student',
          isActive: true // Admin-created accounts are active by default
        });

        await newUser.save({ session });

        await session.commitTransaction();
        session.endSession();

        return NextResponse.json(
          {
            message: 'Student created successfully',
            studentId
          },
          { status: 201 }
        );
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
