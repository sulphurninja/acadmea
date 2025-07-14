"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Search, MoreVertical, Users, FileText,
  ArrowRight, Eye, ListChecks, Calendar, X
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import Link from "next/link";

type Class = {
  id: string;
  grade: number;
  name: string;
  subject: string;
  students: number;
  isClassTeacher: boolean;
  room?: string;
  schedule?: string[];
  subjects?: string[];
};

type Student = {
  id: string;
  name: string;
  surname: string;
  rollNo: string;
  img?: string;
};

// Helper for Roman numerals for class display
const romanize = (num: number): string => {
  const romanNumerals: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"]
  ];

  if (num <= 0 || num > 12) {
    return num.toString();
  }

  let result = '';
  for (const [value, symbol] of romanNumerals) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
};

export default function TeacherClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  // State for dialogs
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showStudentsDialog, setShowStudentsDialog] = useState(false);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    let filtered = classes;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(cls =>
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by tab
    if (activeTab === "classteacher") {
      filtered = filtered.filter(cls => cls.isClassTeacher);
    } else if (activeTab === "subjects") {
      filtered = filtered.filter(cls => !cls.isClassTeacher);
    }

    setFilteredClasses(filtered);
  }, [classes, searchTerm, activeTab]);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/teacher/classes');

      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }

      const data = await response.json();

      // Transform the API data to match our component's expected format
      const formattedClasses = data.map((cls: any) => ({
        id: cls.id,
        grade: cls.grade,
        name: cls.name,
        subject: cls.subject,
        students: cls.studentCount,
        isClassTeacher: cls.isClassTeacher,
        subjects: cls.subjects || []
      }));

      setClasses(formattedClasses);
      setFilteredClasses(formattedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Failed to load classes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (cls: Class) => {
    setSelectedClass(cls);
    setShowDetailsDialog(true);
  };
  // Only updating the handleViewStudents function to use the real API
  const handleViewStudents = async (cls: Class) => {
    setSelectedClass(cls);
    setShowStudentsDialog(true);
    setLoadingStudents(true);
    setClassStudents([]); // Clear previous students

    try {
      // Fetch students from the API
      const response = await fetch(`/api/teacher/classes/${cls.id}/students`);

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setClassStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">My Classes</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Classes & Subjects</CardTitle>
            <div className="mt-4 sm:mt-0 relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Classes</TabsTrigger>
              <TabsTrigger value="classteacher">Class Teacher</TabsTrigger>
              <TabsTrigger value="subjects">Subject Teacher</TabsTrigger>
            </TabsList>
          </Tabs>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Students</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">Loading classes...</TableCell>
                </TableRow>
              ) : filteredClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    {searchTerm ? (
                      <p>No classes match your search</p>
                    ) : (
                      <div>
                        <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p>No classes assigned yet</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary mr-3">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium flex items-center">
                            {cls.name}
                            {cls.isClassTeacher && (
                              <Badge className="ml-2" variant="outline">Class Teacher</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cls.subjects && cls.subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {cls.subjects.map((subj, idx) => (
                            <Badge key={idx} variant="secondary">{subj}</Badge>
                          ))}
                        </div>
                      ) : (
                        cls.subject
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        {cls.students}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleViewDetails(cls)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleViewStudents(cls)}>
                            <Users className="h-4 w-4 mr-2" />
                            View Students
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Class Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-primary" />
              Class Details
            </DialogTitle>
            <DialogDescription>
              Information about {selectedClass?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedClass && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Class Name</p>
                  <p className="text-lg font-semibold">{selectedClass.name}</p>
                </div>
                {/* <div>
                  <p className="text-sm font-medium text-muted-foreground">Grade</p>
                  <p className="text-lg font-semibold">{romanize(selectedClass.grade)}</p>
                </div> */}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <p className="text-lg font-semibold">
                  {selectedClass.isClassTeacher ? 'Class Teacher' : 'Subject Teacher'}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Subjects Taught</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedClass.subjects && selectedClass.subjects.length > 0 ? (
                    selectedClass.subjects.map((subj, idx) => (
                      <Badge key={idx} variant="secondary">{subj}</Badge>
                    ))
                  ) : (
                    <Badge variant="secondary">{selectedClass.subject}</Badge>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Students Enrolled</p>
                <p className="text-lg font-semibold">{selectedClass.students}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Students List Dialog */}
      <Dialog open={showStudentsDialog} onOpenChange={setShowStudentsDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              Students in {selectedClass?.name}
            </DialogTitle>
            <DialogDescription>
              View all students enrolled in this class
            </DialogDescription>
          </DialogHeader>

          {loadingStudents ? (
            <div className="py-8 text-center">
              <p>Loading students...</p>
            </div>
          ) : (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* <TableHead>Roll No</TableHead> */}
                    <TableHead>Name</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        No students found in this class
                      </TableCell>
                    </TableRow>
                  ) : (
                    classStudents.map((student) => (
                      <TableRow key={student.id}>
                        {/* <TableCell>{student.rollNo}</TableCell> */}
                        <TableCell>
                          {student.name} {student.surname}
                        </TableCell>
                        <TableCell>
                          <Link href='/teacher/attendance' className="flex items-center">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Mark Attendance
                          </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
