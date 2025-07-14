"use client";
import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Child = {
  id: string;
  name: string;
  rollNo: string;
  className: string;
};

type AttendanceRecord = {
  _id: string;
  date: string;
  status: string;
  notes?: string;
};

type AttendanceStats = {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendanceRate: number;
};

type AttendanceData = {
  child: Child;
  statistics: AttendanceStats;
  records: AttendanceRecord[];
  chartData: any[];
};

export default function ParentAttendance() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchAttendanceData();
    }
  }, [selectedChild, dateRange]);

  const fetchChildren = async () => {
    try {
      const response = await fetch('/api/parent/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch children');
      }
      const data = await response.json();
      setChildren(data.children);
      if (data.children.length > 0) {
        setSelectedChild(data.children[0].id);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      toast({
        title: "Error",
        description: "Failed to load children data",
        variant: "destructive",
      });
    }
  };

  const fetchAttendanceData = async () => {
    if (!selectedChild) return;

    try {
      setIsLoading(true);
      let url = `/api/parent/children/${selectedChild}/attendance?`;

      if (dateRange.from) {
        url += `startDate=${dateRange.from.toISOString()}&`;
      }
      if (dateRange.to) {
        url += `endDate=${dateRange.to.toISOString()}&`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }

      const data = await response.json();
      setAttendanceData(data);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case 'ABSENT':
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
      case 'LATE':
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>;
      case 'EXCUSED':
        return <Badge className="bg-blue-100 text-blue-800">Excused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const exportToCSV = () => {
    if (!attendanceData) return;

    const csvContent = [
      ['Date', 'Status', 'Notes'],
      ...attendanceData.records.map(record => [
        format(new Date(record.date), 'yyyy-MM-dd'),
        record.status,
        record.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${attendanceData.child.name}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Attendance Tracking</h1>
        <Button
          variant="outline"
          className="mt-4 sm:mt-0"
          onClick={exportToCSV}
          disabled={!attendanceData}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Select child and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium leading-none mb-2 block">
                Child
              </label>
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a child" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name} - {child.className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium leading-none mb-2 block">
                Date Range
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-10">Loading attendance data...</div>
      ) : attendanceData ? (
        <>
          <div className="grid gap-6 md:grid-cols-5 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceData.statistics.totalDays}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Present</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceData.statistics.presentDays}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">Absent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceData.statistics.absentDays}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600">Late</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceData.statistics.lateDays}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceData.statistics.attendanceRate}%</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                Daily attendance for {attendanceData.child.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData.records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendanceData.records.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>{record.notes || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              Select a child to view attendance records
            </p>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
