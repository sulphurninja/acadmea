"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  BookOpen,
  User,
  MapPin,
  FileDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, parseISO, addDays, getDay, startOfWeek } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ClassSchedule = {
  id: string;
  subject: string;
  teacher: string;
  day: string;
  time: string;
  room: string;
  duration: number;
};

// Days of the week
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Time slots for the day view
const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00"
];

export default function StudentSchedule() {
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<ClassSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDay, setSelectedDay] = useState(format(new Date(), 'EEEE'));

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/student/timetable');
      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }
      const data = await response.json();
      setSchedule(data.classes);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast({
        title: "Error",
        description: "Failed to load your class schedule",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert 24h time format to 12h format
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Go to previous week
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  // Go to next week
  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  // Get classes for a specific day
  const getClassesForDay = (day: string) => {
    return schedule.filter(cls => cls.day === day)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  // Get all days with classes
  const getDaysWithClasses = () => {
    const daysWithClasses = new Set(schedule.map(cls => cls.day));
    return days.filter(day => daysWithClasses.has(day));
  };

  // Find class for a specific time slot and day
  const findClassForTimeSlot = (day: string, timeSlot: string) => {
    return schedule.find(cls =>
      cls.day === day &&
      cls.time === timeSlot
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Class Schedule</h1>
          <p className="text-muted-foreground">View your weekly timetable</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSchedule}>
            <Search className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="week">
        <TabsList className="mb-6">
          <TabsTrigger value="week">
            <Calendar className="mr-2 h-4 w-4" />
            Weekly View
          </TabsTrigger>
          <TabsTrigger value="day">
            <Clock className="mr-2 h-4 w-4" />
            Daily View
          </TabsTrigger>
          <TabsTrigger value="list">
            <BookOpen className="mr-2 h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="week">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Weekly Schedule</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
                  </span>
                  <Button variant="outline" size="icon" onClick={goToNextWeek}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                Your complete class schedule for the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
                </div>
              ) : schedule.length === 0 ? (
                <div className="text-center py-10">
                  <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No Classes Scheduled</h3>
                  <p className="text-muted-foreground">
                    You don't have any classes scheduled for this week.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left font-medium text-muted-foreground w-28">
                          Time
                        </th>
                        {days.map((day, index) => {
                          const dateForDay = addDays(currentWeekStart, index);
                          const isToday = format(new Date(), 'EEEE') === day;

                          return (
                            <th
                              key={day}
                              className={cn(
                                "p-3 text-left font-medium border-l",
                                isToday && "bg-primary/5"
                              )}
                            >
                              <div className="font-semibold">{day}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {format(dateForDay, 'MMM d')}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((time, timeIndex) => (
                        <tr key={time} className={cn(
                          "border-b",
                          timeIndex % 2 === 0 ? "bg-muted/20" : "bg-card"
                        )}>
                          <td className="p-3 font-medium text-sm">
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-2 text-primary/70" />
                              {formatTime(time)}
                            </div>
                          </td>
                          {days.map((day) => {
                            const isToday = format(new Date(), 'EEEE') === day;
                            const classForSlot = findClassForTimeSlot(day, time);

                            return (
                              <td
                                key={`${day}-${time}`}
                                className={cn(
                                  "p-2 border-l align-top",
                                  isToday && "bg-primary/5"
                                )}
                              >
                                {classForSlot && (
                                  <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className={cn(
                                      "p-3 rounded-md h-full border shadow-sm transition-all",
                                      isToday ? "border-primary/40 bg-primary/5" : "bg-card"
                                    )}
                                  >
                                    <div className="font-medium mb-1">{classForSlot.subject}</div>
                                    <div className="text-xs text-muted-foreground flex items-center">
                                      <User className="h-3 w-3 mr-1" />
                                      {classForSlot.teacher}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1 flex items-center">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      Room {classForSlot.room}
                                    </div>
                                    <div className="mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {formatTime(classForSlot.time)}
                                      </Badge>
                                    </div>
                                  </motion.div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="day">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <CardTitle>Daily Schedule</CardTitle>
                <div className="mt-3 md:mt-0">
                  <select
                    className="border rounded p-1 text-sm"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                  >
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>
              <CardDescription>
                Your classes for {selectedDay}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
                </div>
              ) : getClassesForDay(selectedDay).length === 0 ? (
                <div className="text-center py-10">
                  <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No Classes Scheduled</h3>
                  <p className="text-muted-foreground">
                    You don't have any classes scheduled for {selectedDay}.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getClassesForDay(selectedDay).map((cls, index) => (
                    <motion.div
                      key={cls.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border rounded-lg shadow-sm"
                    >
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center text-primary mr-4">
                          <Clock className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-lg">{cls.subject}</h3>
                            <Badge variant="outline">
                              {formatTime(cls.time)}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center mt-1">
                            <User className="h-4 w-4 mr-1" />
                            {cls.teacher}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            Room {cls.room}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>All Classes</CardTitle>
              <CardDescription>
                Complete list of your classes by day
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
                </div>
              ) : schedule.length === 0 ? (
                <div className="text-center py-10">
                  <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No Classes Scheduled</h3>
                  <p className="text-muted-foreground">
                    You don't have any classes scheduled.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {getDaysWithClasses().map(day => (
                    <div key={day}>
                      <h3 className="font-medium text-lg mb-3 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-primary" />
                        {day}
                      </h3>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {getClassesForDay(day).map((cls) => (
                          <Card key={cls.id} className="shadow-sm">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">{cls.subject}</h4>
                                <Badge variant="outline">
                                  {formatTime(cls.time)}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {cls.teacher}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center mt-1">
                                <MapPin className="h-4 w-4 mr-1" />
                                Room {cls.room}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
