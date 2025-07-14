"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  User, Mail, Phone, MapPin, Calendar,
  Upload, Save, Edit3, Camera, School,
  Users, FileText, Shield
} from "lucide-react";

type StudentProfile = {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  bloodGroup: string;
  emergencyContact: string;
  emergencyContactName: string;
  parentDetails: {
    fatherName: string;
    motherName: string;
    guardianPhone: string;
    occupation: string;
  };
  academicInfo: {
    rollNo: string;
    className: string;
    section: string;
    admissionDate: string;
    studentId: string;
  };
  profileImage: string;
  documents: Array<{
    type: string;
    name: string;
    url: string;
    uploadDate: string;
  }>;
  profileCompletion: number;
};

export default function StudentProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/student/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        setIsEditing(false);
        fetchProfile(); // Refresh profile data
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/student/profile/image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, profileImage: data.imageUrl } : null);
        toast({
          title: "Success",
          description: "Profile image updated successfully",
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">
          <p>Profile not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Student Profile</h1>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <Button className="text-white" onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Summary */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center pb-2">
            <div className="relative mx-auto w-24 h-24">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.profileImage} />
                <AvatarFallback className="text-lg">
                  {profile.name.charAt(0)}{profile.surname.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="absolute bottom-0 right-0">
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Camera className="h-4 w-4 text-white" />
                    </div>
                  </Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              )}
            </div>
            <CardTitle className="mt-4">{profile.name} {profile.surname}</CardTitle>
            <p className="text-muted-foreground">Student ID: {profile.academicInfo.studentId}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                {profile.academicInfo.className} - {profile.academicInfo.section}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Roll No: {profile.academicInfo.rollNo}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Profile Completion</span>
                <span>{profile.profileCompletion}%</span>
              </div>
              <Progress value={profile.profileCompletion} />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{profile.email || 'Not provided'}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{profile.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  {profile.dateOfBirth
                    ? new Date(profile.dateOfBirth).toLocaleDateString()
                    : 'Not provided'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Information */}
        <div className="md:col-span-2">
          <Tabs defaultValue="personal" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="family">Family</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
               <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">First Name</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, name: e.target.value } : null)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="surname">Last Name</Label>
                      <Input
                        id="surname"
                        value={profile.surname}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, surname: e.target.value } : null)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, email: e.target.value } : null)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, dateOfBirth: e.target.value } : null)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bloodGroup">Blood Group</Label>
                      <Select
                        value={profile.bloodGroup}
                        onValueChange={(value) => setProfile(prev => prev ? { ...prev, bloodGroup: value } : null)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={profile.address}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, address: e.target.value } : null)}
                      disabled={!isEditing}
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                      <Input
                        id="emergencyContactName"
                        value={profile.emergencyContactName}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, emergencyContactName: e.target.value } : null)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Emergency Contact Number</Label>
                      <Input
                        id="emergencyContact"
                        value={profile.emergencyContact}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, emergencyContact: e.target.value } : null)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="academic">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <School className="h-5 w-5 mr-2" />
                    Academic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Student ID</Label>
                      <Input value={profile.academicInfo.studentId} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Roll Number</Label>
                      <Input value={profile.academicInfo.rollNo} disabled />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Input value={profile.academicInfo.className} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Input value={profile.academicInfo.section} disabled />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Admission Date</Label>
                    <Input
                      value={profile.academicInfo.admissionDate
                        ? new Date(profile.academicInfo.admissionDate).toLocaleDateString()
                        : 'Not available'
                      }
                      disabled
                    />
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Academic information cannot be modified by students. Please contact the admin office for any changes.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="family">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Family Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fatherName">Father's Name</Label>
                      <Input
                        id="fatherName"
                        value={profile.parentDetails.fatherName}
                        onChange={(e) => setProfile(prev => prev ? {
                          ...prev,
                          parentDetails: { ...prev.parentDetails, fatherName: e.target.value }
                        } : null)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motherName">Mother's Name</Label>
                      <Input
                        id="motherName"
                        value={profile.parentDetails.motherName}
                        onChange={(e) => setProfile(prev => prev ? {
                          ...prev,
                          parentDetails: { ...prev.parentDetails, motherName: e.target.value }
                        } : null)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="guardianPhone">Guardian Phone</Label>
                      <Input
                        id="guardianPhone"
                        value={profile.parentDetails.guardianPhone}
                        onChange={(e) => setProfile(prev => prev ? {
                          ...prev,
                          parentDetails: { ...prev.parentDetails, guardianPhone: e.target.value }
                        } : null)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="occupation">Parent Occupation</Label>
                      <Input
                        id="occupation"
                        value={profile.parentDetails.occupation}
                        onChange={(e) => setProfile(prev => prev ? {
                          ...prev,
                          parentDetails: { ...prev.parentDetails, occupation: e.target.value }
                        } : null)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.documents.length > 0 ? (
                    <div className="space-y-3">
                      {profile.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-sm text-muted-foreground">{doc.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </span>
                            <Button variant="outline" size="sm" asChild>
                              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                View
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No documents uploaded yet</p>
                    </div>
                  )}

                  {isEditing && (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload important documents (Birth Certificate, Previous School Records, etc.)
                      </p>
                      <Label htmlFor="document-upload">
                        <Button variant="outline" size="sm">
                          Choose Files
                        </Button>
                      </Label>
                      <Input
                        id="document-upload"
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          // Handle document upload
                          console.log('Documents selected:', e.target.files);
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
