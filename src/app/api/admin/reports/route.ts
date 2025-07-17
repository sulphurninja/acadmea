import { NextRequest, NextResponse } from 'next/server';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Parent from '@/models/Parent';
import Class from '@/models/Class';
import Grade from '@/models/Grade';
import Subject from '@/models/Subject';
import Attendance from '@/models/Attendance';
import ExamResult from '@/models/ExamResult';
import Exam from '@/models/Exam';
import FeePayment from '@/models/FeePayment';
import Event from '@/models/Event';
import connectToDatabase from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const gradeId = searchParams.get('gradeId');
    const classId = searchParams.get('classId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let reportData = {};

    switch (reportType) {
      case 'student-performance':
        reportData = await generateStudentPerformanceReport(gradeId, classId, startDate, endDate);
        break;
      case 'attendance':
        reportData = await generateAttendanceReport(gradeId, classId, startDate, endDate);
        break;
      case 'fee-collection':
        reportData = await generateFeeCollectionReport(gradeId, classId, startDate, endDate);
        break;
      case 'teacher-performance':
        reportData = await generateTeacherPerformanceReport(startDate, endDate);
        break;
      case 'exam-results':
        reportData = await generateExamResultsReport(gradeId, classId, startDate, endDate);
        break;
      case 'enrollment':
        reportData = await generateEnrollmentReport(startDate, endDate);
        break;
      default:
        reportData = await generateOverviewReport();
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

async function generateStudentPerformanceReport(gradeId?: string | null, classId?: string | null, startDate?: string | null, endDate?: string | null) {
  const filter: any = {};
  
  if (gradeId) filter.gradeId = parseInt(gradeId);
  if (classId) filter.classId = parseInt(classId);

  const students = await Student.find(filter)
    .populate('gradeId', 'level')
    .populate('classId', 'name')
    .lean();

  const examFilter: any = {};
  if (startDate && endDate) {
    examFilter.examDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const results = await ExamResult.find({
    studentId: { $in: students.map(s => s._id) }
  })
    .populate({
      path: 'examId',
      match: examFilter,
      populate: { path: 'subjectId', select: 'name' }
    })
    .lean();

  const performanceData = students.map(student => {
    const studentResults = results.filter(r => r.studentId === student._id && r.examId);
    const totalMarks = studentResults.reduce((sum, r) => sum + (r.marks || 0), 0);
    const totalMaxMarks = studentResults.reduce((sum, r) => sum + (r.examId?.maxMarks || 0), 0);
    const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;

    return {
      studentId: student._id,
      name: `${student.name} ${student.surname}`,
      grade: student.gradeId?.level,
      class: student.classId?.name,
      totalMarks,
      totalMaxMarks,
      percentage: Math.round(percentage * 100) / 100,
      examsTaken: studentResults.length,
      subjects: studentResults.map(r => ({
        subject: r.examId?.subjectId?.name,
        marks: r.marks,
        maxMarks: r.examId?.maxMarks
      }))
    };
  });

  return {
    title: 'Student Performance Report',
    totalStudents: students.length,
    averagePercentage: performanceData.length > 0 
      ? Math.round((performanceData.reduce((sum, s) => sum + s.percentage, 0) / performanceData.length) * 100) / 100
      : 0,
    topPerformers: performanceData.sort((a, b) => b.percentage - a.percentage).slice(0, 10),
    data: performanceData,
    generatedAt: new Date().toISOString()
  };
}

async function generateAttendanceReport(gradeId?: string | null, classId?: string | null, startDate?: string | null, endDate?: string | null) {
  const filter: any = {};
  
  if (gradeId) filter.gradeId = parseInt(gradeId);
  if (classId) filter.classId = parseInt(classId);

  const students = await Student.find(filter)
    .populate('gradeId', 'level')
    .populate('classId', 'name')
    .lean();

  const attendanceFilter: any = {
    studentId: { $in: students.map(s => s._id) }
  };

  if (startDate && endDate) {
    attendanceFilter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const attendanceRecords = await Attendance.find(attendanceFilter).lean();

  const attendanceData = students.map(student => {
    const records = attendanceRecords.filter(r => r.studentId === student._id);
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'PRESENT').length;
    const absentDays = records.filter(r => r.status === 'ABSENT').length;
    const lateDays = records.filter(r => r.status === 'LATE').length;
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      studentId: student._id,
      name: `${student.name} ${student.surname}`,
      grade: student.gradeId?.level,
      class: student.classId?.name,
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      attendancePercentage: Math.round(attendancePercentage * 100) / 100
    };
  });

  return {
    title: 'Attendance Report',
    totalStudents: students.length,
    averageAttendance: attendanceData.length > 0 
      ? Math.round((attendanceData.reduce((sum, s) => sum + s.attendancePercentage, 0) / attendanceData.length) * 100) / 100
      : 0,
    data: attendanceData,
    generatedAt: new Date().toISOString()
  };
}

async function generateFeeCollectionReport(gradeId?: string | null, classId?: string | null, startDate?: string | null, endDate?: string | null) {
  const filter: any = {};
  
  if (gradeId) filter.gradeId = parseInt(gradeId);
  if (classId) filter.classId = parseInt(classId);

  const students = await Student.find(filter)
    .populate('gradeId', 'level')
    .populate('classId', 'name')
    .lean();

  const feeFilter: any = {
    studentId: { $in: students.map(s => s._id) }
  };

  if (startDate && endDate) {
    feeFilter.paymentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const feePayments = await FeePayment.find(feeFilter).lean();

  const totalCollected = feePayments.filter(f => f.status === 'PAID').reduce((sum, f) => sum + f.amount, 0);
  const totalPending = feePayments.filter(f => f.status === 'PENDING').reduce((sum, f) => sum + f.amount, 0);
  const totalOverdue = feePayments.filter(f => f.status === 'OVERDUE').reduce((sum, f) => sum + f.amount, 0);

  return {
    title: 'Fee Collection Report',
    totalStudents: students.length,
    totalCollected,
    totalPending,
    totalOverdue,
    collectionPercentage: Math.round(((totalCollected / (totalCollected + totalPending + totalOverdue)) * 100) * 100) / 100,
    data: feePayments,
    generatedAt: new Date().toISOString()
  };
}

async function generateTeacherPerformanceReport(startDate?: string | null, endDate?: string | null) {
  const teachers = await Teacher.find({})
    .populate('subjects', 'name')
    .populate('classId', 'name')
    .lean();

  const teacherData = teachers.map(teacher => ({
    teacherId: teacher._id,
    name: `${teacher.name} ${teacher.surname}`,
    subjects: teacher.subjects?.map((s: any) => s.name) || [],
    classes: teacher.classId?.map((c: any) => c.name) || [],
    totalClasses: teacher.classId?.length || 0,
    totalSubjects: teacher.subjects?.length || 0
  }));

  return {
    title: 'Teacher Performance Report',
    totalTeachers: teachers.length,
    data: teacherData,
    generatedAt: new Date().toISOString()
  };
}

async function generateExamResultsReport(gradeId?: string | null, classId?: string | null, startDate?: string | null, endDate?: string | null) {
  const examFilter: any = {};
  if (startDate && endDate) {
    examFilter.examDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  if (gradeId) examFilter.gradeId = parseInt(gradeId);

  const exams = await Exam.find(examFilter)
    .populate('subjectId', 'name')
    .populate('gradeId', 'level')
    .lean();

  const results = await ExamResult.find({
    examId: { $in: exams.map(e => e._id) }
  })
    .populate('studentId', 'name surname')
    .lean();

  const examResults = exams.map(exam => {
    const examResults = results.filter(r => r.examId === exam._id);
    const totalStudents = examResults.length;
    const passedStudents = examResults.filter(r => (r.marks / exam.maxMarks) * 100 >= 40).length;
    const averageMarks = totalStudents > 0 ? examResults.reduce((sum, r) => sum + (r.marks || 0), 0) / totalStudents : 0;

    return {
      examId: exam._id,
      title: exam.title,
      subject: exam.subjectId?.name,
      grade: exam.gradeId?.level,
      examDate: exam.examDate,
      maxMarks: exam.maxMarks,
      totalStudents,
      passedStudents,
      passPercentage: totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0,
      averageMarks: Math.round(averageMarks * 100) / 100
    };
  });

  return {
    title: 'Exam Results Report',
    totalExams: exams.length,
    data: examResults,
    generatedAt: new Date().toISOString()
  };
}

async function generateEnrollmentReport(startDate?: string | null, endDate?: string | null) {
  const filter: any = {};
  if (startDate && endDate) {
    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const [students, grades, classes] = await Promise.all([
    Student.find(filter).populate('gradeId', 'level').populate('classId', 'name').lean(),
    Grade.find({}).lean(),
    Class.find({}).populate('gradeId', 'level').lean()
  ]);

  const enrollmentByGrade = grades.map(grade => {
    const gradeStudents = students.filter(s => s.gradeId?.level === grade.level);
    return {
      grade: grade.level,
      totalStudents: gradeStudents.length,
      maleStudents: gradeStudents.filter(s => s.sex === 'MALE').length,
      femaleStudents: gradeStudents.filter(s => s.sex === 'FEMALE').length
    };
  });

  return {
    title: 'Enrollment Report',
    totalStudents: students.length,
    totalGrades: grades.length,
    totalClasses: classes.length,
    enrollmentByGrade,
    generatedAt: new Date().toISOString()
  };
}

async function generateOverviewReport() {
  const [students, teachers, parents, grades, classes, subjects] = await Promise.all([
    Student.countDocuments(),
    Teacher.countDocuments(),
    Parent.countDocuments(),
    Grade.countDocuments(),
    Class.countDocuments(),
    Subject.countDocuments()
  ]);

  return {
    title: 'School Overview Report',
    totalStudents: students,
    totalTeachers: teachers,
    totalParents: parents,
    totalGrades: grades,
    totalClasses: classes,
    totalSubjects: subjects,
    generatedAt: new Date().toISOString()
  };
}