"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
    Bell,
    Send,
    Users,
    GraduationCap,
    UserCheck,
    AlertCircle,
    Calendar,
    Upload,
    X,
    Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function CreateNotificationPage() {
    const { toast } = useToast();
    const router = useRouter();

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'GENERAL',
        priority: 'MEDIUM',
        targetAudience: 'ALL',
        targetGradeId: '',
        targetClassId: '',
        expiresAt: '',
        actionUrl: '',
        actionText: ''
    });

    const [loading, setLoading] = useState(false);
    const [grades, setGrades] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [attachments, setAttachments] = useState<File[]>([]);

    useEffect(() => {
        fetchGradesAndClasses();
    }, []);

    const fetchGradesAndClasses = async () => {
        try {
            const [gradesRes, classesRes] = await Promise.all([
                fetch('/api/admin/grades'),
                fetch('/api/admin/classes')
            ]);

            if (gradesRes.ok && classesRes.ok) {
                const gradesData = await gradesRes.json();
                const classesData = await classesRes.json();
                setGrades(gradesData.grades || []);
                setClasses(classesData || []);
            }
        } catch (error) {
            console.error('Error fetching grades and classes:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                toast({
                    title: "Success",
                    description: `Notification sent to ${data.notification.recipientCount} recipients`,
                });
                router.push('/admin/notifications');
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create notification');
            }
        } catch (error) {
            console.error('Error creating notification:', error);
            toast({
                title: "Error",
                description: "Failed to create notification",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const getAudienceDescription = () => {
        switch (formData.targetAudience) {
            case 'ALL':
                return 'All students, teachers, and parents';
            case 'STUDENTS':
                return 'All students';
            case 'TEACHERS':
                return 'All teachers';
            case 'PARENTS':
                return 'All parents';
            case 'SPECIFIC_GRADE':
                const grade = grades.find(g => g._id === formData.targetGradeId);
                return grade ? `All students in Class ${grade.level}` : 'Select a grade';
            case 'SPECIFIC_CLASS':
                const cls = classes.find(c => c._id === formData.targetClassId);
                return cls ? `All students in ${cls.name}` : 'Select a class';
            default:
                return '';
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Bell className="h-8 w-8" />
                            Create Notification
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Send announcements and updates to your school community
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Form */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notification Details</CardTitle>
                                    <CardDescription>
                                        Create your notification message and settings
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="title">Title *</Label>
                                        <Input
                                            id="title"
                                            placeholder="Enter notification title"
                                            value={formData.title}
                                            onChange={(e) => handleInputChange('title', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="message">Message *</Label>
                                        <Textarea
                                            id="message"
                                            placeholder="Enter your notification message"
                                            value={formData.message}
                                            onChange={(e) => handleInputChange('message', e.target.value)}
                                            rows={4}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="type">Type</Label>
                                            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="GENERAL">📢 General</SelectItem>
                                                    <SelectItem value="ANNOUNCEMENT">📣 Announcement</SelectItem>
                                                    <SelectItem value="EXAM">📝 Exam</SelectItem>
                                                    <SelectItem value="ASSIGNMENT">📚 Assignment</SelectItem>
                                                    <SelectItem value="ATTENDANCE">👥 Attendance</SelectItem>
                                                    <SelectItem value="FEE">💰 Fee</SelectItem>
                                                    <SelectItem value="URGENT">🚨 Urgent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="priority">Priority</Label>
                                            <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="LOW">🟢 Low</SelectItem>
                                                    <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                                                    <SelectItem value="HIGH">🔴 High</SelectItem>
                                                    <SelectItem value="URGENT">🚨 Urgent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                                        <Input
                                            id="expiresAt"
                                            type="datetime-local"
                                            value={formData.expiresAt}
                                            onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="actionUrl">Action URL (Optional)</Label>
                                            <Input
                                                id="actionUrl"
                                                placeholder="https://example.com"
                                                value={formData.actionUrl}
                                                onChange={(e) => handleInputChange('actionUrl', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="actionText">Action Button Text</Label>
                                            <Input
                                                id="actionText"
                                                placeholder="View Details"
                                                value={formData.actionText}
                                                onChange={(e) => handleInputChange('actionText', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Audience Selection */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Target Audience</CardTitle>
                                    <CardDescription>
                                        Choose who will receive this notification
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="targetAudience">Audience</Label>
                                        <Select value={formData.targetAudience} onValueChange={(value) => handleInputChange('targetAudience', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select audience" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">🌍 Everyone</SelectItem>
                                                <SelectItem value="STUDENTS">🎓 All Students</SelectItem>
                                                <SelectItem value="TEACHERS">👨‍🏫 All Teachers</SelectItem>
                                                <SelectItem value="PARENTS">👨‍👩‍👧‍👦 All Parents</SelectItem>
                                                <SelectItem value="SPECIFIC_GRADE">📚 Specific Grade</SelectItem>
                                                <SelectItem value="SPECIFIC_CLASS">🏫 Specific Class</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {formData.targetAudience === 'SPECIFIC_GRADE' && (
                                        <div>
                                            <Label htmlFor="targetGradeId">Select Grade</Label>
                                            <Select value={formData.targetGradeId} onValueChange={(value) => handleInputChange('targetGradeId', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select grade" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {grades.map(grade => (
                                                        <SelectItem key={grade._id} value={grade._id.toString()}>
                                                            Class {grade.level}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {formData.targetAudience === 'SPECIFIC_CLASS' && (
                                        <div>
                                            <Label htmlFor="targetClassId">Select Class</Label>
                                            <Select value={formData.targetClassId} onValueChange={(value) => handleInputChange('targetClassId', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select class" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {classes.map(cls => (
                                                        <SelectItem key={cls._id} value={cls._id.toString()}>
                                                            {cls.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="text-sm font-medium">Will be sent to:</p>
                                        <p className="text-sm text-muted-foreground">
                                            {getAudienceDescription()}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Preview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="border rounded-lg p-4 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{formData.type}</Badge>
                                            <Badge variant={formData.priority === 'URGENT' ? 'destructive' : 'secondary'}>
                                                {formData.priority}
                                            </Badge>
                                        </div>
                                        <h3 className="font-semibold">{formData.title || 'Notification Title'}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {formData.message || 'Your notification message will appear here...'}
                                        </p>
                                        {formData.actionUrl && (
                                            <Button size="sm" variant="outline">
                                                {formData.actionText || 'View Details'}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="gap-2">
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Send Notification
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}