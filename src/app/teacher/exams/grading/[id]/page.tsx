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
  Save,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export default function ExamGradingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const examId = params.id;

  const [exam, setExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchExamDetails();
    fetchStudents();
  }, [examId]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

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

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/teacher/exams/${examId}/students`);

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data.students);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load students",
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

  const saveGrades = async () => {
    try {
      setIsSubmitting(true);
      setSaveSuccess(false);

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
        description: "Grades saved successfully",
      });

      setSaveSuccess(true);
    } catch (error) {
      console.error('Error saving grades:', error);
      toast({
        title: "Error",
        description: "Failed to save grades",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to get initials from name
  const getInitials = (name: string, surname: string) => {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">Loading exam details...</div>
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
          <Button onClick={() => router.push('/teacher/exams')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exams
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
            onClick={() => router.push('/teacher/exams')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Exams
          </Button>
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <p className="text-muted-foreground">{exam.subject.name} • Class {exam.grade.level}</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={saveGrades}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-1" />
            Save Grades
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 mb-6">
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
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <Badge>
              {exam.examType.replace('_', ' ')}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {saveSuccess && (
        <Card className="mb-6 border-green-500 dark:border-green-600">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
              <div>
                <p className="font-medium">Grades saved successfully!</p>
                <p className="text-sm text-muted-foreground">
                  You can continue grading or view the complete exam report.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => router.push(`/teacher/exams/reports/${exam.id}`)}
              >
                View Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Grade Students</CardTitle>
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
          <CardDescription>
            Enter marks for each student or mark them as absent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-10">
              <AlertTriangle className="h-10 w-10 mx-auto text-amber-500 mb-3" />
              <p className="text-muted-foreground">No students found for this exam</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead className="text-center">Marks (out of {exam.maxMarks})</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-center">Attendance</TableHead>
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
                        <Input
                          className="w-20 text-center mx-auto"
                          type="number"
                          min="0"
                          max={exam.maxMarks}
                          value={student.isAbsent ? '' : (student.marks === null ? '' : student.marks)}
                          onChange={(e) => handleMarksChange(student.id, e.target.value)}
                          disabled={student.isAbsent}
                          placeholder={`0-${exam.maxMarks}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Optional remarks"
                          value={student.remarks || ''}
                          onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant={!student.isAbsent ? "default" : "outline"}
                            size="sm"
                            onClick={() => student.isAbsent && handleAbsentToggle(student.id)}
                            className="h-8 px-3"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Present
                          </Button>
                          <Button
                            variant={student.isAbsent ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => !student.isAbsent && handleAbsentToggle(student.id)}
                            className="h-8 px-3"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Absent
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button
              onClick={saveGrades}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Grades"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
