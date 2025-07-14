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
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  PlusCircle, Search, MoreVertical, Pencil, Trash2, BookOpen, Check, X
} from "lucide-react";

// Function to convert number to Roman numerals for class display
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

type Subject = {
  id: number;
  name: string;
  description: string;
  grade: number;
  gradeId: number;
  isCore: boolean;
  passingMarks: number;
  fullMarks: number;
  hasTheory: boolean;
  hasPractical: boolean;
};

type Grade = {
  _id: number;
  level: number;
};

export default function SubjectsManagement() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New subject form state
  const [newSubject, setNewSubject] = useState({
    name: '',
    description: '',
    gradeId: '',
    isCore: true,
    hasTheory: true,
    hasPractical: false,
    passingMarks: 33,
    fullMarks: 100
  });

  useEffect(() => {
    fetchGrades();
  }, []);

  useEffect(() => {
    if (Array.isArray(grades) && grades.length > 0) {
      fetchSubjects();
    }
  }, [grades]);

  useEffect(() => {
    // Filter subjects based on search term and selected grade
    let filtered = Array.isArray(subjects) ? subjects : [];

    if (selectedGrade !== 'all') {
      filtered = filtered.filter(subject =>
        subject.gradeId === parseInt(selectedGrade)
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(subject =>
        subject.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subject.description && subject.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredSubjects(filtered);
  }, [subjects, selectedGrade, searchTerm]);

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
      setIsLoading(true);
      const response = await fetch('/api/admin/subjects');

      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }

      const data = await response.json();

      // Handle different response formats
      if (data.subjects && Array.isArray(data.subjects)) {
        setSubjects(data.subjects);
        setFilteredSubjects(data.subjects);
      } else if (Array.isArray(data)) {
        setSubjects(data);
        setFilteredSubjects(data);
      } else {
        console.error('Unexpected subjects response format:', data);
        setSubjects([]);
        setFilteredSubjects([]);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
      setFilteredSubjects([]);
      toast({
        title: "Error",
        description: "Failed to load subjects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubject = async () => {
    try {
      if (!newSubject.name || !newSubject.gradeId) {
        toast({
          title: "Validation Error",
          description: "Subject name and class are required",
          variant: "destructive",
        });
        return;
      }

      // Ensure all numeric fields are actually numbers
      const subjectData = {
        ...newSubject,
        passingMarks: Number(newSubject.passingMarks),
        fullMarks: Number(newSubject.fullMarks),
        gradeId: newSubject.gradeId // This should already be a string ID
      };

      console.log("Submitting subject data:", subjectData);

      const response = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subjectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create subject');
      }

      const result = await response.json();
      console.log("Subject creation response:", result);

      toast({
        title: "Success",
        description: "Subject created successfully",
        variant: "default",
      });

      setIsAddDialogOpen(false);
      setNewSubject({
        name: '',
        description: '',
        gradeId: '',
        isCore: true,
        hasTheory: true,
        hasPractical: false,
        passingMarks: 33,
        fullMarks: 100
      });
      fetchSubjects();
    } catch (error) {
      console.error('Error creating subject:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create subject",
        variant: "destructive",
      });
    }
  };

  const handleEditSubject = async () => {
    if (!selectedSubject) return;

    try {
      const response = await fetch(`/api/admin/subjects/${selectedSubject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedSubject.name,
          description: selectedSubject.description,
          gradeId: selectedSubject.gradeId,
          isCore: selectedSubject.isCore,
          hasTheory: selectedSubject.hasTheory,
          hasPractical: selectedSubject.hasPractical,
          passingMarks: selectedSubject.passingMarks,
          fullMarks: selectedSubject.fullMarks
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update subject');
      }

      toast({
        title: "Success",
        description: "Subject updated successfully",
        variant: "default",
      });

      setIsEditDialogOpen(false);
      fetchSubjects();
    } catch (error) {
      console.error('Error updating subject:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update subject",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    if (!confirm('Are you sure you want to delete this subject? This may affect classes and timetable.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/subjects/${subjectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete subject');
      }

      toast({
        title: "Success",
        description: "Subject deleted successfully",
        variant: "default",
      });

      fetchSubjects();
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete subject",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Subjects Management</h1>

        <div className="mt-4 sm:mt-0">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
        </div>
      </div>

      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
        <div className="w-full sm:w-64">
          <Select
            value={selectedGrade}
            onValueChange={setSelectedGrade}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {Array.isArray(grades) && grades.map((grade) => (
                <SelectItem key={grade._id} value={grade._id?.toString() || ''}>
                  Class {romanize(grade.level)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subjects..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Subjects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Assessment</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">Loading subjects...</TableCell>
                </TableRow>
              ) : !Array.isArray(filteredSubjects) || filteredSubjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    {searchTerm || selectedGrade !== 'all' ? (
                      <p>No subjects match your filters</p>
                    ) : (
                      <div>
                        <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p>No subjects have been created yet</p>
                        <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                          Create Your First Subject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        Class {romanize(subject.grade || 0)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={subject.isCore ? "default" : "secondary"}>
                        {subject.isCore ? "Core" : "Elective"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {subject.hasTheory && <Badge variant="outline">Theory</Badge>}
                        {subject.hasPractical && <Badge variant="outline">Practical</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {subject.fullMarks || 0} (Pass: {subject.passingMarks || 0}%)
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
                              setSelectedSubject(subject);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteSubject(subject.id)}
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

      {/* Add Subject Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
            <DialogDescription>
              Create a new subject for the curriculum.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Subject Name</Label>
              <Input
                id="name"
                value={newSubject.name}
                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                placeholder="e.g., Mathematics, Hindi, Science"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newSubject.description}
                onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                placeholder="Subject description and learning objectives"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="grade">Class</Label>
              <Select
                value={newSubject.gradeId}
                onValueChange={(value) => setNewSubject({ ...newSubject, gradeId: value })}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isCore"
                  checked={newSubject.isCore}
                  onCheckedChange={(checked) =>
                    setNewSubject({ ...newSubject, isCore: checked as boolean })
                  }
                />
                <Label htmlFor="isCore">Core Subject</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasTheory"
                  checked={newSubject.hasTheory}
                  onCheckedChange={(checked) =>
                    setNewSubject({ ...newSubject, hasTheory: checked as boolean })
                  }
                />
                <Label htmlFor="hasTheory">Has Theory</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasPractical"
                  checked={newSubject.hasPractical}
                  onCheckedChange={(checked) =>
                    setNewSubject({ ...newSubject, hasPractical: checked as boolean })
                  }
                />
                <Label htmlFor="hasPractical">Has Practical</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullMarks">Full Marks</Label>
                <Input
                  id="fullMarks"
                  type="number"
                  min="1"
                  value={newSubject.fullMarks}
                  onChange={(e) => setNewSubject({ ...newSubject, fullMarks: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="passingMarks">Passing Percentage</Label>
                <Input
                  id="passingMarks"
                  type="number"
                  min="1"
                  max="100"
                  value={newSubject.passingMarks}
                  onChange={(e) => setNewSubject({ ...newSubject, passingMarks: parseInt(e.target.value) || 0 })}
                />
                <div className="text-xs text-muted-foreground">Standard is 33%</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSubject}>Create Subject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>
              Update subject information.
            </DialogDescription>
          </DialogHeader>
          {selectedSubject && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Subject Name</Label>
                <Input
                  id="edit-name"
                  value={selectedSubject.name || ''}
                  onChange={(e) => setSelectedSubject({
                    ...selectedSubject,
                    name: e.target.value
                  })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedSubject.description || ''}
                  onChange={(e) => setSelectedSubject({
                    ...selectedSubject,
                    description: e.target.value
                  })}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-grade">Class</Label>
                <Select
                  value={selectedSubject.gradeId?.toString() || ''}
                  onValueChange={(value) => setSelectedSubject({
                    ...selectedSubject,
                    gradeId: parseInt(value) || 0
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
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-isCore"
                    checked={selectedSubject.isCore}
                    onCheckedChange={(checked) =>
                      setSelectedSubject({ ...selectedSubject, isCore: checked as boolean })
                    }
                  />
                  <Label htmlFor="edit-isCore">Core Subject</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-hasTheory"
                    checked={selectedSubject.hasTheory}
                    onCheckedChange={(checked) =>
                      setSelectedSubject({ ...selectedSubject, hasTheory: checked as boolean })
                    }
                  />
                  <Label htmlFor="edit-hasTheory">Has Theory</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-hasPractical"
                    checked={selectedSubject.hasPractical}
                    onCheckedChange={(checked) =>
                      setSelectedSubject({ ...selectedSubject, hasPractical: checked as boolean })
                    }
                  />
                  <Label htmlFor="edit-hasPractical">Has Practical</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-fullMarks">Full Marks</Label>
                  <Input
                    id="edit-fullMarks"
                    type="number"
                    min="1"
                    value={selectedSubject.fullMarks || 0}
                    onChange={(e) => setSelectedSubject({
                      ...selectedSubject,
                      fullMarks: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-passingMarks">Passing Percentage</Label>
                  <Input
                    id="edit-passingMarks"
                    type="number"
                    min="1"
                    max="100"
                    value={selectedSubject.passingMarks || 0}
                    onChange={(e) => setSelectedSubject({
                      ...selectedSubject,
                      passingMarks: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubject}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
