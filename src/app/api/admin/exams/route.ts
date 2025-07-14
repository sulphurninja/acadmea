import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Exam from '@/models/Exam';
import Subject from '@/models/Subject';
import Grade from '@/models/Grade';
import mongoose from 'mongoose';

// GET: Fetch all exams
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

      if (decoded.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      // Get URL parameters for filtering
      const url = new URL(request.url);
      const gradeId = url.searchParams.get('gradeId');
      const subjectId = url.searchParams.get('subjectId');
      const status = url.searchParams.get('status');

      // Build query
      let query: any = {};
      if (gradeId) query.gradeId = Number(gradeId);
      if (subjectId) query.subjectId = Number(subjectId);
      if (status) query.status = status;

      // Fetch exams with their related data
      const exams = await Exam.find(query)
        .sort({ examDate: -1 })
        .populate('subjectId', 'name')
        .populate('gradeId', 'level name');

      // Format response
      const formattedExams = await Promise.all(exams.map(async (exam) => {
        return {
          id: exam._id,
          title: exam.title,
          description: exam.description || "",
          examDate: exam.examDate,
          subject: {
            id: exam.subjectId?._id || null,
            name: exam.subjectId?.name || "Unknown Subject"
          },
          grade: {
            id: exam.gradeId?._id || null,
            level: exam.gradeId?.level || 0,
            name: exam.gradeId?.name || `Class ${exam.gradeId?.level || 'Unknown'}`
          },
          maxMarks: exam.maxMarks,
          duration: exam.duration,
          examType: exam.examType,
          status: exam.status,
          createdAt: exam.createdAt
        };
      }));

      return NextResponse.json({ exams: formattedExams });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new exam
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

      if (decoded.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const adminId = decoded.id;
      const data = await request.json();

      // Validate required fields
      const requiredFields = ['title', 'examDate', 'subjectId', 'gradeId', 'maxMarks', 'duration', 'examType'];
      for (const field of requiredFields) {
        if (!data[field]) {
          return NextResponse.json(
            { message: `Missing required field: ${field}` },
            { status: 400 }
          );
        }
      }

      // Validate subject exists
      const subject = await Subject.findById(data.subjectId);
      if (!subject) {
        return NextResponse.json(
          { message: 'Subject not found' },
          { status: 404 }
        );
      }

      // Validate grade exists
      const grade = await Grade.findById(data.gradeId);
      if (!grade) {
        return NextResponse.json(
          { message: 'Grade not found' },
          { status: 404 }
        );
      }

      // Generate a new exam ID (auto-incrementing)
      const lastExam = await Exam.findOne().sort({ _id: -1 });
      const newExamId = lastExam ? lastExam._id + 1 : 1;

      // Create the exam
      const newExam = new Exam({
        _id: newExamId,
        title: data.title,
        description: data.description || '',
        examDate: new Date(data.examDate),
        subjectId: data.subjectId,
        gradeId: data.gradeId,
        maxMarks: data.maxMarks,
        duration: data.duration,
        examType: data.examType,
        status: data.status || 'SCHEDULED',
        createdAt: new Date(),
        createdBy: adminId
      });

      await newExam.save();

      return NextResponse.json({
        message: 'Exam created successfully',
        exam: {
          id: newExam._id,
          title: newExam.title
        }
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
