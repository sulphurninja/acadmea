import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Teacher from '@/models/Teacher';
import Class from '@/models/Class';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
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

      // Get query parameters
      const url = new URL(request.url);
      const classId = url.searchParams.get('classId');
      const studentId = url.searchParams.get('studentId');
      const startDate = url.searchParams.get('startDate') ||
                        new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
      const endDate = url.searchParams.get('endDate') || new Date().toISOString();

      // Get teacher's classes
      const teacherClassIds = await getTeacherClassIds(teacherId);

      if (teacherClassIds.length === 0) {
        return NextResponse.json({
          overview: { total: 0, present: 0, absent: 0, late: 0, excused: 0 },
          byClass: [],
          byDate: [],
          byStudent: []
        });
      }

      // Build query
      let query: any = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };

      // Filter by class or student
      if (studentId) {
        query.studentId = studentId;

        // Verify teacher has access to this student
        const student = await Student.findById(studentId);
        if (!student) {
          return NextResponse.json({ message: 'Student not found' }, { status: 404 });
        }

        const hasAccess = teacherClassIds.includes(Number(student.classId));
        if (!hasAccess) {
          return NextResponse.json({ message: 'Access denied to this student' }, { status: 403 });
        }
      }
      else if (classId) {
        // Verify teacher has access to this class
        const hasAccess = teacherClassIds.includes(Number(classId));
        if (!hasAccess) {
          return NextResponse.json({ message: 'Access denied to this class' }, { status: 403 });
        }

        const studentsInClass = await Student.find({ classId }).select('_id');
        const studentIds = studentsInClass.map(s => s._id);
        query.studentId = { $in: studentIds };
      }
      else {
        // Get all students from teacher's classes
        const studentsInClasses = await Student.find({
          classId: { $in: teacherClassIds }
        }).select('_id');

        const studentIds = studentsInClasses.map(s => s._id);
        query.studentId = { $in: studentIds };
      }

      // Get all attendance records for analysis
      const attendanceRecords = await Attendance.find(query)
        .populate('studentId', 'name surname rollNo classId')
        .exec();

      // Get class information
      const classesInfo = await Class.find({
        _id: { $in: teacherClassIds }
      });

      const classMap = new Map();
      classesInfo.forEach(cls => {
        classMap.set(cls._id.toString(), cls.name);
      });

      // 1. Overall attendance statistics
      const overview = {
        total: attendanceRecords.length,
        present: attendanceRecords.filter(r => r.status === 'PRESENT').length,
        absent: attendanceRecords.filter(r => r.status === 'ABSENT').length,
        late: attendanceRecords.filter(r => r.status === 'LATE').length,
        excused: attendanceRecords.filter(r => r.status === 'EXCUSED').length
      };

      // 2. Attendance by class
      const byClassMap = new Map();

      for (const record of attendanceRecords) {
        const student = record.studentId as any;
        const classId = student.classId.toString();
        const className = classMap.get(classId) || 'Unknown';

        if (!byClassMap.has(classId)) {
          byClassMap.set(classId, {
            id: classId,
            name: className,
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0
          });
        }

        const classStats = byClassMap.get(classId);
        classStats.total++;

        switch (record.status) {
          case 'PRESENT': classStats.present++; break;
          case 'ABSENT': classStats.absent++; break;
          case 'LATE': classStats.late++; break;
          case 'EXCUSED': classStats.excused++; break;
        }
      }

      const byClass = Array.from(byClassMap.values()).map(cls => ({
        ...cls,
        presentPercent: cls.total > 0 ? Math.round((cls.present / cls.total) * 100) : 0,
        absentPercent: cls.total > 0 ? Math.round((cls.absent / cls.total) * 100) : 0,
        latePercent: cls.total > 0 ? Math.round((cls.late / cls.total) * 100) : 0,
        excusedPercent: cls.total > 0 ? Math.round((cls.excused / cls.total) * 100) : 0
      }));

      // 3. Attendance by date
      const byDateMap = new Map();

      for (const record of attendanceRecords) {
        const dateString = record.date.toISOString().split('T')[0];

        if (!byDateMap.has(dateString)) {
          byDateMap.set(dateString, {
            date: dateString,
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0
          });
        }

        const dateStats = byDateMap.get(dateString);
        dateStats.total++;

        switch (record.status) {
          case 'PRESENT': dateStats.present++; break;
          case 'ABSENT': dateStats.absent++; break;
          case 'LATE': dateStats.late++; break;
          case 'EXCUSED': dateStats.excused++; break;
        }
      }

      const byDate = Array.from(byDateMap.values())
        .sort((a, b) => a.date.localeCompare(b.date));

      // 4. Attendance by student (top absences)
      const byStudentMap = new Map();

      for (const record of attendanceRecords) {
        const student = record.studentId as any;
        const studentId = student._id.toString();

        if (!byStudentMap.has(studentId)) {
          byStudentMap.set(studentId, {
            id: studentId,
            name: `${student.name} ${student.surname}`,
            rollNo: student.rollNo,
            className: classMap.get(student.classId.toString()) || 'Unknown',
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0
          });
        }

        const studentStats = byStudentMap.get(studentId);
        studentStats.total++;

        switch (record.status) {
          case 'PRESENT': studentStats.present++; break;
          case 'ABSENT': studentStats.absent++; break;
          case 'LATE': studentStats.late++; break;
          case 'EXCUSED': studentStats.excused++; break;
        }
      }

      const byStudent = Array.from(byStudentMap.values())
        .map(student => ({
          ...student,
          presentPercent: student.total > 0 ? Math.round((student.present / student.total) * 100) : 0,
          absentPercent: student.total > 0 ? Math.round((student.absent / student.total) * 100) : 0,
          latePercent: student.total > 0 ? Math.round((student.late / student.total) * 100) : 0,
          excusedPercent: student.total > 0 ? Math.round((student.excused / student.total) * 100) : 0
        }))
        .sort((a, b) => b.absentPercent - a.absentPercent || b.absent - a.absent);

      return NextResponse.json({
        overview,
        byClass,
        byDate,
        byStudent
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error generating attendance analytics:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
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
