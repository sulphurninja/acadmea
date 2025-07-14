"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Clock,
  Calendar,
  Bell,
  PieChart,
  Award,
  FileText,
  ChevronRight,
  MessagesSquare,
  CheckCircle,
  TrendingUp,
  User,
  Users,
  Settings,
  LogOut,
  Info,
  BarChart3,
  Mail
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, isToday, isPast, isFuture, addDays } from "date-fns";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

type Announcement = {
  id: number;
  title: string;
  content: string;
  date: string;
  isRead: boolean;
};

type Subject = {
  id: number;
  name: string;
  teacherName: string;
  progress: number;
};

type Class = {
  id: string;
  subject: string;
  teacher: string;
  time: string;
  room: string;
  duration: number;
};

type Attendance = {
  present: number;
  absent: number;
  leave: number;
  total: number;
};

type Exam = {
  id: number;
  title: string;
  examDate: string;
  subject: {
    id: number;
    name: string;
  };
  duration: number;
  examType: string;
  status: string;
};

type ExamResult = {
  id: number;
  title: string;
  examDate: string;
  subject: {
    id: number;
    name: string;
  };
  maxMarks: number;
  obtainedMarks: number | null;
  percentage: number | null;
  letterGrade: string | null;
  isAbsent: boolean;
  examType: string;
};

type Student = {
  id: string;
  name: string;
  surname: string;
  rollNo: string;
  className: string;
  grade: {
    id: number;
    level: number;
    name: string;
  };
  img?: string;
  birthday: string;
  email: string;
  phone: string;
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function StudentDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [todayClasses, setTodayClasses] = useState<Class[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [attendance, setAttendance] = useState<Attendance>({
    present: 0,
    absent: 0,
    leave: 0,
    total: 0
  });
  const [recentResults, setRecentResults] = useState<ExamResult[]>([]);
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStudentInfo();
    fetchAnnouncements();
    fetchSubjects();
    // fetchTodayClasses();
    fetchUpcomingExams();
    fetchAttendance();
    fetchRecentResults();
  }, []);

  const fetchStudentInfo = async () => {
    try {
      const response = await fetch('/api/student/profile');
      if (response.ok) {
        const data = await response.json();
        setStudentInfo(data);
      } else {
        console.error('Failed to fetch student info');
      }
    } catch (error) {
      console.error('Error fetching student info:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/student/announcements');
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements);
      } else {
        console.error('Failed to fetch announcements');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/student/subjects');
      if (response.ok) {
        const data = await response.json();

        // Get teacher names for each subject
        const subjectsWithTeachers = await Promise.all(
          data.subjects.map(async (subject: any) => {
            try {
              const teacherRes = await fetch(`/api/student/subjects/${subject.id}/teacher`);
              if (teacherRes.ok) {
                const teacherData = await teacherRes.json();
                return {
                  ...subject,
                  teacherName: `${teacherData.name} ${teacherData.surname}`,
                  progress: Math.floor(Math.random() * 100) // This should be replaced with actual progress data
                };
              }
              return {
                ...subject,
                teacherName: 'Unknown Teacher',
                progress: Math.floor(Math.random() * 100) // This should be replaced with actual progress data
              };
            } catch (error) {
              console.error('Error fetching teacher for subject:', error);
              return {
                ...subject,
                teacherName: 'Unknown Teacher',
                progress: Math.floor(Math.random() * 100) // This should be replaced with actual progress data
              };
            }
          })
        );

        setSubjects(subjectsWithTeachers);
      } else {
        console.error('Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  // const fetchTodayClasses = async () => {
  //   try {
  //     const response = await fetch('/api/student/timetable?day=today');
  //     if (response.ok) {
  //       const data = await response.json();
  //       setTodayClasses(data.classes);
  //     } else {
  //       console.error('Failed to fetch today classes');
  //     }
  //   } catch (error) {
  //     console.error('Error fetching today classes:', error);
  //   }
  // };

  const fetchUpcomingExams = async () => {
    try {
      const response = await fetch('/api/student/exams?upcoming=true');
      if (response.ok) {
        const data = await response.json();
        setUpcomingExams(data.exams);
      } else {
        console.error('Failed to fetch upcoming exams');
      }
    } catch (error) {
      console.error('Error fetching upcoming exams:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await fetch('/api/student/attendance');
      if (response.ok) {
        const data = await response.json();
        setAttendance(data);
      } else {
        console.error('Failed to fetch attendance');
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchRecentResults = async () => {
    try {
      const response = await fetch('/api/student/results?recent=true');
      if (response.ok) {
        const data = await response.json();
        setRecentResults(data.results?.slice(0, 3) || []);
      } else {
        console.error('Failed to fetch recent results');
      }
    } catch (error) {
      console.error('Error fetching recent results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAnnouncementAsRead = async (id: number) => {
    try {
      await fetch(`/api/student/announcements/${id}/read`, {
        method: 'POST'
      });

      // Update the local state
      setAnnouncements(prev =>
        prev.map(announcement =>
          announcement.id === id ? { ...announcement, isRead: true } : announcement
        )
      );

      toast({
        title: "Marked as read",
        description: "Announcement has been marked as read"
      });
    } catch (error) {
      console.error('Error marking announcement as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark announcement as read",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string, surname: string) => {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  const getAttendancePercentage = () => {
    if (attendance.total === 0) return 0;
    return Math.round((attendance.present / attendance.total) * 100);
  };

  const getGradeColor = (grade: string | null) => {
    if (!grade) return '';

    switch(grade) {
      case 'A+':
      case 'A':
        return 'text-green-600';
      case 'B+':
      case 'B':
        return 'text-blue-600';
      case 'C+':
      case 'C':
        return 'text-yellow-600';
      case 'D':
        return 'text-orange-600';
      case 'F':
        return 'text-red-600';
      default:
        return '';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        {/* <div>
          <h1 className="text-2xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {studentInfo?.name || 'Student'}!
          </p>
        </div> */}
        {/* <div className="mt-4 md:mt-0 flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline" className="relative">
                  <Bell className="h-4 w-4" />
                  {announcements?.filter(a => !a.isRead).length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                      {announcements.filter(a => !a.isRead).length}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={studentInfo?.img || ''} alt={studentInfo?.name || 'Student'} />
                  <AvatarFallback>{studentInfo ? getInitials(studentInfo.name, studentInfo.surname) : 'ST'}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline-block">{studentInfo?.name || 'Student'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/student/profile')}>
                <User className="h-4 w-4 mr-2" />Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/student/settings')}>
                <Settings className="h-4 w-4 mr-2" />Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/logout')}>
                <LogOut className="h-4 w-4 mr-2" />Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div> */}
      </div>

      {studentInfo && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={studentInfo.img || ''} alt={studentInfo.name} />
                <AvatarFallback>{getInitials(studentInfo.name, studentInfo.surname)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{studentInfo.name} {studentInfo.surname}</h2>
                <p className="text-muted-foreground">{studentInfo.grade?.name || `Class ${studentInfo.grade?.level || ''}`}</p>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Info className="h-4 w-4 mr-1" />
                    Roll No: {studentInfo.rollNo || 'N/A'}
                  </div>
                  {studentInfo.email && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 mr-1" />
                      {studentInfo.email}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
                <Button variant="outline" size="sm" onClick={() => router.push('/student/profile')}>
                  View Profile
                </Button>
                <Button size="sm" onClick={() => router.push('/student/timetable')}>
                  View Timetable
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="academics">Academics</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2"
          >
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Attendance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="text-4xl font-bold">{getAttendancePercentage()}%</div>
                    <Progress value={getAttendancePercentage()} className="w-full" />
                    <div className="text-sm text-muted-foreground">Overall Attendance</div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="flex flex-col items-center justify-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">{attendance.present}</div>
                      <div className="text-xs text-muted-foreground">Present</div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-xl font-bold text-red-600 dark:text-red-400">{attendance.absent}</div>
                      <div className="text-xs text-muted-foreground">Absent</div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{attendance.leave}</div>
                      <div className="text-xs text-muted-foreground">Leave</div>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="w-full mt-4" asChild>
                    <Link href="/student/attendance">
                      View Detailed Attendance
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Upcoming Exams</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Loading exams...</div>
                  ) : upcomingExams && upcomingExams.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingExams.slice(0, 3).map((exam) => (
                        <div
                          key={exam.id}
                          className="flex items-center p-3 border rounded-lg"
                        >
                          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary">
                            <span className="text-xs font-medium">
                              {format(new Date(exam.examDate), 'MMM')}
                            </span>
                            <span className="text-lg font-bold leading-tight">
                              {format(new Date(exam.examDate), 'd')}
                            </span>
                          </div>

                          <div className="ml-3 flex-1">
                            <h3 className="font-medium">{exam.title}</h3>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <span>{exam.subject.name}</span>
                              <span className="mx-1">•</span>
                              <span>{exam.duration} min</span>
                            </div>
                          </div>

                          <Badge>
                            {exam.examType.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" className="w-full" asChild>
                        <Link href="/student/exams">
                          View All Exams
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No upcoming exams</p>
                      <Button variant="ghost" size="sm" className="mt-4" asChild>
                        <Link href="/student/exams">
                          View All Exams
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Recent Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Loading results...</div>
                  ) : recentResults && recentResults.length > 0 ? (
                    <div className="space-y-4">
                      {recentResults.map((result) => (
                        <div
                          key={result.id}
                          className="flex items-center p-3 border rounded-lg"
                        >
                          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                            {result.letterGrade ? (
                              <span className={`text-lg font-bold ${getGradeColor(result.letterGrade)}`}>
                                {result.letterGrade}
                              </span>
                            ) : (
                              <span className="text-lg font-bold">-</span>
                            )}
                          </div>

                          <div className="ml-3 flex-1">
                            <h3 className="font-medium">{result.title}</h3>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <span>{result.subject.name}</span>
                              <span className="mx-1">•</span>
                              <span>{format(new Date(result.examDate), 'dd MMM yyyy')}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            {result.isAbsent ? (
                              <Badge variant="destructive">Absent</Badge>
                            ) : result.obtainedMarks === null ? (
                              <Badge variant="outline">Pending</Badge>
                            ) : (
                              <div className="flex flex-col items-end">
                                <span className="font-medium">
                                  {result.obtainedMarks}/{result.maxMarks}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {result.percentage?.toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" className="w-full" asChild>
                        <Link href="/student/results">
                          View All Results
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No recent results</p>
                      <Button variant="ghost" size="sm" className="mt-4" asChild>
                        <Link href="/student/results">
                          View All Results
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Subject Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Loading subjects...</div>
                  ) : subjects && subjects.length > 0 ? (
                    <div className="space-y-4">
                      {subjects.slice(0, 4).map((subject) => (
                        <div key={subject.id} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="font-medium">{subject.name}</span>
                            <span className="text-sm text-muted-foreground">{subject.progress}%</span>
                          </div>
                          <Progress value={subject.progress} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            Teacher: {subject.teacherName}
                          </div>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" className="w-full" asChild>
                        <Link href="/student/subjects">
                          View All Subjects
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No subjects found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="schedule">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2"
          >
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">Today's Classes</h2>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" asChild>
                  <Link href="/student/timetable">
                    View All <ChevronRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-8">Loading classes...</div>
              ) : todayClasses && todayClasses.length > 0 ? (
                todayClasses.map((cls, index) => {
                  const [hours, minutes] = cls.time.split(':');
                  const startTime = new Date();
                  startTime.setHours(parseInt(hours), parseInt(minutes), 0);

                  const endTime = new Date(startTime);
                  endTime.setMinutes(endTime.getMinutes() + cls.duration);

                  const now = new Date();
                  const isActive = now >= startTime && now < endTime;
                  const isPast = now > endTime;
                  const isUpcoming = now < startTime;

                  return (
                    <Card
                      key={index}
                      className={`mb-3 border-0 shadow-sm ${isActive ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary">
                            <span className="text-xs">
                              {format(startTime, 'a')}
                            </span>
                            <span className="text-lg font-bold leading-tight">
                              {format(startTime, 'h:mm')}
                            </span>
                          </div>

                          <div className="ml-3 flex-1">
                            <h3 className="font-medium">{cls.subject}</h3>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <Users className="h-3 w-3 mr-1" />
                              <span>{cls.teacher}</span>
                              <span className="mx-1">•</span>
                              <span>Room {cls.room}</span>
                            </div>
                          </div>

                          {isActive && (
                            <Badge>Ongoing</Badge>
                          )}

                          {isPast && (
                            <Badge variant="outline">Completed</Badge>
                          )}

                          {isUpcoming && (
                            <Badge variant="secondary">Upcoming</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6 text-center">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No classes scheduled for today</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">Upcoming Exams</h2>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" asChild>
                  <Link href="/student/exams">
                    View All <ChevronRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-8">Loading exams...</div>
              ) : upcomingExams && upcomingExams.length > 0 ? (
                upcomingExams.slice(0, 3).map((exam) => (
                  <Card
                    key={exam.id}
                    className="border-0 shadow-sm mb-3"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center">
                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                          <span className="text-xs font-medium">
                            {format(new Date(exam.examDate), 'MMM')}
                          </span>
                          <span className="text-lg font-bold leading-tight">
                            {format(new Date(exam.examDate), 'd')}
                          </span>
                        </div>

                        <div className="ml-3 flex-1">
{/* // Continuing from where we left off */}
                          <h3 className="font-medium">{exam.title}</h3>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <span>{exam.subject.name}</span>
                            <span className="mx-1">•</span>
                            <span>{exam.duration} min</span>
                          </div>
                        </div>

                        <Badge variant={exam.examType === 'FINAL' ? 'destructive' : 'outline'}>
                          {exam.examType.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6 text-center">
                    <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No upcoming exams</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="academics">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2"
          >
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">Subject Overview</h2>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" asChild>
                  <Link href="/student/subjects">
                    View All <ChevronRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-8">Loading subjects...</div>
              ) : subjects && subjects.length > 0 ? (
                <div className="space-y-4">
                  {subjects.map((subject) => (
                    <Card key={subject.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">{subject.name}</h3>
                          <Badge variant="outline">{subject.progress}%</Badge>
                        </div>
                        <Progress value={subject.progress} className="h-2 mb-2" />
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Teacher: {subject.teacherName}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6 text-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No subjects found</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">Recent Results</h2>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" asChild>
                  <Link href="/student/results">
                    View All <ChevronRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-8">Loading results...</div>
              ) : recentResults && recentResults.length > 0 ? (
                <div className="space-y-4">
                  {recentResults.map((result) => (
                    <Card key={result.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                            {result.letterGrade ? (
                              <span className={`text-lg font-bold ${getGradeColor(result.letterGrade)}`}>
                                {result.letterGrade}
                              </span>
                            ) : (
                              <span className="text-lg font-bold">-</span>
                            )}
                          </div>

                          <div className="ml-3 flex-1">
                            <h3 className="font-medium">{result.title}</h3>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <span>{result.subject.name}</span>
                              <span className="mx-1">•</span>
                              <span>{format(new Date(result.examDate), 'dd MMM yyyy')}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            {result.isAbsent ? (
                              <Badge variant="destructive">Absent</Badge>
                            ) : result.obtainedMarks === null ? (
                              <Badge variant="outline">Pending</Badge>
                            ) : (
                              <div className="flex flex-col items-end">
                                <span className="font-medium">
                                  {result.obtainedMarks}/{result.maxMarks}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {result.percentage?.toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No recent results</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">Attendance Overview</h2>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" asChild>
                  <Link href="/student/attendance">
                    View Details <ChevronRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="col-span-1 md:col-span-1">
                      <div className="text-center">
                        <div className="text-4xl font-bold">{getAttendancePercentage()}%</div>
                        <Progress value={getAttendancePercentage()} className="my-2" />
                        <div className="text-sm text-muted-foreground">Overall Attendance</div>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-3">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col items-center justify-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-xl font-bold text-green-600 dark:text-green-400">{attendance.present}</div>
                          <div className="text-xs text-muted-foreground">Present</div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div className="text-xl font-bold text-red-600 dark:text-red-400">{attendance.absent}</div>
                          <div className="text-xs text-muted-foreground">Absent</div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{attendance.leave}</div>
                          <div className="text-xs text-muted-foreground">Leave</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="announcements">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>School Announcements</CardTitle>
                  <CardDescription>Latest announcements and notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Loading announcements...</div>
                  ) : announcements && announcements.length > 0 ? (
                    <div className="space-y-4">
                      {announcements.map((announcement) => (
                        <div
                          key={announcement.id}
                          className={cn(
                            "p-4 rounded-lg border relative",
                            !announcement.isRead ? "bg-primary/5 dark:bg-primary/10" : ""
                          )}
                        >
                          {!announcement.isRead && (
                            <div className="absolute top-4 right-4">
                              <Badge variant="default" className="px-2 py-0 h-5">New</Badge>
                            </div>
                          )}
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium">{announcement.title}</h3>
                            <span className="text-xs text-muted-foreground">{announcement.date}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{announcement.content}</p>
                          {!announcement.isRead && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAnnouncementAsRead(announcement.id)}
                              className="mt-2"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark as read
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No announcements</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="schedule">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Today's Classes</CardTitle>
                  <CardDescription>Your class schedule for today</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Loading schedule...</div>
                  ) : todayClasses && todayClasses.length > 0 ? (
                    <div className="space-y-4">
                      {todayClasses.map((cls, index) => {
                        const [hours, minutes] = cls.time.split(':');
                        const startTime = new Date();
                        startTime.setHours(parseInt(hours), parseInt(minutes), 0);

                        const endTime = new Date(startTime);
                        endTime.setMinutes(endTime.getMinutes() + cls.duration);

                        const now = new Date();
                        const isActive = now >= startTime && now < endTime;
                        const isPast = now > endTime;
                        const isUpcoming = now < startTime;

                        return (
                          <div
                            key={index}
                            className={cn(
                              "p-4 rounded-lg border relative",
                              isActive ? "bg-primary/5 dark:bg-primary/10 border-primary/20" : ""
                            )}
                          >
                            <div className="flex items-center">
                              <div className="flex flex-col items-center justify-center w-16 h-16 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary">
                                <span className="text-xs">
                                  {format(startTime, 'a')}
                                </span>
                                <span className="text-lg font-bold leading-tight">
                                  {format(startTime, 'h:mm')}
                                </span>
                                <span className="text-xs">
                                  {format(endTime, 'h:mm')}
                                </span>
                              </div>

                              <div className="ml-4 flex-1">
                                <h3 className="font-medium text-lg">{cls.subject}</h3>
                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                  <Users className="h-3 w-3 mr-1" />
                                  <span>{cls.teacher}</span>
                                  <span className="mx-1">•</span>
                                  <span>Room {cls.room}</span>
                                  <span className="mx-1">•</span>
                                  <span>{cls.duration} mins</span>
                                </div>
                              </div>

                              <div>
                                {isActive && (
                                  <Badge className="ml-2">Ongoing</Badge>
                                )}

                                {isPast && (
                                  <Badge variant="outline" className="ml-2">Completed</Badge>
                                )}

                                {isUpcoming && (
                                  <Badge variant="secondary" className="ml-2">Upcoming</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div className="text-center pt-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/student/timetable">View Full Timetable</Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No classes scheduled for today</p>
                      <Button variant="outline" size="sm" className="mt-4" asChild>
                        <Link href="/student/timetable">View Full Timetable</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Quick Access Floating Menu */}
      {/* <div className="fixed bottom-20 right-4 z-40 lg:bottom-8">
        <TooltipProvider>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="bg-card shadow-lg rounded-full p-2 flex flex-col gap-2 border border-border/40"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={() => router.push('/student/schedule')} className="rounded-full">
                  <Calendar className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Timetable</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={() => router.push('/student/exams')} className="rounded-full">
                  <FileText className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Exams</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={() => router.push('/student/results')} className="rounded-full">
                  <BarChart3 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Results</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={() => router.push('/student/messages')} className="rounded-full">
                  <MessagesSquare className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Messages</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        </TooltipProvider>
      </div> */}
    </DashboardLayout>
  );
}
