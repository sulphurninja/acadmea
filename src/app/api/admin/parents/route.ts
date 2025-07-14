import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Parent from '@/models/Parent';
import User from '@/models/User';
import Student from '@/models/Student';
import mongoose from 'mongoose';

// Get all parents
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
          { email: { $regex: searchQuery, $options: 'i' } },
          { phone: { $regex: searchQuery, $options: 'i' } }
        ];
      }

      // Get total count for pagination
      const total = await Parent.countDocuments(query);

      // Get parents with pagination
      const parents = await Parent.find(query)
        .sort({ surname: 1, name: 1 })
        .skip((page - 1) * limit)
        .limit(limit);

      // Get children count for each parent
      const enrichedParents = await Promise.all(parents.map(async (parent) => {
        const childrenCount = await Student.countDocuments({ parentId: parent._id });

        return {
          ...parent.toObject(),
          childrenCount
        };
      }));

      return NextResponse.json({
        parents: enrichedParents,
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
    console.error('Error fetching parents:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new parent
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
          !data.phone || !data.address) {
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

        // Create a new parent ID
        const parentId = new mongoose.Types.ObjectId().toString();

        // Create the parent profile
        const newParent = new Parent({
          _id: parentId,
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email || null,
          phone: data.phone,
          address: data.address
        });

        await newParent.save({ session });

        // Create the user account
        const newUser = new User({
          _id: parentId,
          username: data.username,
          password: data.password,
          role: 'parent',
          isActive: true // Admin-created accounts are active by default
        });

        await newUser.save({ session });

        await session.commitTransaction();
        session.endSession();

        return NextResponse.json(
          {
            message: 'Parent created successfully',
            parentId
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
    console.error('Error creating parent:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
