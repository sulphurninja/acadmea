"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bell, 
  BellRing, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Users,
  MessageCircle,
  FileText,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  isRead: boolean;
  readAt?: string;
  createdBy: string;
  createdByRole: string;
  createdAt: string;
  actionUrl?: string;
  actionText?: string;
  attachments: any[];
}

export default function TeacherNotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, selectedType, selectedPriority, showUnreadOnly]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(selectedType !== 'all' && { type: selectedType }),
        ...(showUnreadOnly && { unreadOnly: 'true' })
      });

      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();

      if (response.ok) {
        setNotifications(data.notifications);
        setTotalPages(data.pagination.pages);
      } else {
        throw new Error(data.error || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        ));
        toast({
          title: "Success",
          description: "Notification marked as read",
        });
      } else {
        throw new Error('Failed to mark as read');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
        toast({
          title: "Success",
          description: "All notifications marked as read",
        });
      } else {
        throw new Error('Failed to mark all as read');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ANNOUNCEMENT': return <MessageCircle className="h-4 w-4" />;
      case 'EXAM': return <FileText className="h-4 w-4" />;
      case 'ASSIGNMENT': return <FileText className="h-4 w-4" />;
      case 'ATTENDANCE': return <Users className="h-4 w-4" />;
      case 'FEE': return <FileText className="h-4 w-4" />;
      case 'URGENT': return <AlertCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ANNOUNCEMENT': return 'bg-blue-100 text-blue-800';
      case 'EXAM': return 'bg-purple-100 text-purple-800';
      case 'ASSIGNMENT': return 'bg-green-100 text-green-800';
      case 'ATTENDANCE': return 'bg-yellow-100 text-yellow-800';
      case 'FEE': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'border-red-500';
      case 'HIGH': return 'border-orange-500';
      case 'MEDIUM': return 'border-yellow-500';
      case 'LOW': return 'border-green-500';
      default: return 'border-gray-300';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = selectedPriority === 'all' || notification.priority === selectedPriority;
    
    return matchesSearch && matchesPriority;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Stay updated with all school announcements and activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <BellRing className="h-3 w-3" />
            {unreadCount} unread
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ANNOUNCEMENT">Announcements</SelectItem>
                <SelectItem value="EXAM">Exams</SelectItem>
                <SelectItem value="ASSIGNMENT">Assignments</SelectItem>
                <SelectItem value="ATTENDANCE">Attendance</SelectItem>
                <SelectItem value="FEE">Fees</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showUnreadOnly ? "default" : "outline"}
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className="gap-2"
            >
              {showUnreadOnly ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showUnreadOnly ? "Show All" : "Unread Only"}
            </Button>

            <Button onClick={markAllAsRead} variant="outline" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Mark All Read
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Notifications</CardTitle>
          <CardDescription>
            {filteredNotifications.length} notification(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "border rounded-lg p-4 transition-all duration-200",
                      !notification.isRead && "bg-primary/5 border-primary/20",
                      notification.isRead && "bg-background",
                      getPriorityColor(notification.priority)
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        getTypeColor(notification.type)
                      )}>
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={cn(
                            "font-medium text-sm",
                            !notification.isRead && "font-semibold"
                          )}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                            <Badge variant={
                              notification.priority === 'URGENT' ? 'destructive' :
                              notification.priority === 'HIGH' ? 'default' : 'secondary'
                            } className="text-xs">
                              {notification.priority}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(notification.createdAt).toLocaleString()}
                            <span>•</span>
                            <span>by {notification.createdBy}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {notification.actionUrl && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={notification.actionUrl} target="_blank" rel="noopener noreferrer">
                                  {notification.actionText || 'View'}
                                </a>
                              </Button>
                            )}
                            
                            {!notification.isRead && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsRead(notification.id)}
                                className="gap-1"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Mark as Read
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {notification.attachments && notification.attachments.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Attachments:</p>
                            <div className="flex flex-wrap gap-1">
                              {notification.attachments.map((attachment, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {attachment.fileName}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}