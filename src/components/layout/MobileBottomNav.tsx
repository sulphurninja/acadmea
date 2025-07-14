"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Home,
  BookOpen,
  Calendar,
  ClipboardList,
  Bell,
  FileText
} from "lucide-react";
import { PiExam } from "react-icons/pi";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  notifications?: number;
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<string>("");
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle scroll to hide/show nav bar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Update selected tab based on pathname
  useEffect(() => {
    setSelectedTab(pathname);
  }, [pathname]);

  if (!user || user.role !== 'student') return null;

  const navItems: NavItem[] = [
    { href: "/student", label: "Home", icon: <Home className="h-5 w-5" /> },
    { href: "/student/Report", label: "Report", icon: <FileText className="h-5 w-5" /> },
    { href: "/student/lessons", label: "Lessons", icon: <BookOpen className="h-5 w-5" /> },
    { 
      href: "/student/assignments", 
      label: "Tasks", 
      icon: <ClipboardList className="h-5 w-5" />,
      notifications: 3 // Example notification count - replace with actual data
    },
    { 
      href: "/student/exams", 
      label: "Exams", 
      icon: <PiExam className="h-5 w-5" />,
      notifications: 1 // Example notification count - replace with actual data
    },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
        >
          <div className="h-18 bg-background/85 backdrop-blur-xl border-t border-border/40 shadow-lg px-1 flex items-center justify-evenly">
            <div className="w-full max-w-md mx-auto flex items-center justify-between">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className="relative flex flex-col items-center justify-center py-2 flex-1"
                    onClick={() => setSelectedTab(item.href)}
                  >
                    <div className="relative">
                      {/* Active indicator pill */}
                      {isActive && (
                        <motion.div
                          layoutId="nav-pill"
                          className="absolute -top-3 left-1/2 transform -translate-x-1/2 h-1 w-10 bg-primary rounded-full"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      
                      {/* Button with icon and background effect */}
                      <motion.div
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                          "relative flex flex-col items-center justify-center",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        <div className="relative">
                          {/* Icon container with animated background */}
                          <div className="relative z-10 p-1.5">
                            {item.icon}
                          </div>
                          
                          {/* Animated background */}
                          {isActive && (
                            <motion.div
                              layoutId={`background-${item.href}`}
                              className="absolute inset-0 bg-primary/15 rounded-full -z-0"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", bounce: 0.5, duration: 0.5 }}
                            />
                          )}
                          
                          {/* Notification badge */}
                          {item.notifications && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground font-semibold h-4 w-4 z-20"
                            >
                              {item.notifications}
                            </motion.div>
                          )}
                        </div>
                        
                        {/* Label with animated appearance */}
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={`${item.label}-${isActive}`}
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -5, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                              "text-[11px] font-medium mt-1",
                              isActive ? "text-primary font-semibold" : "text-muted-foreground"
                            )}
                          >
                            {item.label}
                          </motion.span>
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {/* Floating action button for quick action */}
          
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}