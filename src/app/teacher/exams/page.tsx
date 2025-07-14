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
  Clock,
  CheckCircle,
  X,
  CalendarRange,
  GraduationCap,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isAfter, isBefore, isToday } from "date-fns";
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
};

export default function TeacherExams() {
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
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchExams();
  }, [selectedClassFilter, selectedSubjectFilter]);

  useEffect(() => {
    filterExams();
  }, [exams, searchTerm, activeTab]);

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
      let url = '/api/teacher/exams?';

      if (selectedClassFilter !== 'all') {
        url += `classId=${selectedClassFilter}&`;
      }

      if (selectedSubjectFilter !== 'all') {
        url += `subjectId=${selectedSubjectFilter}&`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch exams');
      }

      const data = await response.json();
      setExams(data);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast({
        title: "Error",
        description: "Failed to load exams",
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

    // Filter by tab
    const now = new Date();
    if (activeTab === "upcoming") {
      filtered = filtered.filter(exam =>
        isAfter(new Date(exam.examDate), now)
      );
    } else if (activeTab === "today") {
      filtered = filtered.filter(exam =>
        isToday(new Date(exam.examDate))
      );
    } else if (activeTab === "past") {
      filtered = filtered.filter(exam =>
        isBefore(new Date(exam.examDate), now) || exam.status === 'COMPLETED'
      );
    }

    setFilteredExams(filtered);
  };

  const handleGradeExam = (examId: number) => {
    router.push(`/teacher/exams/grading/${examId}`);
  };

  const handleViewReport = (examId: number) => {
    router.push(`/teacher/exams/reports/${examId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return { variant: "outline", icon: Clock, label: "Scheduled" };
      case "ONGOING":
        return { variant: "warning", icon: AlertTriangle, label: "Ongoing" };
      case "COMPLETED":
        return { variant: "success", icon: CheckCircle, label: "Completed" };
      case "CANCELLED":
        return { variant: "destructive", icon: X, label: "Cancelled" };
      default:
        return { variant: "outline", icon: Clock, label: status };
    }
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

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Exams</h1>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter exams by class and subject
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
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
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="all">All Exams</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Exam List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10">Loading exams...</div>
          ) : filteredExams.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No {activeTab !== 'all' ? activeTab : ''} exams found
              </p>
              {(searchTerm || selectedClassFilter !== 'all' || selectedSubjectFilter !== 'all') && (
                <p className="text-xs text-muted-foreground mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => {
                  const statusBadge = getStatusBadge(exam.status);
                  const typeBadge = getExamTypeBadge(exam.examType);
                  const StatusIcon = statusBadge.icon;
                  const examDate = new Date(exam.examDate);
                  const isPast = isBefore(examDate, new Date());

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
                        <Badge variant={statusBadge.variant as any} className="capitalize flex items-center w-fit">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGradeExam(exam.id)}
                          >
                            <GraduationCap className="h-4 w-4 mr-1" />
                            Grade
                          </Button>

                          {(isPast || exam.status === 'COMPLETED') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewReport(exam.id)}
                            >
                              <CalendarRange className="h-4 w-4 mr-1" />
                              Report
                            </Button>
                          )}
                        </div>
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
