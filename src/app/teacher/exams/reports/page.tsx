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
  FileText,
  Calendar,
  BarChart3,
  User,
  CheckCircle,
  Download,
  Filter,
  GraduationCap
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

type Class = {
  id: string;
  name: string;
};

type Subject = {
  id: number;
  name: string;
};

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
  };
  maxMarks: number;
  duration: number;
  examType: string;
  status: string;
  gradedCount?: number;
  totalStudents?: number;
};

export default function TeacherExamReports() {
  const router = useRouter();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchExams();
  }, [selectedClassFilter, selectedSubjectFilter, selectedStatusFilter]);

  useEffect(() => {
    filterExams();
  }, [exams, searchTerm]);

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

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/teacher/subjects');
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }
      const data = await response.json();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast({
        title: "Error",
        description: "Failed to load subjects",
        variant: "destructive",
      });
    }
  };

  const fetchExams = async () => {
    try {
      setIsLoading(true);
      let url = '/api/teacher/exams/reports?';

      if (selectedClassFilter !== 'all') {
        url += `classId=${selectedClassFilter}&`;
      }

      if (selectedSubjectFilter !== 'all') {
        url += `subjectId=${selectedSubjectFilter}&`;
      }

      if (selectedStatusFilter !== 'all') {
        url += `status=${selectedStatusFilter}&`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch exam reports');
      }

      const data = await response.json();
      setExams(data);
    } catch (error) {
      console.error('Error fetching exam reports:', error);
      toast({
        title: "Error",
        description: "Failed to load exam reports",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterExams = () => {
    let filtered = [...exams];

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(exam =>
        exam.title.toLowerCase().includes(searchLower) ||
        exam.description?.toLowerCase().includes(searchLower) ||
        exam.subject.name.toLowerCase().includes(searchLower)
      );
    }

    setFilteredExams(filtered);
  };

  const handleViewReport = (examId: number) => {
    router.push(`/teacher/exams/reports/${examId}`);
  };

  const getExamTypeBadge = (type: string) => {
    switch (type) {
      case "UNIT_TEST":
        return { label: "Unit Test", variant: "secondary" };
      case "MIDTERM":
        return { label: "Midterm", variant: "primary" };
      case "FINAL":
        return { label: "Final", variant: "default" };
      case "QUIZ":
        return { label: "Quiz", variant: "outline" };
      case "ASSIGNMENT":
        return { label: "Assignment", variant: "secondary" };
      default:
        return { label: type, variant: "outline" };
    }
  };

  const getGradingStatusBadge = (exam: Exam) => {
    if (!exam.gradedCount || !exam.totalStudents) {
      return { variant: "outline", label: "Not Started" };
    }

    if (exam.gradedCount === 0) {
      return { variant: "destructive", label: "Not Started" };
    }

    if (exam.gradedCount < exam.totalStudents) {
      return { variant: "warning", label: "In Progress" };
    }

    return { variant: "success", label: "Completed" };
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Exam Reports</h1>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter exams by class, subject and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search exams..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-filter">Class</Label>
              <Select
                value={selectedClassFilter}
                onValueChange={setSelectedClassFilter}
              >
                <SelectTrigger id="class-filter">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject-filter">Subject</Label>
              <Select
                value={selectedSubjectFilter}
                onValueChange={setSelectedSubjectFilter}
              >
                <SelectTrigger id="subject-filter">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={selectedStatusFilter}
                onValueChange={setSelectedStatusFilter}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="ONGOING">Ongoing</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Exam Results & Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10">Loading exams...</div>
          ) : filteredExams.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No exam reports found</p>
              {(searchTerm || selectedClassFilter !== 'all' || selectedSubjectFilter !== 'all' || selectedStatusFilter !== 'all') && (
                <p className="text-xs text-muted-foreground mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Grading Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => {
                  const typeBadge = getExamTypeBadge(exam.examType);
                  const gradingStatusBadge = getGradingStatusBadge(exam);
                  const examDate = new Date(exam.examDate);
                  const gradingProgress = exam.totalStudents
                    ? Math.round((exam.gradedCount || 0) / exam.totalStudents * 100)
                    : 0;

                  return (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.title}</TableCell>
                      <TableCell>{exam.subject.name}</TableCell>
                      <TableCell>Class {exam.grade.level}</TableCell>
                      <TableCell>{format(examDate, 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={typeBadge.variant as any} className="capitalize">
                          {typeBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 w-32">
                          <Badge variant={gradingStatusBadge.variant as any} className="mb-1 w-fit">
                            {gradingStatusBadge.label}
                          </Badge>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Progress value={gradingProgress} className="h-2" />
                            <span>{gradingProgress}%</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReport(exam.id)}
                          disabled={exam.status === 'SCHEDULED'}
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          View Report
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
