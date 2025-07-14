"use client";
import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Plus,
  Send,
  Search,
  Phone,
  Mail,
  User,
  Clock,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Users
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

type Contact = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  children?: Array<{
    id: string;
    name: string;
    className: string;
    grade: string;
  }>;
};

type Message = {
  _id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  receiverId: string;
  receiverRole: string;
  subject: string;
  content: string;
  isRead: boolean;
  readAt?: string;
  priority: string;
  category: string;
  studentId?: string;
  createdAt: string;
  updatedAt: string;
};

type Conversation = {
  _id: string;
  participants: Array<{
    userId: string;
    role: string;
    name: string;
    joinedAt: string;
  }>;
  subject: string;
  category: string;
  studentId?: string;
  lastMessage: {
    content: string;
    senderId: string;
    senderName: string;
    createdAt: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
};

type NewMessageForm = {
  receiverId: string;
  subject: string;
  content: string;
  category: string;
  studentId?: string;
};

export default function TeacherMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [newMessageForm, setNewMessageForm] = useState<NewMessageForm>({
    receiverId: "",
    subject: "",
    content: "",
    category: "GENERAL"
  });
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchConversations();
    fetchContacts();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations');
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      const data = await response.json();
      setConversations(data.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/messages/contacts');
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }
      const data = await response.json();
      setContacts(data.contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setIsMessagesLoading(true);
      const response = await fetch(`/api/messages/conversations/${conversationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      setMessages(data.messages);

      // Update conversation unread count
      setConversations(prev =>
        prev.map(conv =>
          conv._id === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setIsMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      const otherParticipant = selectedConversation.participants.find(
        p => p.role !== 'teacher'
      );

      if (!otherParticipant) return;

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: selectedConversation._id,
          receiverId: otherParticipant.userId,
          receiverRole: otherParticipant.role,
          content: messageInput,
          priority: 'MEDIUM'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setMessages(prev => [...prev, data.message]);
      setMessageInput("");

      // Update conversation last message
      setConversations(prev =>
        prev.map(conv =>
          conv._id === selectedConversation._id
            ? {
              ...conv,
              lastMessage: {
                content: messageInput,
                senderId: data.message.senderId,
                senderName: 'You',
                createdAt: data.message.createdAt
              },
              updatedAt: data.message.createdAt
            }
            : conv
        )
      );

      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const startNewConversation = async () => {
    if (!newMessageForm.receiverId || !newMessageForm.subject || !newMessageForm.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: newMessageForm.receiverId,
          receiverRole: 'parent',
          subject: newMessageForm.subject,
          content: newMessageForm.content,
          category: newMessageForm.category,
          studentId: newMessageForm.studentId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();
      setConversations(prev => [data.conversation, ...prev]);
      setSelectedConversation(data.conversation);
      setNewMessageOpen(false);
      setNewMessageForm({
        receiverId: "",
        subject: "",
        content: "",
        category: "GENERAL"
      });

      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ACADEMIC': return 'bg-blue-100 text-blue-800';
      case 'DISCIPLINE': return 'bg-red-100 text-red-800';
      case 'ATTENDANCE': return 'bg-yellow-100 text-yellow-800';
      case 'FEES': return 'bg-purple-100 text-purple-800';
      case 'HEALTH': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)] bg-background">
        {/* Conversations List */}
        <div className={`w-full md:w-96 border-r border-border/40 flex flex-col ${selectedConversation ? 'hidden md:flex' : ''}`}>
          <div className="p-4 border-b border-border/40">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Messages</h2>
              <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Message
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>New Message</DialogTitle>
                    <DialogDescription>
                      Send a message to a parent
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="parent">Parent</Label>
                      <Select
                        value={newMessageForm.receiverId}
                        onValueChange={(value) => setNewMessageForm(prev => ({ ...prev, receiverId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a parent" />
                        </SelectTrigger>
                        <SelectContent>
                          {contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.name}
                              {contact.children && contact.children.length > 0 && (
                                <span className="text-muted-foreground text-xs ml-2">
                                  ({contact.children.map(c => c.name).join(', ')})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {newMessageForm.receiverId && (
                      <div>
                        <Label htmlFor="student">Related Student (Optional)</Label>
                        <Select
                          value={newMessageForm.studentId || ""}
                          onValueChange={(value) => setNewMessageForm(prev => ({ ...prev, studentId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">General Message</SelectItem>
                            {contacts
                              .find(c => c.id === newMessageForm.receiverId)
                              ?.children?.map((child) => (
                                <SelectItem key={child.id} value={child.id}>
                                  {child.name} - {child.className}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newMessageForm.category}
                        onValueChange={(value) => setNewMessageForm(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GENERAL">General</SelectItem>
                          <SelectItem value="ACADEMIC">Academic</SelectItem>
                          <SelectItem value="DISCIPLINE">Discipline</SelectItem>
                          <SelectItem value="ATTENDANCE">Attendance</SelectItem>
                          <SelectItem value="HEALTH">Health</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={newMessageForm.subject}
                        onChange={(e) => setNewMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Enter subject"
                      />
                    </div>
                    <div>
                      <Label htmlFor="content">Message</Label>
                      <Textarea
                        id="content"
                        value={newMessageForm.content}
                        onChange={(e) => setNewMessageForm(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Enter your message"
                        rows={4}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button variant="outline" onClick={() => setNewMessageOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={startNewConversation}>
                      Send Message
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery ? 'No conversations found' : 'No messages yet'}
              </div>
            ) : (
              <div className="p-2">
                {filteredConversations.map((conversation) => {
                  const otherParticipant = conversation.participants.find(p => p.role !== 'teacher');
                  const isSelected = selectedConversation?._id === conversation._id;

                  return (
                    <div
                      key={conversation._id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${isSelected
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50'
                        }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            <Users className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium truncate">
                              {otherParticipant?.name || 'Unknown'}
                            </h4>
                            <div className="flex items-center space-x-1">
                              {conversation.unreadCount > 0 && (
                                <Badge className="text-xs px-1.5 py-0.5">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(conversation.lastMessage.createdAt), 'MMM d')}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-muted-foreground truncate">
                            {conversation.subject}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground truncate">
                              {conversation.lastMessage.content}
                            </p>
                            <Badge variant="outline" className={`text-xs ${getCategoryColor(conversation.category)}`}>
                              {conversation.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Messages Area */}
        <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
          {selectedConversation ? (
            <>
              {/* Message Header */}
              <div className="p-4 border-b border-border/40 bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="md:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        <Users className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">
                        {selectedConversation.participants.find(p => p.role !== 'teacher')?.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.subject}
                      </p>
                    </div>
                  </div>
                  <Badge className={getCategoryColor(selectedConversation.category)}>
                    {selectedConversation.category}
                  </Badge>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {isMessagesLoading ? (
                  <div className="text-center text-muted-foreground">
                    Loading messages...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.senderRole === 'teacher';

                      return (
                        <div
                          key={message._id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${isOwn
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                              }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div className={`flex items-center justify-between mt-2 text-xs ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}>
                              <span>{format(new Date(message.createdAt), 'MMM d, h:mm a')}</span>
                              {isOwn && (
                                <span className="ml-2">
                                  {message.isRead ? (
                                    <CheckCircle2 className="h-3 w-3" />
                                  ) : (
                                    <Circle className="h-3 w-3" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border/40 bg-card">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!messageInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
