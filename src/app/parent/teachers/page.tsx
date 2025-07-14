"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageSquare, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Child = {
  id: string;
  name: string;
  rollNo: string;
  className: string;
  grade: string;
};

type Teacher = {
  id: string;
  name: string;
  email: string;
  phone: string;
  img: string;
  subjects: string[];
  role: string;
};

type TeachersData = {
  child: Child;
  teachers: Teacher[];
};

export default function ParentTeachers() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [teachersData, setTeachersData] = useState<TeachersData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchTeachersData();
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const response = await fetch('/api/parent/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch children');
      }
      const data = await response.json();
      setChildren(data.children);
      if (data.children.length > 0) {
        setSelectedChild(data.children[0].id);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      toast({
        title: "Error",
        description: "Failed to load children data",
        variant: "destructive",
      });
    }
  };

  const fetchTeachersData = async () => {
    if (!selectedChild) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/parent/children/${selectedChild}/teachers`);
      if (!response.ok) {
        throw new Error('Failed to fetch teachers data');
      }

      const data = await response.json();
      setTeachersData(data);
    } catch (error) {
      console.error('Error fetching teachers data:', error);
      toast({
        title: "Error",
        description: "Failed to load teachers data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactTeacher = (teacher: Teacher, method: string) => {
    switch (method) {
      case 'email':
        window.location.href = `mailto:${teacher.email}`;
        break;
      case 'phone':
        window.location.href = `tel:${teacher.phone}`;
        break;
      case 'message':
        // In a real app, this would open a messaging interface
        toast({
          title: "Message Feature",
          description: "Messaging feature would be implemented here",
        });
        break;
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Teachers</h1>
        <p className="text-muted-foreground">
          View and contact your child's teachers
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Child</CardTitle>
          <CardDescription>Choose a child to view their teachers</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.name} - {child.className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-10">Loading teachers data...</div>
      ) : teachersData ? (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Teachers for {teachersData.child.name} ({teachersData.child.className})
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {teachersData.teachers.map((teacher) => (
              <Card key={teacher.id}>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={teacher.img} />
                      <AvatarFallback>
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{teacher.name}</CardTitle>
                      <CardDescription>{teacher.role}</CardDescription>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {teacher.subjects.map((subject, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContactTeacher(teacher, 'email')}
                      disabled={!teacher.email}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContactTeacher(teacher, 'phone')}
                      disabled={!teacher.phone}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContactTeacher(teacher, 'message')}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {teacher.email && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="h-4 w-4 mr-2" />
                        {teacher.email}
                      </div>
                    )}
                    {teacher.phone && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 mr-2" />
                        {teacher.phone}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {teachersData.teachers.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">
                  No teachers found for this child
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              Select a child to view their teachers
            </p>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
