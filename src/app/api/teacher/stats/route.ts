import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Teacher from '@/models/Teacher';
import Lesson from '@/models/Lesson';
import Assignment from '@/models/Assignment';
import Student from '@/models/Student';
import Subject from '@/models/Subject';
import Class from '@/models/Class';

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    // Get the token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify and decode the token
    try {
      const decoded: any = jwtDecode(token);

      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        return NextResponse.json({ message: 'Token expired' }, { status: 401 });
      }

      // Ensure the user is a teacher
      if (decoded.role !== 'teacher') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const teacherId = decoded.id;

      // Get the teacher data
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
      }

      // Get teacher's classes (lessons they teach)
      const lessons = await Lesson.find({ teacherId });

      // Extract unique class IDs from lessons
      const classIds = [...new Set(lessons.map(lesson => lesson.classId))];

      // Get unique subject IDs taught by this teacher
      const subjectIds = [...new Set(lessons.map(lesson => lesson.subjectId))];

      // Count students in teacher's classes
      const students = await Student.countDocuments({
        classId: { $in: classIds }
      });

      // Count upcoming lessons (future lessons)
      const today = new Date();
      const upcomingLessons = await Lesson.countDocuments({
        teacherId,
        startTime: { $gt: today }
      });

      // Count pending assignments
      const pendingAssignments = await Assignment.countDocuments({
        lessonId: { $in: lessons.map(lesson => lesson._id) },
        dueDate: { $gt: today }
      });

      // Prepare response
      const teacherStats = {
        classes: classIds.length,
        students,
        subjects: subjectIds.length,
        upcomingLessons,
        pendingAssignments
      };

      return NextResponse.json(teacherStats);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
