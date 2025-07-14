"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Users, BookOpen, Calendar, AlertTriangle, Bell,
  Mail, Phone, MessageSquare, BarChart, FileText
} from "lucide-react";
import Link from "next/link";

type Child = {
  id: string;
  name: string;
  rollNo: string;
  avatar: string;
  grade: string;
  className: string;
  attendanceRate: number;
  upcomingExams: number;
  recentResults: number;
};

type Announcement = {
  id: number;
  title: string;
  date: Date;
  description: string;
};

type DashboardData = {
  parent: {
    name: string;
    email: string;
    phone: string;
  };
  children: Child[];
  announcements: Announcement[];
};

export default function ParentDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/parent/dashboard');

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <p>Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!dashboardData) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <p>Failed to load dashboard data</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Parent Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="" />
                <AvatarFallback className="text-lg">
                  {dashboardData.parent.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{dashboardData.parent.name}</h2>
                <p className="text-muted-foreground">Parent Account</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {dashboardData.children.length} Children
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact School</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/parent/messages">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="tel:+1234567890">
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`mailto:${dashboardData.parent.email}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/parent/meetings">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4">Children</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {dashboardData.children.map((child) => (
          <Card key={child.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={child.avatar} />
                    <AvatarFallback>
                      {child.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{child.name}</CardTitle>
                    <CardDescription>{child.grade} - {child.className}</CardDescription>
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link href={`/parent/children/${child.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2">
                  <div className="text-2xl font-bold">{child.attendanceRate}%</div>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                </div>
                <div className="p-2">
                  <div className="text-2xl font-bold">{child.upcomingExams}</div>
                  <p className="text-xs text-muted-foreground">Upcoming Exams</p>
                </div>
                <div className="p-2">
                  <div className="text-2xl font-bold">{child.recentResults}</div>
                  <p className="text-xs text-muted-foreground">Recent Results</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Tabs defaultValue="announcements">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="quickActions">Quick Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  School Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.announcements.map((announcement) => (
                    <div key={announcement.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{announcement.title}</h3>
                        <Badge variant="outline">
                          {new Date(announcement.date).toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {announcement.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quickActions">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Access common features quickly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col" asChild>
                    <Link href="/parent/attendance">
                      <Calendar className="h-6 w-6 mb-2" />
                      Attendance
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col" asChild>
                    <Link href="/parent/performance">
                      <BarChart className="h-6 w-6 mb-2" />
                      Performance
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col" asChild>
                    <Link href="/parent/teachers">
                      <Users className="h-6 w-6 mb-2" />
                      Teachers
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col" asChild>
                    <Link href="/parent/reports">
                      <FileText className="h-6 w-6 mb-2" />
                      Reports
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
