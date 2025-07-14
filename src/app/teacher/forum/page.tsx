"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle,
  Plus,
  Search,
  Eye,
  Users,
  Clock,
  Pin,
  Lock,
  ArrowLeft,
  Send,
  ThumbsUp,
  Reply,
  BookOpen,
  User,
  Settings,
  Shield,
  Edit
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
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

// Same types as student forum
type ForumCategory = {
  _id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  allowStudentPosts: boolean;
  gradeIds: Array<{ _id: string; name: string }>;
  subjectIds: Array<{ _id: string; name: string }>;
};

type ForumTopic = {
  _id: string;
  title: string;
  content: string;
  categoryId: {
    _id: string;
    name: string;
    color: string;
  };
  authorId: string;
  authorRole: string;
  authorName: string;
  tags: string[];
  isSticky: boolean;
  isLocked: boolean;
  views: number;
  replies: number;
  lastReplyAt: string;
  lastReplyBy: string;
  lastReplyByName: string;
  createdAt: string;
};

type ForumPost = {
  _id: string;
  topicId: string;
  content: string;
  authorId: string;
  authorRole: string;
  authorName: string;
  parentPostId?: string;
  likes: number;
  likedBy: string[];
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  replies: ForumPost[];
};

type NewTopicForm = {
  title: string;
  content: string;
  categoryId: string;
  tags: string[];
  isSticky: boolean;
  isLocked: boolean;
};

export default function TeacherForum() {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTopicsLoading, setIsTopicsLoading] = useState(false);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [newTopicOpen, setNewTopicOpen] = useState(false);
  const [newTopicForm, setNewTopicForm] = useState<NewTopicForm>({
    title: "",
    content: "",
    categoryId: "",
    tags: [],
    isSticky: false,
    isLocked: false
  });
  const [replyContent, setReplyContent] = useState("");
  const [replyToPost, setReplyToPost] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Same functions as student forum but with teacher-specific features
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchTopics();
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedTopic) {
      fetchPosts();
    }
  }, [selectedTopic]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/forum/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load forum categories",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      setIsTopicsLoading(true);
      const response = await fetch(`/api/forum/topics?categoryId=${selectedCategory}`);
      if (!response.ok) {
        throw new Error('Failed to fetch topics');
      }
      const data = await response.json();
      setTopics(data.topics);
    } catch (error) {
      console.error('Error fetching topics:', error);
      toast({
        title: "Error",
        description: "Failed to load forum topics",
        variant: "destructive",
      });
    } finally {
      setIsTopicsLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (!selectedTopic) return;

    try {
      setIsPostsLoading(true);
      const response = await fetch(`/api/forum/posts?topicId=${selectedTopic._id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      setPosts(data.posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load forum posts",
        variant: "destructive",
      });
    } finally {
      setIsPostsLoading(false);
    }
  };

  const createTopic = async () => {
    if (!newTopicForm.title || !newTopicForm.content || !newTopicForm.categoryId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/forum/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTopicForm),
      });

      if (!response.ok) {
        throw new Error('Failed to create topic');
      }

      const data = await response.json();
      setTopics(prev => [data.topic, ...prev]);
      setNewTopicOpen(false);
      setNewTopicForm({
        title: "",
        content: "",
        categoryId: "",
        tags: [],
        isSticky: false,
        isLocked: false
      });

      toast({
        title: "Success",
        description: "Topic created successfully",
      });
    } catch (error) {
      console.error('Error creating topic:', error);
      toast({
        title: "Error",
        description: "Failed to create topic",
        variant: "destructive",
      });
    }
  };

  const createPost = async (parentPostId?: string) => {
    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId: selectedTopic?._id,
          content: replyContent,
          parentPostId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      const data = await response.json();

      if (parentPostId) {
        // Add reply to existing post
        setPosts(prev =>
          prev.map(post =>
            post._id === parentPostId
              ? { ...post, replies: [...post.replies, data.post] }
              : post
          )
        );
      } else {
        // Add new main post
        setPosts(prev => [...prev, { ...data.post, replies: [] }]);
      }

      setReplyContent("");
      setReplyToPost(null);

      toast({
        title: "Success",
        description: "Post created successfully",
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    }
  };

  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryIcon = (icon: string) => {
    switch (icon) {
      case 'book': return <BookOpen className="h-5 w-5" />;
      case 'users': return <Users className="h-5 w-5" />;
      default: return <MessageCircle className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <p>Loading forum...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Teacher Forum</h1>
            <p className="text-muted-foreground">
              Moderate discussions and interact with students
            </p>
          </div>

          <div className="flex space-x-2">
            {selectedCategory && (
              <Dialog open={newTopicOpen} onOpenChange={setNewTopicOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Topic
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Topic</DialogTitle>
                    <DialogDescription>
                      Create a new discussion topic with moderator options
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newTopicForm.categoryId}
                        onValueChange={(value) => setNewTopicForm(prev => ({ ...prev, categoryId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category._id} value={category._id}>
                              <div className="flex items-center space-x-2">
                                {getCategoryIcon(category.icon)}
                                <span>{category.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newTopicForm.title}
                        onChange={(e) => setNewTopicForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter topic title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={newTopicForm.content}
                        onChange={(e) => setNewTopicForm(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Enter topic content"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        value={newTopicForm.tags.join(', ')}
                        onChange={(e) => setNewTopicForm(prev => ({
                          ...prev,
                          tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                        }))}
                       placeholder="announcement, assignment, homework"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>Moderator Options</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sticky"
                          checked={newTopicForm.isSticky}
                          onCheckedChange={(checked) =>
                            setNewTopicForm(prev => ({ ...prev, isSticky: checked as boolean }))
                          }
                        />
                        <Label htmlFor="sticky" className="flex items-center space-x-2">
                          <Pin className="h-4 w-4" />
                          <span>Make sticky (pin to top)</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="locked"
                          checked={newTopicForm.isLocked}
                          onCheckedChange={(checked) =>
                            setNewTopicForm(prev => ({ ...prev, isLocked: checked as boolean }))
                          }
                        />
                        <Label htmlFor="locked" className="flex items-center space-x-2">
                          <Lock className="h-4 w-4" />
                          <span>Lock topic (no replies allowed)</span>
                        </Label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button variant="outline" onClick={() => setNewTopicOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createTopic}>
                      Create Topic
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Navigation */}
        {selectedTopic && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTopic(null)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Topics
              </Button>
              <span>/</span>
              <span>{selectedTopic.categoryId.name}</span>
              <span>/</span>
              <span className="font-medium">{selectedTopic.title}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Topic
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Moderate
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!selectedCategory ? (
          /* Categories List */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card
                key={category._id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedCategory(category._id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${category.color}15` }}
                    >
                      <div style={{ color: category.color }}>
                        {getCategoryIcon(category.icon)}
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-4 text-sm text-muted-foreground">
                      <span>Grades: {category.gradeIds.map(g => g.name).join(', ')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <Badge variant="default">Moderator</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !selectedTopic ? (
          /* Topics List */
          <div className="space-y-4">
            {/* Search and Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategory("")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Categories
                </Button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Moderator View
                </Badge>
              </div>
            </div>

            {/* Topics */}
            {isTopicsLoading ? (
              <div className="text-center py-8">Loading topics...</div>
            ) : filteredTopics.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No topics found matching your search' : 'No topics in this category yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredTopics.map((topic) => (
                  <Card
                    key={topic._id}
                    className="cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => setSelectedTopic(topic)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {topic.authorRole === 'teacher' ? (
                              <BookOpen className="h-4 w-4" />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            {topic.isSticky && <Pin className="h-4 w-4 text-orange-500" />}
                            {topic.isLocked && <Lock className="h-4 w-4 text-red-500" />}
                            <h3 className="font-medium truncate">{topic.title}</h3>
                            <Badge
                              variant="secondary"
                              className="text-xs"
                              style={{
                                backgroundColor: `${topic.categoryId.color}15`,
                                color: topic.categoryId.color
                              }}
                            >
                              {topic.categoryId.name}
                            </Badge>
                            {topic.authorRole === 'teacher' && (
                              <Badge variant="default" className="text-xs">
                                Teacher
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {topic.content}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>By {topic.authorName}</span>
                              <span className="flex items-center space-x-1">
                                <Eye className="h-3 w-3" />
                                <span>{topic.views}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <MessageCircle className="h-3 w-3" />
                                <span>{topic.replies}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{format(new Date(topic.lastReplyAt), 'MMM d, h:mm a')}</span>
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle topic moderation
                                }}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {topic.tags.length > 0 && (
                            <div className="flex space-x-1 mt-2">
                              {topic.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Topic Detail with Posts */
          <div className="space-y-6">
            {/* Topic Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {selectedTopic.authorRole === 'teacher' ? (
                        <BookOpen className="h-5 w-5" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {selectedTopic.isSticky && <Pin className="h-4 w-4 text-orange-500" />}
                      {selectedTopic.isLocked && <Lock className="h-4 w-4 text-red-500" />}
                      <h2 className="text-xl font-bold">{selectedTopic.title}</h2>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                      <span>By {selectedTopic.authorName}</span>
                      <Badge variant={selectedTopic.authorRole === 'teacher' ? 'default' : 'secondary'}>
                        {selectedTopic.authorRole === 'teacher' ? 'Teacher' : 'Student'}
                      </Badge>
                      <span>{format(new Date(selectedTopic.createdAt), 'MMM d, yyyy h:mm a')}</span>
                      <span className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{selectedTopic.views} views</span>
                      </span>
                    </div>
                    <p className="text-sm mb-3">{selectedTopic.content}</p>
                    {selectedTopic.tags.length > 0 && (
                      <div className="flex space-x-1">
                        {selectedTopic.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Posts */}
            <div className="space-y-4">
              {isPostsLoading ? (
                <div className="text-center py-8">Loading posts...</div>
              ) : posts.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No posts yet. Start the discussion!</p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post._id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {post.authorRole === 'teacher' ? (
                              <BookOpen className="h-4 w-4" />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{post.authorName}</span>
                              <Badge variant={post.authorRole === 'teacher' ? 'default' : 'secondary'}>
                                {post.authorRole === 'teacher' ? 'Teacher' : 'Student'}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(post.createdAt), 'MMM d, h:mm a')}
                              </span>
                              {post.isEdited && (
                                <Badge variant="outline" className="text-xs">
                                  Edited
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Handle post moderation
                                }}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm mb-3">{post.content}</p>
                          <div className="flex items-center space-x-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              {post.likes}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => setReplyToPost(post._id)}
                            >
                              <Reply className="h-4 w-4 mr-1" />
                              Reply
                            </Button>
                          </div>

                          {/* Reply Form */}
                          {replyToPost === post._id && (
                            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                              <Textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write your reply..."
                                rows={3}
                                className="mb-2"
                              />
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => createPost(post._id)}
                                  disabled={!replyContent.trim()}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Reply
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setReplyToPost(null);
                                    setReplyContent("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Replies */}
                          {post.replies.length > 0 && (
                            <div className="mt-4 pl-4 border-l-2 border-muted space-y-3">
                              {post.replies.map((reply) => (
                                <div key={reply._id} className="flex items-start space-x-3">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback>
                                      {reply.authorRole === 'teacher' ? (
                                        <BookOpen className="h-3 w-3" />
                                      ) : (
                                        <User className="h-3 w-3" />
                                      )}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-medium text-sm">{reply.authorName}</span>
                                        <Badge
                                          variant={reply.authorRole === 'teacher' ? 'default' : 'secondary'}
                                          className="text-xs"
                                        >
                                          {reply.authorRole === 'teacher' ? 'Teacher' : 'Student'}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {format(new Date(reply.createdAt), 'MMM d, h:mm a')}
                                        </span>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          // Handle reply moderation
                                        }}
                                      >
                                        <Settings className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <p className="text-sm">{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* New Post Form */}
            {!selectedTopic.isLocked && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>Add a Reply</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write your reply..."
                      rows={4}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={() => createPost()}
                        disabled={!replyContent.trim()}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Post Reply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
