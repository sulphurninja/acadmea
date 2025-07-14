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
import { useToast } from "@/hooks/use-toast";
import {
  Search, Users, Eye, Mail, Phone, CalendarDays, UserCircle,
  FileText
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

type Student = {
  id: string;
  name: string;
  surname: string;
  rollNo: string;
  img?: string;
  className: string;
  classId: number;
  email: string;
  phone: string;
  sex: string;
  birthday: string;
};

type StudentDetails = Student & {
  address: string;
  bloodType: string;
  emergencyContact: string;
  emergencyContactName: string;
  fatherName: string;
  motherName: string;
  admissionDate: string;
  documents: Array<{
    type: string;
    name: string;
    url: string;
    uploadDate: string;
  }>;
};

export default function TeacherStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<{ id: string, name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const [loadingStudentDetails, setLoadingStudentDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, selectedClassFilter]);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/teacher/students');

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data);

      // Extract unique classes for the filter
      const uniqueClasses = Array.from(
        new Map(data.map((s: Student) => [s.classId, { id: s.classId, name: s.className }]))
      ).map(([_, value]) => value);

      setClasses(uniqueClasses);

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
        student.rollNo.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower) ||
        student.className.toLowerCase().includes(searchLower)
      );
    }

    // Filter by class
    if (selectedClassFilter !== 'all') {
      filtered = filtered.filter(student =>
        student.classId.toString() === selectedClassFilter
      );
    }

    setFilteredStudents(filtered);
  };

  const handleViewStudent = async (studentId: string) => {
    try {
      setLoadingStudentDetails(true);
      setShowStudentDialog(true);

      const response = await fetch(`/api/teacher/students/${studentId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch student details');
      }

      const data = await response.json();
      setSelectedStudent(data);

    } catch (error) {
      console.error('Error fetching student details:', error);
      toast({
        title: "Error",
        description: "Failed to load student details",
        variant: "destructive",
      });
      setShowStudentDialog(false);
    } finally {
      setLoadingStudentDetails(false);
    }
  };

  // Helper function to get initials from name
  const getInitials = (name: string, surname: string) => {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Students</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Students</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={selectedClassFilter}
                onValueChange={setSelectedClassFilter}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                {/* <TableHead>Roll No</TableHead> */}
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">Loading students...</TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    {searchTerm || selectedClassFilter !== 'all' ? (
                      <p>No students match your search criteria</p>
                    ) : (
                      <div>
                        <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p>No students found</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-9 w-9 mr-3">
                          <AvatarImage src={student.img || ''} alt={`${student.name} ${student.surname}`} />
                          <AvatarFallback>{getInitials(student.name, student.surname)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.name} {student.surname}</div>
                          <div className="text-xs text-muted-foreground">
                            {student.sex === 'MALE' ? 'Male' : 'Female'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.className}</Badge>
                    </TableCell>
                    {/* <TableCell>{student.rollNo}</TableCell> */}
                    <TableCell>
                      {student.email && (
                        <div className="flex items-center text-xs mb-1">
                          <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                          {student.email}
                        </div>
                      )}
                      {student.phone && (
                        <div className="flex items-center text-xs">
                          <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                          {student.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewStudent(student.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Link href={`/teacher/students/${student.id}/exams`}>
                        <Button variant="ghost"
                          size="sm" className="mr-2">
                          <FileText className="h-4 w-4 mr-1" />
                          Exams
                        </Button>
                      </Link>

                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Student Details Dialog */}
      <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserCircle className="h-5 w-5 mr-2 text-primary" />
              Student Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about the student
            </DialogDescription>
          </DialogHeader>

          {loadingStudentDetails ? (
            <div className="py-8 text-center">
              <p>Loading student details...</p>
            </div>
          ) : selectedStudent ? (
            <div className="mt-4">
              <Tabs defaultValue="personal">
                <TabsList className="mb-4">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="academic">Academic Info</TabsTrigger>
                  <TabsTrigger value="contact">Contact Info</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                  <div className="flex items-center mb-6">
                    <Avatar className="h-16 w-16 mr-4">
                      <AvatarImage src={selectedStudent.img || ''} alt={`${selectedStudent.name} ${selectedStudent.surname}`} />
                      <AvatarFallback>{getInitials(selectedStudent.name, selectedStudent.surname)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold">{selectedStudent.name} {selectedStudent.surname}</h3>
                      <p className="text-muted-foreground">{selectedStudent.className}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Gender</p>
                      <p>{selectedStudent.sex === 'MALE' ? 'Male' : 'Female'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                      <p>{selectedStudent.birthday ? format(new Date(selectedStudent.birthday), 'PPP') : 'Not Available'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Blood Type</p>
                      <p>{selectedStudent.bloodType || 'Not Available'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Father's Name</p>
                      <p>{selectedStudent.fatherName || 'Not Available'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Mother's Name</p>
                      <p>{selectedStudent.motherName || 'Not Available'}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="academic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Class</p>
                      <p>{selectedStudent.className}</p>
                    </div>
                    <div>
                      {/* <p className="text-sm font-medium text-muted-foreground">Roll Number</p> */}
                      {/* <p>{selectedStudent.rollNo}</p> */}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Admission Date</p>
                      <p>{selectedStudent.admissionDate ? format(new Date(selectedStudent.admissionDate), 'PPP') : 'Not Available'}</p>
                    </div>
                  </div>

                  {selectedStudent.documents && selectedStudent.documents.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Documents</p>
                      <ul className="space-y-2">
                        {selectedStudent.documents.map((doc, index) => (
                          <li key={index} className="flex items-center justify-between border p-2 rounded">
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">{doc.type}</p>
                            </div>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              View
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p>{selectedStudent.email || 'Not Available'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p>{selectedStudent.phone || 'Not Available'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p>{selectedStudent.address || 'Not Available'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                      <p>{selectedStudent.emergencyContactName || 'Not Available'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Emergency Phone</p>
                      <p>{selectedStudent.emergencyContact || 'Not Available'}</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Student details not available
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
