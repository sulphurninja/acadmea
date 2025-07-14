"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Users, Calendar, ClipboardList, Clock,
  ArrowRight, Bell, CheckCircle2, Layers, Award
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type TeacherStats = {
  totalClasses: number;
  totalStudents: number;
  upcomingLessons: number;
  pendingAssignments: number;
};

type UpcomingClass = {
  id: string;
  subject: string;
  className: string;
  section: string;
  time: string;
  room: string;
};

type PendingAssignment = {
  id: string;
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  submissions: number;
  totalStudents: number;
};

type Announcement = {
  id: string;
  title: string;
  date: string;
  isNew: boolean;
};

type Event = {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  class?: {
    id: string;
    name: string;
  } | null;
  isNew: boolean;
};

// Helper for Roman numerals for class display
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

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]); // Replace announcements with events

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        // Fetch teacher stats
        const statsResponse = await fetch('/api/teacher/stats');
        const statsData = await statsResponse.json();
        setStats(statsData);

        // Fetch upcoming classes for today
        const classesResponse = await fetch('/api/teacher/today-schedule');
        const classesData = await classesResponse.json();
        setUpcomingClasses(classesData);

        // Fetch pending assignments
        const assignmentsResponse = await fetch('/api/teacher/pending-assignments');
        const assignmentsData = await assignmentsResponse.json();
        setPendingAssignments(assignmentsData);

        // Fetch school events instead of announcements
        const eventsResponse = await fetch('/api/events?upcoming=true&limit=5');
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Format time for display
  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };
  // Format date and time for events
  const formatEventTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } catch {
      return dateString;
    }
  };

  // Get current date in Indian format
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });


  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name || 'Teacher'}</h1>
        <p className="text-muted-foreground">{today}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">My Classes</p>
                {/* {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.totalClasses || 0}</p>
                )} */}
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
            <Button variant="link" className="px-0 mt-2" asChild>
              <Link href="/teacher/classes">
                View Classes <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Students</p>
                {/* {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.totalStudents || 0}</p>
                )} */}
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <Button variant="link" className="px-0 mt-2" asChild>
              <Link href="/teacher/students">
                View Students <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>



        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Assignments</p>
                {/* {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.pendingAssignments || 0}</p>
                )} */}
              </div>
              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500">
                <ClipboardList className="h-6 w-6" />
              </div>
            </div>
            <Button variant="link" className="px-0 mt-2" asChild>
              <Link href="/teacher/assignments">
                View Assignments <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Upcoming Classes */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Today's Class Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-10 w-20" />
                  </div>
                ))}
              </div>
            ) : upcomingClasses.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium text-lg mb-1">No Classes Today</h3>
                <p className="text-muted-foreground mb-4">You have no scheduled classes for today.</p>
                <Button variant="outline" asChild>
                  <Link href="/teacher/schedule">View Full Schedule</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium">{cls.subject}</h3>
                          <p className="text-sm text-muted-foreground">
                            Class {romanize(parseInt(cls.className))} - {cls.section} • Room {cls.room}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(cls.time)}
                    </Badge>
                  </div>
                ))}
                <div className="pt-2">
                  <Button variant="link" className="px-0" asChild>
                    <Link href="/teacher/schedule">
                      View Full Schedule <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column - Announcements and Tasks */}
        <div className="space-y-6">
          {/* Announcements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No upcoming events</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="pb-3 border-b last:border-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium flex items-center">
                          {event.title}
                          {event.isNew && (
                            <Badge className="ml-2" variant="default">New</Badge>
                          )}
                        </h3>
                      </div>
                      <p className="text-sm">{event.description}</p>
                      <div className="flex justify-between mt-1">
                        <p className="text-sm text-muted-foreground">
                          {formatEventTime(event.startTime)}
                        </p>
                        {event.class && (
                          <Badge variant="outline">{event.class.name}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Button variant="link" className="px-0" asChild>
                      <Link href="/teacher/calendar">
                        View All Events <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <ClipboardList className="h-5 w-5 mr-2" />
                Pending Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : pendingAssignments.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No pending assignments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingAssignments.map((assignment) => (
                    <div key={assignment.id} className="pb-3 border-b last:border-0">
                      <h3 className="font-medium">{assignment.title}</h3>
                      <div className="flex justify-between text-sm">
                        <p className="text-muted-foreground">Due: {formatDate(assignment.dueDate)}</p>
                        <p className="text-muted-foreground">
                          {assignment.submissions}/{assignment.totalStudents} submissions
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Button variant="link" className="px-0" asChild>
                      <Link href="/teacher/assignments">
                        Grade Assignments <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
