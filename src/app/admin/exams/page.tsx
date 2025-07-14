"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Plus, Search, Filter, FileText, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Grade = {
  id: number;
  level: number;
  name: string;
};

type Subject = {
  id: number;
  name: string;
  gradeId: number;
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

export default function AdminExams() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    examDate: new Date(),
    gradeId: '',
    subjectId: '',
    maxMarks: 100,
    duration: 60,
    examType: 'UNIT_TEST',
    status: 'SCHEDULED'
  });

  // Form validation
  const [formErrors, setFormErrors] = useState({
    title: false,
    examDate: false,
    gradeId: false,
    subjectId: false,
    maxMarks: false,
    duration: false
  });

  useEffect(() => {
    fetchGrades();
    fetchSubjects();
    fetchExams();
  }, []);

  useEffect(() => {
    if (formData.gradeId && Array.isArray(subjects)) {
      const filtered = subjects.filter(
        subject => subject.gradeId === Number(formData.gradeId)
      );
      setFilteredSubjects(filtered);

      // Reset subject selection if current selection is not valid for the new grade
      if (formData.subjectId && !filtered.some(s => s.id === Number(formData.subjectId))) {
        setFormData(prev => ({ ...prev, subjectId: '' }));
      }
    } else {
      setFilteredSubjects(Array.isArray(subjects) ? subjects : []);
    }
  }, [formData.gradeId, subjects]);

  useEffect(() => {
    filterExams();
  }, [exams, searchTerm, gradeFilter, subjectFilter, statusFilter]);

  const fetchGrades = async () => {
    try {
      const response = await fetch('/api/admin/grades');
      if (!response.ok) {
        throw new Error('Failed to fetch grades');
      }
      const data = await response.json();

      // Handle different response formats
      if (data.grades && Array.isArray(data.grades)) {
        setGrades(data.grades);
      } else if (Array.isArray(data)) {
        setGrades(data);
      } else {
        console.error('Unexpected grades response format:', data);
        setGrades([]);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
      setGrades([]);
      toast({
        title: "Error",
        description: "Failed to load grades",
        variant: "destructive",
      });
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/admin/subjects');
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }
      const data = await response.json();

      // Handle different response formats
      if (data.subjects && Array.isArray(data.subjects)) {
        setSubjects(data.subjects);
      } else if (Array.isArray(data)) {
        setSubjects(data);
      } else {
        console.error('Unexpected subjects response format:', data);
        setSubjects([]);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
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
      let url = '/api/admin/exams';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch exams');
      }

      const data = await response.json();

      // Handle different response formats
      if (data.exams && Array.isArray(data.exams)) {
        setExams(data.exams);
      } else if (Array.isArray(data)) {
        setExams(data);
      } else {
        console.error('Unexpected exams response format:', data);
        setExams([]);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      setExams([]);
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
    let filtered = Array.isArray(exams) ? [...exams] : [];

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(exam =>
        exam.title?.toLowerCase().includes(searchLower) ||
        (exam.description && exam.description.toLowerCase().includes(searchLower)) ||
        (exam.subject?.name && exam.subject.name.toLowerCase().includes(searchLower))
      );
    }

    // Filter by grade
    if (gradeFilter !== 'all') {
      filtered = filtered.filter(exam =>
        exam.grade?.id && exam.grade.id === Number(gradeFilter)
      );
    }

    // Filter by subject
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(exam =>
        exam.subject?.id && exam.subject.id === Number(subjectFilter)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(exam =>
        exam.status === statusFilter
      );
    }

    setFilteredExams(filtered);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData(prev => ({ ...prev, [name]: numValue }));
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, examDate: date }));
    }
  };

  const validateForm = () => {
    const errors = {
      title: !formData.title,
      examDate: !formData.examDate,
      gradeId: !formData.gradeId,
      subjectId: !formData.subjectId,
      maxMarks: formData.maxMarks <= 0,
      duration: formData.duration <= 0
    };

    setFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleCreateExam = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create exam');
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: "Exam created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchExams();
    } catch (error) {
      console.error('Error creating exam:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create exam",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExam = async () => {
    if (!examToDelete) return;

    try {
      const response = await fetch(`/api/admin/exams/${examToDelete}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete exam');
      }

      toast({
        title: "Success",
        description: "Exam deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setExamToDelete(null);
      fetchExams();
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete exam",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      examDate: new Date(),
      gradeId: '',
      subjectId: '',
      maxMarks: 100,
      duration: 60,
      examType: 'UNIT_TEST',
      status: 'SCHEDULED'
    });
    setFormErrors({
      title: false,
      examDate: false,
      gradeId: false,
      subjectId: false,
      maxMarks: false,
      duration: false
    });
  };

  const openEditExam = (exam: Exam) => {
    setFormData({
      title: exam.title || '',
      description: exam.description || '',
      examDate: exam.examDate ? new Date(exam.examDate) : new Date(),
      gradeId: exam.grade?.id ? exam.grade.id.toString() : '',
      subjectId: exam.subject?.id ? exam.subject.id.toString() : '',
      maxMarks: exam.maxMarks || 100,
      duration: exam.duration || 60,
      examType: exam.examType || 'UNIT_TEST',
      status: exam.status || 'SCHEDULED'
    });
    setIsCreateDialogOpen(true);
  };

  const openDeleteDialog = (examId: number) => {
    setExamToDelete(examId);
    setIsDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return { variant: "outline", label: "Scheduled" };
      case "ONGOING":
        return { variant: "warning", label: "Ongoing" };
      case "COMPLETED":
        return { variant: "success", label: "Completed" };
      case "CANCELLED":
        return { variant: "destructive", label: "Cancelled" };
      default:
        return { variant: "outline", label: status };
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
        <h1 className="text-2xl font-bold">Exams Management</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-3 text-white   sm:mt-0">
          <Plus className="h-4 w-4 mr-2" /> Create Exam
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter exams by grade, subject, and status
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
              <Label htmlFor="grade-filter">Grade</Label>
              <Select
                value={gradeFilter}
                onValueChange={setGradeFilter}
              >
                <SelectTrigger id="grade-filter">
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {Array.isArray(grades) && grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id?.toString() || 'None'}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject-filter">Subject</Label>
              <Select
                value={subjectFilter}
                onValueChange={setSubjectFilter}
              >
                <SelectTrigger id="subject-filter">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {Array.isArray(subjects) && subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id?.toString() || 'None'}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="ONGOING">Ongoing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exams List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Exams</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10">Loading exams...</div>
          ) : !Array.isArray(filteredExams) || filteredExams.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No exams found</p>
              {(searchTerm || gradeFilter !== 'all' || subjectFilter !== 'all' || statusFilter !== 'all') && (
                <p className="text-xs text-muted-foreground mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => {
                  const statusBadge = getStatusBadge(exam.status || '');
                  const typeBadge = getExamTypeBadge(exam.examType || '');

                  return (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.title || 'N/A'}</TableCell>
                      <TableCell>
                        {exam.grade?.level ? `Class ${exam.grade.level}` : 'N/A'}
                      </TableCell>
                      <TableCell>{exam.subject?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {exam.examDate ? format(new Date(exam.examDate), 'dd MMM yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={typeBadge.variant as any}>
                          {typeBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadge.variant as any}>
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditExam(exam)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(exam.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Exam Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Exam</DialogTitle>
            <DialogDescription>
              Add a new exam to the system. Fill all the required fields.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label htmlFor="title" className={formErrors.title ? "text-red-500" : ""}>
                  Exam Title*
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={formErrors.title ? "border-red-500" : ""}
                />
                {formErrors.title && (
                  <p className="text-sm text-red-500">Title is required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="examDate" className={formErrors.examDate ? "text-red-500" : ""}>
                    Exam Date*
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${formErrors.examDate ? "border-red-500" : ""}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.examDate ? format(formData.examDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.examDate}
                        onSelect={handleDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {formErrors.examDate && (
                    <p className="text-sm text-red-500">Exam date is required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examType">Exam Type*</Label>
                  <Select
                    name="examType"
                    value={formData.examType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, examType: value }))}
                  >
                    <SelectTrigger id="examType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNIT_TEST">Unit Test</SelectItem>
                      <SelectItem value="MIDTERM">Midterm</SelectItem>
                      <SelectItem value="FINAL">Final</SelectItem>
                      <SelectItem value="QUIZ">Quiz</SelectItem>
                      <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="gradeId" className={formErrors.gradeId ? "text-red-500" : ""}>
                    Grade/Class*
                  </Label>
                  <Select
                    name="gradeId"
                    value={formData.gradeId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, gradeId: value }))}
                  >
                    <SelectTrigger id="gradeId" className={formErrors.gradeId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(grades) && grades.map((grade) => (
                        <SelectItem key={grade.id} value={grade.id?.toString() || 'None'}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.gradeId && (
                    <p className="text-sm text-red-500">Grade is required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subjectId" className={formErrors.subjectId ? "text-red-500" : ""}>
                    Subject*
                  </Label>
                  <Select
                    name="subjectId"
                    value={formData.subjectId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}
                    disabled={!formData.gradeId}
                  >
                    <SelectTrigger id="subjectId" className={formErrors.subjectId ? "border-red-500" : ""}>
                      <SelectValue placeholder={formData.gradeId ? "Select subject" : "Select grade first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(filteredSubjects) && filteredSubjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id?.toString() || 'None'}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.subjectId && (
                    <p className="text-sm text-red-500">Subject is required</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="maxMarks" className={formErrors.maxMarks ? "text-red-500" : ""}>
                    Maximum Marks*
                  </Label>
                  <Input
                    id="maxMarks"
                    name="maxMarks"
                    type="number"
                    value={formData.maxMarks}
                    onChange={handleNumberInputChange}
                    className={formErrors.maxMarks ? "border-red-500" : ""}
                  />
                  {formErrors.maxMarks && (
                    <p className="text-sm text-red-500">Marks must be greater than 0</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration" className={formErrors.duration ? "text-red-500" : ""}>
                    Duration (minutes)*
                  </Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    value={formData.duration}
                    onChange={handleNumberInputChange}
                    className={formErrors.duration ? "border-red-500" : ""}
                  />
                  {formErrors.duration && (
                    <p className="text-sm text-red-500">Duration must be greater than 0</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status*</Label>
                  <Select
                    name="status"
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="ONGOING">Ongoing</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateExam}>
              Save Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this exam? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteExam}>
              Delete
            </Button>
          </DialogFooter>
</DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
