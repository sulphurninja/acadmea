"use client";
import { useState, useEffect } from "react";
import { format, isAfter, isBefore, isToday } from "date-fns";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus, FileText, Trash2, PenLine, Clock, X, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Class = {
  id: string;
  name: string;
};

type Subject = {
  id: number;
  name: string;
};

type Assignment = {
  id: number;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  subject: {
    id: number;
    name: string;
  };
};

type AssignmentFormData = {
  title: string;
  description: string;
  startDate: Date | undefined;
  dueDate: Date | undefined;
  subjectId: number | undefined;
};

export default function TeacherAssignments() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: "",
    description: "",
    startDate: undefined,
    dueDate: undefined,
    subjectId: undefined,
  });
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    description?: string;
    startDate?: string;
    dueDate?: string;
    subjectId?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [selectedClass, selectedSubject]);

  useEffect(() => {
    filterAssignments();
  }, [assignments, activeTab]);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/teacher/classes");
      if (!response.ok) {
        throw new Error("Failed to fetch classes");
      }
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast({
        title: "Error",
        description: "Failed to load classes",
        variant: "destructive",
      });
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/teacher/subjects");
      if (!response.ok) {
        throw new Error("Failed to fetch subjects");
      }
      const data = await response.json();
      setSubjects(data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast({
        title: "Error",
        description: "Failed to load subjects",
        variant: "destructive",
      });
    }
  };

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      let url = "/api/teacher/assignments?";

      if (selectedClass !== "all") {
        url += `classId=${selectedClass}&`;
      }

      if (selectedSubject !== "all") {
        url += `subjectId=${selectedSubject}&`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch assignments");
      }

      const data = await response.json();
      setAssignments(data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAssignments = () => {
    const now = new Date();

    let filtered = assignments;

    // Filter by tab (status)
    if (activeTab === "active") {
      filtered = filtered.filter(
        (assignment) =>
          isToday(new Date(assignment.startDate)) ||
          (isBefore(new Date(assignment.startDate), now) &&
            isAfter(new Date(assignment.dueDate), now))
      );
    } else if (activeTab === "upcoming") {
      filtered = filtered.filter((assignment) =>
        isAfter(new Date(assignment.startDate), now)
      );
    } else if (activeTab === "past") {
      filtered = filtered.filter((assignment) =>
        isBefore(new Date(assignment.dueDate), now)
      );
    }

    setFilteredAssignments(filtered);
  };

  const handleAddAssignment = () => {
    setFormData({
      title: "",
      description: "",
      startDate: new Date(),
      dueDate: undefined,
      subjectId: undefined,
    });
    setFormErrors({});
    setShowAddDialog(true);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      startDate: new Date(assignment.startDate),
      dueDate: new Date(assignment.dueDate),
      subjectId: assignment.subject.id,
    });
    setFormErrors({});
    setShowEditDialog(true);
  };

  const handleDeleteAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowDeleteDialog(true);
  };

  const validateForm = (): boolean => {
    const errors: {
      title?: string;
      description?: string;
      startDate?: string;
      dueDate?: string;
      subjectId?: string;
    } = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required";
    }

    if (!formData.startDate) {
      errors.startDate = "Start date is required";
    }

    if (!formData.dueDate) {
      errors.dueDate = "Due date is required";
    } else if (
      formData.startDate &&
      formData.dueDate &&
      isBefore(formData.dueDate, formData.startDate)
    ) {
      errors.dueDate = "Due date must be after start date";
    }

    if (!formData.subjectId) {
      errors.subjectId = "Subject is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAssignment = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          startDate: formData.startDate?.toISOString(),
          dueDate: formData.dueDate?.toISOString(),
          subjectId: formData.subjectId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create assignment");
      }

      const data = await response.json();

      toast({
        title: "Success",
        description: "Assignment created successfully",
      });

      setShowAddDialog(false);
      fetchAssignments();
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast({
        title: "Error",
        description: "Failed to create assignment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAssignment = async () => {
    if (!selectedAssignment || !validateForm()) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/teacher/assignments/${selectedAssignment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          startDate: formData.startDate?.toISOString(),
          dueDate: formData.dueDate?.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update assignment");
      }

      toast({
        title: "Success",
        description: "Assignment updated successfully",
      });

      setShowEditDialog(false);
      fetchAssignments();
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast({
        title: "Error",
        description: "Failed to update assignment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignmentConfirm = async () => {
    if (!selectedAssignment) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/teacher/assignments/${selectedAssignment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete assignment");
      }

      toast({
        title: "Success",
        description: "Assignment deleted successfully",
      });

      setShowDeleteDialog(false);
      fetchAssignments();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast({
        title: "Error",
        description: "Failed to delete assignment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get assignment status
  const getAssignmentStatus = (startDate: string, dueDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const due = new Date(dueDate);

    if (isAfter(start, now)) {
      return { label: "Upcoming", variant: "outline", icon: Clock };
    } else if (isBefore(due, now)) {
      return { label: "Past", variant: "destructive", icon: X };
    } else {
      return { label: "Active", variant: "default", icon: CheckCircle2 };
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Assignments</h1>
        <Button
          onClick={handleAddAssignment}
          className="mt-4 sm:mt-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Assignment
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter assignments by class and subject
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium leading-none mb-2 block">
                Class
              </label>
              <Select
                value={selectedClass}
                onValueChange={setSelectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
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

            <div>
              <label className="text-sm font-medium leading-none mb-2 block">
                Subject
              </label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger>
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
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="text-center py-10">Loading assignments...</div>
      ) : filteredAssignments.length === 0 ? (
       <Card>
          <CardContent className="py-10 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No {activeTab !== "all" ? activeTab : ""} assignments found
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssignments.map((assignment) => {
            const status = getAssignmentStatus(assignment.startDate, assignment.dueDate);

            return (
              <Card key={assignment.id} className="overflow-hidden">
                <div className="flex justify-between items-start p-6">
                  <div className="space-y-1">
                    <CardTitle className="line-clamp-1">{assignment.title}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      {assignment.subject.name}
                    </CardDescription>
                  </div>
                  <Badge variant={status.variant as any} className="ml-2 capitalize">
                    <status.icon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
                <CardContent className="p-6 pt-0">
                  <div className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {assignment.description}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p>{format(new Date(assignment.startDate), "MMM dd, yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Due Date</p>
                      <p>{format(new Date(assignment.dueDate), "MMM dd, yyyy")}</p>
                    </div>
                  </div>
                </CardContent>
                <div className="bg-muted/50 px-6 py-4 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditAssignment(assignment)}
                    className="mr-2"
                  >
                    <PenLine className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAssignment(assignment)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Assignment Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Assignment</DialogTitle>
            <DialogDescription>
              Add a new assignment for your class or subject
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Assignment title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              {formErrors.title && (
                <p className="text-sm text-destructive">{formErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description and instructions"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              {formErrors.description && (
                <p className="text-sm text-destructive">{formErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                      id="startDate"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? (
                        format(formData.startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => setFormData({ ...formData, startDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {formErrors.startDate && (
                  <p className="text-sm text-destructive">{formErrors.startDate}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.dueDate && "text-muted-foreground"
                      )}
                      id="dueDate"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dueDate ? (
                        format(formData.dueDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.dueDate}
                      onSelect={(date) => setFormData({ ...formData, dueDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {formErrors.dueDate && (
                  <p className="text-sm text-destructive">{formErrors.dueDate}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select
                value={formData.subjectId?.toString()}
                onValueChange={(value) => setFormData({ ...formData, subjectId: Number(value) })}
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.subjectId && (
                <p className="text-sm text-destructive">{formErrors.subjectId}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreateAssignment} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>
              Update the assignment details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                placeholder="Assignment title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              {formErrors.title && (
                <p className="text-sm text-destructive">{formErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Description and instructions"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              {formErrors.description && (
                <p className="text-sm text-destructive">{formErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                      id="edit-startDate"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? (
                        format(formData.startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => setFormData({ ...formData, startDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {formErrors.startDate && (
                  <p className="text-sm text-destructive">{formErrors.startDate}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dueDate">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.dueDate && "text-muted-foreground"
                      )}
                      id="edit-dueDate"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dueDate ? (
                        format(formData.dueDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.dueDate}
                      onSelect={(date) => setFormData({ ...formData, dueDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {formErrors.dueDate && (
                  <p className="text-sm text-destructive">{formErrors.dueDate}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <div className="p-2 border rounded-md bg-muted/50">
                {selectedAssignment?.subject.name}
              </div>
              <p className="text-xs text-muted-foreground">
                Subject cannot be changed after creation
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateAssignment} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the assignment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAssignmentConfirm}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
