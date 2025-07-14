"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, FileText, Upload, File, X,
  Calendar, BookOpen, User
} from "lucide-react";
import Link from "next/link";

type Assignment = {
  id: string;
  title: string;
  description: string;
  subject: string;
  teacher: string;
  startDate: string;
  dueDate: string;
  maxGrade: number;
};

export default function SubmitAssignment({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if assignment is overdue
  const isOverdue = () => {
    if (!assignment) return false;
    return new Date(assignment.dueDate) < new Date();
  };

  useEffect(() => {
    fetchAssignment();
  }, [params.id]);

  const fetchAssignment = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/student/assignments/${params.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch assignment');
      }

      const data = await response.json();
      setAssignment(data);
    } catch (error) {
      console.error('Error fetching assignment:', error);
      toast({
        title: "Error",
        description: "Failed to load assignment details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one file",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create form data for file upload
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('comments', comments);
      formData.append('assignmentId', params.id);

      const response = await fetch('/api/student/assignments/submit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit assignment');
      }

      toast({
        title: "Success",
        description: "Your assignment has been submitted successfully",
        variant: "default",
      });

      // Redirect back to assignments page
      setTimeout(() => {
        router.push('/student/assignments');
      }, 1500);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: "Error",
        description: "Failed to submit assignment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <p>Loading assignment details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!assignment) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Assignment Not Found</h2>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            The assignment you're looking for doesn't exist or you don't have permission to access it.
          </p>
          <Button asChild>
            <Link href="/student/assignments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assignments
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" className="mr-4" asChild>
          <Link href="/student/assignments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Submit Assignment</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{assignment.title}</CardTitle>
            <CardDescription>
              Assignment Details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {assignment.description}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <p className="flex items-center text-sm font-medium">
                  <BookOpen className="h-4 w-4 mr-1 text-muted-foreground" />
                  {assignment.subject}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Teacher</Label>
                <p className="flex items-center text-sm font-medium">
                  <User className="h-4 w-4 mr-1 text-muted-foreground" />
                  {assignment.teacher}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Start Date</Label>
                <p className="flex items-center text-sm font-medium">
                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                  {formatDate(assignment.startDate)}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Due Date</Label>
                <p className="flex items-center text-sm font-medium">
                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                  {formatDate(assignment.dueDate)}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Maximum Grade</Label>
              <p className="text-sm font-medium">{assignment.maxGrade} points</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Submission</CardTitle>
            <CardDescription>
              Upload your work for this assignment
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comments">Additional Comments (Optional)</Label>
                <Textarea
                  id="comments"
                  placeholder="Add any comments or notes for your teacher..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Upload Files</Label>
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium mb-1">Drag & drop files here</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    or click to browse for files
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Files
                  </Button>
                </div>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files</Label>
                  <div className="rounded-lg border divide-y">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3">
                        <div className="flex items-center">
                          <File className="h-5 w-5 text-muted-foreground mr-2" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push('/student/assignments')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isOverdue() || files.length === 0}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {isOverdue() && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-red-800">
            <span className="font-medium">
              This assignment is past due. You can no longer submit your work.
            </span>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
