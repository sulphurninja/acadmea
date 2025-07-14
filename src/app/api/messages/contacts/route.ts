import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Parent from '@/models/Parent';
import Subject from '@/models/Subject';

// GET - Get available contacts for messaging
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

      const userId = decoded.id;
      const userRole = decoded.role;

      let contacts = [];

      if (userRole === 'parent') {
        // Get all teachers of the parent's children
        const children = await Student.find({ parentId: userId })
          .populate('classId', 'name supervisorId')
          .populate('gradeId', 'name');

        const teacherIds = new Set();
        const studentTeachers = [];

        for (const child of children) {
          // Add class teacher
          if (child.classId && child.classId.supervisorId) {
            teacherIds.add(child.classId.supervisorId);
          }

          // Get subjects for this grade
          const subjects = await Subject.find({ gradeId: child.gradeId });

          // Get all teachers who teach these subjects
          const subjectTeachers = await Teacher.find({
            subjects: { $in: subjects.map(s => s._id) }
          });

          for (const teacher of subjectTeachers) {
            teacherIds.add(teacher._id);
          }
        }

        // Get teacher details
        const teachers = await Teacher.find({ _id: { $in: Array.from(teacherIds) } })
          .populate('subjects', 'name')
          .select('name surname email phone img subjects');

        contacts = teachers.map(teacher => ({
          id: teacher._id,
          name: `${teacher.name} ${teacher.surname}`,
          role: 'teacher',
          email: teacher.email,
          phone: teacher.phone,
          img: teacher.img,
          subjects: teacher.subjects.map(s => s.name)
        }));

      } else if (userRole === 'teacher') {
        // Get all parents of students in teacher's classes
        const teacher = await Teacher.findById(userId).populate('subjects');

        if (teacher) {
          // Get all students in classes where teacher teaches
          const students = await Student.find({
            $or: [
              { 'classId.supervisorId': userId }, // Students in supervised class
              { gradeId: { $in: teacher.subjects.map(s => s.gradeId) } } // Students in grades where teacher teaches
            ]
          }).populate('parentId');

          const parentIds = new Set();
          students.forEach(student => {
            if (student.parentId) {
              parentIds.add(student.parentId);
            }
          });

          const parents = await Parent.find({ _id: { $in: Array.from(parentIds) } })
            .select('name surname email phone');

          contacts = parents.map(parent => ({
            id: parent._id,
            name: `${parent.name} ${parent.surname}`,
            role: 'parent',
            email: parent.email,
            phone: parent.phone,
            children: students.filter(s => s.parentId === parent._id).map(s => ({
              id: s._id,
              name: `${s.name} ${s.surname}`,
              className: s.classId?.name,
              grade: s.gradeId?.name
            }))
          }));
        }
      }

      return NextResponse.json({ contacts });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
