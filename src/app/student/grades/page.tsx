"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Award, TrendingUp, Target, BookOpen,
  Download, Filter, Calendar
} from "lucide-react";

type Grade = {
  subject: string;
  subjectId: string;
  assignments: Array<{
    title: string;
    grade: number;
    maxGrade: number;
    date: string;
    type: 'assignment' | 'quiz' | 'exam';
  }>;
  currentGrade: string;
  percentage: number;
  credits: number;
  teacher: string;
};

type Semester = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

export default function StudentGrades() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('current');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    if (selectedSemester) {
      fetchGrades();
    }
  }, [selectedSemester]);

  const fetchSemesters = async () => {
    try {
      const response = await fetch('/api/student/semesters');
      if (response.ok) {
        const data = await response.json();
        setSemesters(data);

        // Set current semester as default
        const currentSemester = data.find((s: Semester) => s.isActive);
        if (currentSemester) {
          setSelectedSemester(currentSemester.id);
        }
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await fetch(`/api/student/grades?semester=${selectedSemester}`);
      if (response.ok) {
        const data = await response.json();
        setGrades(data);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTranscript = async () => {
    try {
      const response = await fetch('/api/student/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          semester: selectedSemester,
          format: 'pdf'
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript-${selectedSemester}.pdf`;
        a.click();
      }
    } catch (error) {
      console.error('Error downloading transcript:', error);
    }
  };

  // Calculate overall stats
  const overallStats = {
    gpa: grades.length > 0
      ? grades.reduce((sum, grade) => {
          const gradePoints =
            grade.currentGrade === 'A+' ? 10 :
            grade.currentGrade === 'A' ? 9 :
            grade.currentGrade === 'B+' ? 8 :
            grade.currentGrade === 'B' ? 7 :
            grade.currentGrade === 'C+' ? 6 :
            grade.currentGrade === 'C' ? 5 :
            grade.currentGrade === 'D' ? 4 : 0;
          return sum + (gradePoints * grade.credits);
        }, 0) / grades.reduce((sum, grade) => sum + grade.credits, 0)
      : 0,
    totalCredits: grades.reduce((sum, grade) => sum + grade.credits, 0),
    averagePercentage: grades.length > 0
      ? grades.reduce((sum, grade) => sum + grade.percentage, 0) / grades.length
      : 0,
    totalAssignments: grades.reduce((sum, grade) => sum + grade.assignments.length, 0)
  };

  // Data for charts
  const subjectChartData = grades.map(grade => ({
    subject: grade.subject.substring(0, 8),
    percentage: grade.percentage,
    credits: grade.credits
  }));

  const gradeDistribution = grades.reduce((acc, grade) => {
    const gradeKey = grade.currentGrade;
    acc[gradeKey] = (acc[gradeKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(gradeDistribution).map(([grade, count]) => ({
    name: grade,
    value: count
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Grades</h1>
          <p className="text-muted-foreground">Track your academic performance and progress</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((semester) => (
                <SelectItem key={semester.id} value={semester.id}>
                  {semester.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={downloadTranscript} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Transcript
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">GPA</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.gpa.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Out of 10.0
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.averagePercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Across all subjects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Credits</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalCredits}</div>
            <p className="text-xs text-muted-foreground">
              Total credits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
<div className="text-2xl font-bold">{overallStats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Completed
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">By Subject</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Subject Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Grade Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subjects">
          <div className="space-y-4">
            {grades.map((grade) => (
              <Card key={grade.subjectId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{grade.subject}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          grade.percentage >= 90 ? "default" :
                          grade.percentage >= 75 ? "secondary" :
                          grade.percentage >= 60 ? "outline" : "destructive"
                        }
                      >
                        {grade.currentGrade}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {grade.credits} credits
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Current Grade</span>
                      <span className="font-bold">{grade.percentage}%</span>
                    </div>
                    <Progress value={grade.percentage} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Teacher: {grade.teacher}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Recent Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {grades.flatMap(grade =>
                  grade.assignments.map(assignment => ({
                    ...assignment,
                    subject: grade.subject
                  }))
                )
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map((assignment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{assignment.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {assignment.subject} • {new Date(assignment.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={
                            assignment.type === 'exam' ? 'bg-red-100 text-red-800' :
                            assignment.type === 'quiz' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }
                        >
                          {assignment.type}
                        </Badge>
                        <span className="font-bold">
                          {assignment.grade}/{assignment.maxGrade}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {Math.round((assignment.grade / assignment.maxGrade) * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={subjectChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="percentage" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Strengths & Improvements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-green-600 mb-2">Strong Subjects</h4>
                    {grades
                      .filter(g => g.percentage >= 80)
                      .map(grade => (
                        <div key={grade.subjectId} className="flex justify-between items-center py-1">
                          <span className="text-sm">{grade.subject}</span>
                          <span className="text-sm font-medium text-green-600">{grade.percentage}%</span>
                        </div>
                      ))}
                  </div>

                  <div>
                    <h4 className="font-medium text-yellow-600 mb-2">Needs Attention</h4>
                    {grades
                      .filter(g => g.percentage < 70)
                      .map(grade => (
                        <div key={grade.subjectId} className="flex justify-between items-center py-1">
                          <span className="text-sm">{grade.subject}</span>
                          <span className="text-sm font-medium text-yellow-600">{grade.percentage}%</span>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
