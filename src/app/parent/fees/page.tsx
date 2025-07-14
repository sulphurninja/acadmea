"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download, CreditCard, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

type FeeStructure = {
  tuitionFee: number;
  admissionFee: number;
  examFee: number;
  libraryFee: number;
  sportsFee: number;
  miscFee: number;
  totalFees: number;
  dueDate: string;
};

type Payment = {
  _id: string;
  feeType: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: string;
  paymentMethod?: string;
  transactionId?: string;
  receiptNumber?: string;
  lateFee: number;
  discount: number;
  remarks?: string;
};

type ChildFeeData = {
  childId: string;
  childName: string;
  rollNo: string;
  grade: string;
  feeStructure: FeeStructure | null;
  paymentSummary: {
    totalFees: number;
    totalPaid: number;
    pendingAmount: number;
    pendingPayments: number;
    overduePayments: number;
  };
  recentPayments: Payment[];
  upcomingDues: Payment[];
  overdueDues: Payment[];
};

type FeesData = {
  academicYear: string;
  children: ChildFeeData[];
  summary: {
    totalChildren: number;
    totalPendingAmount: number;
    totalOverduePayments: number;
  };
};

export default function ParentFees() {
  const [feesData, setFeesData] = useState<FeesData | null>(null);
  const [selectedChild, setSelectedChild] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFeesData();
  }, []);

  const fetchFeesData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/parent/fees');

      if (!response.ok) {
        throw new Error('Failed to fetch fees data');
      }

      const data = await response.json();
      setFeesData(data);
    } catch (error) {
      console.error('Error fetching fees data:', error);
      toast({
        title: "Error",
        description: "Failed to load fees data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'OVERDUE':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handlePayment = (childId: string, paymentId: string) => {
    // In a real app, this would integrate with a payment gateway
    toast({
      title: "Payment Gateway",
      description: "Payment gateway integration would be implemented here",
    });
  };

  const exportFeesReport = () => {
    if (!feesData) return;

    const csvContent = [
      ['Child Name', 'Roll No', 'Grade', 'Total Fees', 'Total Paid', 'Pending Amount', 'Overdue Payments'],
      ...feesData.children.map(child => [
        child.childName,
        child.rollNo,
        child.grade,
        child.paymentSummary.totalFees.toString(),
        child.paymentSummary.totalPaid.toString(),
        child.paymentSummary.pendingAmount.toString(),
        child.paymentSummary.overduePayments.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fees_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredChildren = selectedChild === "all"
    ? feesData?.children || []
    : feesData?.children.filter(child => child.childId === selectedChild) || [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <p>Loading fees data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!feesData) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <p>Failed to load fees data</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fee Management</h1>
          <p className="text-muted-foreground">Academic Year: {feesData.academicYear}</p>
        </div>
        <Button variant="outline" onClick={exportFeesReport}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Children</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feesData.summary.totalChildren}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(feesData.summary.totalPendingAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Overdue Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feesData.summary.totalOverduePayments}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter by Child</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a child" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {feesData.children.map((child) => (
                <SelectItem key={child.childId} value={child.childId}>
                  {child.childName} - {child.grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {filteredChildren.map((child) => (
          <Card key={child.childId}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{child.childName}</CardTitle>
                  <CardDescription>
                    {child.grade} - Roll No: {child.rollNo}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Pending Amount</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(child.paymentSummary.pendingAmount)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="structure">Fee Structure</TabsTrigger>
                  <TabsTrigger value="payments">Payment History</TabsTrigger>
                  <TabsTrigger value="pending">Pending Dues</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold">
                        {formatCurrency(child.paymentSummary.totalFees)}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Fees</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(child.paymentSummary.totalPaid)}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Paid</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold text-yellow-600">
                        {child.paymentSummary.pendingPayments}
                      </div>
                      <p className="text-sm text-muted-foreground">Pending Payments</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold text-red-600">
                        {child.paymentSummary.overduePayments}
                      </div>
                      <p className="text-sm text-muted-foreground">Overdue Payments</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="structure" className="mt-4">
                  {child.feeStructure ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fee Type</TableHead>
                          <TableHead>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Tuition Fee</TableCell>
                          <TableCell>{formatCurrency(child.feeStructure.tuitionFee)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Admission Fee</TableCell>
                          <TableCell>{formatCurrency(child.feeStructure.admissionFee)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Exam Fee</TableCell>
                          <TableCell>{formatCurrency(child.feeStructure.examFee)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Library Fee</TableCell>
                          <TableCell>{formatCurrency(child.feeStructure.libraryFee)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Sports Fee</TableCell>
                          <TableCell>{formatCurrency(child.feeStructure.sportsFee)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Miscellaneous Fee</TableCell>
                          <TableCell>{formatCurrency(child.feeStructure.miscFee)}</TableCell>
                        </TableRow>
                        <TableRow className="font-bold">
                          <TableCell>Total</TableCell>
                          <TableCell>{formatCurrency(child.feeStructure.totalFees)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground">No fee structure found for this child</p>
                  )}
                </TabsContent>

                <TabsContent value="payments" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Fee Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Receipt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {child.recentPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No payment history
                          </TableCell>
                        </TableRow>
                      ) : (
                        child.recentPayments.map((payment) => (
                          <TableRow key={payment._id}>
                            <TableCell>
                              {payment.paymentDate
                                ? format(new Date(payment.paymentDate), 'MMM dd, yyyy')
                                : '-'
                              }
                            </TableCell>
                            <TableCell>{payment.feeType}</TableCell>
                            <TableCell>{formatCurrency(payment.amount)}</TableCell>
                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                            <TableCell>{payment.paymentMethod || '-'}</TableCell>
                            <TableCell>
                              {payment.receiptNumber ? (
                                <Button size="sm" variant="outline">
                                  <Download className="w-4 h-4 mr-1" />
                                  {payment.receiptNumber}
                                </Button>
                              ) : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="pending" className="mt-4">
                  <div className="space-y-4">
                    {child.upcomingDues.length === 0 && child.overdueDues.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No pending dues
                      </p>
                    ) : (
                      <>
                        {child.overdueDues.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-red-600 mb-2">Overdue Payments</h3>
                            <div className="space-y-2">
                              {child.overdueDues.map((payment) => (
                                <div key={payment._id} className="flex justify-between items-center p-3 border border-red-200 rounded">
                                  <div>
                                    <p className="font-medium">{payment.feeType}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Due: {format(new Date(payment.dueDate), 'MMM dd, yyyy')}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-red-600">
                                      {formatCurrency(payment.amount)}
                                    </p>
                                    <Button
                                      size="sm"
                                      className="mt-1"
                                      onClick={() => handlePayment(child.childId, payment._id)}
                                    >
                                      <CreditCard className="w-4 h-4 mr-1" />
                                      Pay Now
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {child.upcomingDues.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-yellow-600 mb-2">Upcoming Dues</h3>
                            <div className="space-y-2">
                              {child.upcomingDues.map((payment) => (
                                <div key={payment._id} className="flex justify-between items-center p-3 border border-yellow-200 rounded">
                                  <div>
                                    <p className="font-medium">{payment.feeType}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Due: {format(new Date(payment.dueDate), 'MMM dd, yyyy')}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-yellow-600">
                                      {formatCurrency(payment.amount)}
                                    </p>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mt-1"
                                      onClick={() => handlePayment(child.childId, payment._id)}
                                    >
                                      <CreditCard className="w-4 h-4 mr-1" />
                                      Pay Now
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
