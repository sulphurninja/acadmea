"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  BookOpen,
  Users,
  TrendingUp,
  Mail,
  Phone,
  MessageSquare,
  User,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ChildDetail = {
  id: string;
  name: string;
  rollNo: string;
  className: string;
  grade: string;
  img?: string;
};

type AttendanceStats = {
  attendanceRate: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
};

type PerformanceStats = {
  overallPercentage: number;
  totalExams: number;
  completedExams: number;
  totalSubjects: number;
};

type Teacher = {
  id: string;
  name: string;
  email: string;
  phone: string;
  img: string;
  subjects: string[];
  role: string;
};

type RecentExam = {
  subject: string;
  title: string;
  date: string;
  marks: number;
  maxMarks: number;
  percentage: number;
};

type ChildData = {
  child: ChildDetail;
  attendance: AttendanceStats;
  performance: PerformanceStats;
  teachers: Teacher[];
  recentExams: RecentExam[];
  upcomingExams: any[];
};

export default function ChildDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [childData, setChildData] = useState<ChildData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchChildData();
    }
  }, [id]);

  const fetchChildData = async () => {
    try {
      setIsLoading(true);

      // Fetch all data concurrently
      const [attendanceRes, performanceRes, teachersRes] = await Promise.all([
        fetch(`/api/parent/children/${id}/attendance`),
        fetch(`/api/parent/children/${id}/performance`),
        fetch(`/api/parent/children/${id}/teachers`)
      ]);

      if (!attendanceRes.ok || !performanceRes.ok || !teachersRes.ok) {
        throw new Error('Failed to fetch child data');
      }

      const [attendanceData, performanceData, teachersData] = await Promise.all([
        attendanceRes.json(),
        performanceRes.json(),
        teachersRes.json()
      ]);

      // Combine all data
      const combinedData: ChildData = {
        child: attendanceData.child,
        attendance: attendanceData.statistics,
        performance: performanceData.statistics,
        teachers: teachersData.teachers,
        recentExams: performanceData.subjectPerformance.flatMap((subject: any) =>
          subject.results.slice(0, 3).map((result: any) => ({
            subject: subject.subjectName,
            title: result.examTitle,
            date: result.examDate,
            marks: result.marks,
            maxMarks: result.maxMarks,
            percentage: result.percentage
          }))
        ).slice(0, 5),
        upcomingExams: performanceData.upcomingExams
      };

      setChildData(combinedData);
    } catch (error) {
      console.error('Error fetching child data:', error);
      toast({
        title: "Error",
        description: "Failed to load child data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-blue-600";
    if (percentage >= 60) return "text-yellow-600";
    if (percentage >= 33) return "text-orange-600";
    return "text-red-600";
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C+";
    if (percentage >= 40) return "C";
    if (percentage >= 33) return "D";
    return "F";
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <p>Loading child details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!childData) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <p>Failed to load child data</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/parent">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={childData.child.img} />
                <AvatarFallback className="text-lg">
                  {childData.child.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{childData.child.name}</CardTitle>
                <CardDescription className="text-lg">
                  {childData.child.grade} - {childData.child.className}
                </CardDescription>
                <Badge variant="outline" className="mt-2">
                  Roll No: {childData.child.rollNo}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{childData.attendance.attendanceRate}%</div>
            <Progress value={childData.attendance.attendanceRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Academic Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getGradeColor(childData.performance.overallPercentage)}`}>
              {childData.performance.overallPercentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              Grade: {getGradeLetter(childData.performance.overallPercentage)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{childData.performance.totalExams}</div>
            <p className="text-xs text-muted-foreground">
              {childData.performance.completedExams} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{childData.teachers.length}</div>
            <p className="text-xs text-muted-foreground">
              {childData.performance.totalSubjects} subjects
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Recent Exam Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {childData.recentExams.length === 0 ? (
                    <p className="text-muted-foreground">No recent exam results</p>
                  ) : (
                    childData.recentExams.map((exam, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium">{exam.subject}</p>
                          <p className="text-sm text-muted-foreground">{exam.title}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${getGradeColor(exam.percentage)}`}>
                            {exam.marks}/{exam.maxMarks}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {exam.percentage}% ({getGradeLetter(exam.percentage)})
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href="/parent/performance">View All Results</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Upcoming Exams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {childData.upcomingExams.length === 0 ? (
                    <p className="text-muted-foreground">No upcoming exams</p>
                  ) : (
                    childData.upcomingExams.slice(0, 5).map((exam, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium">{exam.subject}</p>
                          <p className="text-sm text-muted-foreground">{exam.title}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {new Date(exam.date).toLocaleDateString()}
                          </p>
                          <Badge variant="outline">{exam.examType}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>
                Monthly attendance overview for {childData.child.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {childData.attendance.presentDays}
                  </div>
                  <p className="text-sm text-muted-foreground">Present</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {childData.attendance.absentDays}
                  </div>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {childData.attendance.lateDays}
                  </div>
                  <p className="text-sm text-muted-foreground">Late</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {childData.attendance.totalDays}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Days</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/parent/attendance">View Detailed Attendance</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Academic Performance</CardTitle>
              <CardDescription>
                Performance summary for {childData.child.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getGradeColor(childData.performance.overallPercentage)}`}>
                    {childData.performance.overallPercentage}%
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Average</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {childData.performance.completedExams}
                  </div>
                  <p className="text-sm text-muted-foreground">Completed Exams</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {childData.performance.totalSubjects}
                  </div>
                  <p className="text-sm text-muted-foreground">Subjects</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/parent/performance">View Detailed Performance</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>Teachers</CardTitle>
              <CardDescription>
                Teachers for {childData.child.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {childData.teachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={teacher.img} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{teacher.name}</p>
                        <p className="text-sm text-muted-foreground">{teacher.role}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {teacher.subjects.map((subject, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`mailto:${teacher.email}`}>
                          <Mail className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`tel:${teacher.phone}`}>
                          <Phone className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/parent/teachers">View All Teachers</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
