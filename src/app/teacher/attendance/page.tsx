"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Check, X, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type Class = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  name: string;
  surname: string;
  rollNo: string;
  img?: string;
};

type AttendanceRecord = {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  notes: string;
};

export default function TeacherAttendance() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [attendance, setAttendance] = useState<{ [key: string]: AttendanceRecord }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRecords, setExistingRecords] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    } else {
      setStudents([]);
      setFilteredStudents([]);
      setAttendance({});
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && date) {
      checkExistingAttendance();
    }
  }, [selectedClass, date]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredStudents(
        students.filter(
          (student) =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredStudents(students);
    }
  }, [students, searchTerm]);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/teacher/classes');
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Failed to load classes",
        variant: "destructive",
      });
    }
  };

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/teacher/classes/${selectedClass}/students`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      setStudents(data);
      setFilteredStudents(data);

      // Initialize attendance for all students as PRESENT
      const initialAttendance: { [key: string]: AttendanceRecord } = {};
      data.forEach((student: Student) => {
        initialAttendance[student.id] = {
          studentId: student.id,
          status: 'PRESENT',
          notes: ''
        };
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingAttendance = async () => {
    try {
      setIsLoading(true);
      const formattedDate = format(date, 'yyyy-MM-dd');
      const response = await fetch(
        `/api/teacher/attendance?classId=${selectedClass}&date=${formattedDate}`
      );

      if (!response.ok) {
        throw new Error('Failed to check existing attendance');
      }

      const data = await response.json();

      if (data.length > 0) {
        setExistingRecords(true);

        // Populate attendance state with existing records
        const existingAttendance: { [key: string]: AttendanceRecord } = {};
        data.forEach((record: any) => {
          existingAttendance[record.student.id] = {
            studentId: record.student.id,
            status: record.status,
            notes: record.notes || ''
          };
        });

        setAttendance(existingAttendance);

        toast({
          title: "Existing Records Found",
          description: "Attendance for this date already exists and has been loaded.",
          variant: "default",
        });
      } else {
        setExistingRecords(false);
      }
    } catch (error) {
      console.error('Error checking existing attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setAttendance({
      ...attendance,
      [studentId]: {
        ...attendance[studentId],
        status
      }
    });
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendance({
      ...attendance,
      [studentId]: {
        ...attendance[studentId],
        notes
      }
    });
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    const updatedAttendance = { ...attendance };
    filteredStudents.forEach(student => {
      updatedAttendance[student.id] = {
        ...updatedAttendance[student.id],
        status
      };
    });
    setAttendance(updatedAttendance);
  };

  const submitAttendance = async () => {
    if (!selectedClass || !date) {
      toast({
        title: "Error",
        description: "Please select a class and date",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Convert attendance object to array
      const attendanceData = Object.values(attendance);

      const response = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: selectedClass,
          date: date.toISOString(),
          attendanceData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit attendance');
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: `Attendance recorded successfully for ${result.records} students.`,
        variant: "default",
      });

      // Update the existing records flag since we've saved records
      setExistingRecords(true);

    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast({
        title: "Error",
        description: "Failed to submit attendance",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get initials for avatar
  const getInitials = (name: string, surname: string) => {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Attendance Management</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Take Attendance</CardTitle>
          <CardDescription>
            Select a class and date to record attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium leading-none mb-2 block">
                Class
              </label>
              <Select
                value={selectedClass}
                onValueChange={setSelectedClass}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium leading-none mb-2 block">
                Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="self-end">
              <Button
                onClick={submitAttendance}
                disabled={!selectedClass || isSubmitting || isLoading || students.length === 0}
                className="w-full"
              >
                {isSubmitting ? "Saving..." : existingRecords ? "Update Attendance" : "Save Attendance"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClass && students.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Students</CardTitle>
                <CardDescription>
                  {format(date, "EEEE, MMMM d, yyyy")}
                </CardDescription>
              </div>

              <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2 sm:gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleMarkAll('PRESENT')}
                          disabled={isSubmitting}
                        >
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Mark all as present</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleMarkAll('ABSENT')}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Mark all as absent</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleMarkAll('LATE')}
                          disabled={isSubmitting}
                        >
                          <Clock className="h-4 w-4 text-yellow-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Mark all as late</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleMarkAll('EXCUSED')}
                          disabled={isSubmitting}
                        >
                          <AlertCircle className="h-4 w-4 text-blue-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Mark all as excused</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-10">Loading students...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-10">
                {searchTerm ? (
                  <p>No students match your search</p>
                ) : (
                  <p>No students found in this class</p>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={student.img || ''} alt={`${student.name} ${student.surname}`} />
                            <AvatarFallback>{getInitials(student.name, student.surname)}</AvatarFallback>
                          </Avatar>
                          <div>
                            {student.name} {student.surname}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.rollNo}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={attendance[student.id]?.status === 'PRESENT' ? 'default' : 'outline'}
                                  size="icon"
                                  onClick={() => handleStatusChange(student.id, 'PRESENT')}
                                  disabled={isSubmitting}
                                  className={attendance[student.id]?.status === 'PRESENT' ? 'bg-green-500 hover:bg-green-600' : ''}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Present</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={attendance[student.id]?.status === 'ABSENT' ? 'default' : 'outline'}
                                  size="icon"
                                  onClick={() => handleStatusChange(student.id, 'ABSENT')}
                                  disabled={isSubmitting}
                                  className={attendance[student.id]?.status === 'ABSENT' ? 'bg-red-500 hover:bg-red-600' : ''}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Absent</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={attendance[student.id]?.status === 'LATE' ? 'default' : 'outline'}
                                  size="icon"
                                  onClick={() => handleStatusChange(student.id, 'LATE')}
                                  disabled={isSubmitting}
                                  className={attendance[student.id]?.status === 'LATE' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                                >
                                  <Clock className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Late</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={attendance[student.id]?.status === 'EXCUSED' ? 'default' : 'outline'}
                                  size="icon"
                                  onClick={() => handleStatusChange(student.id, 'EXCUSED')}
                                  disabled={isSubmitting}
                                  className={attendance[student.id]?.status === 'EXCUSED' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                                >
                                  <AlertCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Excused</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Textarea
                          placeholder="Add notes (optional)"
                          className="resize-none min-h-[50px]"
                          value={attendance[student.id]?.notes || ''}
                          onChange={(e) => handleNotesChange(student.id, e.target.value)}
                          disabled={isSubmitting}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : selectedClass && !isLoading ? (
        <Card>
          <CardContent className="text-center py-10">
            <p>No students found in this class.</p>
          </CardContent>
        </Card>
      ) : null}
    </DashboardLayout>
  );
}
