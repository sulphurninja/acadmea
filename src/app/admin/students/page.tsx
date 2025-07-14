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
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  PlusCircle, Search, MoreVertical, Pencil, Trash2, Users, Mail, Phone, GraduationCap, UserSquare
} from "lucide-react";

// Helper for Roman numerals (for class display)
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

type Student = {
  _id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  sex: string;
  birthday: string;
  classId: { _id: number; name: string };
  gradeId: { _id: number; level: number };
  parentId: { _id: string; name: string; surname: string };
  rollNo?: string;
};

type Class = {
  _id: number;
  name: string;
  grade: { _id: number; level: number };
};

type Grade = {
  _id: number;
  level: number;
};

type Parent = {
  _id: string;
  name: string;
  surname: string;
};

export default function StudentsManagement() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [showUsernameField, setShowUsernameField] = useState(false);

  // New student form state
  const [newStudent, setNewStudent] = useState({
    username: '',
    password: '',
    name: '',
    surname: '',
    email: '',
    phone: '',
    address: '',
    sex: 'MALE',
    birthday: '',
    classId: '',
    gradeId: '',
    parentId: '',
    rollNo: ''
  });

  useEffect(() => {
    fetchGrades();
    fetchClasses();
    fetchParents();
  }, []);

  useEffect(() => {
    if (grades.length > 0 && classes.length > 0 && parents.length > 0) {
      fetchStudents();
    }
  }, [grades, classes, parents]);

  useEffect(() => {
    // Filter students based on search term, grade, and class
    let filtered = students;

    if (selectedGrade !== 'all') {
      filtered = filtered.filter(student =>
        student.gradeId && student.gradeId._id && student.gradeId._id.toString() === selectedGrade
      );
    }

    if (selectedClass !== 'all') {
      filtered = filtered.filter(student =>
        student.classId && student.classId._id && student.classId._id.toString() === selectedClass
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${student.name} ${student.surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.rollNo && student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredStudents(filtered);
  }, [students, selectedGrade, selectedClass, searchTerm]);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/students');

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data.students);
      setFilteredStudents(data.students);
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

  const fetchGrades = async () => {
    try {
      const response = await fetch('/api/admin/grades');

      if (!response.ok) {
        throw new Error('Failed to fetch grades');
      }

      const data = await response.json();
      // Make sure we handle the response structure correctly
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
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/admin/classes');

      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setClasses(data);
      } else {
        console.error('Unexpected classes response format:', data);
        setClasses([]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    }
  };

  const fetchParents = async () => {
    try {
      const response = await fetch('/api/admin/parents');

      if (!response.ok) {
        throw new Error('Failed to fetch parents');
      }

      const data = await response.json();
      if (data.parents && Array.isArray(data.parents)) {
        setParents(data.parents);
      } else {
        console.error('Unexpected parents response format:', data);
        setParents([]);
      }
    } catch (error) {
      console.error('Error fetching parents:', error);
      setParents([]);
    }
  };

  const handleAddStudent = async () => {
    try {
      if (!newStudent.username || !newStudent.password ||
        !newStudent.name || !newStudent.surname ||
        !newStudent.classId || !newStudent.gradeId) {
        toast({
          title: "Validation Error",
          description: "Please fill all required fields (name, username, password, class, and section)",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStudent),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create student');
      }

      toast({
        title: "Success",
        description: "Student created successfully",
        variant: "default",
      });

      setIsAddDialogOpen(false);
      setNewStudent({
        username: '',
        password: '',
        name: '',
        surname: '',
        email: '',
        phone: '',
        address: '',
        sex: 'MALE',
        birthday: '',
        classId: '',
        gradeId: '',
        parentId: '',
        rollNo: ''
      });
      fetchStudents();
    } catch (error) {
      console.error('Error creating student:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create student",
        variant: "destructive",
      });
    }
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setNewPassword('');
    setShowUsernameField(false);
    setIsEditDialogOpen(true);
  };

  const handleUpdateStudent = async () => {
    if (!selectedStudent) return;

    try {
      const updateData: any = {
        name: selectedStudent.name,
        surname: selectedStudent.surname,
        email: selectedStudent.email || '',
        phone: selectedStudent.phone || '',
        address: selectedStudent.address || '',
        sex: selectedStudent.sex,
        birthday: selectedStudent.birthday,
        classId: selectedStudent.classId._id,
        gradeId: selectedStudent.gradeId._id,
        parentId: selectedStudent.parentId?._id || '',
        username: selectedStudent.username,
        rollNo: selectedStudent.rollNo || ''
      };

      // Only include password if a new one was provided
      if (newPassword && newPassword.trim() !== '') {
        updateData.password = newPassword;
      }

      const response = await fetch(`/api/admin/students/${selectedStudent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update student');
      }

      toast({
        title: "Success",
        description: "Student updated successfully",
        variant: "default",
      });

      setIsEditDialogOpen(false);
      setNewPassword('');
      setShowUsernameField(false);
      fetchStudents();
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update student",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete student');
      }

      toast({
        title: "Success",
        description: "Student deleted successfully",
        variant: "default",
      });

      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete student",
        variant: "destructive",
      });
    }
  };

  // Auto-generate username from name and roll number
  const generateUsername = (name: string, surname: string, rollNo: string) => {
    if (!name) return '';

    const formattedName = name.toLowerCase().replace(/\s+/g, '');
    let username = formattedName;

    if (surname) {
      username = formattedName + '.' + surname.toLowerCase().substring(0, 1);
    }

    if (rollNo) {
      username += rollNo;
    }

    return username;
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Student Management</h1>

        <div className="mt-4 sm:mt-0">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select
            value={selectedGrade}
            onValueChange={setSelectedGrade}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {Array.isArray(grades) && grades.map((grade) => (
                <SelectItem key={grade._id} value={grade._id.toString()}>
                  Class {romanize(grade.level)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedClass}
            onValueChange={setSelectedClass}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {Array.isArray(classes) && classes.map((classItem) => (
                <SelectItem key={classItem._id} value={classItem._id.toString()}>
                  {classItem.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Class & Section</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">Loading students...</TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    {searchTerm || selectedGrade !== 'all' || selectedClass !== 'all' ? (
                      <p>No students match your filters</p>
                    ) : (
                      <div>
                        <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p>No students have been added yet</p>
                        <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                          Add Your First Student
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell className="font-medium">
                      {student.name} {student.surname}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <UserSquare className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-sm font-mono">{student.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.rollNo ? (
                        <span className="font-semibold">{student.rollNo}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>Class {romanize(student.gradeId?.level || 0)}</span>
                        <Badge variant="outline">
                          {student.classId?.name ? student.classId.name.split('-')[1] || student.classId.name : '-'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.parentId ?
                        `${student.parentId.name} ${student.parentId.surname}` :
                        <span className="text-muted-foreground">None</span>}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {student.email && (
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-xs">{student.email}</span>
                          </div>
                        )}
                        {student.phone && (
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-xs">{student.phone}</span>
                          </div>
                        )}
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
                          <DropdownMenuItem
                            onClick={() => handleEditStudent(student)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteStudent(student._id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
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

      {/* Add Student Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Create a new student account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">First Name</Label>
                <Input
                  id="name"
                  value={newStudent.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setNewStudent({
                      ...newStudent,
                      name,
                      username: generateUsername(name, newStudent.surname, newStudent.rollNo)
                    });
                  }}
                  placeholder="Rahul"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="surname">Last Name</Label>
                <Input
                  id="surname"
                  value={newStudent.surname}
                  onChange={(e) => {
                    const surname = e.target.value;
                    setNewStudent({
                      ...newStudent,
                      surname,
                      username: generateUsername(newStudent.name, surname, newStudent.rollNo)
                    });
                  }}
                  placeholder="Sharma"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newStudent.username}
                  onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                  placeholder="rahul.s23"
                />
                <div className="text-xs text-muted-foreground">
                  Auto-generated from name but can be changed
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  placeholder="student@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newStudent.address}
                onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
                placeholder="123, Sector 45, Noida, UP - 201301"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sex">Gender</Label>
                <Select
                  value={newStudent.sex}
                  onValueChange={(value) => setNewStudent({ ...newStudent, sex: value })}
                >
                  <SelectTrigger id="sex">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="birthday">Date of Birth</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={newStudent.birthday}
                  onChange={(e) => setNewStudent({ ...newStudent, birthday: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="grade">Class</Label>
                <Select
                  value={newStudent.gradeId}
                  onValueChange={(value) => {
                    setNewStudent({
                      ...newStudent,
                      gradeId: value,
                      // Reset class when grade changes
                      classId: ''
                    });
                  }}
                >
                  <SelectTrigger id="grade">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(grades) && grades.map((grade) => (
                      <SelectItem key={grade._id} value={grade._id.toString()}>
                        Class {romanize(grade.level)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="class">Section</Label>
                <Select
                  value={newStudent.classId}
                  onValueChange={(value) => setNewStudent({ ...newStudent, classId: value })}
                >
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(classes) && classes
                      .filter(c => !newStudent.gradeId || c.grade._id.toString() === newStudent.gradeId)
                      .map((classItem) => (
                        <SelectItem key={classItem._id} value={classItem._id.toString()}>
                          {classItem.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="parent">Parent/Guardian</Label>
              <Select
                value={newStudent.parentId}
                onValueChange={(value) => setNewStudent({ ...newStudent, parentId: value })}
              >
                <SelectTrigger id="parent">
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  {Array.isArray(parents) && parents.map((parent) => (
                    <SelectItem key={parent._id} value={parent._id}>
                      {parent.name} {parent.surname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Add the Roll No field after the parent selection */}
            <div className="grid gap-2">
              <Label htmlFor="rollNo">Roll Number</Label>
              <Input
                id="rollNo"
                value={newStudent.rollNo}
                onChange={(e) => {
                  const rollNo = e.target.value;
                  setNewStudent({
                    ...newStudent,
                    rollNo,
                    username: generateUsername(newStudent.name, newStudent.surname, rollNo)
                  });
                }}
                placeholder="23ABC45"
              />
              <div className="text-xs text-muted-foreground">
                Unique identification number for the student
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStudent}>Create Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setNewPassword('');
          setShowUsernameField(false);
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information, credentials, and enrollment details.
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">First Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedStudent.name}
                    onChange={(e) => setSelectedStudent({
                      ...selectedStudent,
                      name: e.target.value
                    })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-surname">Last Name</Label>
                  <Input
                    id="edit-surname"
                    value={selectedStudent.surname}
                    onChange={(e) => setSelectedStudent({
                      ...selectedStudent,
                      surname: e.target.value
                    })}
                  />
                </div>
              </div>

              {/* Username field - can toggle to show/edit */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-username">Username</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUsernameField(!showUsernameField)}
                    className="h-6 px-2"
                  >
                    {showUsernameField ? 'Cancel' : 'Change Username'}
                  </Button>
                </div>
                {showUsernameField ? (
                  <Input
                    id="edit-username"
                    value={selectedStudent.username}
                    onChange={(e) => setSelectedStudent({
                      ...selectedStudent,
                      username: e.target.value
                    })}
                  />
                ) : (
                  <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <span className="text-muted-foreground font-mono">{selectedStudent.username}</span>
                  </div>
                )}
              </div>

              {/* Password field - only shown when intentionally changing */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-password">Password</Label>
                  {newPassword && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNewPassword('')}
                      className="h-6 px-2"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
                {newPassword ? (
                  <Input
                    id="edit-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setNewPassword(' ')}
                    className="w-full justify-start text-muted-foreground"
                  >
                    <span>Click to change password</span>
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedStudent.email || ''}
                    onChange={(e) => setSelectedStudent({
                      ...selectedStudent,
                      email: e.target.value
                    })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={selectedStudent.phone || ''}
                    onChange={(e) => setSelectedStudent({
                      ...selectedStudent,
                      phone: e.target.value
                    })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={selectedStudent.address || ''}
                  onChange={(e) => setSelectedStudent({
                    ...selectedStudent,
                    address: e.target.value
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-sex">Gender</Label>
                  <Select
                    value={selectedStudent.sex}
                    onValueChange={(value) => setSelectedStudent({
                      ...selectedStudent,
                      sex: value
                    })}
                  >
                    <SelectTrigger id="edit-sex">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-birthday">Date of Birth</Label>
                  <Input
                    id="edit-birthday"
                    type="date"
                    value={selectedStudent.birthday ? new Date(selectedStudent.birthday).toISOString().split('T')[0] : ''}
                    onChange={(e) => setSelectedStudent({
                      ...selectedStudent,
                      birthday: e.target.value
                    })}
                  />
                </div>
              </div>
              {/* Add the Roll No field before the class/section fields */}
              <div className="grid gap-2">
                <Label htmlFor="edit-rollNo">Roll Number</Label>
                <Input
                  id="edit-rollNo"
                  value={selectedStudent.rollNo || ''}
                  onChange={(e) => setSelectedStudent({
                    ...selectedStudent,
                    rollNo: e.target.value
                  })}
                  placeholder="23ABC45"
                />
                <div className="text-xs text-muted-foreground">
                  Unique identification number for the student
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-grade">Class</Label>
                  <Select
                    value={selectedStudent.gradeId?._id?.toString() || ''}
                    onValueChange={(value) => {
                      // When class changes, reset section selection
                      setSelectedStudent({
                        ...selectedStudent,
                        gradeId: {
                          ...selectedStudent.gradeId,
                          _id: parseInt(value)
                        },
                        classId: {
                          _id: 0,
                          name: ''
                        }
                      });
                    }}
                  >
                    <SelectTrigger id="edit-grade">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(grades) && grades.map((grade) => (
                        <SelectItem key={grade._id} value={grade._id.toString()}>
                          Class {romanize(grade.level)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-class">Section</Label>
                  <Select
                    value={selectedStudent.classId?._id?.toString() || ''}
                    onValueChange={(value) => {
                      const classObj = classes.find(c => c._id.toString() === value);
                      setSelectedStudent({
                        ...selectedStudent,
                        classId: {
                          _id: parseInt(value),
                          name: classObj ? classObj.name : ''
                        }
                      });
                    }}
                  >
                    <SelectTrigger id="edit-class">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(classes) && classes
                        .filter(c => selectedStudent.gradeId?._id && c.grade._id === selectedStudent.gradeId._id)
                        .map((classItem) => (
                          <SelectItem key={classItem._id} value={classItem._id.toString()}>
                            {classItem.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-parent">Parent/Guardian</Label>
                <Select
                  value={selectedStudent.parentId?._id || ''}
                  onValueChange={(value) => {
                    const parent = parents.find(p => p._id === value);
                    setSelectedStudent({
                      ...selectedStudent,
                      parentId: value ? {
                        _id: value,
                        name: parent ? parent.name : '',
                        surname: parent ? parent.surname : ''
                      } : undefined
                    });
                  }}
                >
                  <SelectTrigger id="edit-parent">
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    {Array.isArray(parents) && parents.map((parent) => (
                      <SelectItem key={parent._id} value={parent._id}>
                        {parent.name} {parent.surname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setNewPassword('');
              setShowUsernameField(false);
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStudent}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
