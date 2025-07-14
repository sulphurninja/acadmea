import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';
import FeeStructure from '@/models/FeeStructure';
import FeePayment from '@/models/FeePayment';
import Grade from '@/models/Grade';

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

      // Get all children of this parent
      const children = await Student.find({ parentId })
        .populate('gradeId', 'level name')
        .select('name surname rollNo gradeId classId');

      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}-${currentYear + 1}`;

      const childrenWithFees = await Promise.all(
        children.map(async (child) => {
          // Get fee structure for this child's grade
          const feeStructure = await FeeStructure.findOne({
            gradeId: child.gradeId,
            academicYear
          });

          // Get all payments for this child
          const payments = await FeePayment.find({
            studentId: child._id,
            academicYear
          }).sort({ paymentDate: -1 });

          // Calculate totals
          const totalFees = feeStructure ?
            feeStructure.tuitionFee + feeStructure.admissionFee + feeStructure.examFee +
            feeStructure.libraryFee + feeStructure.sportsFee + feeStructure.miscFee : 0;

          const totalPaid = payments.reduce((sum, payment) =>
            payment.status === 'PAID' ? sum + payment.amount : sum, 0
          );

          const pendingAmount = totalFees - totalPaid;

          // Get pending/overdue payments
          const pendingPayments = payments.filter(payment =>
            payment.status === 'PENDING' || payment.status === 'OVERDUE'
          );

          const overduePayments = payments.filter(payment =>
            payment.status === 'OVERDUE'
          );

          return {
            childId: child._id,
            childName: `${child.name} ${child.surname}`,
            rollNo: child.rollNo,
            grade: child.gradeId?.name,
            feeStructure: feeStructure ? {
              tuitionFee: feeStructure.tuitionFee,
              admissionFee: feeStructure.admissionFee,
              examFee: feeStructure.examFee,
              libraryFee: feeStructure.libraryFee,
              sportsFee: feeStructure.sportsFee,
              miscFee: feeStructure.miscFee,
              totalFees,
              dueDate: feeStructure.dueDate
            } : null,
            paymentSummary: {
              totalFees,
              totalPaid,
              pendingAmount,
              pendingPayments: pendingPayments.length,
              overduePayments: overduePayments.length
            },
            recentPayments: payments.slice(0, 5),
            upcomingDues: pendingPayments.filter(payment =>
              new Date(payment.dueDate) > new Date()
            ),
            overdueDues: overduePayments
          };
        })
      );

      return NextResponse.json({
        academicYear,
        children: childrenWithFees,
        summary: {
          totalChildren: children.length,
          totalPendingAmount: childrenWithFees.reduce((sum, child) =>
            sum + child.paymentSummary.pendingAmount, 0
          ),
          totalOverduePayments: childrenWithFees.reduce((sum, child) =>
            sum + child.paymentSummary.overduePayments, 0
          )
        }
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching fees:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
