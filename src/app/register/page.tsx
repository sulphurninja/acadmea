"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, School, User, Users, UserPlus } from "lucide-react";

export default function Register() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    surname: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
    sex: "",
    birthday: "",
    userType: "student", // Default selection
    registrationCode: "",
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));

    // Clear password error when user types in password fields
    if (id === 'password' || id === 'confirmPassword') {
      setPasswordError("");
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, agreeToTerms: checked }));
  };

  const validateForm = () => {
    if (!formData.agreeToTerms) {
      toast({
        title: "Terms Required",
        description: "You must agree to the terms of service",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }

    if (formData.password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Registration Successful",
          description: "Your account has been created. Please wait for admin approval.",
          variant: "default",
        });

        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        toast({
          title: "Registration Failed",
          description: data.message || "An error occurred during registration",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const userTypeIcons = {
    student: <User className="h-5 w-5" />,
    teacher: <Users className="h-5 w-5" />,
    parent: <UserPlus className="h-5 w-5" />
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => router.push('/login')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Login
        </Button>

        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <School className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
              <CardDescription className="text-center mt-2">
                Register to access our school portal
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="student"
              onValueChange={(value) => handleSelectChange("userType", value)}
              className="w-full mb-6"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="student" className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Student
                </TabsTrigger>
                <TabsTrigger value="teacher" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Teacher
                </TabsTrigger>
                <TabsTrigger value="parent" className="flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Parent
                </TabsTrigger>
              </TabsList>

              {/* We'll keep the same form for all tabs, but you could customize per role if needed */}
              <TabsContent value="student">
                <p className="text-sm text-muted-foreground mb-4">
                  Register as a student to access your class materials, assignments, and grades.
                </p>
              </TabsContent>
              <TabsContent value="teacher">
                <p className="text-sm text-muted-foreground mb-4">
                  Teacher accounts require approval from the administrator before activation.
                </p>
              </TabsContent>
              <TabsContent value="parent">
                <p className="text-sm text-muted-foreground mb-4">
                  Parent accounts allow you to monitor your child's progress and communicate with teachers.
                </p>
              </TabsContent>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">First Name</Label>
                  <Input
                    id="name"
                    placeholder="John"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Last Name</Label>
                  <Input
                    id="surname"
                    placeholder="Doe"
                    value={formData.surname}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1234567890"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main St, City"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sex">Gender</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("sex", value)}
                    required
                    value={formData.sex}
                  >
                    <SelectTrigger id="sex">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthday">Date of Birth</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {passwordError && (
                <div className="text-sm text-red-500">{passwordError}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="registrationCode">Registration Code</Label>
                <Input
                  id="registrationCode"
                  placeholder="Enter code provided by school"
                  value={formData.registrationCode}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This code is required and will be provided by the school administration
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={handleCheckboxChange}
                />
                <label
                  htmlFor="terms"
                  className="text-sm leading-none"
                >
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    terms of service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    privacy policy
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
