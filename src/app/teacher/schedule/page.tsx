"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar, Clock, BookOpen, ChevronLeft, ChevronRight,
  ArrowLeft, ArrowRight, FileDown
} from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";

type ScheduleItem = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  className: string;
  section: string;
  room: string;
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

export default function TeacherSchedule() {
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const { toast } = useToast();

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const timeSlots = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

  useEffect(() => {
    fetchSchedule();
  }, [currentWeekStart]);

  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      // Format date for API
      const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');

      const response = await fetch(`/api/teacher/schedule?week=${weekStartStr}`);

      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      const data = await response.json();
      setWeeklySchedule(data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast({
        title: "Error",
        description: "Failed to load schedule",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  // Format time from 24h to 12h format
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Find schedule item for a specific day and time slot
  const findScheduleItem = (day: string, timeSlot: string) => {
    if (!weeklySchedule[day]) return null;

    return weeklySchedule[day].find(item => {
      const itemStart = item.startTime;
      // Check if this item starts at the current time slot
      return formatTime(itemStart) === timeSlot;
    });
  };

  // Check if an item spans multiple time slots
  const getItemRowSpan = (item: ScheduleItem) => {
    const startHour = parseInt(item.startTime.split(':')[0]);
    const endHour = parseInt(item.endTime.split(':')[0]);
    return endHour - startHour;
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">My Schedule</h1>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export Schedule
          </Button>
        </div>
      </div>

      <Tabs defaultValue="week" className="mb-6" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="week">Weekly View</TabsTrigger>
            <TabsTrigger value="day">Daily View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(currentWeekStart, 'dd MMM')} - {format(addDays(currentWeekStart, 6), 'dd MMM, yyyy')}
            </span>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="week" className="mt-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Weekly Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                  <p className="mt-2 text-muted-foreground">Loading schedule...</p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-3 text-left font-medium text-muted-foreground w-20">Time</th>
                        {days.map((day, index) => (
                          <th key={day} className="p-3 text-left font-medium">
                            <div>{day}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(addDays(currentWeekStart, index), 'dd MMM')}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((time, timeIndex) => (
                        <tr key={time} className="border-t">
                          <td className="p-3 align-top">
                            <div className="text-sm font-medium">{time}</div>
                          </td>
                          {days.map((day, dayIndex) => {
                            const scheduleItem = findScheduleItem(day, time);
                            const dateForThisCell = addDays(currentWeekStart, dayIndex);
                            const isToday = isSameDay(dateForThisCell, new Date());

                            if (scheduleItem) {
                              const rowSpan = getItemRowSpan(scheduleItem);

                              // Only render cell if this is the starting time slot
                              if (formatTime(scheduleItem.startTime) === time) {
                                return (
                                  <td
                                    key={`${day}-${time}`}
                                    className={`p-3 align-top ${isToday ? 'bg-primary/5' : ''}`}
                                    rowSpan={rowSpan || 1}
                                  >
                                    <div className={`p-3 rounded-md bg-card border ${isToday ? 'border-primary/30' : 'border-border'}`}>
                                      <div className="font-medium truncate">{scheduleItem.subject}</div>
                                      <div className="text-sm text-muted-foreground">
                                        Class {romanize(parseInt(scheduleItem.className))}-{scheduleItem.section}
                                      </div>
                                      <div className="flex items-center mt-2 text-xs">
                                        <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                                        <span>{formatTime(scheduleItem.startTime)} - {formatTime(scheduleItem.endTime)}</span>
                                      </div>
                                      <div className="mt-1 text-xs">
                                        <Badge variant="outline" className="mt-1">Room {scheduleItem.room}</Badge>
                                      </div>
                                    </div>
                                  </td>
                                );
                              }
                              // Skip this cell as it's part of a multi-hour class
                              return null;
                            }

                            return (
                              <td
                                key={`${day}-${time}`}
                                className={`p-3 align-top ${isToday ? 'bg-primary/5' : ''}`}
                              ></td>
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
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Today's Schedule
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    {format(new Date(), 'EEEE, dd MMMM yyyy')}
                  </span>
                  <Button variant="outline" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                  <p className="mt-2 text-muted-foreground">Loading schedule...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {weeklySchedule[format(new Date(), 'EEEE')] && weeklySchedule[format(new Date(), 'EEEE')].length > 0 ? (
                    weeklySchedule[format(new Date(), 'EEEE')].map((item) => (
                      <div key={item.id} className="flex p-4 rounded-lg border bg-card">
                        <div className="w-20 text-center border-r pr-3">
                          <div className="text-sm font-medium">{formatTime(item.startTime)}</div>
                          <div className="text-xs text-muted-foreground">to</div>
                          <div className="text-sm font-medium">{formatTime(item.endTime)}</div>
                        </div>
                        <div className="ml-6">
                          <div className="font-medium text-lg">{item.subject}</div>
                          <div className="text-sm text-muted-foreground mb-2">
                            Class {romanize(parseInt(item.className))}-{item.section}
                          </div>
                          <Badge variant="outline">Room {item.room}</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                      <h3 className="font-medium text-lg mb-1">No Classes Today</h3>
                      <p className="text-muted-foreground mb-4">You don't have any scheduled classes for today.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                All Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                  <p className="mt-2 text-muted-foreground">Loading schedule...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {days.map((day) => (
                    <div key={day}>
                      <h3 className="font-medium text-lg mb-3">{day}</h3>
                      {weeklySchedule[day] && weeklySchedule[day].length > 0 ? (
                        <div className="space-y-2">
                          {weeklySchedule[day].map((item) => (
                            <div key={item.id} className="flex items-center p-3 rounded-md border bg-card">
                              <div className="mr-4 w-24 text-sm">
                                {formatTime(item.startTime)} - {formatTime(item.endTime)}
                              </div>
                              <div>
                                <div className="font-medium">{item.subject}</div>
                                <div className="text-sm text-muted-foreground">
                                  Class {romanize(parseInt(item.className))}-{item.section} • Room {item.room}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted-foreground p-3 bg-muted/20 rounded-md text-center">
                          No classes scheduled
                        </div>
                      )}
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
