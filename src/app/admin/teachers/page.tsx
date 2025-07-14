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
  PlusCircle, Search, MoreVertical, Pencil, Trash2, UserCheck, Mail, Phone
} from "lucide-react";

type Teacher = {
  _id: string;
  username: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  subjects: { _id: number; name: string }[];
};

type Subject = {
  id: number;
  name: string;
  grade: number;
};

export default function TeachersManagement() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New teacher form state
  const [newTeacher, setNewTeacher] = useState({
    username: '',
    password: '',
    name: '',
    surname: '',
    email: '',
    phone: '',
    address: '',
    sex: 'MALE',
    birthday: '',
    subjects: [] as string[]
  });

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, []);

  useEffect(() => {
    // Filter teachers based on search term
    if (searchTerm) {
      const filtered = teachers.filter(teacher =>
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.phone?.includes(searchTerm)
      );
      setFilteredTeachers(filtered);
    } else {
      setFilteredTeachers(teachers);
    }
  }, [teachers, searchTerm]);

  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/teachers');

      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }

      const data = await response.json();
      setTeachers(data.teachers);
      setFilteredTeachers(data.teachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast({
        title: "Error",
        description: "Failed to load teachers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/admin/subjects');

      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }

      const data = await response.json();
      setSubjects(data.subjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleAddTeacher = async () => {
    try {
      if (!newTeacher.username || !newTeacher.password || !newTeacher.name || !newTeacher.surname) {
        toast({
          title: "Validation Error",
          description: "Username, password, name and surname are required",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify(newTeacher),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create teacher');
      }

      toast({
        title: "Success",
        description: "Teacher created successfully",
        variant: "default",
      });

      setIsAddDialogOpen(false);
      setNewTeacher({
        username: '',
        password: '',
        name: '',
        surname: '',
        email: '',
        phone: '',
        address: '',
        sex: 'MALE',
        birthday: '',
        subjects: []
      });
      fetchTeachers();
    } catch (error) {
      console.error('Error creating teacher:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create teacher",
        variant: "destructive",
      });
    }
  };

  const handleEditTeacher = async () => {
    if (!selectedTeacher) return;

    try {
      const response = await fetch(`/api/admin/teachers/${selectedTeacher._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedTeacher.name,
          surname: selectedTeacher.surname,
          email: selectedTeacher.email,
          phone: selectedTeacher.phone,
          subjects: selectedTeacher.subjects?.map(s => s._id) || []
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update teacher');
      }

      toast({
        title: "Success",
        description: "Teacher updated successfully",
        variant: "default",
      });

      setIsEditDialogOpen(false);
      fetchTeachers();
    } catch (error) {
      console.error('Error updating teacher:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update teacher",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/teachers/${teacherId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete teacher');
      }

      toast({
        title: "Success",
        description: "Teacher deleted successfully",
        variant: "default",
      });

      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete teacher",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Teacher Management</h1>

        <div className="mt-4 sm:mt-0">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Teacher
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search teachers..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Teachers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">Loading teachers...</TableCell>
                </TableRow>
              ) : filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    {searchTerm ? (
                      <p>No teachers match your search</p>
                    ) : (
                      <div>
                        <UserCheck className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p>No teachers have been added yet</p>
                        <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                          Add Your First Teacher
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((teacher) => (
                  <TableRow key={teacher._id}>
                    <TableCell className="font-medium">
                      {teacher.name} {teacher.surname}
                    </TableCell>
                    <TableCell>
                      {teacher.email ? (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-1 text-muted-foreground" />
                          {teacher.email}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not provided</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {teacher.phone ? (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-muted-foreground" />
                          {teacher.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not provided</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjects && teacher.subjects.length > 0 ? (
                          teacher.subjects.map((subject) => (
                            <Badge key={subject._id} variant="outline">
                              {subject.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">No subjects assigned</span>
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
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteTeacher(teacher._id)}
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

      {/* Add Teacher Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
            <DialogDescription>
              Create a new teacher account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">First Name</Label>
                <Input
                  id="name"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                  placeholder="John"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="surname">Last Name</Label>
                <Input
                  id="surname"
                  value={newTeacher.surname}
                  onChange={(e) => setNewTeacher({...newTeacher, surname: e.target.value})}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newTeacher.username}
                  onChange={(e) => setNewTeacher({...newTeacher, username: e.target.value})}
                  placeholder="johndoe"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                  placeholder="john.doe@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newTeacher.phone}
                  onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value})}
                  placeholder="+1234567890"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newTeacher.address}
                onChange={(e) => setNewTeacher({...newTeacher, address: e.target.value})}
                placeholder="123 Main St, City"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sex">Gender</Label>
                <Select
                  value={newTeacher.sex}
                  onValueChange={(value) => setNewTeacher({...newTeacher, sex: value})}
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
                  value={newTeacher.birthday}
                  onChange={(e) => setNewTeacher({...newTeacher, birthday: e.target.value})}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subjects">Subjects</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (!newTeacher.subjects.includes(value)) {
                    setNewTeacher({
                      ...newTeacher,
                      subjects: [...newTeacher.subjects, value]
                    });
                  }
                }}
              >
                <SelectTrigger id="subjects">
                  <SelectValue placeholder="Select subjects" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name} (Grade {subject.grade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1 mt-2">
                {newTeacher.subjects.map((subjectId) => {
                  const subject = subjects.find(s => s.id.toString() === subjectId);
                  return subject ? (
                    <Badge key={subjectId} variant="secondary" className="flex items-center">
                      {subject.name}
                      <button
                        className="ml-1 text-xs"
                        onClick={() => {
                          setNewTeacher({
                            ...newTeacher,
                            subjects: newTeacher.subjects.filter(id => id !== subjectId)
                          });
                        }}
                      >
                        ✕
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTeacher}>Create Teacher</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>
              Update teacher information.
            </DialogDescription>
          </DialogHeader>
          {selectedTeacher && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">First Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedTeacher.name}
                    onChange={(e) => setSelectedTeacher({
                      ...selectedTeacher,
                      name: e.target.value
                    })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-surname">Last Name</Label>
                  <Input
                    id="edit-surname"
                    value={selectedTeacher.surname}
                    onChange={(e) => setSelectedTeacher({
                      ...selectedTeacher,
                      surname: e.target.value
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedTeacher.email || ''}
                    onChange={(e) => setSelectedTeacher({
                      ...selectedTeacher,
                      email: e.target.value
                    })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={selectedTeacher.phone || ''}
                    onChange={(e) => setSelectedTeacher({
                      ...selectedTeacher,
                      phone: e.target.value
                    })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-subjects">Subjects</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    const subjectExists = selectedTeacher.subjects?.some(s => s._id.toString() === value);
                    if (!subjectExists) {
                      const newSubject = subjects.find(s => s.id.toString() === value);
                      if (newSubject) {
                        setSelectedTeacher({
                          ...selectedTeacher,
                          subjects: [
                            ...(selectedTeacher.subjects || []),
                            { _id: newSubject.id, name: newSubject.name }
                          ]
                        });
                      }
                    }
                  }}
                >
                  <SelectTrigger id="edit-subjects">
                    <SelectValue placeholder="Select subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name} (Grade {subject.grade})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedTeacher.subjects?.map((subject) => (
                    <Badge key={subject._id} variant="secondary" className="flex items-center">
                      {subject.name}
                      <button
                        className="ml-1 text-xs"
                        onClick={() => {
                          setSelectedTeacher({
                            ...selectedTeacher,
                            subjects: selectedTeacher.subjects?.filter(s => s._id !== subject._id) || []
                          });
                        }}
                      >
                        ✕
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTeacher}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
