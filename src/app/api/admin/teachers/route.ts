import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Teacher from '@/models/Teacher';
import User from '@/models/User';
import mongoose from 'mongoose';

// Get all teachers
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
      const searchQuery = url.searchParams.get('search');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '50');

      // Build query
      const query: any = {};
      if (searchQuery) {
        query.$or = [
          { name: { $regex: searchQuery, $options: 'i' } },
          { surname: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } }
        ];
      }

      // Get total count for pagination
      const total = await Teacher.countDocuments(query);

      // Get teachers with pagination
      const teachers = await Teacher.find(query)
        .sort({ name: 1, surname: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('subjects', 'name');

      return NextResponse.json({
        teachers,
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
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new teacher (admin only)
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
      if (!data.username || !data.password || !data.name || !data.surname) {
        return NextResponse.json(
          { message: 'Username, password, name and surname are required' },
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

        // Create a new teacher ID
        const teacherId = new mongoose.Types.ObjectId().toString();

        // Create the teacher profile
        const newTeacher = new Teacher({
          _id: teacherId,
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || '',
          img: data.img || '',
          bloodType: data.bloodType || '',
          sex: data.sex || 'MALE',
          birthday: data.birthday || new Date(),
          subjects: data.subjects || []
        });

        await newTeacher.save({ session });

        // Create the user account
        const newUser = new User({
          _id: teacherId,
          username: data.username,
          password: data.password,
          role: 'teacher',
          isActive: true // Admin-created accounts are active by default
        });

        await newUser.save({ session });

        await session.commitTransaction();
        session.endSession();

        return NextResponse.json(
          {
            message: 'Teacher created successfully',
            teacherId
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
    console.error('Error creating teacher:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
