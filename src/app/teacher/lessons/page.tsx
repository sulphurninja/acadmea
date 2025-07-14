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
  VideoIcon, Search, MoreVertical, PlusCircle,
  Pencil, Eye, Trash2, PlayCircle, Clock
} from "lucide-react";
import Link from "next/link";

type VideoLesson = {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  duration: number;
  videoUrl: string;
  thumbnailUrl: string;
  createdAt: string;
  views: number;
  isPublished: boolean;
};

export default function TeacherLessons() {
  const [lessons, setLessons] = useState<VideoLesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<VideoLesson[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLessons();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = lessons.filter(lesson =>
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.class.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLessons(filtered);
    } else {
      setFilteredLessons(lessons);
    }
  }, [lessons, searchTerm]);

  const fetchLessons = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/teacher/lessons');

      if (!response.ok) {
        throw new Error('Failed to fetch lessons');
      }

      const data = await response.json();
      setLessons(data);
      setFilteredLessons(data);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: "Error",
        description: "Failed to load video lessons",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete lesson');
      }

      toast({
        title: "Success",
        description: "Lesson deleted successfully",
        variant: "default",
      });

      // Update lessons list
      setLessons(lessons.filter(lesson => lesson.id !== lessonId));
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast({
        title: "Error",
        description: "Failed to delete lesson",
        variant: "destructive",
      });
    }
  };

  const toggleLessonPublish = async (lessonId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/teacher/lessons/${lessonId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update lesson');
      }

      toast({
        title: "Success",
        description: `Lesson ${!currentStatus ? 'published' : 'unpublished'} successfully`,
        variant: "default",
      });

      // Update lessons list
      setLessons(lessons.map(lesson =>
        lesson.id === lessonId
          ? { ...lesson, isPublished: !currentStatus }
          : lesson
      ));
    } catch (error) {
      console.error('Error updating lesson:', error);
      toast({
        title: "Error",
        description: "Failed to update lesson",
        variant: "destructive",
      });
    }
  };

  // Format duration from minutes to hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Video Lessons</h1>

        <div className="mt-4 sm:mt-0">
          <Button asChild>
            <Link href="/teacher/lessons/upload">
              <PlusCircle className="h-4 w-4 mr-2" />
              Upload New Lesson
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Your Video Lessons</CardTitle>
            <div className="mt-4 sm:mt-0 relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search lessons..."
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
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">Loading lessons...</TableCell>
                </TableRow>
              ) : filteredLessons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    {searchTerm ? (
                      <p>No lessons match your search</p>
                    ) : (
                      <div>
                        <VideoIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p>You haven't uploaded any video lessons yet</p>
                        <Button variant="outline" className="mt-4" asChild>
                          <Link href="/teacher/lessons/upload">Upload Your First Lesson</Link>
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center mr-3">
                          <VideoIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="truncate max-w-[200px]">
                          {lesson.title}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{lesson.subject}</TableCell>
                    <TableCell>{lesson.class}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        {formatDuration(lesson.duration)}
                      </div>
                    </TableCell>
                    <TableCell>{lesson.views}</TableCell>
                    <TableCell>
                      <Badge variant={lesson.isPublished ? "default" : "outline"}>
                        {lesson.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/teacher/lessons/${lesson.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/teacher/lessons/${lesson.id}/edit`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleLessonPublish(lesson.id, lesson.isPublished)}>
                            {lesson.isPublished ? (
                              <>
                                <Eye className="h-4 w-4 mr-2 text-red-500" />
                                <span className="text-red-500">Unpublish</span>
                              </>
                            ) : (
                              <>
                                <PlayCircle className="h-4 w-4 mr-2 text-green-500" />
                                <span className="text-green-500">Publish</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteLesson(lesson.id)}
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
    </DashboardLayout>
  );
}
