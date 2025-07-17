import { NextRequest, NextResponse } from 'next/server';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Attendance from '@/models/Attendance';
import ExamResult from '@/models/ExamResult';
import Exam from '@/models/Exam';
import FeePayment from '@/models/FeePayment';
import Event from '@/models/Event';
import Grade from '@/models/Grade';
import Class from '@/models/Class';
import Subject from '@/models/Subject';
import connectToDatabase from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [
      totalStudents,
      totalTeachers,
      attendanceData,
      performanceData,
      feeData,
      enrollmentTrends,
      upcomingExams,
      recentEvents
    ] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      getAttendanceAnalytics(startDate),
      getPerformanceAnalytics(startDate),
      getFeeAnalytics(startDate),
      getEnrollmentTrends(startDate),
      getUpcomingExams(),
      getRecentEvents()
    ]);

    return NextResponse.json({
      overview: {
        totalStudents,
        totalTeachers,
        attendanceRate: attendanceData.averageAttendance,
        performanceRate: performanceData.averagePerformance
      },
      attendance: attendanceData,
      performance: performanceData,
      fees: feeData,
      enrollment: enrollmentTrends,
      upcomingExams,
      recentEvents,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json({ error: 'Failed to generate analytics' }, { status: 500 });
  }
}

async function getAttendanceAnalytics(startDate: Date) {
  const attendanceRecords = await Attendance.find({
    date: { $gte: startDate }
  }).lean();

  const dailyAttendance = attendanceRecords.reduce((acc: any, record) => {
    const date = record.date.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { present: 0, absent: 0, late: 0, total: 0 };
    }
    acc[date][record.status.toLowerCase()]++;
    acc[date].total++;
    return acc;
  }, {});

  const attendanceChart = Object.entries(dailyAttendance).map(([date, data]: [string, any]) => ({
    date,
    present: data.present,
    absent: data.absent,
    late: data.late,
    total: data.total,
    percentage: ((data.present / data.total) * 100).toFixed(1)
  }));

  const totalRecords = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length;
  const averageAttendance = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

  return {
    averageAttendance: Math.round(averageAttendance * 100) / 100,
    totalRecords,
    presentCount,
    absentCount: attendanceRecords.filter(r => r.status === 'ABSENT').length,
    lateCount: attendanceRecords.filter(r => r.status === 'LATE').length,
    chart: attendanceChart
  };
}

async function getPerformanceAnalytics(startDate: Date) {
  const exams = await Exam.find({
    examDate: { $gte: startDate }
  }).lean();

  const results = await ExamResult.find({
    examId: { $in: exams.map(e => e._id) }
  })
    .populate('examId')
    .populate('studentId', 'name surname gradeId')
    .lean();

  // Get subjects for better labeling
  const subjects = await Subject.find({}).lean();
  const subjectMap = subjects.reduce((acc: any, subject) => {
    acc[subject._id] = subject.name;
    return acc;
  }, {});

  const performanceBySubject = results.reduce((acc: any, result) => {
    const subjectId = result.examId?.subjectId?.toString();
    const subjectName = subjectMap[subjectId] || 'Unknown Subject';
    
    if (!acc[subjectName]) {
      acc[subjectName] = { totalMarks: 0, maxMarks: 0, count: 0 };
    }
    acc[subjectName].totalMarks += result.marks || 0;
    acc[subjectName].maxMarks += result.examId?.maxMarks || 0;
    acc[subjectName].count++;
    return acc;
  }, {});

  const subjectPerformance = Object.entries(performanceBySubject).map(([subject, data]: [string, any]) => ({
    subject,
    percentage: data.maxMarks > 0 ? ((data.totalMarks / data.maxMarks) * 100).toFixed(1) : '0',
    totalStudents: data.count
  }));

  const totalMarks = results.reduce((sum, r) => sum + (r.marks || 0), 0);
  const totalMaxMarks = results.reduce((sum, r) => sum + (r.examId?.maxMarks || 0), 0);
  const averagePerformance = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;

  return {
    averagePerformance: Math.round(averagePerformance * 100) / 100,
    totalExams: exams.length,
    totalResults: results.length,
    subjectPerformance,
    gradeDistribution: getGradeDistribution(results)
  };
}

function getGradeDistribution(results: any[]) {
  const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  
  results.forEach(result => {
    if (result.examId?.maxMarks) {
      const percentage = (result.marks / result.examId.maxMarks) * 100;
      if (percentage >= 90) distribution.A++;
      else if (percentage >= 80) distribution.B++;
      else if (percentage >= 70) distribution.C++;
      else if (percentage >= 60) distribution.D++;
      else distribution.F++;
    }
  });

  return distribution;
}

async function getFeeAnalytics(startDate: Date) {
  const feePayments = await FeePayment.find({
    createdAt: { $gte: startDate }
  }).lean();

  const totalCollected = feePayments.filter(f => f.status === 'PAID').reduce((sum, f) => sum + f.amount, 0);
  const totalPending = feePayments.filter(f => f.status === 'PENDING').reduce((sum, f) => sum + f.amount, 0);
  const totalOverdue = feePayments.filter(f => f.status === 'OVERDUE').reduce((sum, f) => sum + f.amount, 0);

  const monthlyCollection = feePayments.reduce((acc: any, payment) => {
    const month = payment.createdAt.toISOString().substring(0, 7);
    if (!acc[month]) {
      acc[month] = { collected: 0, pending: 0, overdue: 0 };
    }
    if (payment.status === 'PAID') acc[month].collected += payment.amount;
    else if (payment.status === 'PENDING') acc[month].pending += payment.amount;
    else if (payment.status === 'OVERDUE') acc[month].overdue += payment.amount;
    return acc;
  }, {});

  const totalAmount = totalCollected + totalPending + totalOverdue;
  const collectionRate = totalAmount > 0 ? ((totalCollected / totalAmount) * 100).toFixed(1) : '0';

  return {
    totalCollected,
    totalPending,
    totalOverdue,
    collectionRate,
    monthlyCollection: Object.entries(monthlyCollection).map(([month, data]: [string, any]) => ({
      month,
      ...data
    }))
  };
}

async function getEnrollmentTrends(startDate: Date) {
  const students = await Student.find({
    createdAt: { $gte: startDate }
  })
    .populate('gradeId', 'level')
    .lean();

  const enrollmentByMonth = students.reduce((acc: any, student) => {
    const month = student.createdAt.toISOString().substring(0, 7);
    if (!acc[month]) {
      acc[month] = { male: 0, female: 0, total: 0 };
    }
    acc[month][student.sex.toLowerCase()]++;
    acc[month].total++;
    return acc;
  }, {});

  return {
    totalNewEnrollments: students.length,
    monthlyTrends: Object.entries(enrollmentByMonth).map(([month, data]: [string, any]) => ({
      month,
      ...data
    }))
  };
}

async function getUpcomingExams() {
  const upcomingExams = await Exam.find({
    examDate: { $gte: new Date() },
    status: 'SCHEDULED'
  })
    .populate('subjectId', 'name')
    .populate('gradeId', 'level')
    .sort({ examDate: 1 })
    .limit(5)
    .lean();

  return upcomingExams.map(exam => ({
    id: exam._id,
    title: exam.title,
    subject: exam.subjectId?.name || 'Unknown Subject',
    grade: exam.gradeId?.level || 'Unknown Grade',
    date: exam.examDate,
    maxMarks: exam.maxMarks,
    duration: exam.duration
  }));
}

async function getRecentEvents() {
  const recentEvents = await Event.find({
    startTime: { $gte: new Date() }
  })
    .sort({ startTime: 1 })
    .limit(5)
    .lean();

  return recentEvents.map(event => ({
    id: event._id,
    title: event.title,
    description: event.description,
    startTime: event.startTime,
    endTime: event.endTime
  }));
}