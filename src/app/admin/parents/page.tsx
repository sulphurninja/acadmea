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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  PlusCircle, Search, MoreVertical, Pencil,
  Trash2, Users, Mail, Phone, Eye, UserSquare
} from "lucide-react";

type Parent = {
  _id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  address: string;
  childrenCount: number;
  username: string;
};


type Student = {
  _id: string;
  name: string;
  surname: string;
  classId?: {
    _id: number;
    name: string;
  };
};

// Helper for Roman numerals (for class display)
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

export default function ParentsManagement() {
  const { toast } = useToast();
  const [parents, setParents] = useState<Parent[]>([]);
  const [filteredParents, setFilteredParents] = useState<Parent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewChildrenDialogOpen, setIsViewChildrenDialogOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [childrenOfSelectedParent, setChildrenOfSelectedParent] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Add password field to the Edit Dialog state
  const [newPassword, setNewPassword] = useState('');
  const [showUsernameField, setShowUsernameField] = useState(false);


  // New parent form state
  const [newParent, setNewParent] = useState({
    username: '',
    password: '',
    name: '',
    surname: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchParents();
  }, []);

  useEffect(() => {
    // Filter parents based on search term
    if (searchTerm) {
      const filtered = parents.filter(parent =>
        parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${parent.name} ${parent.surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.phone?.includes(searchTerm)
      );
      setFilteredParents(filtered);
    } else {
      setFilteredParents(parents);
    }
  }, [parents, searchTerm]);

  const fetchParents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/parents');

      if (!response.ok) {
        throw new Error('Failed to fetch parents');
      }

      const data = await response.json();
      setParents(data.parents || []);
      setFilteredParents(data.parents || []);
    } catch (error) {
      console.error('Error fetching parents:', error);
      toast({
        title: "Error",
        description: "Failed to load parents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChildrenForParent = async (parentId: string) => {
    try {
      const response = await fetch(`/api/admin/parents/${parentId}/children`);

      if (!response.ok) {
        throw new Error('Failed to fetch children');
      }

      const data = await response.json();
      setChildrenOfSelectedParent(data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
      toast({
        title: "Error",
        description: "Failed to load children for this parent",
        variant: "destructive",
      });
      setChildrenOfSelectedParent([]);
    }
  };

  const handleAddParent = async () => {
    try {
      if (!newParent.username || !newParent.password || !newParent.name || !newParent.surname || !newParent.phone) {
        toast({
          title: "Validation Error",
          description: "Username, password, name, surname and phone are required",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/admin/parents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newParent),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create parent');
      }

      toast({
        title: "Success",
        description: "Parent created successfully",
        variant: "default",
      });

      setIsAddDialogOpen(false);
      setNewParent({
        username: '',
        password: '',
        name: '',
        surname: '',
        email: '',
        phone: '',
        address: ''
      });
      fetchParents();
    } catch (error) {
      console.error('Error creating parent:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create parent",
        variant: "destructive",
      });
    }
  };

  // Update the handleUpdateParent function to include username and optional password
  const handleUpdateParent = async () => {
    if (!selectedParent) return;

    try {
      const updateData: any = {
        name: selectedParent.name,
        surname: selectedParent.surname,
        email: selectedParent.email,
        phone: selectedParent.phone,
        address: selectedParent.address,
        username: selectedParent.username
      };

      // Only include password if a new one was provided
      if (newPassword) {
        updateData.password = newPassword;
      }

      const response = await fetch(`/api/admin/parents/${selectedParent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update parent');
      }

      toast({
        title: "Success",
        description: "Parent updated successfully",
        variant: "default",
      });

      setIsEditDialogOpen(false);
      setNewPassword('');
      setShowUsernameField(false);
      fetchParents();
    } catch (error) {
      console.error('Error updating parent:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update parent",
        variant: "destructive",
      });
    }
  };

  const handleDeleteParent = async (parentId: string) => {
    if (!confirm('Are you sure you want to delete this parent? This will affect all associated students.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/parents/${parentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete parent');
      }

      toast({
        title: "Success",
        description: "Parent deleted successfully",
        variant: "default",
      });

      fetchParents();
    } catch (error) {
      console.error('Error deleting parent:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete parent",
        variant: "destructive",
      });
    }
  };

  const viewChildren = (parent: Parent) => {
    setSelectedParent(parent);
    fetchChildrenForParent(parent._id);
    setIsViewChildrenDialogOpen(true);
  };
  // Add this when opening the edit dialog
  const handleEditParent = (parent: Parent) => {
    setSelectedParent(parent);
    setNewPassword('');
    setShowUsernameField(false);
    setIsEditDialogOpen(true);
  };
  // Auto-generate username from name and surname
  const generateUsername = (name: string, surname: string) => {
    if (!name || !surname) return '';

    const formattedName = name.toLowerCase().replace(/\s+/g, '');
    const formattedSurname = surname.toLowerCase().replace(/\s+/g, '');

    return `${formattedName}.${formattedSurname}`;
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Parent Management</h1>

        <div className="mt-4 sm:mt-0">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Parent
          </Button>
        </div>
      </div>

      <div className="relative mb-4 w-full sm:w-80">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search parents..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <UserSquare className="h-5 w-5 mr-2" />
            Parents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>  {/* Added username column */}
                <TableHead>Contact</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Children</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">Loading parents...</TableCell>
                </TableRow>
              ) : filteredParents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    {searchTerm ? (
                      <p>No parents match your search</p>
                    ) : (
                      <div>
                        <UserSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p>No parents have been added yet</p>
                        <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                          Add Your First Parent
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredParents.map((parent) => (
                  <TableRow key={parent._id}>
                    <TableCell className="font-medium">
                      {parent.name} {parent.surname}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <UserSquare className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-sm font-mono">{parent.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {parent.phone && (
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-sm">{parent.phone}</span>
                          </div>
                        )}
                        {parent.email && (
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-sm">{parent.email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {parent.address || <span className="text-muted-foreground italic">No address provided</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{parent.childrenCount || 0}</span>
                        {parent.childrenCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-7 px-2"
                            onClick={() => viewChildren(parent)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        )}
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
                            onClick={() => handleEditParent(parent)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteParent(parent._id)}
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

      {/* Add Parent Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Parent</DialogTitle>
            <DialogDescription>
              Create a new parent account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">First Name</Label>
                <Input
                  id="name"
                  value={newParent.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setNewParent({
                      ...newParent,
                      name,
                      username: generateUsername(name, newParent.surname)
                    });
                  }}
                  placeholder="Rajesh"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="surname">Last Name</Label>
                <Input
                  id="surname"
                  value={newParent.surname}
                  onChange={(e) => {
                    const surname = e.target.value;
                    setNewParent({
                      ...newParent,
                      surname,
                      username: generateUsername(newParent.name, surname)
                    });
                  }}
                  placeholder="Sharma"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newParent.username}
                  onChange={(e) => setNewParent({ ...newParent, username: e.target.value })}
                  placeholder="rajesh.sharma"
                />
                <div className="text-xs text-muted-foreground">
                  Auto-generated from name, but can be changed
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newParent.password}
                  onChange={(e) => setNewParent({ ...newParent, password: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone (required)</Label>
                <Input
                  id="phone"
                  value={newParent.phone}
                  onChange={(e) => setNewParent({ ...newParent, phone: e.target.value })}
                  placeholder="+91 9876543210"
                />
                <div className="text-xs text-muted-foreground">
                  Primary contact number for school communications
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newParent.email}
                  onChange={(e) => setNewParent({ ...newParent, email: e.target.value })}
                  placeholder="rajesh.sharma@example.com"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newParent.address}
                onChange={(e) => setNewParent({ ...newParent, address: e.target.value })}
                placeholder="123, Sector 45, Noida, UP - 201301"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddParent}>Create Parent</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Parent Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setNewPassword('');
          setShowUsernameField(false);
        }
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Parent</DialogTitle>
            <DialogDescription>
              Update parent information, credentials, and contact details.
            </DialogDescription>
          </DialogHeader>
          {selectedParent && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">First Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedParent.name}
                    onChange={(e) => setSelectedParent({
                      ...selectedParent,
                      name: e.target.value
                    })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-surname">Last Name</Label>
                  <Input
                    id="edit-surname"
                    value={selectedParent.surname}
                    onChange={(e) => setSelectedParent({
                      ...selectedParent,
                      surname: e.target.value
                    })}
                  />
                </div>
              </div>

              {/* Username field - can toggle to show/edit */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-username">Username</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUsernameField(!showUsernameField)}
                    className="h-6 px-2"
                  >
                    {showUsernameField ? 'Cancel' : 'Change Username'}
                  </Button>
                </div>
                {showUsernameField ? (
                  <Input
                    id="edit-username"
                    value={selectedParent.username}
                    onChange={(e) => setSelectedParent({
                      ...selectedParent,
                      username: e.target.value
                    })}
                  />
                ) : (
                  <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <span className="text-muted-foreground font-mono">{selectedParent.username}</span>
                  </div>
                )}
              </div>

              {/* Password field - only shown when intentionally changing */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-password">Password</Label>
                  {newPassword && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNewPassword('')}
                      className="h-6 px-2"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
                {newPassword ? (
                  <Input
                    id="edit-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setNewPassword(' ')}
                    className="w-full justify-start text-muted-foreground"
                  >
                    <span>Click to change password</span>
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={selectedParent.phone}
                    onChange={(e) => setSelectedParent({
                      ...selectedParent,
                      phone: e.target.value
                    })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedParent.email || ''}
                    onChange={(e) => setSelectedParent({
                      ...selectedParent,
                      email: e.target.value
                    })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={selectedParent.address || ''}
                  onChange={(e) => setSelectedParent({
                    ...selectedParent,
                    address: e.target.value
                  })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setNewPassword('');
              setShowUsernameField(false);
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateParent}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Children Dialog */}
      <Dialog open={isViewChildrenDialogOpen} onOpenChange={setIsViewChildrenDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Children of {selectedParent?.name} {selectedParent?.surname}</DialogTitle>
            <DialogDescription>
              List of students registered with this parent
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {childrenOfSelectedParent.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No children found for this parent
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {childrenOfSelectedParent.map((child) => (
                    <TableRow key={child._id}>
                      <TableCell className="font-medium">
                        {child.name} {child.surname}
                      </TableCell>
                      <TableCell>
                        {child.classId ? (
                          <span>Class {romanize(child.classId.name.split('-')[0])}</span>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {child.classId ? (
                          <Badge variant="outline">
                            {child.classId.name.split('-')[1] || ''}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewChildrenDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
