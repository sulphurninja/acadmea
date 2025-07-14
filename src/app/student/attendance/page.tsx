"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Download, Check, X, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isSameMonth } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

type AttendanceSummary = {
  present: number;
  absent: number;
  late: number;
  leave: number;
  total: number;
};

type AttendanceRecord = {
  id: string;
  date: string;
  status: string;
  notes: string;
};

export default function StudentAttendance() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState(new Date());
  const [summary, setSummary] = useState<AttendanceSummary>({
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    total: 0
  });
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, [month]);

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);
      const monthNum = month.getMonth() + 1; // JavaScript months are 0-indexed
      const year = month.getFullYear();

      const response = await fetch(`/api/student/attendance?month=${monthNum}&year=${year}`);
      if (!response.ok) {
        throw new Error('Failed to fetch attendance');
      }

      const data = await response.json();
      setSummary(data.summary);
      setRecords(data.records);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance records",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'text-green-600';
      case 'ABSENT':
        return 'text-red-600';
      case 'LATE':
        return 'text-yellow-600';
      case 'EXCUSED':
        return 'text-blue-600';
      default:
        return '';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge className="bg-green-500">Present</Badge>;
      case 'ABSENT':
        return <Badge variant="destructive">Absent</Badge>;
      case 'LATE':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Late</Badge>;
      case 'EXCUSED':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Excused</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getAttendanceRate = () => {
    if (summary.total === 0) return 0;
    return Math.round((summary.present / summary.total) * 100);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Attendance Records</h1>
          <p className="text-muted-foreground">Monitor your attendance and performance</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{getAttendanceRate()}%</p>
            <Progress value={getAttendanceRate()} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Present</p>
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{summary.present}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.total > 0 ? `${Math.round((summary.present / summary.total) * 100)}% of total days` : 'No records'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Absent</p>
              <X className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold">{summary.absent}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.total > 0 ? `${Math.round((summary.absent / summary.total) * 100)}% of total days` : 'No records'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Late / Excused</p>
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold">{summary.late + summary.leave}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.total > 0 ? `${Math.round(((summary.late + summary.leave) / summary.total) * 100)}% of total days` : 'No records'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Attendance History</CardTitle>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(month, "MMMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    onMonthChange={setMonth}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <CardDescription>
              Your attendance records for {format(month, "MMMM yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-10">
                <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-1">No Records Found</h3>
                <p className="text-muted-foreground">
                  No attendance records available for {format(month, "MMMM yyyy")}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => {
                      const recordDate = new Date(record.date);
                      return (
                        <TableRow key={record.id}>
                          <TableCell>{format(recordDate, "dd MMM yyyy")}</TableCell>
                          <TableCell>{format(recordDate, "EEEE")}</TableCell>
                          <TableCell>
                            {getStatusBadge(record.status)}
                          </TableCell>
                          <TableCell>
                            {record.notes || <span className="text-muted-foreground text-sm">No notes</span>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>
              Monthly attendance summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-sm text-muted-foreground">Present</p>
                  <p className="text-sm font-medium text-green-600">{summary.present} days</p>
                </div>
                <Progress value={summary.total ? (summary.present / summary.total) * 100 : 0} className="h-2 bg-green-100" indicatorClassName="bg-green-600" />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-sm text-muted-foreground">Absent</p>
                  <p className="text-sm font-medium text-red-600">{summary.absent} days</p>
                </div>
                <Progress value={summary.total ? (summary.absent / summary.total) * 100 : 0} className="h-2 bg-red-100" indicatorClassName="bg-red-600" />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-sm text-muted-foreground">Late</p>
                  <p className="text-sm font-medium text-yellow-600">{summary.late} days</p>
                </div>
                <Progress value={summary.total ? (summary.late / summary.total) * 100 : 0} className="h-2 bg-yellow-100" indicatorClassName="bg-yellow-600" />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-sm text-muted-foreground">Excused</p>
                  <p className="text-sm font-medium text-blue-600">{summary.leave} days</p>
                </div>
                <Progress value={summary.total ? (summary.leave / summary.total) * 100 : 0} className="h-2 bg-blue-100" indicatorClassName="bg-blue-600" />
              </div>

              <div className="pt-4 border-t mt-6">
                <p className="text-sm font-medium mb-2">Attendance Statistics</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-md">
                    <p className="text-xs text-muted-foreground">Total School Days</p>
                    <p className="text-xl font-bold">{summary.total}</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-md">
                    <p className="text-xs text-muted-foreground">Attendance Rate</p>
                    <p className="text-xl font-bold">{getAttendanceRate()}%</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
