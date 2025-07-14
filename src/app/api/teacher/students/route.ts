import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Teacher from '@/models/Teacher';
import Class from '@/models/Class';
import Student from '@/models/Student';
import Subject from '@/models/Subject';

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

      // Get teacher info and assigned classes
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
      }

      // Get all class IDs where this teacher teaches
      const teacherClassIds = new Set<number>();

      // Add classes where teacher is class teacher
      if (teacher.classId) {
        const classIds = Array.isArray(teacher.classId) ? teacher.classId : [teacher.classId];
        classIds.forEach(id => {
          if (id) teacherClassIds.add(Number(id));
        });
      }

      // Add classes based on subjects the teacher teaches
      if (teacher.subjects && teacher.subjects.length > 0) {
        // Get all grades where this teacher teaches subjects
        const subjectGrades = await Subject.find({
          _id: { $in: teacher.subjects }
        }).distinct('gradeId');

        // Get all classes for these grades
        const classesForGrades = await Class.find({
          gradeId: { $in: subjectGrades }
        });

        // Add these class IDs to the set
        classesForGrades.forEach(cls => {
          teacherClassIds.add(Number(cls._id));
        });
      }

      // If no classes found, return empty array
      if (teacherClassIds.size === 0) {
        return NextResponse.json([]);
      }

      // Convert Set to Array for the query
      const classIdsArray = Array.from(teacherClassIds);

      // Get all students from these classes (without duplicates)
      const students = await Student.find({
        classId: { $in: classIdsArray }
      }).sort({ name: 1 });

      // Get class info for each student
      const classInfo = await Class.find({
        _id: { $in: classIdsArray }
      });

      // Create a map of class ID to class name for easier lookup
      const classMap = new Map();
      classInfo.forEach(cls => {
        classMap.set(cls._id.toString(), cls.name);
      });

      // Format student data with class information
      const formattedStudents = students.map(student => ({
        id: student._id,
        name: student.name,
        surname: student.surname,
        rollNo: student.rollNo || 'N/A',
        img: student.img || null,
        className: classMap.get(student.classId.toString()) || 'Unknown',
        classId: student.classId,
        email: student.email || '',
        phone: student.phone || '',
        sex: student.sex,
        birthday: student.birthday
      }));

      return NextResponse.json(formattedStudents);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching teacher students:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
