import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Subject from '@/models/Subject';
import Class from '@/models/Class';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

      if (decoded.role !== 'parent') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const parentId = decoded.id;
      const { id } = params;

      // Verify this child belongs to this parent
      const child = await Student.findById(id)
        .populate('classId', 'name supervisorId')
        .populate('gradeId', 'level name');

      if (!child || child.parentId !== parentId) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 });
      }

      // Get class teacher
      let classTeacher = null;
      if (child.classId && child.classId.supervisorId) {
        classTeacher = await Teacher.findById(child.classId.supervisorId)
          .select('name surname email phone img');
      }

      // Get all subjects for this grade
      const subjects = await Subject.find({ gradeId: child.gradeId });
      const subjectIds = subjects.map(s => Number(s._id));

      // Get all teachers who teach these subjects
      const subjectTeachers = await Teacher.find({
        subjects: { $in: subjectIds }
      })
      .populate('subjects', 'name')
      .select('name surname email phone img subjects');

      // Filter subjects that the teachers actually teach for this grade
      const teachersWithSubjects = subjectTeachers.map(teacher => ({
        id: teacher._id,
        name: `${teacher.name} ${teacher.surname}`,
        email: teacher.email,
        phone: teacher.phone,
        img: teacher.img,
        subjects: teacher.subjects.filter(subject =>
          subjectIds.includes(Number(subject._id))
        ).map(subject => subject.name),
        role: 'Subject Teacher'
      }));

      // Add class teacher if exists and not already in the list
      if (classTeacher && !teachersWithSubjects.find(t => t.id.toString() === classTeacher._id.toString())) {
        teachersWithSubjects.unshift({
          id: classTeacher._id,
          name: `${classTeacher.name} ${classTeacher.surname}`,
          email: classTeacher.email,
          phone: classTeacher.phone,
          img: classTeacher.img,
          subjects: ['Class Teacher'],
          role: 'Class Teacher'
        });
      }

      return NextResponse.json({
        child: {
          name: `${child.name} ${child.surname}`,
          rollNo: child.rollNo,
          className: child.classId?.name,
          grade: child.gradeId?.name
        },
        teachers: teachersWithSubjects
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
