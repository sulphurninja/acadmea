import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';
// import Schedule from '@/models/Schedule';

export async function GET(request: Request) {
  // try {
  //   await connectToDatabase();

  //   const cookieStore = cookies();
  //   const token = cookieStore.get('token')?.value;

  //   if (!token) {
  //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  //   }

  //   try {
  //     const decoded: any = jwtDecode(token);
  //     if (decoded.exp * 1000 < Date.now()) {
  //       return NextResponse.json({ message: 'Token expired' }, { status: 401 });
  //     }
  //     if (decoded.role !== 'student') {
  //       return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  //     }

  //     const studentId = decoded.id;
  //     const url = new URL(request.url);
  //     const week = url.searchParams.get('week') || 'current';

  //     const student = await Student.findById(studentId)
  //       .populate('classId')
  //       .populate('gradeId');

  //     if (!student) {
  //       return NextResponse.json({ message: 'Student not found' }, { status: 404 });
  //     }

  //     // Calculate week dates based on parameter
  //     const today = new Date();
  //     let weekStart: Date, weekEnd: Date;

  //     switch (week) {
  //       case 'next':
  //         weekStart = new Date(today.setDate(today.getDate() - today.getDay() + 7));
  //         weekEnd = new Date(today.setDate(today.getDate() + 6));
  //         break;
  //       case 'previous':
  //         weekStart = new Date(today.setDate(today.getDate() - today.getDay() - 7));
  //         weekEnd = new Date(today.setDate(today.getDate() + 6));
  //         break;
  //       default: // current
  //         weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
  //         weekEnd = new Date(today.setDate(today.getDate() + 6));
  //     }

  //     // Get schedule for the class/grade
  //     const schedules = await Schedule.find({
  //       $or: [
  //         { classId: student.classId._id },
  //         { gradeId: student.gradeId._id }
  //       ]
  //     })
  //     .populate('subjectId', 'name')
  //     .populate('teacherId', 'name surname');

  //     // Generate weekly schedule
  //     const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  //     const days = [];

  //     for (let i = 0; i < 7; i++) {
  //       const currentDate = new Date(weekStart);
  //       currentDate.setDate(weekStart.getDate() + i);

  //       const daySchedules = schedules.filter(schedule =>
  //         schedule.dayOfWeek === daysOfWeek[i] || schedule.dayOfWeek === i
  //       );

  //       const periods = daySchedules.map(schedule => ({
  //         id: schedule._id,
  //         subject: schedule.subjectId?.name || 'Unknown',
  //         teacher: schedule.teacherId ?
  //           `${schedule.teacherId.name} ${schedule.teacherId.surname}` : 'TBA',
  //         room: schedule.room || 'TBA',
  //         startTime: schedule.startTime || '09:00',
  //         endTime: schedule.endTime || '10:00',
  //         type: schedule.type || 'lecture'
  //       }));

  //       // Add break periods
  //       if (periods.length > 0) {
  //         periods.splice(2, 0, {
  //           id: `break-${i}`,
  //           subject: 'Break',
  //           teacher: '',
  //           room: '',
  //           startTime: '11:00',
  //           endTime: '11:15',
  //           type: 'break'
  //         });
  //       }

  //       days.push({
  //         day: daysOfWeek[i],
  //         date: currentDate.toISOString(),
  //         periods: periods.sort((a, b) => a.startTime.localeCompare(b.startTime))
  //       });
  //     }

  //     const weekSchedule = {
  //       weekStart: weekStart.toISOString(),
  //       weekEnd: weekEnd.toISOString(),
  //       days
  //     };

  //     return NextResponse.json(weekSchedule);

  //   } catch (error) {
  //     console.error('JWT verification error:', error);
  //     return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  //   }
  // } catch (error) {
  //   console.error('Error fetching schedule:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  // }
}
