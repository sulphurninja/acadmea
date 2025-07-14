import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Teacher from '@/models/Teacher';
import Class from '@/models/Class';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import Subject from '@/models/Subject';

// GET: Fetch attendance records with filters
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

      // Get query parameters
      const url = new URL(request.url);
      const classId = url.searchParams.get('classId');
      const studentId = url.searchParams.get('studentId');
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const status = url.searchParams.get('status');

      // Verify teacher has access to the requested class
      if (classId) {
        const hasAccess = await verifyTeacherClassAccess(teacherId, classId);
        if (!hasAccess) {
          return NextResponse.json({ message: 'Access denied to this class' }, { status: 403 });
        }
      }

      // Build query
      let query: any = {};

      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      } else if (startDate) {
        query.date = { $gte: new Date(startDate) };
      } else if (endDate) {
        query.date = { $lte: new Date(endDate) };
      }

      if (status) {
        query.status = status;
      }

      // If specific student requested
      if (studentId) {
        query.studentId = studentId;

        // Verify teacher has access to this student
        const student = await Student.findById(studentId);
        if (!student) {
          return NextResponse.json({ message: 'Student not found' }, { status: 404 });
        }

        const hasAccess = await verifyTeacherClassAccess(teacherId, student.classId.toString());
        if (!hasAccess) {
          return NextResponse.json({ message: 'Access denied to this student' }, { status: 403 });
        }
      }
      // If class filter applied, get all students in that class
      else if (classId) {
        const studentsInClass = await Student.find({ classId }).select('_id');
        const studentIds = studentsInClass.map(s => s._id);
        query.studentId = { $in: studentIds };
      }
      // Otherwise, get all students from teacher's classes
      else {
        const teacherClassIds = await getTeacherClassIds(teacherId);
        if (teacherClassIds.length === 0) {
          return NextResponse.json([]);
        }

        const studentsInClasses = await Student.find({
          classId: { $in: teacherClassIds }
        }).select('_id');

        const studentIds = studentsInClasses.map(s => s._id);
        query.studentId = { $in: studentIds };
      }

      // Fetch attendance records
      const attendanceRecords = await Attendance.find(query)
        .sort({ date: -1 })
        .populate('studentId', 'name surname rollNo classId')
        .exec();

      // Fetch class info for each student
      const classIds = Array.from(new Set(attendanceRecords.map(
        record => (record.studentId as any).classId
      )));

      const classesInfo = await Class.find({ _id: { $in: classIds } });
      const classMap = new Map();
      classesInfo.forEach(cls => {
        classMap.set(cls._id.toString(), cls.name);
      });

      // Format the response
      const formattedRecords = attendanceRecords.map(record => {
        const student = record.studentId as any;
        return {
          id: record._id,
          date: record.date,
          status: record.status,
          notes: record.notes,
          student: {
            id: student._id,
            name: student.name,
            surname: student.surname,
            rollNo: student.rollNo,
            className: classMap.get(student.classId.toString()) || 'Unknown'
          }
        };
      });

      return NextResponse.json(formattedRecords);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create/Update attendance records
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
      const requestBody = await request.json();

      // Validate request
      if (!requestBody.classId || !requestBody.date || !requestBody.attendanceData) {
        return NextResponse.json(
          { message: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Verify teacher has access to this class
      const hasAccess = await verifyTeacherClassAccess(
        teacherId,
        requestBody.classId
      );

      if (!hasAccess) {
        return NextResponse.json(
          { message: 'Access denied to this class' },
          { status: 403 }
        );
      }

      // Get all students in the class
      const studentsInClass = await Student.find({
        classId: requestBody.classId
      }).select('_id');

      const studentIds = studentsInClass.map(s => s._id.toString());

      // Validate all students in the attendance data belong to the class
      for (const attendance of requestBody.attendanceData) {
        if (!studentIds.includes(attendance.studentId)) {
          return NextResponse.json(
            { message: `Student ${attendance.studentId} not in class` },
            { status: 400 }
          );
        }
      }

      // Convert date string to Date object
      const attendanceDate = new Date(requestBody.date);

      // Create/update attendance records
      const results = [];

      for (const attendance of requestBody.attendanceData) {
        // Check if record already exists
        const existingRecord = await Attendance.findOne({
          studentId: attendance.studentId,
          date: {
            $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
            $lt: new Date(attendanceDate.setHours(23, 59, 59, 999))
          }
        });

        if (existingRecord) {
          // Update existing record
          existingRecord.status = attendance.status;
          existingRecord.notes = attendance.notes || '';
          await existingRecord.save();
          results.push(existingRecord);
        } else {
          // Create new record
          const newRecord = new Attendance({
            studentId: attendance.studentId,
            date: attendanceDate,
            status: attendance.status,
            notes: attendance.notes || '',
            recordedBy: teacherId
          });

          await newRecord.save();
          results.push(newRecord);
        }
      }

      return NextResponse.json({
        message: 'Attendance recorded successfully',
        records: results.length
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error recording attendance:', error);
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

// Helper function to get all class IDs where a teacher teaches
async function getTeacherClassIds(teacherId: string): Promise<number[]> {
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) return [];

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
    const subjectGrades = await Subject.find({
      _id: { $in: teacher.subjects }
    }).distinct('gradeId');

    const classesForGrades = await Class.find({
      gradeId: { $in: subjectGrades }
    });

    classesForGrades.forEach(cls => {
      teacherClassIds.add(Number(cls._id));
    });
  }

  return Array.from(teacherClassIds);
}
