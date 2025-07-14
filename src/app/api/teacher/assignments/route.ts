import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Teacher from '@/models/Teacher';
import Class from '@/models/Class';
import Subject from '@/models/Subject';
import Assignment from '@/models/Assignment';
import mongoose from 'mongoose';

// GET: Fetch assignments for the teacher
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

      // Get URL parameters
      const url = new URL(request.url);
      const subjectId = url.searchParams.get('subjectId');
      const classId = url.searchParams.get('classId');
      const status = url.searchParams.get('status'); // active, past, upcoming

      // Get teacher info to find subjects they teach
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
      }

      // If subject filter is provided, verify teacher teaches this subject
      if (subjectId && (!teacher.subjects || !teacher.subjects.includes(Number(subjectId)))) {
        return NextResponse.json({ message: 'Access denied to this subject' }, { status: 403 });
      }

      // Get subjects taught by the teacher
      const teacherSubjects = teacher.subjects || [];

      // Build query
      let query: any = {};

      // Filter by subject
      if (subjectId) {
        query.subjectId = Number(subjectId);
      } else {
        // Only include assignments for subjects taught by this teacher
        query.subjectId = { $in: teacherSubjects };
      }

      // Filter by status
      const now = new Date();
      if (status === 'active') {
        query.startDate = { $lte: now };
        query.dueDate = { $gte: now };
      } else if (status === 'past') {
        query.dueDate = { $lt: now };
      } else if (status === 'upcoming') {
        query.startDate = { $gt: now };
      }

      // Fetch assignments
      const assignments = await Assignment.find(query)
        .sort({ dueDate: 1 })
        .populate('subjectId', 'name')
        .exec();

      // Get class filter if provided
      let filteredAssignments = assignments;
      if (classId) {
        // Get class info
        const classInfo = await Class.findById(classId);
        if (!classInfo) {
          return NextResponse.json({ message: 'Class not found' }, { status: 404 });
        }

        // Verify teacher has access to this class
        const hasAccess = await verifyTeacherClassAccess(teacherId, classId);
        if (!hasAccess) {
          return NextResponse.json({ message: 'Access denied to this class' }, { status: 403 });
        }

        // Filter assignments by class grade level
        filteredAssignments = assignments.filter((assignment: any) => {
          const subject = assignment.subjectId;
          return subject && subject.gradeId === classInfo.gradeId;
        });
      }

      // Format the response
      const formattedAssignments = filteredAssignments.map((assignment: any) => ({
        id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        startDate: assignment.startDate,
        dueDate: assignment.dueDate,
        subject: assignment.subjectId ? {
          id: assignment.subjectId._id,
          name: assignment.subjectId.name
        } : null
      }));

      return NextResponse.json(formattedAssignments);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new assignment
export async function POST(request: Request) {
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
      const data = await request.json();

      // Validate required fields
      if (!data.title || !data.description || !data.startDate ||
          !data.dueDate || !data.subjectId) {
        return NextResponse.json(
          { message: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Verify teacher teaches this subject
      const teacher = await Teacher.findById(teacherId);
      if (!teacher || !teacher.subjects || !teacher.subjects.includes(Number(data.subjectId))) {
        return NextResponse.json(
          { message: 'You are not authorized to create assignments for this subject' },
          { status: 403 }
        );
      }

      // Verify the subject exists
      const subject = await Subject.findById(data.subjectId);
      if (!subject) {
        return NextResponse.json(
          { message: 'Subject not found' },
          { status: 404 }
        );
      }

      // Create a new assignment ID
      const count = await Assignment.countDocuments();
      const assignmentId = count + 1;

      // Create the assignment
      const newAssignment = new Assignment({
        _id: assignmentId,
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        dueDate: new Date(data.dueDate),
        subjectId: data.subjectId
      });

      await newAssignment.save();

      return NextResponse.json(
        {
          message: 'Assignment created successfully',
          assignmentId
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to verify if a teacher has access to a class
async function verifyTeacherClassAccess(teacherId: string, classId: string): Promise<boolean> {
  // Check if teacher is the class teacher
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) return false;

  // If teacher is a class teacher for this class
  if (teacher.classId) {
    const classIds = Array.isArray(teacher.classId) ? teacher.classId : [teacher.classId];
    if (classIds.some(id => id?.toString() === classId)) {
      return true;
    }
  }

  // Check if teacher teaches a subject in this class
  if (teacher.subjects && teacher.subjects.length > 0) {
    // Get the class grade
    const classInfo = await Class.findById(classId);
    if (!classInfo) return false;

    // Check if teacher teaches any subject for this grade
    const teacherSubjects = await Subject.find({
      _id: { $in: teacher.subjects },
      gradeId: classInfo.gradeId
    });

    return teacherSubjects.length > 0;
  }

  return false;
}
