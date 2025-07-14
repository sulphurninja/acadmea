"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  ArrowLeft,
  Download,
  BarChart3,
  User,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Pencil,
  Save,
  AlertTriangle,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Exam = {
  id: number;
  title: string;
  description: string;
  examDate: string;
  subject: {
    id: number;
    name: string;
  };
  grade: {
    id: number;
    level: number;
    name: string;
  };
  maxMarks: number;
  duration: number;
  examType: string;
  status: string;
};

type Student = {
  id: string;
  name: string;
  surname: string;
  rollNo: string;
  img?: string;
  marks?: number | null;
  isAbsent?: boolean;
  remarks?: string;
};

export default function ExamReportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const examId = params.id;

  const [exam, setExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    highestMarks: 0,
    lowestMarks: 0,
    averageMarks: 0,
    totalStudents: 0,
    presentStudents: 0,
    absentStudents: 0,
    passedStudents: 0,
    failedStudents: 0,
    passPercentage: 0,
  });

  useEffect(() => {
    fetchExamDetails();
    fetchExamResults();
  }, [examId]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  useEffect(() => {
    if (students.length > 0) {
      calculateStats();
    }
  }, [students]);

  const fetchExamDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/teacher/exams/${examId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch exam details');
      }

      const data = await response.json();
      setExam(data);
    } catch (error) {
      console.error('Error fetching exam details:', error);
      toast({
        title: "Error",
        description: "Failed to load exam details",
        variant: "destructive",
      });
    }
  };

  const fetchExamResults = async () => {
    try {
      const response = await fetch(`/api/teacher/exams/${examId}/results`);

      if (!response.ok) {
        throw new Error('Failed to fetch exam results');
      }

      const data = await response.json();
      setStudents(data.students);
    } catch (error) {
      console.error('Error fetching exam results:', error);
      toast({
        title: "Error",
        description: "Failed to load exam results",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchLower) ||
        student.surname.toLowerCase().includes(searchLower) ||
        student.rollNo.toLowerCase().includes(searchLower)
      );
    }

    setFilteredStudents(filtered);
  };

  const calculateStats = () => {
    const presentStudents = students.filter(s => !s.isAbsent);
    const studentsWithMarks = presentStudents.filter(s => s.marks !== null && s.marks !== undefined);

    if (studentsWithMarks.length === 0) {
      setStats({
        highestMarks: 0,
        lowestMarks: 0,
        averageMarks: 0,
        totalStudents: students.length,
        presentStudents: presentStudents.length,
        absentStudents: students.length - presentStudents.length,
        passedStudents: 0,
        failedStudents: 0,
        passPercentage: 0,
      });
      return;
    }

    const marks = studentsWithMarks.map(s => s.marks as number);
    const highest = Math.max(...marks);
    const lowest = Math.min(...marks);
    const total = marks.reduce((sum, mark) => sum + mark, 0);
    const average = total / marks.length;

    // Assuming passing marks is 33% of max marks
    const passingMarks = exam ? exam.maxMarks * 0.33 : 0;
    const passedStudents = studentsWithMarks.filter(s => (s.marks as number) >= passingMarks).length;
    const failedStudents = studentsWithMarks.length - passedStudents;
    const passPercentage = (passedStudents / studentsWithMarks.length) * 100;

    setStats({
      highestMarks: highest,
      lowestMarks: lowest,
      averageMarks: average,
      totalStudents: students.length,
      presentStudents: presentStudents.length,
      absentStudents: students.length - presentStudents.length,
      passedStudents,
      failedStudents,
      passPercentage,
    });
  };

  const handleMarksChange = (studentId: string, value: string) => {
    const numValue = value === '' ? null : Number(value);

    // Validate the marks (cannot exceed max marks)
    if (numValue !== null && exam && numValue > exam.maxMarks) {
      toast({
        title: "Invalid marks",
        description: `Marks cannot exceed maximum marks (${exam.maxMarks})`,
        variant: "destructive",
      });
      return;
    }

    setStudents(prev =>
      prev.map(student =>
        student.id === studentId
          ? { ...student, marks: numValue }
          : student
      )
    );
  };

  const handleAbsentToggle = (studentId: string) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId
          ? { ...student, isAbsent: !student.isAbsent, marks: student.isAbsent ? null : student.marks }
          : student
      )
    );
  };

  const handleRemarksChange = (studentId: string, value: string) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId
          ? { ...student, remarks: value }
          : student
      )
    );
  };

  const saveResults = async () => {
    try {
      setIsSubmitting(true);

      const resultsData = students.map(student => ({
        studentId: student.id,
        marks: student.isAbsent ? null : student.marks,
        isAbsent: student.isAbsent || false,
        remarks: student.remarks || ''
      }));

      const response = await fetch(`/api/teacher/exams/${examId}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ results: resultsData })
      });

      if (!response.ok) {
        throw new Error('Failed to save exam results');
      }

      toast({
        title: "Success",
        description: "Exam results saved successfully",
      });

      setEditMode(false);
      fetchExamResults(); // Refresh data
    } catch (error) {
      console.error('Error saving exam results:', error);
      toast({
        title: "Error",
        description: "Failed to save exam results",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const publishResults = async () => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/teacher/exams/${examId}/publish`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to publish exam results');
      }

      toast({
        title: "Success",
        description: "Exam results published successfully",
      });

      setPublishConfirmOpen(false);
      fetchExamDetails(); // Refresh exam status
    } catch (error) {
      console.error('Error publishing exam results:', error);
      toast({
        title: "Error",
        description: "Failed to publish exam results",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGradeFromMarks = (marks: number | null | undefined, maxMarks: number): string => {
    if (marks === null || marks === undefined) return '-';

    const percentage = (marks / maxMarks) * 100;

    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 33) return 'D';
    return 'F';
  };

  const getStatusColor = (marks: number | null | undefined, maxMarks: number): string => {
    if (marks === null || marks === undefined) return '';

    const percentage = (marks / maxMarks) * 100;

    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 33) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Function to get initials from name
  const getInitials = (name: string, surname: string) => {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">Loading exam report...</div>
      </DashboardLayout>
    );
  }

  if (!exam) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">
          <AlertTriangle className="h-10 w-10 mx-auto text-amber-500 mb-3" />
          <h2 className="text-xl font-bold mb-2">Exam Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The exam you're looking for could not be found or you don't have permission to access it.
          </p>
          <Button onClick={() => router.push('/teacher/exams/reports')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exam Reports
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2"
            onClick={() => router.push('/teacher/exams/reports')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Reports
          </Button>
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <p className="text-muted-foreground">{exam.subject.name} • Class {exam.grade.level}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          {editMode ? (
            <>
              <Button
                variant="outline"
                onClick={() => setEditMode(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={saveResults}
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4 mr-1" />
                Save Results
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setEditMode(true)}
                disabled={exam.status === 'PUBLISHED'}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit Results
              </Button>
              <Button
                onClick={() => setPublishConfirmOpen(true)}
                disabled={exam.status === 'PUBLISHED'}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Publish Results
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{format(new Date(exam.examDate), 'dd MMM yyyy')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Maximum Marks</p>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{exam.maxMarks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Duration</p>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{exam.duration} min</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <Badge className="text-xs" variant={exam.status === 'PUBLISHED' ? 'success' : 'outline'}>
              {exam.status === 'PUBLISHED' ? 'Published' : 'Draft'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="results" className="mb-6">
        <TabsList>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Student Results</CardTitle>
               {/* // Continue from where we left off... */}

                <div className="mt-4 sm:mt-0 relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-10">
                  <User className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No students found for this exam</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Roll No</TableHead>
                        <TableHead className="text-center">Marks</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead>Remarks</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src={student.img || ''} alt={`${student.name} ${student.surname}`} />
                                <AvatarFallback>{getInitials(student.name, student.surname)}</AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{student.name} {student.surname}</div>
                            </div>
                          </TableCell>
                          <TableCell>{student.rollNo}</TableCell>
                          <TableCell className="text-center">
                            {editMode ? (
                              <Input
                                className="w-20 text-center mx-auto"
                                type="number"
                                min="0"
                                max={exam.maxMarks}
                                value={student.isAbsent ? '' : (student.marks === null ? '' : student.marks)}
                                onChange={(e) => handleMarksChange(student.id, e.target.value)}
                                disabled={student.isAbsent}
                              />
                            ) : (
                              <div className={getStatusColor(student.marks, exam.maxMarks)}>
                                {student.isAbsent ? '-' : (student.marks === null ? 'Not graded' : student.marks)}
                                {student.marks !== null && !student.isAbsent && <span className="text-muted-foreground">/{exam.maxMarks}</span>}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className={getStatusColor(student.marks, exam.maxMarks)}>
                              {getGradeFromMarks(student.marks, exam.maxMarks)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {editMode ? (
                              <Input
                                placeholder="Optional remarks"
                                value={student.remarks || ''}
                                onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                              />
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                {student.remarks || '-'}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {editMode ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAbsentToggle(student.id)}
                              >
                                {student.isAbsent ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                              </Button>
                            ) : (
                              <Badge variant={student.isAbsent ? "destructive" : "success"}>
                                {student.isAbsent ? "Absent" : "Present"}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Pass Percentage</p>
                    <div className="flex items-center gap-2">
                      <Progress value={stats.passPercentage} className="h-2" />
                      <span className="text-sm font-medium">{stats.passPercentage.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Highest Marks</p>
                      <p className="text-2xl font-bold">{stats.highestMarks}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Average Marks</p>
                      <p className="text-2xl font-bold">{stats.averageMarks.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Lowest Marks</p>
                      <p className="text-2xl font-bold">{stats.lowestMarks}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Passing Marks</p>
                      <p className="text-2xl font-bold">{(exam.maxMarks * 0.33).toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold">{stats.totalStudents}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Present</p>
                    <p className="text-2xl font-bold">{stats.presentStudents}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Absent</p>
                    <p className="text-2xl font-bold">{stats.absentStudents}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Attendance</p>
                    <p className="text-2xl font-bold">
                      {stats.totalStudents ? ((stats.presentStudents / stats.totalStudents) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium text-muted-foreground">Pass / Fail</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.passedStudents} / {stats.failedStudents}
                    </p>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${stats.presentStudents ? (stats.passedStudents / stats.presentStudents) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirm Publish Dialog */}
      <Dialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Exam Results</DialogTitle>
            <DialogDescription>
              Are you sure you want to publish the results for this exam? Once published, students will be able to view their grades and the results cannot be modified.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={publishResults}
              disabled={isSubmitting}
            >
              Publish Results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
