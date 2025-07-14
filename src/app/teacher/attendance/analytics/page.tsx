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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, PieChart, LineChart } from "@/components/charts";

type Class = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  name: string;
  rollNo: string;
  className: string;
  presentPercent: number;
  absentPercent: number;
  latePercent: number;
  excusedPercent: number;
};

type ClassAttendance = {
  id: string;
  name: string;
  presentPercent: number;
  absentPercent: number;
  latePercent: number;
  excusedPercent: number;
  total: number;
};

type DateAttendance = {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
};

type OverviewStats = {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
};

type AnalyticsData = {
  overview: OverviewStats;
  byClass: ClassAttendance[];
  byDate: DateAttendance[];
  byStudent: Student[];
};

export default function AttendanceAnalytics() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedClass, selectedStudent, dateRange]);

  useEffect(() => {
    if (selectedClass !== "all") {
      fetchStudentsForClass(selectedClass);
    } else {
      setStudents([]);
      setSelectedStudent("all");
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/teacher/classes');
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Failed to load classes",
        variant: "destructive",
      });
    }
  };

  const fetchStudentsForClass = async (classId: string) => {
    try {
      const response = await fetch(`/api/teacher/classes/${classId}/students`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    }
  };

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);

      let url = '/api/teacher/attendance/analytics?';

      if (selectedClass !== "all") {
        url += `classId=${selectedClass}&`;
      }

      if (selectedStudent !== "all") {
        url += `studentId=${selectedStudent}&`;
      }

      if (dateRange.from) {
        url += `startDate=${dateRange.from.toISOString()}&`;
      }

      if (dateRange.to) {
        url += `endDate=${dateRange.to.toISOString()}&`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalyticsData(data);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance analytics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!analyticsData) return;

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";

    // Headers
    csvContent += "Date,Class,Student,Status,Notes\n";

    // Add data rows - in a real app, you'd need to fetch the actual attendance records
    // This is just a placeholder
    csvContent += "Example data would go here\n";

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare chart data
  const pieChartData = analyticsData ? [
    { name: 'Present', value: analyticsData.overview.present, color: '#22c55e' },
    { name: 'Absent', value: analyticsData.overview.absent, color: '#ef4444' },
    { name: 'Late', value: analyticsData.overview.late, color: '#eab308' },
    { name: 'Excused', value: analyticsData.overview.excused, color: '#3b82f6' }
  ] : [];

  const barChartData = analyticsData?.byClass.map(cls => ({
    name: cls.name,
    Present: cls.presentPercent,
    Absent: cls.absentPercent,
    Late: cls.latePercent,
    Excused: cls.excusedPercent
  })) || [];

  const lineChartData = analyticsData?.byDate.map(day => ({
    name: format(new Date(day.date), 'MMM dd'),
    Present: day.present,
    Absent: day.absent,
    Late: day.late,
    Excused: day.excused
  })) || [];

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Attendance Analytics</h1>
        <Button
          variant="outline"
          className="mt-4 sm:mt-0"
          onClick={exportToCSV}
          disabled={!analyticsData}
        >
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Customize your attendance analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium leading-none mb-2 block">
                Class
              </label>
              <Select
                value={selectedClass}
                onValueChange={setSelectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium leading-none mb-2 block">
                Student
              </label>
              <Select
                value={selectedStudent}
                onValueChange={setSelectedStudent}
                disabled={selectedClass === "all" || students.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.name} {student.surname}
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
        <div className="text-center py-10">Loading analytics...</div>
      ) : analyticsData ? (
        <>
          <div className="grid gap-6 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">
                  Present
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.present}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.overview.total > 0
                    ? `${Math.round((analyticsData.overview.present / analyticsData.overview.total) * 100)}%`
                    : '0%'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">
                  Absent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.absent}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.overview.total > 0
                    ? `${Math.round((analyticsData.overview.absent / analyticsData.overview.total) * 100)}%`
                    : '0%'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600">
                  Late
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.late}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.overview.total > 0
                    ? `${Math.round((analyticsData.overview.late / analyticsData.overview.total) * 100)}%`
                    : '0%'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="mb-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="byClass">By Class</TabsTrigger>
              <TabsTrigger value="byDate">Trends</TabsTrigger>
              <TabsTrigger value="byStudent">Students</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Distribution</CardTitle>
                  <CardDescription>
                    Overall attendance breakdown for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <PieChart data={pieChartData} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="byClass" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance by Class</CardTitle>
                  <CardDescription>
                    Comparing attendance across different classes
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <BarChart data={barChartData} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="byDate" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trends</CardTitle>
                  <CardDescription>
                    Daily attendance patterns over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <LineChart data={lineChartData} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="byStudent" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Attendance</CardTitle>
                  <CardDescription>
                    Individual student attendance records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Present %</TableHead>
                        <TableHead>Absent %</TableHead>
                        <TableHead>Late %</TableHead>
                        <TableHead>Excused %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyticsData.byStudent.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No student data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        analyticsData.byStudent.map(student => (
                          <TableRow key={student.id}>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.className}</TableCell>
                            <TableCell className="text-green-600">{student.presentPercent}%</TableCell>
                            <TableCell className="text-red-600">{student.absentPercent}%</TableCell>
                            <TableCell className="text-yellow-600">{student.latePercent}%</TableCell>
                            <TableCell className="text-blue-600">{student.excusedPercent}%</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              Select filters above to view attendance analytics
            </p>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
