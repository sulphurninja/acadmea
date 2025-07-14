import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Parent from '@/models/Parent';
import Student from '@/models/Student';
import Class from '@/models/Class';
import Grade from '@/models/Grade';
import Attendance from '@/models/Attendance';
import ExamResult from '@/models/ExamResult';
import Exam from '@/models/Exam';

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

      if (decoded.role !== 'parent') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const parentId = decoded.id;

      // Get parent information
      const parent = await Parent.findById(parentId);
      if (!parent) {
        return NextResponse.json({ message: 'Parent not found' }, { status: 404 });
      }

      // Get all children of this parent
      const children = await Student.find({ parentId })
        .populate('classId', 'name')
        .populate('gradeId', 'level name')
        .select('name surname rollNo img classId gradeId');

      // Get attendance and exam statistics for each child
      const childrenWithStats = await Promise.all(
        children.map(async (child) => {
          // Get attendance for last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const attendanceRecords = await Attendance.find({
            studentId: child._id,
            date: { $gte: thirtyDaysAgo }
          });

          const totalDays = attendanceRecords.length;
          const presentDays = attendanceRecords.filter(record =>
            record.status === 'PRESENT' || record.status === 'LATE'
          ).length;
          const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

          // Get upcoming exams
          const upcomingExams = await Exam.find({
            gradeId: child.gradeId,
            examDate: { $gte: new Date() },
            status: 'SCHEDULED'
          }).countDocuments();

          // Get recent exam results count
          const recentExamResults = await ExamResult.find({
            studentId: child._id,
            isGraded: true
          }).countDocuments();

          return {
            id: child._id,
            name: `${child.name} ${child.surname}`,
            rollNo: child.rollNo,
            avatar: child.img || '',
            grade: child.gradeId?.name || 'Unknown',
            className: child.classId?.name || 'Unknown',
            attendanceRate,
            upcomingExams,
            recentResults: recentExamResults
          };
        })
      );

      // Get recent announcements (we'll need to create an Announcement model later)
      const announcements = [
        {
          id: 1,
          title: "Parent-Teacher Meeting",
          date: new Date('2024-01-25'),
          description: "Annual parent-teacher conference to discuss student progress."
        },
        {
          id: 2,
          title: "School Holiday",
          date: new Date('2024-01-04'),
          description: "School will be closed for Republic Day celebration."
        }
      ];

      return NextResponse.json({
        parent: {
          name: `${parent.name} ${parent.surname}`,
          email: parent.email,
          phone: parent.phone
        },
        children: childrenWithStats,
        announcements
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching parent dashboard:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
