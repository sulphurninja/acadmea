"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  FileDown,
  Building2,
  Users,
  Layers,
  Plus,
  Info,
  Trash2
} from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogHeader, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ScheduleItem = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  className: string;
  section: string;
  teacherName: string;
};

type WeeklySchedule = {
  [key: string]: ScheduleItem[];
};

// Helper for Roman numerals for class display
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

export default function AdminSchedule() {
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showDialog, setShowDialog] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    classId: "",
    day: "Monday",
    startTime: "",
    endTime: "",
    subject: "",
    teacherName: "",
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const timeSlots = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

  useEffect(() => {
    fetchSchedule();
  }, [currentWeekStart]);

  useEffect(() => {
    fetchSections();
    fetchSubjects();
  }, []);

  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      // Format date for API
      const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
      const response = await fetch(`/api/admin/schedule?week=${weekStartStr}`);

      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      const data = await response.json();
      setWeeklySchedule(data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast.error("Failed to load schedule");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/admin/classes');
      if (!response.ok) throw new Error("Failed to fetch sections");

      const data = await response.json();
      setSections(data);
    } catch (error) {
      console.error("Error fetching sections:", error);
      toast.error("Failed to load sections");
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/admin/subjects');
      if (!response.ok) throw new Error("Failed to fetch subjects");

      const data = await response.json();
      setSubjects(data.subjects || []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to load subjects");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.classId || !formData.day || !formData.startTime ||
        !formData.endTime || !formData.subject || !formData.teacherName) {
        toast.error("All fields are required");
        return;
      }

      // Validate time format
      const timeFormat = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeFormat.test(formData.startTime) || !timeFormat.test(formData.endTime)) {
        toast.error("Time must be in 24-hour format (HH:MM)");
        return;
      }

      const res = await fetch("/api/admin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add timetable");
      }

      toast.success("Timetable entry added successfully");
      setShowDialog(false);
      // Reset form
      setFormData({
        classId: "",
        day: "Monday",
        startTime: "",
        endTime: "",
        subject: "",
        teacherName: "",
      });
      fetchSchedule(); // Refresh view
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Could not add timetable");
    }
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  // Navigate to previous day (for day view)
  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  // Navigate to next day (for day view)
  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  // Format time from 24h to 12h format
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Fixed findScheduleItem function to correctly match time slots
  const findScheduleItem = (day: string, timeSlot: string) => {
    if (!weeklySchedule[day]) return null;

    // Convert the timeSlot string (e.g., "8:00 AM") to 24-hour format for comparison
    const convertTo24Hour = (timeStr: string) => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);

      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const timeSlot24 = convertTo24Hour(timeSlot);

    // Find any schedule item that starts at this time slot
    return weeklySchedule[day].find(item => item.startTime === timeSlot24);
  };

  // Check if an item spans multiple time slots
  const getItemRowSpan = (item: ScheduleItem) => {
    const startHour = parseInt(item.startTime.split(':')[0]);
    const endHour = parseInt(item.endTime.split(':')[0]);
    return endHour - startHour;
  };

  // Get the current day's schedule
  const getDaySchedule = (date: Date) => {
    const dayName = format(date, 'EEEE');
    return weeklySchedule[dayName] || [];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">School Timetable</h1>
            <p className="text-muted-foreground">Manage and view class schedules for the school</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Timetable Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Add New Timetable Entry</DialogTitle>
                  <DialogDescription>
                    Create a new class schedule entry. All fields are required.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      <Select
                        value={formData.classId}
                        onValueChange={(value) => handleInputChange("classId", value)}
                      >
                        <SelectTrigger id="section">
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map((section) => (
                            <SelectItem key={section._id} value={String(section._id)}>
                              Class {romanize(section.grade?.level || 0)}-{section.name?.split('-')[1] || section.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) => handleInputChange("subject", value)}
                      >
                        <SelectTrigger id="subject">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id || subject._id} value={subject.name}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="day">Day</Label>
                    <Select
                      value={formData.day}
                      onValueChange={(value) => handleInputChange("day", value)}
                    >
                      <SelectTrigger id="day">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time (24h format)</Label>
                      <Input
                        id="startTime"
                        value={formData.startTime}
                        onChange={(e) => handleInputChange("startTime", e.target.value)}
                        placeholder="e.g., 08:00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time (24h format)</Label>
                      <Input
                        id="endTime"
                        value={formData.endTime}
                        onChange={(e) => handleInputChange("endTime", e.target.value)}
                        placeholder="e.g., 09:00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teacherName">Teacher Name</Label>
                    <Input
                      id="teacherName"
                      value={formData.teacherName}
                      onChange={(e) => handleInputChange("teacherName", e.target.value)}
                      placeholder="Teacher Name"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                  <Button onClick={handleSubmit}>Add Entry</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <FileDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export schedule</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <Tabs defaultValue="week" className="w-full" onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="week" className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                <span>Weekly View</span>
              </TabsTrigger>
              <TabsTrigger value="day" className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span>Daily View</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>List View</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center justify-center gap-2 bg-muted/40 rounded-md px-3 py-1.5 border">
              {activeTab === "week" ? (
                <>
                  <Button variant="ghost" size="icon" onClick={goToPreviousWeek} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-medium min-w-[140px] text-center">
                    {format(currentWeekStart, 'dd MMM')} - {format(addDays(currentWeekStart, 6), 'dd MMM, yyyy')}
                  </div>
                  <Button variant="ghost" size="icon" onClick={goToNextWeek} className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              ) : activeTab === "day" ? (
                <>
                  <Button variant="ghost" size="icon" onClick={goToPreviousDay} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-medium min-w-[140px] text-center">
                    {format(currentDate, 'EEEE, dd MMMM yyyy')}
                  </div>
                  <Button variant="ghost" size="icon" onClick={goToNextDay} className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="text-sm font-medium min-w-[140px] text-center">
                  Full Schedule Overview
                </div>
              )}
            </div>
          </div>

          <TabsContent value="week" className="mt-0 p-0">
            <Card className=" shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
                  Weekly Class Schedule
                </CardTitle>
                <CardDescription>
                  View and manage the complete weekly schedule for all classes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full -4 border-solid border-current border-primary/30 border-r-transparent"></div>
                    <p className="mt-4 text-muted-foreground">Loading timetable data...</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-22rem)]">
                    <div className="w-full min-w-[900px]">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="p-4 text-left font-medium text-muted-foreground w-28 sticky left-0 bg-card z-10 border-r">
                              Time Slot
                            </th>
                            {days.map((day, index) => (
                              <th key={day} className="p-4 text-left font-medium">
                                <div className="font-semibold">{day}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {format(addDays(currentWeekStart, index), 'dd MMM')}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>

                          {timeSlots.map((time, timeIndex) => (
                            <tr key={time} className={cn(
                              "border-b",
                              timeIndex % 2 === 0 ? "bg-muted/20" : "bg-card"
                            )}>
                              <td className="p-4 font-medium text-sm sticky left-0 bg-inherit z-10 border-r">
                                <div className="flex items-center">
                                  <Clock className="h-3.5 w-3.5 mr-2 text-primary/70" />
                                  {time}
                                </div>
                              </td>
                              {days.map((day, dayIndex) => {
                                // Log the schedule data to help debug
                                if (timeIndex === 0) {
                                  console.log(`Schedule for ${day}:`, weeklySchedule[day]);
                                }

                                const scheduleItem = findScheduleItem(day, time);
                                const dateForThisCell = addDays(currentWeekStart, dayIndex);
                                const isToday = isSameDay(dateForThisCell, new Date());

                                if (scheduleItem) {
                                  const rowSpan = getItemRowSpan(scheduleItem);
                                  console.log(`Found item for ${day} at ${time}:`, scheduleItem);

                                  return (
                                    <td
                                      key={`${day}-${time}`}
                                      className={cn(
                                        "p-2 align-top",
                                        isToday ? "bg-primary/5" : ""
                                      )}
                                      rowSpan={rowSpan || 1}
                                    >
                                      <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className={cn(
                                          "p-3 rounded-md h-full border shadow-sm transition-all",
                                          isToday ? "border-primary/40 bg-primary/5" : "bg-card"
                                        )}
                                      >
                                        <div className="flex justify-between items-start">
                                          <div className="font-medium truncate">{scheduleItem.subject}</div>
                                          <Badge variant={isToday ? "default" : "outline"} className="ml-2 font-normal">
                                            {formatTime(scheduleItem.startTime)} - {formatTime(scheduleItem.endTime)}
                                          </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1 flex items-center">
                                          <Users className="h-3.5 w-3.5 mr-1.5" />
                                          Class {romanize(parseInt(scheduleItem.className))}-{scheduleItem.section}
                                        </div>
                                        <div className="flex items-center mt-2 text-xs text-muted-foreground">
                                          <Building2 className="h-3.5 w-3.5 mr-1.5" />
                                          Room {scheduleItem.room}
                                        </div>
                                      </motion.div>
                                    </td>
                                  );
                                }

                                return (
                                  <td
                                    key={`${day}-${time}`}
                                    className={cn(
                                      "p-2 align-top",
                                      isToday ? "bg-primary/5" : ""
                                    )}
                                  ></td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
              <CardFooter className="py-3 px-6 border-t bg-muted/10 flex justify-between">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 mr-1.5" />
                  Updated {format(new Date(), "dd MMM yyyy, HH:mm")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {Object.values(weeklySchedule).flat().length} classes scheduled this week
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="day" className="mt-0">
            <Card className=" shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <Clock className="h-5 w-5 mr-2 text-primary" />
                  {format(currentDate, "EEEE's")} Schedule
                </CardTitle>
                <CardDescription>
                  All classes scheduled for {format(currentDate, "MMMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-primary/30 border-r-transparent"></div>
                    <p className="mt-4 text-muted-foreground">Loading schedule data...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getDaySchedule(currentDate).length > 0 ? (
                      getDaySchedule(currentDate)
                        .sort((a, b) => parseInt(a.startTime) - parseInt(b.startTime))
                        .map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex p-4 rounded-lg border shadow-sm hover:border-primary/30 transition-all bg-card"
                          >
                            <div className="min-w-[100px] text-center border-r pr-4">
                              <div className="text-sm font-bold">{formatTime(item.startTime)}</div>
                              <div className="text-xs text-muted-foreground my-1">to</div>
                              <div className="text-sm font-bold">{formatTime(item.endTime)}</div>
                            </div>
                            <div className="ml-6 flex-grow">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-semibold text-lg">{item.subject}</div>
                                  <div className="text-sm text-muted-foreground mb-2 flex items-center">
                                    <Users className="h-3.5 w-3.5 mr-1.5" />
                                    Class {romanize(parseInt(item.className))}-{item.section}
                                  </div>
                                </div>
                                <Badge variant="outline" className="ml-auto flex items-center gap-1">
                                  <Building2 className="h-3.5 w-3.5" />
                                  Teacher Name {item.teacherName}
                                </Badge>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button variant="outline" size="sm">Edit</Button>
                                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">Delete</Button>
                              </div>
                            </div>
                          </motion.div>
                        ))
                    ) : (
                      <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
                        <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <h3 className="font-medium text-lg mb-1">No Classes Scheduled</h3>
                        <p className="text-muted-foreground mb-4">There are no classes scheduled for {format(currentDate, "EEEE, MMMM d")}.</p>
                        <Button onClick={() => setShowDialog(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Class
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <Card className=" shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <BookOpen className="h-5 w-5 mr-2 text-primary" />
                  Complete Timetable
                </CardTitle>
                <CardDescription>
                  Full overview of all scheduled classes by day
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-primary/30 border-r-transparent"></div>
                    <p className="mt-4 text-muted-foreground">Loading timetable data...</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {days.map((day) => (
                      <div key={day} className="space-y-3">
                        <div className="flex items-center">
                          <h3 className="font-semibold text-lg flex items-center">
                            <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
                            {day}
                          </h3>
                          <Separator className="ml-4 flex-grow" />
                        </div>

                        {weeklySchedule[day] && weeklySchedule[day].length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {weeklySchedule[day]
                              .sort((a, b) => a.startTime.localeCompare(b.startTime))
                              .map((item, index) => (
                                <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="p-3 rounded-md border shadow-sm hover:border-primary/30 transition-all bg-card"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="font-medium">{item.subject}</div>
                                    <Badge variant="outline" className="font-normal text-xs">
                                      {formatTime(item.startTime)} - {formatTime(item.endTime)}
                                    </Badge>
                                  </div>
                                  <div className="mt-2 text-sm text-muted-foreground flex items-center">
                                    <Users className="h-3.5 w-3.5 mr-1.5" />
                                    Class {romanize(parseInt(item.className))}-{item.section}
                                  </div>
                                  <div className="mt-1 text-xs text-muted-foreground flex items-center">
                                    <Building2 className="h-3.5 w-3.5 mr-1.5" />
                                    Teacher Name {item.teacherName}
                                  </div>
                                  <div className="mt-3 flex gap-2">
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                      <Info className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </motion.div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-muted-foreground bg-muted/20 rounded-md py-4 px-3 text-center border border-dashed">
                            No classes scheduled for {day}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2 justify-between py-4 border-t">
                <Button variant="outline" size="sm" onClick={() => setShowDialog(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Schedule Entry
                </Button>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <FileDown className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <Clock className="h-4 w-4 mr-2" />
                    Set Hours
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Schedule Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(weeklySchedule).flat().length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {Object.keys(weeklySchedule).length} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Busiest Day</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(weeklySchedule).length > 0 ? (
                <>
                  <div className="text-2xl font-bold">
                    {Object.entries(weeklySchedule)
                      .sort((a, b) => b[1].length - a[1].length)[0]?.[0] || 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Object.entries(weeklySchedule)
                      .sort((a, b) => b[1].length - a[1].length)[0]?.[1].length || 0} scheduled classes
                  </p>
                </>
              ) : (
                <div className="text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {weeklySchedule[format(new Date(), 'EEEE')]?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(), 'EEEE, dd MMMM yyyy')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Additional component for the cells to improve performance
function ScheduleCell({ item, isToday }: { item: ScheduleItem; isToday: boolean }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        "p-3 rounded-md h-full border shadow-sm transition-all",
        isToday ? "border-primary/40 bg-primary/5" : "bg-card"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="font-medium truncate">{item.subject}</div>
        <Badge variant={isToday ? "default" : "outline"} className="ml-2 font-normal">
          {formatTime(item.startTime)} - {formatTime(item.endTime)}
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground mt-1 flex items-center">
        <Users className="h-3.5 w-3.5 mr-1.5" />
        Class {romanize(parseInt(item.className))}-{item.section}
      </div>
      <div className="flex items-center mt-2 text-xs text-muted-foreground">
        <Building2 className="h-3.5 w-3.5 mr-1.5" />
        Teacher Name {item.teacherName}
      </div>
    </motion.div>
  );
}

// Format time from 24h to 12h format for the ScheduleCell component
function formatTime(time: string) {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
}

