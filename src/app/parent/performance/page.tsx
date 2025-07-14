"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

type Child = {
  id: string;
  name: string;
  rollNo: string;
  className: string;
  grade: string;
};

type ExamResult = {
  examTitle: string;
  examType: string;
  examDate: string;
  marks: number;
  maxMarks: number;
  percentage: number;
  isAbsent: boolean;
  remarks?: string;
};

type SubjectPerformance = {
  subjectName: string;
  results: ExamResult[];
  averagePercentage: number;
  totalMarks: number;
  totalMaxMarks: number;
};

type UpcomingExam = {
  title: string;
  subject: string;
  date: string;
  maxMarks: number;
  duration: number;
  examType: string;
};

type PerformanceData = {
  child: Child;
  statistics: {
    totalExams: number;
    completedExams: number;
    overallPercentage: number;
    totalSubjects: number;
  };
  subjectPerformance: SubjectPerformance[];
  upcomingExams: UpcomingExam[];
};

export default function ParentPerformance() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchPerformanceData();
    }
  }, [selectedChild]);

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

  const fetchPerformanceData = async () => {
    if (!selectedChild) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/parent/children/${selectedChild}/performance`);
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }

      const data = await response.json();
      setPerformanceData(data);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast({
        title: "Error",
        description: "Failed to load performance data",
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

  const exportToCSV = () => {
    if (!performanceData) return;

    const csvContent = [
      ['Subject', 'Exam', 'Date', 'Marks', 'Max Marks', 'Percentage', 'Grade'],
      ...performanceData.subjectPerformance.flatMap(subject =>
        subject.results.map(result => [
          subject.subjectName,
          result.examTitle,
          new Date(result.examDate).toLocaleDateString(),
          result.marks.toString(),
          result.maxMarks.toString(),
          result.percentage.toString(),
          getGradeLetter(result.percentage)
        ])
      )
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance_${performanceData.child.name}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Academic Performance</h1>
        <Button
          variant="outline"
          className="mt-4 sm:mt-0"
          onClick={exportToCSV}
          disabled={!performanceData}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Child</CardTitle>
          <CardDescription>Choose a child to view their academic performance</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-full md:w-[300px]">
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
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-10">Loading performance data...</div>
      ) : performanceData ? (
        <>
          <div className="grid gap-6 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.statistics.totalExams}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.statistics.completedExams}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Overall Percentage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getGradeColor(performanceData.statistics.overallPercentage)}`}>
                  {performanceData.statistics.overallPercentage}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Grade: {getGradeLetter(performanceData.statistics.overallPercentage)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.statistics.totalSubjects}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="subjects">
            <TabsList>
              <TabsTrigger value="subjects">Subject Performance</TabsTrigger>
              <TabsTrigger value="exams">Upcoming Exams</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Results</TabsTrigger>
            </TabsList>

            <TabsContent value="subjects">
              <Card>
                <CardHeader>
                  <CardTitle>Subject-wise Performance</CardTitle>
                  <CardDescription>
                    Performance breakdown by subject
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performanceData.subjectPerformance.map((subject) => (
                      <div key={subject.subjectName} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold">{subject.subjectName}</h3>
                          <Badge className={getGradeColor(subject.averagePercentage)}>
                            {subject.averagePercentage}% ({getGradeLetter(subject.averagePercentage)})
                          </Badge>
                        </div>
                        <Progress value={subject.averagePercentage} className="mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {subject.results.length} exams completed
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="exams">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Exams</CardTitle>
                  <CardDescription>
                    Scheduled exams for {performanceData.child.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Exam</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Max Marks</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {performanceData.upcomingExams.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No upcoming exams
                          </TableCell>
                        </TableRow>
                      ) : (
                        performanceData.upcomingExams.map((exam, index) => (
                          <TableRow key={index}>
                            <TableCell>{exam.subject}</TableCell>
                            <TableCell>{exam.title}</TableCell>
                            <TableCell>{new Date(exam.date).toLocaleDateString()}</TableCell>
                            <TableCell>{exam.duration} min</TableCell>
                            <TableCell>{exam.maxMarks}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{exam.examType}</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="detailed">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Results</CardTitle>
                  <CardDescription>
                    All exam results for {performanceData.child.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {performanceData.subjectPerformance.map((subject) => (
                      <div key={subject.subjectName}>
                        <h3 className="font-semibold mb-3">{subject.subjectName}</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Exam</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Marks</TableHead>
                              <TableHead>Percentage</TableHead>
                              <TableHead>Grade</TableHead>
                              <TableHead>Remarks</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subject.results.map((result, index) => (
                              <TableRow key={index}>
                                <TableCell>{result.examTitle}</TableCell>
                                <TableCell>{new Date(result.examDate).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  {result.isAbsent ? 'Absent' : `${result.marks}/${result.maxMarks}`}
                                </TableCell>
                                <TableCell className={getGradeColor(result.percentage)}>
                                  {result.isAbsent ? '-' : `${result.percentage}%`}
                                </TableCell>
                                <TableCell>
                                  {result.isAbsent ? '-' : (
                                    <Badge className={getGradeColor(result.percentage)}>
                                      {getGradeLetter(result.percentage)}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>{result.remarks || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              Select a child to view their academic performance
            </p>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
