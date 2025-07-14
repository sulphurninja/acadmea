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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle, XCircle, Search, User,
  UserSquare, GraduationCap
} from "lucide-react";

type PendingUser = {
  _id: string;
  username: string;
  role: string;
  createdAt: string;
  // Profile data (from associated model)
  name?: string;
  surname?: string;
  email?: string;
  phone?: string;
};

export default function UserApprovalsPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<PendingUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  useEffect(() => {
    let filtered = pendingUsers;

    // Filter by role if not "all"
    if (activeTab !== 'all') {
      filtered = filtered.filter(user => user.role === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.surname && user.surname.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredUsers(filtered);
  }, [pendingUsers, activeTab, searchTerm]);

  const fetchPendingUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/approvals');

      if (!response.ok) {
        throw new Error('Failed to fetch pending users');
      }

      const data = await response.json();
      setPendingUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        title: "Error",
        description: "Failed to load pending approval requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/approvals/${userId}/approve`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to approve user');
      }

      toast({
        title: "Success",
        description: "User has been approved",
        variant: "default",
      });

      // Update local state
      setPendingUsers(prev => prev.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: "Failed to approve user",
        variant: "destructive",
      });
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/approvals/${userId}/reject`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to reject user');
      }

      toast({
        title: "User Rejected",
        description: "User has been rejected and removed from the system",
        variant: "default",
      });

      // Update local state
      setPendingUsers(prev => prev.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Error",
        description: "Failed to reject user",
        variant: "destructive",
      });
    }
  };

  const roleIcons = {
    teacher: <GraduationCap className="h-4 w-4" />,
    student: <User className="h-4 w-4" />,
    parent: <UserSquare className="h-4 w-4" />
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">User Approval Requests</h1>

      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">All Requests</TabsTrigger>
            <TabsTrigger value="teacher">Teachers</TabsTrigger>
            <TabsTrigger value="student">Students</TabsTrigger>
            <TabsTrigger value="parent">Parents</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Pending Approval Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Requested On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">Loading pending requests...</TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">No pending approval requests</TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.name} {user.surname}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize flex items-center w-fit">
                        {roleIcons[user.role as keyof typeof roleIcons]}
                        <span className="ml-1">{user.role}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 flex items-center"
                          onClick={() => handleApproveUser(user._id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex items-center"
                          onClick={() => handleRejectUser(user._id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
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
