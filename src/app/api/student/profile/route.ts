import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';
import Parent from '@/models/Parent';

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    // Authenticate student
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

      if (decoded.role !== 'student') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const studentId = decoded.id;

      // Get student profile with populated references
      const student = await Student.findById(studentId)
        .populate('classId', 'name')
        .populate('gradeId', 'level')
        .populate('parentId', 'name surname phone');

      if (!student) {
        return NextResponse.json({ message: 'Student not found' }, { status: 404 });
      }

      // Get parent details if available
      let parentDetails = {
        fatherName: '',
        motherName: '',
        guardianPhone: '',
        occupation: ''
      };

      if (student.parentId) {
        const parent = await Parent.findById(student.parentId._id);
        if (parent) {
          parentDetails = {
            fatherName: parent.fatherName || '',
            motherName: parent.motherName || '',
            guardianPhone: parent.phone || '',
            occupation: parent.occupation || ''
          };
        }
      }

      // Calculate profile completion
      const profileFields = [
        'name', 'surname', 'email', 'phone', 'address',
        'birthday', 'bloodType', 'sex'
      ];

      const completedFields = profileFields.filter(field =>
        student[field] && student[field].toString().trim() !== ''
      ).length;

      const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

      const profile = {
        id: student._id,
        name: student.name,
        surname: student.surname,
        email: student.email || '',
        phone: student.phone || '',
        address: student.address || '',
        dateOfBirth: student.birthday || '',
        bloodGroup: student.bloodType || '',
        emergencyContact: student.emergencyContact || '',
        emergencyContactName: student.emergencyContactName || '',
        parentDetails,
        academicInfo: {
          rollNo: student.rollNo || '',
          className: student.classId?.name || 'Not assigned',
          section: student.classId?.name?.split('-')[1] || '',
          admissionDate: student.admissionDate || '',
          studentId: student.username,
        },
        profileImage: student.img || '',
        documents: student.documents || [],
        profileCompletion,
      };

      return NextResponse.json(profile);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();

    // Authenticate student
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

      if (decoded.role !== 'student') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const studentId = decoded.id;
      const data = await request.json();

      // Update student profile
      const updatedStudent = await Student.findByIdAndUpdate(
        studentId,
        {
          name: data.name,
          surname: data.surname,
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          birthday: data.dateOfBirth || null,
          bloodType: data.bloodGroup || '',
          emergencyContact: data.emergencyContact || '',
          emergencyContactName: data.emergencyContactName || '',
        },
        { new: true }
      );

      if (!updatedStudent) {
        return NextResponse.json({ message: 'Student not found' }, { status: 404 });
      }

      // Update parent details if provided
      if (data.parentDetails && updatedStudent.parentId) {
        await Parent.findByIdAndUpdate(
          updatedStudent.parentId,
          {
            fatherName: data.parentDetails.fatherName || '',
            motherName: data.parentDetails.motherName || '',
            phone: data.parentDetails.guardianPhone || '',
            occupation: data.parentDetails.occupation || '',
          }
        );
      }

      return NextResponse.json({
        message: 'Profile updated successfully',
        student: updatedStudent
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error updating student profile:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
