"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  FileText,
  Calendar,
  Clock,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isAfter, isBefore, isToday, addDays } from "date-fns";
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";

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
    name: string;
  };
  maxMarks: number;
  duration: number;
  examType: string;
  status: string;
};

export default function StudentExams() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedExamTypeFilter, setSelectedExamTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState("upcoming");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  useEffect(() => {
    fetchSubjects();
    fetchExams();
  }, []);

  useEffect(() => {
    filterExams();
  }, [exams, searchTerm, selectedSubjectFilter, selectedExamTypeFilter, activeTab, dateRange]);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/student/subjects');
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }
      const data = await response.json();
      setSubjects(data.subjects);
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
      const response = await fetch('/api/student/exams');
      if (!response.ok) {
        throw new Error('Failed to fetch exams');
      }

      const data = await response.json();
      setExams(data.exams);
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

    // Filter by subject
    if (selectedSubjectFilter !== 'all') {
      filtered = filtered.filter(exam =>
        exam.subject.id === parseInt(selectedSubjectFilter)
      );
    }

    // Filter by exam type
    if (selectedExamTypeFilter !== 'all') {
      filtered = filtered.filter(exam =>
        exam.examType === selectedExamTypeFilter
      );
    }

    // Filter by date range
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(exam => {
        const examDate = new Date(exam.examDate);
        return isAfter(examDate, dateRange.from!) && isBefore(examDate, addDays(dateRange.to!, 1));
      });
    }

    // Filter by tab
    const now = new Date();
    if (activeTab === "upcoming") {
      filtered = filtered.filter(exam =>
        isAfter(new Date(exam.examDate), now) && exam.status !== 'CANCELLED'
      );
    } else if (activeTab === "today") {
      filtered = filtered.filter(exam =>
        isToday(new Date(exam.examDate)) && exam.status !== 'CANCELLED'
      );
    } else if (activeTab === "past") {
      filtered = filtered.filter(exam =>
        isBefore(new Date(exam.examDate), now) || exam.status === 'COMPLETED'
      );
    }

    setFilteredExams(filtered);
  };

  const getStatusBadge = (status: string, examDate: string) => {
    const now = new Date();
    const date = new Date(examDate);

    if (status === "CANCELLED") {
      return { variant: "destructive", icon: AlertTriangle, label: "Cancelled" };
    }

    if (status === "COMPLETED") {
      return { variant: "success", icon: CheckCircle2, label: "Completed" };
    }

    if (status === "ONGOING") {
      return { variant: "warning", icon: Clock, label: "In Progress" };
    }

    if (isToday(date)) {
      return { variant: "warning", icon: Calendar, label: "Today" };
    }

    if (isAfter(date, now) && isBefore(date, addDays(now, 7))) {
      return { variant: "outline", icon: Calendar, label: "This Week" };
    }

    return { variant: "secondary", icon: Calendar, label: "Upcoming" };
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

  const getDaysUntilExam = (examDate: string) => {
    const now = new Date();
    const date = new Date(examDate);
    const diffTime = Math.abs(date.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (isToday(date)) {
      return "Today";
    }

    if (isBefore(date, now)) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }

    return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Exams</h1>
        <div className="mt-3 sm:mt-0">
          <CalendarDateRangePicker
            date={dateRange}
            setDate={setDateRange}
          />
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter exams by subject and type
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
              <Label htmlFor="exam-type-filter">Exam Type</Label>
              <Select
                value={selectedExamTypeFilter}
                onValueChange={setSelectedExamTypeFilter}
              >
                <SelectTrigger id="exam-type-filter">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="UNIT_TEST">Unit Test</SelectItem>
                  <SelectItem value="MIDTERM">Midterm</SelectItem>
                  <SelectItem value="FINAL">Final</SelectItem>
                  <SelectItem value="QUIZ">Quiz</SelectItem>
                  <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
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
          <CardTitle>Exam Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="w-full h-12" />
              <Skeleton className="w-full h-12" />
              <Skeleton className="w-full h-12" />
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No {activeTab !== 'all' ? activeTab : ''} exams found
              </p>
              {(searchTerm || selectedSubjectFilter !== 'all' || selectedExamTypeFilter !== 'all' || (dateRange.from && dateRange.to)) && (
                <p className="text-xs text-muted-foreground mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => {
                  const statusBadge = getStatusBadge(exam.status, exam.examDate);
                  const typeBadge = getExamTypeBadge(exam.examType);
                  const StatusIcon = statusBadge.icon;
                  const examDate = new Date(exam.examDate);

                  return (
                    <TableRow key={exam.id}>
                      <TableCell>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="font-medium cursor-help">{exam.title}</div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            <div className="space-y-1">
                              <h4 className="text-sm font-semibold">{exam.title}</h4>
                              <p className="text-sm">{exam.description || "No description available."}</p>
                              <div className="pt-2">
                                <Badge className="mt-2">Max Marks: {exam.maxMarks}</Badge>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                          {exam.subject.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{format(examDate, 'dd MMM yyyy')}</span>
                          <span className="text-xs text-muted-foreground">
                            {getDaysUntilExam(exam.examDate)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          {exam.duration} minutes
                        </div>
                      </TableCell>
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {activeTab === "upcoming" && filteredExams.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Study Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Plan your study schedule</h4>
                    <p className="text-sm text-muted-foreground">
                      Create a study timetable that allocates specific time slots for each subject.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Focus on weak areas</h4>
                    <p className="text-sm text-muted-foreground">
                      Identify and prioritize topics you find challenging to improve your overall performance.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Practice time management</h4>
                    <p className="text-sm text-muted-foreground">
                      Practice answering questions within time constraints to prepare for the exam environment.
                    </p>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="mt-4 w-full">View Study Resources</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
