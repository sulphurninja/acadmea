import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Class from '@/models/Class';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Grade from '@/models/Grade';
import mongoose from 'mongoose';

// Get all classes with counts
// Get all classes with counts
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

      // Note: Removed the admin role check to allow other roles to view classes/sections
      // This allows teachers and other users to see the sections

      // Get all classes with populated references
      const classes = await Class.find()
        .populate('supervisorId', 'name surname')
        .populate('gradeId', 'level name')
        .sort({ 'gradeId.level': 1, name: 1 });

      console.log("Found sections in database:", classes.length); // Debug log

      // Get student counts for each class
      const classData = await Promise.all(classes.map(async (classItem) => {
        const studentCount = await Student.countDocuments({ classId: classItem._id });

        // Convert to plain object for better logging/debugging
        const section = {
          _id: classItem._id,
          name: classItem.name,
          capacity: classItem.capacity,
          supervisor: classItem.supervisorId ? {
            _id: classItem.supervisorId._id,
            name: classItem.supervisorId.name,
            surname: classItem.supervisorId.surname
          } : undefined,
          grade: classItem.gradeId ? {
            _id: classItem.gradeId._id,
            level: classItem.gradeId.level,
            name: classItem.gradeId.name
          } : { _id: 0, level: 0, name: 'Unknown' },
          studentCount
        };

        return section;
      }));

      console.log("Returning section data:", classData.length); // Debug log
      return NextResponse.json(classData);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
// Create a new class (section)
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
      console.log("Received section data:", data); // Add this for debugging

      // Validate required fields
      if (!data.name || !data.gradeId) {
        return NextResponse.json(
          { message: 'Section name and class are required' },
          { status: 400 }
        );
      }

      // Ensure capacity is a number
      const capacity = Number(data.capacity) || 30;

      // Check if the section name already exists
      const existingClass = await Class.findOne({ name: data.name });
      if (existingClass) {
        return NextResponse.json(
          { message: 'A section with this name already exists' },
          { status: 400 }
        );
      }

      // Check if grade exists
      const grade = await Grade.findById(data.gradeId);
      if (!grade) {
        return NextResponse.json(
          { message: 'Class not found' },
          { status: 404 }
        );
      }

      // Check if supervisor exists if provided
      if (data.supervisorId) {
        const supervisor = await Teacher.findById(data.supervisorId);
        if (!supervisor) {
          return NextResponse.json(
            { message: 'Supervisor teacher not found' },
            { status: 404 }
          );
        }
      }

      // Generate a new class ID
      const lastClass = await Class.findOne().sort({ _id: -1 });
      const classId = lastClass ? lastClass._id + 1 : 1;

      // Create the new section
      const newClass = new Class({
        _id: classId,
        name: data.name,
        capacity: capacity,
        supervisorId: data.supervisorId || null,
        gradeId: data.gradeId
      });

      await newClass.save();
      console.log("Created new section:", newClass); // Add this for debugging

      return NextResponse.json(
        {
          message: 'Section created successfully',
          section: {
            _id: newClass._id,
            name: newClass.name,
            capacity: newClass.capacity,
            supervisorId: newClass.supervisorId,
            gradeId: newClass.gradeId
          }
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('JWT verification or section creation error:', error);
      return NextResponse.json({ message: 'Invalid token or section creation failed' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
