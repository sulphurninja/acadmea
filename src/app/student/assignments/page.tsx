"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Calendar, FileText, Upload,
  CheckCircle, Clock, Eye, BookOpen, AlertTriangle
} from "lucide-react";
import Link from "next/link";

type Assignment = {
  id: string;
  title: string;
  description: string;
  subject: string;
  subjectId: string;
  teacher: string;
  startDate: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  submitted?: string;
  grade?: number;
  maxGrade: number;
  feedback?: string;
};

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [subjects, setSubjects] = useState<{id: string, name: string}[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    // Get unique subjects from assignments
    if (assignments.length > 0) {
      const uniqueSubjects = Array.from(
        new Set(assignments.map(assignment => assignment.subjectId))
      ).map(subjectId => {
        const assignment = assignments.find(a => a.subjectId === subjectId);
        return {
          id: subjectId,
          name: assignment?.subject || 'Unknown'
        };
      });

      setSubjects(uniqueSubjects);
    }
  }, [assignments]);

  useEffect(() => {
    let filtered = assignments;

    // Filter by subject
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(assignment =>
        assignment.subjectId === selectedSubject
      );
    }

    // Filter by status
    if (activeTab === 'pending') {
      filtered = filtered.filter(assignment => assignment.status === 'pending');
    } else if (activeTab === 'submitted') {
      filtered = filtered.filter(assignment =>
        assignment.status === 'submitted' || assignment.status === 'graded'
      );
    } else if (activeTab === 'graded') {
      filtered = filtered.filter(assignment => assignment.status === 'graded');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.teacher.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAssignments(filtered);
  }, [assignments, selectedSubject, activeTab, searchTerm]);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/student/assignments');

      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }

      const data = await response.json();
      setAssignments(data);
      setFilteredAssignments(data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format dates
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check if assignment is overdue
  const isOverdue = (dueDate: string, status: string) => {
    return status === 'pending' && new Date(dueDate) < new Date();
  };

  // Get status badge properties
  const getStatusBadge = (assignment: Assignment) => {
    if (isOverdue(assignment.dueDate, assignment.status)) {
      return {
        variant: "destructive" as const,
        label: "Overdue",
        icon: <AlertTriangle className="h-3 w-3 mr-1" />
      };
    }

    switch (assignment.status) {
      case 'pending':
        return {
          variant: "outline" as const,
          label: "Pending",
          icon: <Clock className="h-3 w-3 mr-1" />
        };
      case 'submitted':
        return {
          variant: "default" as const,
          label: "Submitted",
          icon: <CheckCircle className="h-3 w-3 mr-1" />
        };
      case 'graded':
        return {
          variant: "success" as const,
          label: "Graded",
          icon: <CheckCircle className="h-3 w-3 mr-1" />
        };
      default:
        return {
          variant: "outline" as const,
          label: "Unknown",
          icon: null
        };
    }
  };

  // Calculate the remaining days until due
  const getDaysRemaining = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Assignments</h1>

      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="submitted">Submitted</TabsTrigger>
            <TabsTrigger value="graded">Graded</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex space-x-4">
          <div className="w-full sm:w-48">
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">Loading assignments...</TableCell>
                </TableRow>
              ) : filteredAssignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    {searchTerm || selectedSubject !== 'all' || activeTab !== 'all' ? (
                      <p>No assignments match your filters</p>
                    ) : (
                      <div>
                        <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p>You don't have any assignments yet</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssignments.map((assignment) => {
                  const statusBadge = getStatusBadge(assignment);
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {assignment.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1 text-muted-foreground" />
                          {assignment.subject}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                            {formatDate(assignment.dueDate)}
                          </div>
                          {assignment.status === 'pending' && (
                            <span className={`text-xs ${isOverdue(assignment.dueDate, assignment.status) ? 'text-red-500' : 'text-muted-foreground'}`}>
                              {getDaysRemaining(assignment.dueDate)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge  className="flex w-fit items-center">
                          {statusBadge.icon}
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assignment.status === 'graded' ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {assignment.grade}/{assignment.maxGrade}
                              </span>
                              <span className="text-sm font-medium">
                                {Math.round((assignment.grade! / assignment.maxGrade) * 100)}%
                              </span>
                            </div>
                            <Progress
                              value={(assignment.grade! / assignment.maxGrade) * 100}
                              className="h-2"
                            />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {assignment.status === 'pending' ? (
                          <Button asChild>
                            <Link href={`/student/assignments/${assignment.id}/submit`}>
                              <Upload className="h-4 w-4 mr-2" />
                              Submit
                            </Link>
                          </Button>
                        ) : (
                          <Button variant="outline" asChild>
                            <Link href={`/student/assignments/${assignment.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
