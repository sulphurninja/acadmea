"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Menu,
  BellRing,
  X,
  CheckCircle,
  GraduationCap,
  School,
  UserSquare,
  ClipboardList,
  BookMarked,
  PieChart,
  MessageSquare,
  Car,
  Search,
  ChevronRight,
  Home,
  Activity,
  Sun,
  Moon,
  Laptop,
  ChevronDown,
  Sparkles,
  LucideProps,
  BarChart3,
  Video,
  Megaphone,
  IndianRupee,
  MessageCircleIcon,
  Loader2
} from "lucide-react";
import { PiBooksBold, PiExam } from "react-icons/pi";
import { MdCoPresent } from "react-icons/md";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "../ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import MobileBottomNav from "./MobileBottomNav";
import { useTheme } from "next-themes";

// Extracting navigation schema to improve structure
interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  section?: string;
  notifications?: number;
}

interface SidebarSection {
  title: string;
  links: SidebarLink[];
}

// Updated admin links with logical sections
const adminSections: SidebarSection[] = [
  {
    title: "Overview",
    links: [
      { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
      //{ href: "/admin/approvals", label: "Approvals", icon: <CheckCircle className="h-5 w-5" /> }
    ]
  },
  {
    title: "Academic",
    links: [
      { href: "/admin/grades", label: "Classes", icon: <School className="h-5 w-5" /> },
      { href: "/admin/classes", label: "Sections", icon: <BookMarked className="h-5 w-5" /> },
      { href: "/admin/subjects", label: "Subjects", icon: <BookOpen className="h-5 w-5" /> },
      { href: "/admin/schedule", label: "Timetable", icon: <Calendar className="h-5 w-5" /> },
      { href: "/admin/exams", label: "Exams", icon: <PiBooksBold className="h-5 w-5" /> },
      { href: "/admin/video-lessons", label: "Video Lessons", icon: <Video className="h-5 w-5" /> },
    ]
  },
  {
    title: "People",
    links: [
      { href: "/admin/students", label: "Students", icon: <GraduationCap className="h-5 w-5" /> },
      { href: "/admin/teachers", label: "Teachers", icon: <UserSquare className="h-5 w-5" /> },
      { href: "/admin/parents", label: "Parents", icon: <Users className="h-5 w-5" /> }
    ]
  },
  {
    title: "Administration",
    links: [
      { href: "/admin/events", label: "Events", icon: <Megaphone className="h-5 w-5" /> },
      { href: "/admin/fees", label: "Fee Structures", icon: <IndianRupee className="h-5 w-5" /> },
    ]
  }
];

// Updated teacher links with sections
const teacherSections: SidebarSection[] = [
  {
    title: "Overview",
    links: [
      { href: "/teacher", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
      { href: "/teacher/schedule", label: "My Timetable", icon: <Calendar className="h-5 w-5" /> }
    ]
  },
  {
    title: "Teaching",
    links: [
      { href: "/teacher/classes", label: "My Classes", icon: <BookMarked className="h-5 w-5" /> },
      { href: "/teacher/lessons", label: "Lessons", icon: <BookOpen className="h-5 w-5" /> },
      { href: "/teacher/students", label: "Students", icon: <GraduationCap className="h-5 w-5" /> },
      { href: "/teacher/attendance", label: "Attendance", icon: <MdCoPresent className="h-5 w-5" /> },
      { href: "/teacher/attendance/analytics", label: "Attendance Analytics", icon: <Activity className="h-5 w-5" /> },
      { href: "/teacher/exams", label: "Exams", icon: <ClipboardList className="h-5 w-5" /> }
    ]
  },
  {
    title: "Communication",
    links: [
      { href: "/teacher/messages", label: "Messages", icon: <MessageSquare className="h-5 w-5" />, notifications: 3 },
      { href: "/teacher/forum", label: "Discussion Forum", icon: <MessageCircleIcon className="h-5 w-5" />, notifications: 3 },
      // { href: "/teacher/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> }
    ]
  }
];

// Updated student links with sections
const studentSections: SidebarSection[] = [
  {
    title: "Overview",
    links: [
      { href: "/student", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
      { href: "/student/schedule", label: "My Timetable", icon: <Calendar className="h-5 w-5" /> }
    ]
  },
  {
    title: "Academics",
    links: [
      { href: "/student/video-lessons", label: "Video Lessons", icon: <Video className="h-5 w-5" /> },
      { href: "/student/attendance", label: "Attendance", icon: <ClipboardList className="h-5 w-5" />, notifications: 2 },
      { href: "/student/results", label: "My Reports", icon: <PieChart className="h-5 w-5" /> },
      { href: "/student/exams", label: "Exams", icon: <PiExam className="h-5 w-5" /> }
    ]
  },
  {
    title: "Communication",
    links: [
      { href: "/student/forum", label: "Discussion Forum", icon: <MessageSquare className="h-5 w-5" />, notifications: 3 },
      // { href: "/student/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> }
    ]
  }
];

// Updated parent links with sections
const parentSections: SidebarSection[] = [
  {
    title: "Overview",
    links: [
      { href: "/parent", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
      { href: "/parent/children", label: "My Children", icon: <Users className="h-5 w-5" /> }
    ]
  },
  {
    title: "Academic",
    links: [
      { href: "/parent/performance", label: "Performance", icon: <PieChart className="h-5 w-5" /> },
      { href: "/parent/attendance", label: "Attendance", icon: <Calendar className="h-5 w-5" /> },
      { href: "/parent/teachers", label: "Teachers", icon: <UserSquare className="h-5 w-5" /> }
    ]
  },
  {
    title: "Communication",
    links: [
      { href: "/parent/messages", label: "Messages", icon: <MessageSquare className="h-5 w-5" />, notifications: 1 },
      { href: "/parent/fees", label: "Fee Management", icon: <IndianRupee className="h-5 w-5" />, notifications: 1 },
      // { href: "/parent/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> }
    ]
  }
];

// Custom animated icon component
const AnimatedIcon = ({
  icon: Icon,
  isActive = false,
  notifications = 0
}: {
  icon: React.ElementType<LucideProps>,
  isActive?: boolean,
  notifications?: number
}) => {
  return (
    <div className="relative">
      <motion.div
        initial={false}
        animate={{
          scale: isActive ? 1 : 1,
          color: isActive ? 'var(--primary)' : 'var(--muted-foreground)'
        }}
        className="relative z-10"
      >
        <Icon className="h-5 w-5" />
      </motion.div>

      {isActive && (
        <motion.div
          layoutId="navIconBackground"
          className="absolute inset-0 bg-primary/10 rounded-md -z-0"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.5 }}
        />
      )}

      {notifications > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
          {notifications}
        </span>
      )}
    </div>
  );
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
  // All useState hooks MUST be called before any conditional logic
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  // All useRef hooks MUST be called before any conditional logic
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // All useEffect hooks MUST be called before any conditional logic
  // Add scroll listener for header style changes
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // NOW we can do the conditional return after all hooks have been called
  if (!user) return null;

  let sections: SidebarSection[] = [];

  switch (user.role) {
    case 'admin':
      sections = adminSections;
      break;
    case 'teacher':
      sections = teacherSections;
      break;
    case 'student':
      sections = studentSections;
      break;
    case 'parent':
      sections = parentSections;
      break;
  }

  // Helper function to format display name
  const getDisplayName = () => {
    if (user.name && user.surname) {
      return `${user.name} ${user.surname}`;
    }
    return user.username;
  };

  // Function to get initials for avatar
  const getInitials = () => {
    if (user.name && user.surname) {
      return `${user.name[0]}${user.surname[0]}`.toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  // Function to get role display name
  const getRoleDisplay = () => {
    switch (user.role) {
      case 'admin': return 'Administrator';
      case 'teacher': return 'Teacher';
      case 'student': return 'Student';
      case 'parent': return 'Parent';
      default: return user.role;
    }
  };

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=5');
      const data = await response.json();

      if (response.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter((n: any) => !n.isRead).length || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Get notification time ago
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ANNOUNCEMENT':
        return '📢';
      case 'EXAM':
        return '📝';
      case 'ASSIGNMENT':
        return '📋';
      case 'ATTENDANCE':
        return '👥';
      case 'FEE':
        return '💰';
      case 'URGENT':
        return '🚨';
      default:
        return '🔔';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-20 w-72 bg-card shadow-sm hidden lg:block border-r border-border/40",
        isScrolled ? "lg:top-0" : "lg:top-0"
      )}>
        {/* Sidebar header with logo */}
        <div className="flex items-center h-16 px-6 border-b border-border/40">
          <Link href={`/${user.role}`} className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <School className="h-6 w-6 text-primary" />
            </motion.div>
            <motion.span
              className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              EduPortal
            </motion.span>
          </Link>
        </div>

        {/* User profile section */}
        <div className="px-6 py-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-primary/10">
              <AvatarImage src={user.profilePic || ""} alt={getDisplayName()} />
              <AvatarFallback className="bg-primary/10 text-primary">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{getDisplayName()}</span>
              <span className="text-xs text-muted-foreground">{getRoleDisplay()}</span>
            </div>
          </div>
        </div>

        {/* Navigation sections */}
        <div className="flex flex-col h-[calc(100%-12rem)] overflow-y-auto py-4 px-4">
          {sections.map((section, idx) => (
            <div key={idx} className="mb-6">
              <h3 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase px-2 mb-2">
                {section.title}
              </h3>
              <nav>
                <ul className="space-y-1">
                  {section.links.map((link) => {
                    const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

                    return (
                      <motion.li
                        key={link.href}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link href={link.href}>
                          <div className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent/50 transition-colors text-sm group relative overflow-hidden",
                            isActive ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                          )}>
                            {isActive && (
                              <motion.div
                                layoutId="sidebar-active-indicator"
                                className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                              />
                            )}

                            <div className="flex items-center">
                              <div className={cn(
                                "mr-3 relative",
                                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                              )}>
                                {link.icon}
                                {link.notifications && link.notifications > 0 && (
                                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[8px] font-medium text-destructive-foreground">
                                    {link.notifications}
                                  </span>
                                )}
                              </div>
                              <span>{link.label}</span>
                            </div>

                            {isActive && <ChevronRight className="h-4 w-4 text-primary/70" />}
                          </div>
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          ))}
        </div>

        {/* Sidebar footer with logout */}
        <div className="mt-auto p-4 border-t border-border/40">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 text-sm group transition-all duration-300"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden lg:pl-72">
        {/* Header */}
        <motion.header
          className={cn(
            "bg-background/90 backdrop-blur-md sticky top-0 z-30 transition-all duration-200",
            isScrolled ? "shadow-sm border-b border-border/40" : ""
          )}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="p-6 border-b border-border/40">
                    <SheetTitle className="flex items-center gap-2">
                      <School className="h-6 w-6 text-primary" />
                      EduPortal
                    </SheetTitle>
                  </SheetHeader>
                  {/* Mobile navigation content would go here */}
                </SheetContent>
              </Sheet>

              {/* Breadcrumb or page title */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="hidden md:block ml-1"
                >
                  <h1 className="text-lg font-medium flex items-center gap-1">
                    {pathname === "/" + user.role ? (
                      <>
                        Dashboard
                        <Sparkles className="h-4 w-4 text-primary ml-1" />
                      </>
                    ) : (
                      pathname.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    )}
                  </h1>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Search, theme, notifications, and profile */}
            <div className="flex items-center ml-auto space-x-1 md:space-x-3">
              {/* Search */}
              <div className={cn(
                "hidden md:flex items-center relative transition-all duration-300 ease-in-out",
                searchActive ? "w-64" : "w-40"
              )}>
                <Input
                  type="text"
                  placeholder="Search..."
                  className={cn(
                    "pl-9 h-9 focus-visible:ring-primary/30 bg-background transition-all duration-300",
                    searchActive ? "w-full" : "w-full"
                  )}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchActive(true)}
                  onBlur={() => setSearchActive(false)}
                />
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              </div>

              {/* Theme toggle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="relative overflow-hidden"
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={theme}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {theme === "dark" ? (
                            <Moon className="h-5 w-5" />
                          ) : theme === "light" ? (
                            <Sun className="h-5 w-5" />
                          ) : (
                            <Laptop className="h-5 w-5" />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle theme</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        className="relative"
                      >
                        <BellRing className="h-5 w-5" />
                        {unreadCount > 0 && (
                          <motion.span
                            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </motion.span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Notifications</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Notifications dropdown */}
                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div
                      className="absolute right-0 mt-2 w-80 rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 py-1 overflow-hidden"
                      initial={{ opacity: 0, y: 10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: 10, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
                        <h3 className="text-sm font-semibold">Notifications</h3>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {unreadCount} new
                            </Badge>
                          )}
                          <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs">
                            Mark all as read
                          </Button>
                        </div>
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : notifications.length > 0 ? (
                          <div>
                            {notifications.map((notification) => (
                              <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                  "px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer relative border-l-2",
                                  !notification.isRead ? "bg-primary/5 border-l-primary" : "border-l-transparent"
                                )}
                                onClick={() => {
                                  if (!notification.isRead) {
                                    markNotificationAsRead(notification.id);
                                  }
                                  if (notification.actionUrl) {
                                    window.open(notification.actionUrl, '_blank');
                                  }
                                }}
                              >
                            <div className="flex items-start gap-3">
                                  <div className="text-lg">
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <h4 className={cn(
                                        "text-sm truncate",
                                        !notification.isRead && "font-medium"
                                      )}>
                                        {notification.title}
                                      </h4>
                                      <div className="flex items-center gap-1">
                                        <Badge variant="outline" className="text-xs">
                                          {notification.type}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {getTimeAgo(notification.createdAt)}
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="text-xs text-muted-foreground">
                                        by {notification.createdBy}
                                      </span>
                                      {notification.priority === 'URGENT' && (
                                        <Badge variant="destructive" className="text-xs">
                                          Urgent
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 text-center">
                            <BellRing className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                            <p className="text-sm text-muted-foreground">No notifications</p>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-border/40 px-4 py-2">
                        <Button variant="ghost" size="sm" className="w-full justify-center text-xs" asChild>
                          <Link href={`/${user.role}/notifications`}>
                            View all notifications
                          </Link>
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User menu */}
              <div className="relative" ref={profileDropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-sm font-normal md:pr-4 relative"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Avatar className="h-8 w-8 border border-primary/10">
                      <AvatarImage src={user.profilePic || ""} alt={getDisplayName()} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">{getInitials()}</AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <span className="hidden md:inline-block">{user.name || user.username}</span>
                  {/* <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" /> */}
                </Button>

                {/* Profile dropdown */}
                {/* <AnimatePresence>
                  {showProfileDropdown && (
                    <motion.div
                      className="absolute right-0 mt-2 w-56 rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 py-1"
                      initial={{ opacity: 0, y: 10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: 10, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 py-3 border-b border-border/40">
                        <p className="text-sm font-medium truncate">{getDisplayName()}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email || `${user.username}@eduportal.com`}</p>
                      </div>

                      <div className="py-1">
                        <Link href={`/${user.role}/profile`}>
                          <div className="px-4 py-2 text-sm hover:bg-muted/50 transition-colors cursor-pointer flex items-center gap-2">
                            <UserSquare className="h-4 w-4" />
                            My Profile
                          </div>
                        </Link>
                        <Link href={`/${user.role}/grades`}>
                          <div className="px-4 py-2 text-sm hover:bg-muted/50 transition-colors cursor-pointer flex items-center gap-2">
                            <UserSquare className="h-4 w-4" />
                            My Reports
                          </div>
                        </Link>
                        <Link href={`/${user.role}/settings`}>
                          <div className="px-4 py-2 text-sm hover:bg-muted/50 transition-colors cursor-pointer flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Settings
                          </div>
                        </Link>
                      </div>

                      <div className="py-1 border-t border-border/40">
                        <div
                          className="px-4 py-2 text-sm hover:bg-destructive/10 transition-colors cursor-pointer flex items-center gap-2 text-destructive"
                          onClick={logout}
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence> */}
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main content area with enhanced styling */}
        <main className="flex-1 overflow-y-auto bg-background relative">
          {/* Content with responsive padding */}
          <div className="px-4 py-6 md:px-6 md:py-8 lg:px-8 max-w-7xl mx-auto">
            {/* Welcome banner for dashboard pages - with animations */}
            {pathname === `/${user.role}` && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8 bg-gradient-to-r from-card to-card/80 rounded-lg overflow-hidden shadow-sm border border-border/40 relative"
              >
                <div className="absolute inset-0 bg-primary/5 backdrop-blur-sm"></div>
                <div className="relative p-6 md:p-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                      Welcome back, {user.name || user.username}
                    </h2>
                    <p className="text-muted-foreground max-w-xl">
                      {user.role === 'admin' && "Manage your school operations and monitor academic progress."}
                      {user.role === 'teacher' && "Access your class schedule and manage student assignments."}
                      {user.role === 'student' && "View your assignments and check your class schedule."}
                      {user.role === 'parent' && "Stay updated with your child's academic progress."}
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button size="sm" className="gap-2 text-white">
                          {user.role === 'admin' && <>
                            <Link className="flex gap-2 items-center" href='/admin/reports'>
                              View Reports
                              <FileText className="h-4 w-4" />
                            </Link>
                          </>}
                          {user.role === 'teacher' && <>
                            <Link className="flex gap-2" href='/teacher/schedule'>
                              Check Schedule <Calendar className="h-4 w-4" />
                            </Link>
                          </>}
                          {user.role === 'student' && <>
                            <Link className="flex gap-2" href='/student/exams'>
                              View Upcoming Exams <ClipboardList className="h-4 w-4" /> 
                            </Link>
                          </>}
                          {user.role === 'parent' && <>Check Performance <PieChart className="h-4 w-4" /></>}
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="outline" size="sm" className="gap-2">
                          {user.role === 'admin' && <>
                            <Link className="flex gap-2 items-center" href='/admin/analytics'>
                              School Analytics <BarChart3 className="h-4 w-4" />
                            </Link></>}
                          {user.role === 'teacher' && <>Create Lesson <BookOpen className="h-4 w-4" /></>}
                          {/* {user.role === 'student' && <>Join Class <School className="h-4 w-4" /></>} */}
                          {user.role === 'parent' && <>Message Teacher <MessageSquare className="h-4 w-4" /></>}
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Main content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
}