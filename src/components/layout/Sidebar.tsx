"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  FileText,
  Bell,
  Settings,
  UserCircle2,
  School,
  ClipboardList,
  LineChart,
  MessageSquare,
  Clock
} from "lucide-react";

interface SidebarProps {
  role: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [navItems, setNavItems] = useState<{
    title: string;
    href: string;
    icon: React.ReactNode;
  }[]>([]);

  // Set navigation items based on role
  useEffect(() => {
    let items = [];

    // Common items for all roles
    items.push({
      title: "Dashboard",
      href: `/${role}/dashboard`,
      icon: <LayoutDashboard className="w-5 h-5" />,
    });

    // Role-specific items
    switch (role) {
      case "admin":
        items = [
          ...items,
          {
            title: "Users",
            href: "/admin/users",
            icon: <Users className="w-5 h-5" />,
          },
          {
            title: "Teachers",
            href: "/admin/teachers",
            icon: <UserCircle2 className="w-5 h-5" />,
          },
          {
            title: "Students",
            href: "/admin/students",
            icon: <GraduationCap className="w-5 h-5" />,
          },
          {
            title: "Classes",
            href: "/admin/classes",
            icon: <School className="w-5 h-5" />,
          },
          {
            title: "Subjects",
            href: "/admin/subjects",
            icon: <BookOpen className="w-5 h-5" />,
          },
          {
            title: "Events",
            href: "/admin/events",
            icon: <CalendarDays className="w-5 h-5" />,
          },
          {
            title: "Announcements",
            href: "/admin/announcements",
            icon: <Bell className="w-5 h-5" />,
          },
          {
            title: "Reports",
            href: "/admin/reports",
            icon: <LineChart className="w-5 h-5" />,
          },
          {
            title: "Settings",
            href: "/admin/settings",
            icon: <Settings className="w-5 h-5" />,
          },
        ];
        break;

      case "teacher":
        items = [
          ...items,
          {
            title: "My Classes",
            href: "/teacher/classes",
            icon: <School className="w-5 h-5" />,
          },
          {
            title: "Students",
            href: "/teacher/students",
            icon: <GraduationCap className="w-5 h-5" />,
          },
          {
            title: "Attendance",
            href: "/teacher/attendance",
            icon: <ClipboardList className="w-5 h-5" />,
          },
          {
            title: "Assignments",
            href: "/teacher/assignments",
            icon: <FileText className="w-5 h-5" />,
          },
          {
            title: "Exams",
            href: "/teacher/exams",
            icon: <BookOpen className="w-5 h-5" />,
          },
          {
            title: "Schedule",
            href: "/teacher/schedule",
            icon: <Clock className="w-5 h-5" />,
          },
          {
            title: "Messages",
            href: "/teacher/messages",
            icon: <MessageSquare className="w-5 h-5" />,
          },
        ];
        break;

      case "student":
        items = [
          ...items,
          {
            title: "My Exa",
            href: "/student/classes",
            icon: <School className="w-5 h-5" />,
          },
          {
            title: "Assignments",
            href: "/student/assignments",
            icon: <FileText className="w-5 h-5" />,
          },
          {
            title: "Exams",
            href: "/student/exams",
            icon: <BookOpen className="w-5 h-5" />,
          },
          {
            title: "Grades",
            href: "/student/grades",
            icon: <LineChart className="w-5 h-5" />,
          },
          {
            title: "Schedule",
            href: "/student/schedule",
            icon: <Clock className="w-5 h-5" />,
          },
          {
            title: "Attendance",
            href: "/student/attendance",
            icon: <ClipboardList className="w-5 h-5" />,
          },
          {
            title: "Messages",
            href: "/student/messages",
            icon: <MessageSquare className="w-5 h-5" />,
          },
        ];
        break;

      case "parent":
        items = [
          ...items,
          {
            title: "My Children",
            href: "/parent/children",
            icon: <Users className="w-5 h-5" />,
          },
          {
            title: "Grades",
            href: "/parent/grades",
            icon: <LineChart className="w-5 h-5" />,
          },
          {
            title: "Attendance",
            href: "/parent/attendance",
            icon: <ClipboardList className="w-5 h-5" />,
          },
          {
            title: "Assignments",
            href: "/parent/assignments",
            icon: <FileText className="w-5 h-5" />,
          },
          {
            title: "Events",
            href: "/parent/events",
            icon: <CalendarDays className="w-5 h-5" />,
          },
          {
            title: "Messages",
            href: "/parent/messages",
            icon: <MessageSquare className="w-5 h-5" />,
          },
        ];
        break;

      default:
        items = [...items];
    }

    setNavItems(items);
  }, [role]);

  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 md:h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <Link href={`/${role}/dashboard`} className="flex items-center">
              <img src="/logo.png" alt="School Logo" className="h-8 w-auto" />
              <span className="ml-2 text-lg font-bold">School Portal</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.title}</span>
              </Link>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} School Management System
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
