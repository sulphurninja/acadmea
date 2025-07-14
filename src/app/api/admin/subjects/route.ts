import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Subject from '@/models/Subject';
import mongoose from 'mongoose';

// Get all subjects
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

      // Allow both admins and teachers to view subjects
      if (decoded.role !== 'admin' && decoded.role !== 'teacher') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      // Get URL params for pagination and filtering
      const url = new URL(request.url);
      const gradeId = url.searchParams.get('gradeId');
      const searchQuery = url.searchParams.get('search');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '50');

      // Build query
      const query: any = {};
      if (gradeId) query.gradeId = gradeId;
      if (searchQuery) query.name = { $regex: searchQuery, $options: 'i' };

      // Get total count for pagination
      const total = await Subject.countDocuments(query);

      // Get subjects with pagination
      const subjects = await Subject.find(query)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('gradeId', 'level');

      // Format the response - remove credits, add new fields
      const formattedSubjects = subjects.map(subject => ({
        id: subject._id,
        name: subject.name,
        description: subject.description,
        grade: subject.gradeId ? subject.gradeId.level : null,
        gradeId: subject.gradeId ? subject.gradeId._id : null,
        isCore: subject.isCore,
        passingMarks: subject.passingMarks,
        fullMarks: subject.fullMarks,
        hasTheory: subject.hasTheory,
        hasPractical: subject.hasPractical
      }));

      return NextResponse.json({
        subjects: formattedSubjects,
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
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new subject
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

      // Only admins can create subjects
      if (decoded.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const data = await request.json();
      console.log("Creating subject with data:", data); // Debug log

      // Validate required fields
      if (!data.name || !data.gradeId) {
        return NextResponse.json(
          { message: 'Subject name and class are required' },
          { status: 400 }
        );
      }

      // Check if subject with this name already exists for this grade
      const existingSubject = await Subject.findOne({
        name: data.name,
        gradeId: parseInt(data.gradeId)
      });

      if (existingSubject) {
        return NextResponse.json(
          { message: 'A subject with this name already exists for this class' },
          { status: 400 }
        );
      }

      // Generate a new subject ID
      const lastSubject = await Subject.findOne().sort({ _id: -1 });
      const subjectId = lastSubject ? parseInt(lastSubject._id) + 1 : 1;

      // Create the new subject with the updated model fields
      const newSubject = new Subject({
        _id: subjectId,
        name: data.name,
        description: data.description || '',
        gradeId: parseInt(data.gradeId),
        isCore: data.isCore !== undefined ? data.isCore : true,
        passingMarks: data.passingMarks || 33,
        fullMarks: data.fullMarks || 100,
        hasTheory: data.hasTheory !== undefined ? data.hasTheory : true,
        hasPractical: data.hasPractical !== undefined ? data.hasPractical : false,
        theoryCutOff: data.theoryCutOff || 33,
        practicalCutOff: data.practicalCutOff || 33
      });

      await newSubject.save();
      console.log("Created new subject:", newSubject); // Debug log

      return NextResponse.json(
        {
          message: 'Subject created successfully',
          subject: {
            id: newSubject._id,
            name: newSubject.name,
            description: newSubject.description,
            gradeId: newSubject.gradeId,
            grade: null, // Will be populated on fetch
            isCore: newSubject.isCore,
            passingMarks: newSubject.passingMarks,
            fullMarks: newSubject.fullMarks,
            hasTheory: newSubject.hasTheory,
            hasPractical: newSubject.hasPractical
          }
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('JWT verification or subject creation error:', error);
      return NextResponse.json({
        message: 'Invalid token or subject creation failed',
        error: error.message
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
