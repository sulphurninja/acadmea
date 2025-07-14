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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Video, UploadCloud, Trash2, Edit, Play, Eye, Clock, X, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function VideoLessonsPage() {
  // State for lesson form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [duration, setDuration] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // State for data
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [videoLessons, setVideoLessons] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterClass, setFilterClass] = useState("");

  // Fetch classes, subjects, and existing video lessons
  // In your useEffect where you fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch classes
        const classesResponse = await fetch('/api/admin/classes');
        const classesData = await classesResponse.json();
        console.log("Classes data:", classesData); // Debug log to see the structure
        setClasses(Array.isArray(classesData) ? classesData : []);

        // Fetch subjects - handle response structure correctly
        const subjectsResponse = await fetch('/api/admin/subjects');
        const subjectsData = await subjectsResponse.json();
        console.log("Subjects data:", subjectsData); // Debug log to see the structure

        // Extract subjects array depending on API response structure
        const subjectsArray = subjectsData.subjects || subjectsData;
        setSubjects(Array.isArray(subjectsArray) ? subjectsArray : []);

        // Log the extracted IDs to verify
        if (Array.isArray(subjectsArray)) {
          console.log("Available subject IDs:", subjectsArray.map(s => ({
            id: s._id || s.id,
            name: s.name
          })));
        }

        if (Array.isArray(classesData)) {
          console.log("Available class IDs:", classesData.map(c => ({
            id: c._id || c.id,
            name: c.name
          })));
        }

        // Fetch video lessons
        const lessonsResponse = await fetch('/api/admin/video-lessons');
        const lessonsData = await lessonsResponse.json();
        setVideoLessons(Array.isArray(lessonsData) ? lessonsData : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Failed to load data");
      }
    };

    fetchData();
  }, []);

  // Handle video file selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // 500MB limit
      if (file.size > 500 * 1024 * 1024) {
        toast.error("Video file is too large. Maximum size is 500MB.");
        return;
      }
      setVideoFile(file);
    }
  };

  // Handle thumbnail file selection
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // 5MB limit for thumbnails
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Thumbnail is too large. Maximum size is 5MB.");
        return;
      }
      setThumbnailFile(file);
    }
  };


  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Form submission values:", {
      title,
      description,
      selectedSubject,
      selectedClass,
      duration,
      videoFile: videoFile ? `${videoFile.name} (${videoFile.size} bytes)` : "No file",
      thumbnailFile: thumbnailFile ? `${thumbnailFile.name} (${thumbnailFile.size} bytes)` : "No file"
    });

    // Validate form fields
    if (!title) {
      toast.error("Title is required");
      return;
    }

    if (!selectedSubject) {
      toast.error("Subject is required");
      return;
    }

    if (!selectedClass) {
      toast.error("Class is required");
      return;
    }

    if (!videoFile) {
      toast.error("Video file is required");
      return;
    }

    // Validate that selectedSubject and selectedClass can be converted to numbers
    const subjectId = Number(selectedSubject);
    const classId = Number(selectedClass);

    if (isNaN(subjectId)) {
      console.error("Invalid subject ID:", selectedSubject);
      toast.error("Invalid subject selected. Please try again.");
      return;
    }

    if (isNaN(classId)) {
      console.error("Invalid class ID:", selectedClass);
      toast.error("Invalid class selected. Please try again.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // ... file upload code ...

      // Now create the video lesson with validated numeric IDs
      const videoLessonData = {
        title,
        description: description || "",
        subjectId: subjectId, // Validated numeric value
        classId: classId,     // Validated numeric value
        duration: duration ? parseInt(duration) : 0,
        videoUrl: uploadData.fileUrls[0],
        thumbnailUrl: uploadData.fileUrls.length > 1 ? uploadData.fileUrls[1] : "",
        isPublished: true
      };

      console.log("Creating video lesson with data:", videoLessonData);
      // ... continue with API call ...
    } catch (error) {
      // ... error handling ...
    }
  };
  // Filter video lessons based on search and filters
  const filteredLessons = videoLessons.filter(lesson => {
    const matchesSearch = searchQuery
      ? lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesSubject = filterSubject
      ? lesson.subjectId.toString() === filterSubject
      : true;

    const matchesClass = filterClass
      ? lesson.classId.toString() === filterClass
      : true;

    const matchesTab = activeTab === "all"
      ? true
      : activeTab === "published"
        ? lesson.isPublished
        : !lesson.isPublished;

    return matchesSearch && matchesSubject && matchesClass && matchesTab;
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Video Lessons</h1>
            <p className="text-muted-foreground">Manage and upload video lessons for classes</p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Video className="h-4 w-4" />
                Upload New Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl m-auto h-fit max-h-screen overflow-y-auto scrollbar-hidden">
              <DialogHeader>
                <DialogTitle>Upload Video Lesson</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Lesson Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter lesson title"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Select
                      value={selectedSubject}
                      onValueChange={(value) => {
                        console.log("Selected subject ID:", value);
                        setSelectedSubject(value);
                      }}
                      required
                    >
                      <SelectTrigger id="subject" className="w-full">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects && subjects.length > 0 ? (
                          subjects.map((subject) => {
                            // Extract ID correctly from the subject object
                            const id = subject._id !== undefined ? subject._id : subject.id;
                            const gradeName = subject.grade ;

                            return (
                              <SelectItem
                                key={`subject-${id}`}
                                value={String(id)}
                              >
                                {subject.name} - {gradeName}
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="No" disabled>No subjects available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="class">Class/Section *</Label>
                    <Select
                      value={selectedClass}
                      onValueChange={(value) => {
                        console.log("Selected class ID:", value);
                        setSelectedClass(value);
                      }}
                      required
                    >
                      <SelectTrigger id="class" className="w-full">
                        <SelectValue placeholder="Select class/section" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes && classes.length > 0 ? (
                          classes.map((classItem) => {
                            // Extract ID correctly from the class object
                            const id = classItem._id !== undefined ? classItem._id : classItem.id;
                            const gradeName = classItem.grade?.level || "Unknown Grade";

                            return (
                              <SelectItem
                                key={`class-${id}`}
                                value={String(id)}
                              >
                                {classItem.name}
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="No" disabled>No classes available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter lesson description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Enter lesson duration in minutes"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video">Video File *</Label>
                  <div className="border-2 border-dashed rounded-md p-6 text-center hover:bg-muted/50 transition-colors">
                    <UploadCloud className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      {videoFile ? videoFile.name : "Click to upload or drag and drop"}
                    </p>
                    {videoFile && (
                      <p className="text-xs text-muted-foreground">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    )}
                    <Input
                      id="video"
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('video')?.click()}
                      className="mt-2"
                    >
                      Select Video
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Maximum file size: 500MB</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Thumbnail Image (Optional)</Label>
                  <div className="border-2 border-dashed rounded-md p-4 text-center hover:bg-muted/50 transition-colors">
                    <Input
                      id="thumbnail"
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="hidden"
                    />
                    {thumbnailFile ? (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(thumbnailFile)}
                          alt="Thumbnail preview"
                          className="max-h-40 mx-auto rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => setThumbnailFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <UploadCloud className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('thumbnail')?.click()}
                        >
                          Select Thumbnail
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Recommended size: 1280x720px, Maximum: 5MB</p>
                </div>

                {isUploading && (
                  <div className="w-full bg-muted rounded-full h-2.5 mt-4">
                    <div
                      className="bg-primary h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogTrigger>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? "Uploading..." : "Upload Lesson"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search" className="text-xs">Search</Label>
                <Input
                  id="search"
                  placeholder="Search lessons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="filterSubject" className="text-xs">Filter by Subject</Label>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Subjects</SelectItem>
                    {subjects && subjects.length > 0 && subjects.map((subject) => (
                      <SelectItem
                        key={subject._id?.toString() || `subject-filter-${Math.random()}`}
                        value={(subject._id?.toString()) || "NONE"}>
                        {subject.name || "Unnamed Subject"}
                      </SelectItem>
                    ))}
                  </SelectContent>

                </Select>
              </div>

              <div>
                <Label htmlFor="filterClass" className="text-xs">Filter by Class</Label>
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Classes</SelectItem>
                    {classes && classes.length > 0 && classes.map((classItem) => (
                      <SelectItem
                        key={classItem._id?.toString() || `class-filter-${Math.random()}`}
                        value={(classItem._id?.toString()) || "None"}>
                        {classItem.name || "Unnamed Class"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterSubject("");
                    setFilterClass("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs and Video Lessons List */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Lessons</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="unpublished">Unpublished</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLessons.length > 0 ? (
                filteredLessons.map((lesson) => (
                  <VideoLessonCard
                    key={lesson._id}
                    lesson={lesson}
                    subjects={subjects}
                    classes={classes}
                    onDelete={() => {
                      // Handle delete
                      setVideoLessons(videoLessons.filter(l => l._id !== lesson._id));
                    }}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
                  <Video className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No video lessons found</h3>
                  <p className="text-muted-foreground">
                    {videoLessons.length === 0
                      ? "Start by uploading your first video lesson"
                      : "No lessons match your filters"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="published" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLessons.length > 0 ? (
                filteredLessons.map((lesson) => (
                  <VideoLessonCard
                    key={lesson._id}
                    lesson={lesson}
                    subjects={subjects}
                    classes={classes}
                    onDelete={() => {
                      // Handle delete
                      setVideoLessons(videoLessons.filter(l => l._id !== lesson._id));
                    }}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
                  <Video className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No published lessons found</h3>
                  <p className="text-muted-foreground">
                    {videoLessons.length === 0
                      ? "Start by uploading your first video lesson"
                      : "No published lessons match your filters"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="unpublished" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLessons.length > 0 ? (
                filteredLessons.map((lesson) => (
                  <VideoLessonCard
                    key={lesson._id}
                    lesson={lesson}
                    subjects={subjects}
                    classes={classes}
                    onDelete={() => {
                      // Handle delete
                      setVideoLessons(videoLessons.filter(l => l._id !== lesson._id));
                    }}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
                  <Video className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No unpublished lessons found</h3>
                  <p className="text-muted-foreground">
                    {videoLessons.length === 0
                      ? "Start by uploading your first video lesson"
                      : "No unpublished lessons match your filters"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function VideoLessonCard({ lesson, subjects, classes, onDelete }) {
  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const safeClasses = Array.isArray(classes) ? classes : [];

  const subjectObj = safeSubjects.find(s => s._id === lesson.subjectId);
  const classObj = safeClasses.find(c => c._id === lesson.classId);

  const subjectName = subjectObj?.name || "Unknown Subject";
  const className = classObj?.name || "Unknown Class";

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="relative aspect-video bg-muted">
        {lesson.thumbnailUrl ? (
          <img
            src={lesson.thumbnailUrl}
            alt={lesson.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/30">
            <Video className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute bottom-2 right-2">
          <Badge variant={lesson.isPublished ? "default" : "secondary"} className="gap-1">
            {lesson.isPublished ? (
              <>
                <CheckCircle2 className="h-3 w-3" /> Published
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" /> Unpublished
              </>
            )}
          </Badge>
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm">
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4 flex-grow">
        <h3 className="font-semibold truncate mb-1">{lesson.title}</h3>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs font-normal">
            {subjectName}
          </Badge>
          <Badge variant="outline" className="text-xs font-normal">
            {className}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {lesson.description || "No description provided"}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{lesson.duration || 0} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{lesson.views || 0} views</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button variant="secondary" className="w-full gap-2">
          <Play className="h-4 w-4" />
          Preview Lesson
        </Button>
      </CardFooter>
    </Card>
  );
}
