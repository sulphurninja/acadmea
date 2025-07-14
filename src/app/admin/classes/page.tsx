"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card, CardContent, CardDescription,
  CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  PlusCircle, Search, Users, BookOpen,
  Pencil, MoreVertical, Trash2
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Section = {
  _id: number;
  name: string;
  capacity: number;
  supervisor?: {
    _id: string;
    name: string;
    surname: string;
  };
  grade: {
    _id: number;
    level: number;
  };
  studentCount: number;
};

type Teacher = {
  _id: string;
  name: string;
  surname: string;
};

type Grade = {
  _id: number;
  level: number;
};

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

export default function SectionsManagement() {
  const [sections, setSections] = useState<Section[]>([]);
  const [filteredSections, setFilteredSections] = useState<Section[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Add these new state variables
  const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false);
  const [sectionStudents, setSectionStudents] = useState<any[]>([]);
  const [selectedSectionName, setSelectedSectionName] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const { toast } = useToast();

  // New section form state
  const [newSection, setNewSection] = useState({
    name: '',
    capacity: 30,
    supervisorId: '',
    gradeId: 0  // Make sure this is a number, not a string
  });

  useEffect(() => {
    fetchSections();
    fetchTeachers();
    fetchGrades();
  }, []);

  useEffect(() => {
    // Filter sections based on search term
    if (searchTerm) {
      const filtered = Array.isArray(sections) ? sections.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.grade?.level?.toString().includes(searchTerm) ||
        (c.supervisor && `${c.supervisor.name} ${c.supervisor.surname}`.toLowerCase().includes(searchTerm.toLowerCase()))
      ) : [];
      setFilteredSections(filtered);
    } else {
      setFilteredSections(Array.isArray(sections) ? sections : []);
    }
  }, [sections, searchTerm]);

  const fetchSections = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching sections...");

      const response = await fetch('/api/admin/classes');
      console.log("API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Failed to fetch sections: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log("Fetched sections:", data);

      if (Array.isArray(data)) {
        setSections(data);
        setFilteredSections(data);
      } else {
        console.error("API didn't return an array:", data);
        setSections([]);
        setFilteredSections([]);
        toast({
          title: "Error",
          description: "Invalid data format received from server",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
      setFilteredSections([]);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load sections",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add this new function to fetch students for a section
  const fetchSectionStudents = async (sectionId: number, sectionName: string) => {
    try {
      setLoadingStudents(true);
      setSelectedSectionName(sectionName);

      const response = await fetch(`/api/admin/students?classId=${sectionId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      console.log("Fetched students:", data);

      // Assuming the API returns {students: [...], pagination: {...}}
      const students = data.students || data;
      setSectionStudents(Array.isArray(students) ? students : []);
      setIsStudentsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching section students:', error);
      setSectionStudents([]);
      toast({
        title: "Error",
        description: "Failed to load students for this section",
        variant: "destructive",
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/admin/teachers');

      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }

      const data = await response.json();

      // Handle different response formats
      if (data.teachers && Array.isArray(data.teachers)) {
        setTeachers(data.teachers);
      } else if (Array.isArray(data)) {
        setTeachers(data);
      } else {
        console.error('Unexpected teachers response format:', data);
        setTeachers([]);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]);
      toast({
        title: "Error",
        description: "Failed to load teachers",
        variant: "destructive",
      });
    }
  };

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
    }
  };

  const handleAddSection = async () => {
    try {
      // Validate required fields
      if (!newSection.name || !newSection.gradeId) {
        toast({
          title: "Error",
          description: "Section name and class are required",
          variant: "destructive",
        });
        return;
      }

      // Make sure capacity is a number
      const sectionData = {
        ...newSection,
        capacity: Number(newSection.capacity) || 30,
        // If supervisorId is "NONE", send null or empty string
        supervisorId: newSection.supervisorId === "NONE" ? "" : newSection.supervisorId
      };

      const response = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sectionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add section');
      }

      toast({
        title: "Success",
        description: "Section added successfully",
        variant: "default",
      });

      setIsAddDialogOpen(false);
      setNewSection({
        name: '',
        capacity: 30,
        supervisorId: '',
        gradeId: 0
      });
      fetchSections();
    } catch (error) {
      console.error('Error adding section:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add section",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSection = async () => {
    if (!selectedSection) return;

    try {
      console.log("Updating section with data:", {
        name: selectedSection.name,
        capacity: selectedSection.capacity,
        supervisorId: selectedSection.supervisor?._id || 'NONE',
        gradeId: selectedSection.grade._id
      });

      const response = await fetch(`/api/admin/classes/${selectedSection._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedSection.name,
          capacity: selectedSection.capacity,
          supervisorId: selectedSection.supervisor?._id || 'NONE',
          gradeId: selectedSection.grade._id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update section');
      }

      const data = await response.json();
      console.log("Section updated successfully:", data);

      toast({
        title: "Success",
        description: "Section updated successfully",
        variant: "default",
      });

      setIsEditDialogOpen(false);
      fetchSections();
    } catch (error) {
      console.error('Error updating section:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update section",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!confirm('Are you sure you want to delete this section? This will affect all associated students and timetable.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/classes/${sectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete section');
      }

      toast({
        title: "Success",
        description: "Section deleted successfully",
        variant: "default",
      });

      fetchSections();
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete section",
        variant: "destructive",
      });
    }
  };

  // Generate section name suggestions for a class (I-A, I-B, etc.)
  const generateSectionSuggestion = (gradeId: number) => {
    if (!gradeId || !Array.isArray(grades)) return '';

    const grade = grades.find(g => g._id === gradeId);
    if (!grade) return '';

    const existingSections = Array.isArray(sections) ? sections.filter(s => s.grade?._id === gradeId) : [];
    const sectionLetters = existingSections.map(s => {
      // Extract section letter from name like "IX-A" -> "A"
      const match = s.name?.match(/[A-Z]$/);
      return match ? match[0] : '';
    });

    // Find the next available section letter
    let nextLetter = 'A';
    while (sectionLetters.includes(nextLetter)) {
      nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
    }

    return `${romanize(grade.level)}-${nextLetter}`;
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Section Management</h1>

        <div className="mt-4 sm:mt-0">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Sections</CardTitle>
              <CardDescription className="mt-2">
                Manage class sections, assign class teachers, and set capacities
              </CardDescription>
            </div>
            <div className="mt-4 sm:mt-0 relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sections..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Class Teacher</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Students</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">Loading sections...</TableCell>
                </TableRow>
              ) : !Array.isArray(filteredSections) || filteredSections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">No sections found</TableCell>
                </TableRow>
              ) : (
                filteredSections.map((section) => (
                  <TableRow key={section._id}>
                    <TableCell className="font-medium">{section.name || 'N/A'}</TableCell>
                    <TableCell>Class {romanize(section.grade?.level || 0)}</TableCell>
                    <TableCell>
                      {section.supervisor ?
                        `${section.supervisor.name} ${section.supervisor.surname}` :
                        <span className="text-muted-foreground">None assigned</span>
                      }
                    </TableCell>
                    <TableCell>{section.capacity || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{section.studentCount || 0}</span>
                        {(section.studentCount || 0) >= (section.capacity || 0) && (
                          <span className="ml-2 text-red-500">(Full)</span>
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
                            onClick={() => fetchSectionStudents(section._id, section.name)}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            View Students
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedSection(section);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteSection(section._id)}
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

      {/* Add Section Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
            <DialogDescription>
              Create a new section for students.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="grade">Class</Label>
              <Select
                value={newSection.gradeId.toString()}
                onValueChange={(value) => {
                  const gradeId = parseInt(value);
                  setNewSection({
                    ...newSection,
                    gradeId: gradeId,
                    name: generateSectionSuggestion(gradeId)
                  });
                }}
              >
                <SelectTrigger id="grade">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(grades) && grades.map((grade) => (
                    <SelectItem key={grade._id} value={grade._id?.toString() || ''}>
                      Class {romanize(grade.level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Section Name</Label>
              <Input
                id="name"
                value={newSection.name}
                onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                placeholder="e.g., IX-A"
              />
              <div className="text-xs text-muted-foreground">
                Typically follows format like "IX-A", "IX-B", etc.
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={newSection.capacity}
                onChange={(e) => setNewSection({ ...newSection, capacity: parseInt(e.target.value) || 30 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supervisor">Class Teacher</Label>
              <Select
                value={newSection.supervisorId}
                onValueChange={(value) => setNewSection({ ...newSection, supervisorId: value })}
              >
                <SelectTrigger id="supervisor">
                  <SelectValue placeholder="Select a class teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  {Array.isArray(teachers) && teachers.map((teacher) => (
                    <SelectItem key={teacher._id} value={teacher._id}>
                      {teacher.name} {teacher.surname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSection}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>
              Update section information.
            </DialogDescription>
          </DialogHeader>
          {selectedSection && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Section Name</Label>
                <Input
                  id="edit-name"
                  value={selectedSection.name || ''}
                  onChange={(e) => setSelectedSection({
                    ...selectedSection,
                    name: e.target.value
                  })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  min="1"
                  value={selectedSection.capacity || 0}
                  onChange={(e) => setSelectedSection({
                    ...selectedSection,
                    capacity: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-grade">Class</Label>
                <Select
                  value={selectedSection.grade?._id?.toString() || ''}
                  onValueChange={(value) => setSelectedSection({
                    ...selectedSection,
                    grade: {
                      ...selectedSection.grade,
                      _id: parseInt(value) || 0
                    }
                  })}
                >
                  <SelectTrigger id="edit-grade">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(grades) && grades.map((grade) => (
                      <SelectItem key={grade._id} value={grade._id?.toString() || ''}>
                        Class {romanize(grade.level)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-supervisor">Class Teacher</Label>
                <Select
                  value={selectedSection.supervisor?._id || ""}
                  onValueChange={(value) => setSelectedSection({
                    ...selectedSection,
                    supervisor: value ?
                      { _id: value, name: "", surname: "" } :
                      undefined
                  })}
                >
                  <SelectTrigger id="edit-supervisor">
                    <SelectValue placeholder="Select a class teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    {Array.isArray(teachers) && teachers.map((teacher) => (
                      <SelectItem key={teacher._id} value={teacher._id}>
                        {teacher.name} {teacher.surname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSection}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Students List Dialog */}
      <Dialog open={isStudentsDialogOpen} onOpenChange={setIsStudentsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Students in {selectedSectionName}</DialogTitle>
            <DialogDescription>
              List of all students enrolled in this section
            </DialogDescription>
          </DialogHeader>

          {loadingStudents ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !Array.isArray(sectionStudents) || sectionStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No students in this section yet</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-3">
                {sectionStudents.map((student) => (
                  <div key={student._id} className="flex items-center p-3 border rounded-md">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={student.img} alt={`${student.name} ${student.surname}`} />
                      <AvatarFallback>
                        {student.name?.charAt(0) || ''}{student.surname?.charAt(0) || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">{student.name} {student.surname}</h4>
                      <p className="text-sm text-muted-foreground">
                        Roll No: {student.rollNo || 'Not assigned'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStudentsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
