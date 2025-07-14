"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Video, Search, Play, Book, Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function StudentLessonsPage() {
  const [videoLessons, setVideoLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await fetch('/api/student/video-lessons');
        if (!response.ok) {
          throw new Error('Failed to fetch video lessons');
        }
        const data = await response.json();
        setVideoLessons(data);
      } catch (error) {
        console.error('Error:', error);
        toast.error("Failed to load video lessons");
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, []);

  const filteredLessons = videoLessons.filter(lesson =>
    lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleWatchLesson = async (lesson) => {
    try {
      // Update view count
      await fetch(`/api/admin/video-lessons/${lesson._id}`, {
        method: 'GET',
      });

      setSelectedLesson(lesson);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Video Lessons</h1>
            <p className="text-muted-foreground">Access your class video lessons</p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search lessons..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Lessons</TabsTrigger>
            <TabsTrigger value="recent">Recently Added</TabsTrigger>
            <TabsTrigger value="watched">Watched</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-video bg-muted animate-pulse" />
                    <CardContent className="p-4">
                      <div className="h-5 bg-muted rounded-md animate-pulse mb-2" />
                      <div className="h-4 bg-muted rounded-md animate-pulse w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredLessons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLessons.map((lesson) => (
                  <Card key={lesson._id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative aspect-video bg-muted cursor-pointer group" onClick={() => handleWatchLesson(lesson)}>
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
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="secondary" className="rounded-full h-14 w-14">
                          <Play className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate mb-1">{lesson.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs font-normal">
                          <Book className="h-3 w-3 mr-1" />
                          {lesson.subjectName || "Subject"}
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
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 text-center">
                <Video className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No video lessons found</h3>
                <p className="text-muted-foreground max-w-md mt-1">
                  {searchQuery ? "No lessons match your search query" : "There are no video lessons available for your class yet"}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent">
            {/* Similar content to "all" tab but filtered for recent lessons */}
          </TabsContent>

          <TabsContent value="watched">
            {/* Similar content to "all" tab but filtered for watched lessons */}
          </TabsContent>
        </Tabs>
      </div>

      {/* Video Player Dialog */}
      {selectedLesson && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-5xl p-0 overflow-hidden">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>{selectedLesson.title}</DialogTitle>
            </DialogHeader>
            <div className="aspect-video w-full">
              <video
                src={selectedLesson.videoUrl}
                controls
                className="w-full h-full"
                autoPlay
              />
            </div>
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-2">
                {selectedLesson.description || "No description provided"}
              </p>
              <div className="flex items-center gap-3 text-sm">
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {selectedLesson.duration || 0} minutes
                </Badge>
                <Badge variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  {selectedLesson.views || 0} views
                </Badge>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
