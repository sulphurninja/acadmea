"use client";
import { useState, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VideoIcon, UploadCloud, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

export default function UploadVideoLesson() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [classes, setClasses] = useState([{ id: "1", name: "Class 1" }]); // Mock data
  const [subjects, setSubjects] = useState([{ id: "1", name: "Mathematics" }]); // Mock data
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoFile || !title || !selectedClass || !selectedSubject) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and select a video file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 300);

    try {
      // In a real app, you would upload the file to a storage service like AWS S3
      // and then save the metadata to your API

      // Simulating API call
      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);
        setIsUploading(false);
        setUploadComplete(true);

        toast({
          title: "Upload Complete",
          description: "Your video lesson has been uploaded successfully.",
          variant: "default",
        });
      }, 3000);

    } catch (error) {
      clearInterval(interval);
      setIsUploading(false);

      toast({
        title: "Upload Failed",
        description: "There was an error uploading your video. Please try again.",
        variant: "destructive",
      });

      console.error("Upload error:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center mb-6">
        <Link href="/teacher/lessons" className="mr-4">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Upload Video Lesson</h1>
      </div>

      {uploadComplete ? (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Upload Complete!</h2>
            <p className="text-muted-foreground mb-6">
              Your video lesson "{title}" has been successfully uploaded.
            </p>
            <div className="flex space-x-4">
              <Button asChild>
                <Link href="/teacher/lessons">
                  View All Lessons
                </Link>
              </Button>
              <Button variant="outline" onClick={() => {
                setTitle("");
                setDescription("");
                setSelectedClass("");
                setSelectedSubject("");
                setVideoFile(null);
                setUploadComplete(false);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}>
                Upload Another
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lesson Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Lesson Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter lesson title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isUploading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                    disabled={isUploading}
                  >
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Select
                    value={selectedClass}
                    onValueChange={setSelectedClass}
                    disabled={isUploading}
                  >
                    <SelectTrigger id="class">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter lesson description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isUploading}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Video File</Label>
                <div className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center ${videoFile ? 'border-primary' : 'border-gray-300'}`}>
                  {videoFile ? (
                    <div className="space-y-2">
                      <VideoIcon className="h-10 w-10 text-primary mx-auto" />
                      <p className="font-medium">{videoFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setVideoFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                        disabled={isUploading}
                      >
                        Change File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto" />
                      <p className="text-lg font-medium">Drag & drop your video here</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Or click to browse files (MP4, WebM, Ogg up to 500MB)
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        Select File
                      </Button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isUploading || !videoFile}
                >
                  {isUploading ? 'Uploading...' : 'Upload Lesson'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
