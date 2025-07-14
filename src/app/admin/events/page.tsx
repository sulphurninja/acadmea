"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  Trash2,
  Edit,
  Plus,
  Search,
  FilterX,
  CalendarIcon,
  Users,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isPast, isFuture, parseISO } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function EventsPage() {
  // State for event form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState("10:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // State for data
  const [classes, setClasses] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("upcoming");

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>(undefined);
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>(undefined);

  // Fetch classes and events
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch classes
        const classesResponse = await fetch('/api/admin/classes');
        const classesData = await classesResponse.json();
        setClasses(Array.isArray(classesData) ? classesData : []);

        // Fetch events
        await fetchEvents();
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Failed to load data");
      }
    };

    fetchData();
  }, []);

  // Fetch events with filters
  const fetchEvents = async () => {
    try {
      // Build query string with filters
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterClass) params.append('classId', filterClass);
      if (filterStartDate) params.append('startDate', filterStartDate.toISOString());
      if (filterEndDate) params.append('endDate', filterEndDate.toISOString());

      const response = await fetch(`/api/admin/events?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setEvents(data.events || []);
      } else {
        toast.error(data.message || "Failed to fetch events");
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error("Failed to load events");
    }
  };

  // Apply filters
  const handleApplyFilters = () => {
    fetchEvents();
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterClass("");
    setFilterStartDate(undefined);
    setFilterEndDate(undefined);
    // Fetch all events without filters
    fetchEvents();
  };

  // Combine date and time for submission
  const combineDateTime = (date: Date | undefined, timeString: string) => {
    if (!date) return null;

    const [hours, minutes] = timeString.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);

    return combined;
  };

  // Reset form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedClass("");
    setStartDate(undefined);
    setStartTime("09:00");
    setEndDate(undefined);
    setEndTime("10:00");
    setIsEditMode(false);
    setEditingEventId(null);
  };

  // Load event for editing
  const handleEditEvent = async (eventId: number) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`);
      const data = await response.json();

      if (response.ok && data.event) {
        const event = data.event;
        const startDateTime = new Date(event.startTime);
        const endDateTime = new Date(event.endTime);

        setTitle(event.title);
        setDescription(event.description);
        setSelectedClass(event.classId ? String(event.classId) : "");
        setStartDate(startDateTime);
        setStartTime(format(startDateTime, 'HH:mm'));
        setEndDate(endDateTime);
        setEndTime(format(endDateTime, 'HH:mm'));

        setIsEditMode(true);
        setEditingEventId(eventId);
        setDialogOpen(true);
      } else {
        toast.error(data.message || "Failed to load event");
      }
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error("Failed to load event");
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Event deleted successfully");
        // Remove from state
        setEvents(events.filter(event => event.id !== eventId));
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to delete event");
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error("Failed to delete event");
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form fields
    if (!title) {
      toast.error("Title is required");
      return;
    }

    if (!startDate) {
      toast.error("Start date is required");
      return;
    }

    if (!endDate) {
      toast.error("End date is required");
      return;
    }

    // Combine date and time
    const startDateTime = combineDateTime(startDate, startTime);
    const endDateTime = combineDateTime(endDate, endTime);

    if (!startDateTime || !endDateTime) {
      toast.error("Invalid date or time");
      return;
    }

    if (startDateTime >= endDateTime) {
      toast.error("End time must be after start time");
      return;
    }

    setIsSubmitting(true);

    try {
      const eventData = {
        title,
        description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        classId: selectedClass || null
      };

      // Create or update event
      const url = isEditMode
        ? `/api/admin/events/${editingEventId}`
        : '/api/admin/events';

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(isEditMode ? "Event updated successfully" : "Event created successfully");
        resetForm();
        setDialogOpen(false);
        // Refresh events list
        fetchEvents();
      } else {
        toast.error(data.message || "Failed to save event");
      }
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error("Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter events based on active tab
  const getFilteredEvents = () => {
    const now = new Date();

    return events.filter(event => {
      const eventStartDate = new Date(event.startTime);

      switch (activeTab) {
        case 'today':
          return isToday(eventStartDate);
        case 'upcoming':
          return isFuture(eventStartDate);
        case 'past':
          return isPast(eventStartDate);
        default:
          return true; // 'all' tab
      }
    });
  };

  const filteredEvents = getFilteredEvents();

  // Group events by date for better display
  const groupEventsByDate = (events: any[]) => {
    const grouped: Record<string, any[]> = {};

    events.forEach(event => {
      const dateKey = format(new Date(event.startTime), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    // Sort dates
    return Object.keys(grouped)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(date => ({
        date,
        formattedDate: format(new Date(date), 'EEEE, MMMM d, yyyy'),
        events: grouped[date].sort((a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        )
      }));
  };

  const groupedEvents = groupEventsByDate(filteredEvents);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">School Events</h1>
            <p className="text-muted-foreground">Manage and schedule events for the school calendar</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="gap-2"
                onClick={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Edit Event" : "Add New Event"}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter event description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class">Class (Optional)</Label>
                  <Select
                    value={selectedClass}
                    onValueChange={setSelectedClass}
                  >
                    <SelectTrigger id="class">
                      <SelectValue placeholder="All Classes / School-wide" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Classes / School-wide</SelectItem>
                      {classes.map((classItem) => (
                        <SelectItem
                          key={`class-${classItem._id || classItem.id}`}
                          value={String(classItem._id || classItem.id)}
                        >
                          {classItem.name || "Unnamed Class"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Leave empty for school-wide events</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : isEditMode ? "Update Event" : "Create Event"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
  <div className="md:col-span-2">
    <Label htmlFor="search" className="text-xs">Search Events</Label>
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        id="search"
        placeholder="Search by title..."
        className="pl-9"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  </div>

  <div>
    <Label htmlFor="filterClass" className="text-xs">Filter by Class</Label>
    <Select value={filterClass} onValueChange={setFilterClass}>
      <SelectTrigger id="filterClass">
        <SelectValue placeholder="All Classes" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="All">All Classes</SelectItem>
        {classes.map((classItem) => (
          <SelectItem
            key={`filter-class-${classItem._id || classItem.id}`}
            value={String(classItem._id || classItem.id)}
          >
            {classItem.name || "Unnamed Class"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  <div>
    <Label className="text-xs">Date Range</Label>
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left font-normal w-full text-xs",
              !filterStartDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-3 w-3" />
            {filterStartDate ? format(filterStartDate, "PP") : "Start date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <CalendarComponent
            mode="single"
            selected={filterStartDate}
            onSelect={setFilterStartDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left font-normal w-full text-xs",
              !filterEndDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-3 w-3" />
            {filterEndDate ? format(filterEndDate, "PP") : "End date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <CalendarComponent
            mode="single"
            selected={filterEndDate}
            onSelect={setFilterEndDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  </div>

  <div className="flex items-end gap-2">
    <Button
      variant="default"
      className="w-full text-xs"
      onClick={handleApplyFilters}
    >
      Apply Filters
    </Button>

  </div>
  <Button
      variant="outline"
      className="w-full text-xs"
      onClick={handleClearFilters}
    >
      <FilterX className="h-3 w-3 mr-1" />
      Clear
    </Button>
</div>
          </CardContent>
        </Card>

        {/* Tabs and Events List */}
        <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-6">
            {groupedEvents.length > 0 ? (
              groupedEvents.map((group) => (
                <div key={group.date} className="space-y-2">
                  <h3 className="font-medium text-sm flex items-center gap-2 text-muted-foreground mb-3">
                    <Calendar className="h-4 w-4" />
                    {group.formattedDate}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEdit={() => handleEditEvent(event.id)}
                        onDelete={() => handleDeleteEvent(event.id)}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-card/50 rounded-lg border border-border/40">
                <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No events found</h3>
                <p className="text-muted-foreground">
                  {events.length === 0
                    ? "Start by creating your first event"
                    : "No events match your filters"}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="today" className="mt-4 space-y-6">
            {groupedEvents.length > 0 ? (
              groupedEvents.map((group) => (
                <div key={group.date} className="space-y-2">
                  <h3 className="font-medium text-sm flex items-center gap-2 text-muted-foreground mb-3">
                    <Calendar className="h-4 w-4" />
                    {group.formattedDate}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEdit={() => handleEditEvent(event.id)}
                        onDelete={() => handleDeleteEvent(event.id)}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-card/50 rounded-lg border border-border/40">
                <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No events today</h3>
                <p className="text-muted-foreground">
                  There are no events scheduled for today
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4 space-y-6">
            {groupedEvents.length > 0 ? (
              groupedEvents.map((group) => (
                <div key={group.date} className="space-y-2">
                  <h3 className="font-medium text-sm flex items-center gap-2 text-muted-foreground mb-3">
                    <Calendar className="h-4 w-4" />
                    {group.formattedDate}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEdit={() => handleEditEvent(event.id)}
                        onDelete={() => handleDeleteEvent(event.id)}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-card/50 rounded-lg border border-border/40">
                <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No upcoming events</h3>
                <p className="text-muted-foreground">
                  There are no events scheduled for the future
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4 space-y-6">
            {groupedEvents.length > 0 ? (
              groupedEvents.map((group) => (
                <div key={group.date} className="space-y-2">
                  <h3 className="font-medium text-sm flex items-center gap-2 text-muted-foreground mb-3">
                    <Calendar className="h-4 w-4" />
                    {group.formattedDate}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEdit={() => handleEditEvent(event.id)}
                        onDelete={() => handleDeleteEvent(event.id)}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-card/50 rounded-lg border border-border/40">
                <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No past events</h3>
                <p className="text-muted-foreground">
                  There are no past events in the system
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// Event Card Component
function EventCard({ event, onEdit, onDelete }) {
  const startDateTime = new Date(event.startTime);
  const endDateTime = new Date(event.endTime);

  const isSameDay = startDateTime.toDateString() === endDateTime.toDateString();
  const isPastEvent = endDateTime < new Date();

  return (
    <Card className={cn(
      "overflow-hidden flex flex-col h-full border transition-all duration-200",
      isPastEvent ? "opacity-80" : "hover:border-primary/30 hover:shadow-md"
    )}>
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold line-clamp-1">{event.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs px-1 py-0 h-5">
              {event.className || "All Classes"}
            </Badge>
            {isPastEvent && (
              <Badge variant="secondary" className="text-xs px-1 py-0 h-5">
                Past
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {event.description || "No description provided"}
        </p>

        <div className="space-y-1 text-sm">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <div>{format(startDateTime, "MMM d, yyyy • h:mm a")}</div>
              {!isSameDay && <div>to {format(endDateTime, "MMM d, yyyy • h:mm a")}</div>}
              {isSameDay && <div>to {format(endDateTime, "h:mm a")}</div>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{event.className || "All Classes"}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button variant="outline" className="w-full text-xs gap-1" disabled={isPastEvent}>
          {isPastEvent ? (
            <>Event Completed</>
          ) : (
            <>View Details<ChevronRight className="h-3 w-3" /></>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
