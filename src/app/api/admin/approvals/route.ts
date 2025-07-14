import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';
import Parent from '@/models/Parent';

// Get all users pending approval
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

      // Get all inactive users
      const pendingUsers = await User.find({ isActive: false })
        .sort({ createdAt: -1 });

      // Get additional profile info for each user
      const enrichedUsers = await Promise.all(pendingUsers.map(async (user) => {
        const userId = user._id;
        let profileData = {};

        // Fetch profile data based on role
        if (user.role === 'teacher') {
          const teacher = await Teacher.findById(userId);
          if (teacher) {
            profileData = {
              name: teacher.name,
              surname: teacher.surname,
              email: teacher.email,
              phone: teacher.phone
            };
          }
        } else if (user.role === 'student') {
          const student = await Student.findById(userId);
          if (student) {
            profileData = {
              name: student.name,
              surname: student.surname,
              email: student.email,
              phone: student.phone
            };
          }
        } else if (user.role === 'parent') {
          const parent = await Parent.findById(userId);
          if (parent) {
            profileData = {
              name: parent.name,
              surname: parent.surname,
              email: parent.email,
              phone: parent.phone
            };
          }
        }

        return {
          _id: user._id,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
          ...profileData
        };
      }));

      return NextResponse.json(enrichedUsers);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching pending users:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
