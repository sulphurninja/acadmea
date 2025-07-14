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
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  PlusCircle, MoreVertical, Pencil, Trash2, GraduationCap, Users, BookOpen
} from "lucide-react";

type Grade = {
  _id: number;
  level: number;
  name?: string;
  classes?: number;
  students?: number;
  subjects?: number;
};

// Helper function to get proper class nomenclature based on level
const getClassDisplayName = (level: number): string => {
  if (level <= 5) {
    return `Class ${romanize(level)} (Primary)`;
  } else if (level <= 8) {
    return `Class ${romanize(level)} (Middle)`;
  } else if (level <= 10) {
    return `Class ${romanize(level)} (Secondary)`;
  } else if (level <= 12) {
    return `Class ${romanize(level)} (Senior Secondary)`;
  }
  return `Class ${romanize(level)}`;
};

// Convert numbers to Roman numerals for class naming (common in Indian schools)
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

export default function GradesManagement() {
  const { toast } = useToast();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New grade form state
  const [newGrade, setNewGrade] = useState({
    level: '',
    name: ''
  });

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching grades...");

      const response = await fetch('/api/admin/grades');

      if (!response.ok) {
        throw new Error('Failed to fetch grades');
      }

      const data = await response.json();
      console.log("Raw grades response:", data);

      // Handle different response formats
      let gradesArray: Grade[] = [];
      if (data.grades && Array.isArray(data.grades)) {
        gradesArray = data.grades;
      } else if (Array.isArray(data)) {
        gradesArray = data;
      } else {
        console.error('Unexpected grades response format:', data);
        setGrades([]);
        return;
      }

      console.log("Parsed grades array:", gradesArray);

      // Fetch additional stats for each grade
      const enrichedGrades = await Promise.all(gradesArray.map(async (grade: Grade) => {
        try {
          // Get sections count (classes in Indian context)
          const classesRes = await fetch(`/api/admin/classes?gradeId=${grade._id}`);
          let classesCount = 0;
          if (classesRes.ok) {
            const classesData = await classesRes.json();
            classesCount = Array.isArray(classesData) ? classesData.length : 0;
          }

          // Get students count
          const studentsRes = await fetch(`/api/admin/students?gradeId=${grade._id}`);
          let studentsCount = 0;
          if (studentsRes.ok) {
            const studentsData = await studentsRes.json();
            studentsCount = studentsData.pagination?.total || 0;
          }

          // Get subjects count
          const subjectsRes = await fetch(`/api/admin/subjects?gradeId=${grade._id}`);
          let subjectsCount = 0;
          if (subjectsRes.ok) {
            const subjectsData = await subjectsRes.json();
            subjectsCount = subjectsData.pagination?.total || 0;
          }

          return {
            ...grade,
            classes: classesCount,
            students: studentsCount,
            subjects: subjectsCount
          };
        } catch (error) {
          console.error(`Error fetching stats for class ${grade.level}:`, error);
          return {
            ...grade,
            classes: 0,
            students: 0,
            subjects: 0
          };
        }
      }));

      console.log("Enriched grades:", enrichedGrades);
      setGrades(enrichedGrades);
    } catch (error) {
      console.error('Error fetching grades:', error);
      setGrades([]);
      toast({
        title: "Error",
        description: "Failed to load grades",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGrade = async () => {
    try {
      if (!newGrade.level) {
        toast({
          title: "Validation Error",
          description: "Class level is required",
          variant: "destructive",
        });
        return;
      }

      const level = parseInt(newGrade.level);
      if (isNaN(level) || level < 1 || level > 12) {
        toast({
          title: "Validation Error",
          description: "Class level must be between 1 and 12",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/admin/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: level,
          name: newGrade.name || getClassDisplayName(level)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create class');
      }

      toast({
        title: "Success",
        description: "Class created successfully",
        variant: "default",
      });

      setIsAddDialogOpen(false);
      setNewGrade({ level: '', name: '' });
      fetchGrades();
    } catch (error) {
      console.error('Error creating class:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create class",
        variant: "destructive",
      });
    }
  };

  const handleEditGrade = async () => {
    if (!selectedGrade) return;

    try {
      const response = await fetch(`/api/admin/grades/${selectedGrade._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: selectedGrade.level,
          name: selectedGrade.name
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update class');
      }

      toast({
        title: "Success",
        description: "Class updated successfully",
        variant: "default",
      });

      setIsEditDialogOpen(false);
      fetchGrades();
    } catch (error) {
      console.error('Error updating class:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update class",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGrade = async (gradeId: number) => {
    if (!confirm('Are you sure you want to delete this class? This will affect sections, subjects, and students.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/grades/${gradeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete class');
      }

      toast({
        title: "Success",
        description: "Class deleted successfully",
        variant: "default",
      });

      fetchGrades();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete class",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Class Management</h1>

        <div className="mt-4 sm:mt-0">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <GraduationCap className="h-5 w-5 mr-2" />
            Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Sections</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">Loading classes...</TableCell>
                </TableRow>
              ) : !Array.isArray(grades) || grades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div>
                      <GraduationCap className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p>No classes have been created yet</p>
                      <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                        Create Your First Class
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                grades.map((grade) => (
                  <TableRow key={grade._id}>
                    <TableCell className="font-medium">
                      Class {romanize(grade.level || 0)}
                    </TableCell>
                    <TableCell>
                      {grade.name || getClassDisplayName(grade.level || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1 text-muted-foreground" />
                        {grade.classes || 0} {grade.classes === 1 ? 'Section' : 'Sections'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        {grade.students || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1 text-muted-foreground" />
                        {grade.subjects || 0}
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
                              setSelectedGrade(grade);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteGrade(grade._id)}
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

      {/* Add Class Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
            <DialogDescription>
              Create a new class level for your school.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="level">Class Level (1-12)</Label>
              <Input
                id="level"
                type="number"
                min="1"
                max="12"
                value={newGrade.level}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewGrade({
                    ...newGrade,
                    level: value,
                    name: value ? getClassDisplayName(parseInt(value)) : ''
                  });
                }}
                placeholder="e.g., 9 for Class IX"
              />
              <div className="text-xs text-muted-foreground mt-1">
                1-5: Primary, 6-8: Middle, 9-10: Secondary, 11-12: Senior Secondary
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={newGrade.name}
                onChange={(e) => setNewGrade({...newGrade, name: e.target.value})}
                placeholder="e.g., Class IX (Secondary)"
              />
              {newGrade.level && (
                <div className="text-xs text-muted-foreground mt-1">
                  Default: {getClassDisplayName(parseInt(newGrade.level))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGrade}>Create Class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Update class information.
            </DialogDescription>
          </DialogHeader>
          {selectedGrade && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-level">Class Level (1-12)</Label>
                <Input
                  id="edit-level"
                  type="number"
                  min="1"
                  max="12"
                  value={selectedGrade.level || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setSelectedGrade({
                      ...selectedGrade,
                      level: value,
                      name: getClassDisplayName(value)
                    });
                  }}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  1-5: Primary, 6-8: Middle, 9-10: Secondary, 11-12: Senior Secondary
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Display Name</Label>
                <Input
                  id="edit-name"
                  value={selectedGrade.name || getClassDisplayName(selectedGrade.level || 0)}
                  onChange={(e) => setSelectedGrade({
                    ...selectedGrade,
                    name: e.target.value
                  })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditGrade}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
