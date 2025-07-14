"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function CreateAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
    email: "",
    superAdmin: false
  });
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));

    if (id === 'password' || id === 'confirmPassword') {
      setPasswordError("");
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, superAdmin: checked }));
  };

  const validateForm = () => {
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
      const response = await fetch('/api/auth/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          email: formData.email,
          superAdmin: formData.superAdmin
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Admin user created successfully",
          variant: "default",
        });

        setTimeout(() => {
          router.push('/admin/users');
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create admin user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating admin:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center">
        <Button
          variant="outline"
          size="sm"
          className="mr-4"
          onClick={() => router.push('/admin/users')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <h1 className="text-2xl font-bold">Create Admin User</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <CardTitle>New Administrator</CardTitle>
          </div>
          <CardDescription>
            Create a new admin user who will have full access to the system
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="admin_username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="superAdmin"
                checked={formData.superAdmin}
                onCheckedChange={handleCheckboxChange}
              />
              <label
                htmlFor="superAdmin"
                className="text-sm font-medium leading-none"
              >
                Super Admin (can create other admins)
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/users')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Admin"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </DashboardLayout>
  );
}
