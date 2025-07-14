import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import FeeStructure from '@/models/FeeStructure';
import Grade from '@/models/Grade';

// GET - Fetch all fee structures
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

      const url = new URL(request.url);
      const academicYear = url.searchParams.get('academicYear');

      let query = {};
      if (academicYear) {
        query = { academicYear };
      }

      const feeStructures = await FeeStructure.find(query)
        .populate('gradeId', 'level name')
        .sort({ gradeId: 1 });

      return NextResponse.json(feeStructures);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching fee structures:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new fee structure
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
      const body = await request.json();

      const {
        gradeId,
        academicYear,
        tuitionFee,
        admissionFee,
        examFee,
        libraryFee,
        sportsFee,
        miscFee,
        dueDate,
        lateFeePenalty,
        installmentAllowed,
        installments
      } = body;

      // Check if fee structure already exists for this grade and academic year
      const existingFee = await FeeStructure.findOne({ gradeId, academicYear });
      if (existingFee) {
        return NextResponse.json(
          { message: 'Fee structure already exists for this grade and academic year' },
          { status: 400 }
        );
      }

      // Get the next ID
      const lastFeeStructure = await FeeStructure.findOne().sort({ _id: -1 });
      const nextId = lastFeeStructure ? lastFeeStructure._id + 1 : 1;

      const newFeeStructure = new FeeStructure({
        _id: nextId,
        gradeId,
        academicYear,
        tuitionFee: tuitionFee || 0,
        admissionFee: admissionFee || 0,
        examFee: examFee || 0,
        libraryFee: libraryFee || 0,
        sportsFee: sportsFee || 0,
        miscFee: miscFee || 0,
        dueDate,
        lateFeePenalty: lateFeePenalty || 0,
        installmentAllowed: installmentAllowed || false,
        installments: installments || [],
        createdBy: adminId
      });

      await newFeeStructure.save();

      const populatedFeeStructure = await FeeStructure.findById(nextId)
        .populate('gradeId', 'level name');

      return NextResponse.json(populatedFeeStructure, { status: 201 });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating fee structure:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
