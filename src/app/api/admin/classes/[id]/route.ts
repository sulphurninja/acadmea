import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Class from '@/models/Class';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Grade from '@/models/Grade';

// Get a specific class (section)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

      const classItem = await Class.findById(params.id)
        .populate('supervisorId', 'name surname')
        .populate('gradeId', 'level name');

      if (!classItem) {
        return NextResponse.json({ message: 'Section not found' }, { status: 404 });
      }

      // Get student count
      const studentCount = await Student.countDocuments({ classId: classItem._id });

      const sectionData = {
        _id: classItem._id,
        name: classItem.name,
        capacity: classItem.capacity,
        supervisor: classItem.supervisorId ? {
          _id: classItem.supervisorId._id,
          name: classItem.supervisorId.name,
          surname: classItem.supervisorId.surname
        } : null,
        grade: {
          _id: classItem.gradeId._id,
          level: classItem.gradeId.level,
          name: classItem.gradeId.name
        },
        studentCount
      };

      return NextResponse.json(sectionData);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching section:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a class (section)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      console.log("Received update data:", data);

      // Validate required fields
      if (!data.name || !data.capacity || !data.gradeId) {
        return NextResponse.json(
          { message: 'Name, capacity, and class are required' },
          { status: 400 }
        );
      }

      // Check if the section name already exists on another section
      const existingClass = await Class.findOne({
        name: data.name,
        _id: { $ne: parseInt(params.id) }
      });

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
      if (data.supervisorId && data.supervisorId !== 'NONE') {
        const supervisor = await Teacher.findById(data.supervisorId);
        if (!supervisor) {
          return NextResponse.json(
            { message: 'Supervisor teacher not found' },
            { status: 404 }
          );
        }
      }

      // Prepare update data
      const updateData = {
        name: data.name,
        capacity: parseInt(data.capacity),
        supervisorId: data.supervisorId === 'NONE' ? null : data.supervisorId,
        gradeId: parseInt(data.gradeId)
      };

      // Update the section
      const updatedClass = await Class.findByIdAndUpdate(
        params.id,
        updateData,
        { new: true }
      )
      .populate('supervisorId', 'name surname')
      .populate('gradeId', 'level name');

      if (!updatedClass) {
        return NextResponse.json({ message: 'Section not found' }, { status: 404 });
      }

      // Get student count
      const studentCount = await Student.countDocuments({ classId: updatedClass._id });

      const sectionData = {
        _id: updatedClass._id,
        name: updatedClass.name,
        capacity: updatedClass.capacity,
        supervisor: updatedClass.supervisorId ? {
          _id: updatedClass.supervisorId._id,
          name: updatedClass.supervisorId.name,
          surname: updatedClass.supervisorId.surname
        } : null,
        grade: {
          _id: updatedClass.gradeId._id,
          level: updatedClass.gradeId.level,
          name: updatedClass.gradeId.name
        },
        studentCount
      };

      return NextResponse.json({
        message: 'Section updated successfully',
        section: sectionData
      });

    } catch (error) {
      console.error('JWT verification or update error:', error);
      return NextResponse.json({ message: 'Invalid token or update failed' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a class (section)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

      // Check if there are students in this section
      const studentCount = await Student.countDocuments({ classId: parseInt(params.id) });
      if (studentCount > 0) {
        return NextResponse.json(
          { message: 'Cannot delete section: there are students assigned to this section' },
          { status: 400 }
        );
      }

      // Delete the section
      const deletedClass = await Class.findByIdAndDelete(params.id);

      if (!deletedClass) {
        return NextResponse.json({ message: 'Section not found' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Section deleted successfully' });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
