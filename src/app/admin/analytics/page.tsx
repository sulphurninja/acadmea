"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    TrendingUp,
    Users,
    GraduationCap,
    BookOpen,
    IndianRupee,
    Calendar,
    Activity,
    BarChart3,
    PieChart,
    LineChart,
    Loader2,
    ArrowUp,
    ArrowDown,
    FileText
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface AnalyticsData {
    overview: {
        totalStudents: number;
        totalTeachers: number;
        attendanceRate: number;
        performanceRate: number;
    };
    attendance: {
        averageAttendance: number;
        totalRecords: number;
        presentCount: number;
        absentCount: number;
        lateCount: number;
        chart: Array<{
            date: string;
            present: number;
            absent: number;
            late: number;
            total: number;
            percentage: string;
        }>;
    };
    performance: {
        averagePerformance: number;
        totalExams: number;
        totalResults: number;
        subjectPerformance: Array<{
            subject: string;
            percentage: string;
            totalStudents: number;
        }>;
        gradeDistribution: {
            A: number;
            B: number;
            C: number;
            D: number;
            F: number;
        };
    };
    fees: {
        totalCollected: number;
        totalPending: number;
        totalOverdue: number;
        collectionRate: string;
        monthlyCollection: Array<{
            month: string;
            collected: number;
            pending: number;
            overdue: number;
        }>;
    };
    enrollment: {
        totalNewEnrollments: number;
        monthlyTrends: Array<{
            month: string;
            male: number;
            female: number;
            total: number;
        }>;
    };
    upcomingExams: Array<{
        id: string;
        title: string;
        subject: string;
        grade: number;
        date: string;
        maxMarks: number;
        duration: number;
    }>;
    recentEvents: Array<{
        id: string;
        title: string;
        description: string;
        startTime: string;
        endTime: string;
    }>;
    generatedAt: string;
}

export default function AdminAnalyticsPage() {
    const { toast } = useToast();
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('30');

    useEffect(() => {
        fetchAnalytics();
    }, [selectedPeriod]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/analytics?period=${selectedPeriod}`);
            const data = await response.json();

            if (response.ok) {
                setAnalyticsData(data);
            } else {
                throw new Error(data.error || 'Failed to fetch analytics');
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast({
                title: "Error",
                description: "Failed to fetch analytics data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const getChangeIndicator = (current: number, previous: number) => {
        if (previous === 0) return null;
        const change = ((current - previous) / previous) * 100;
        const isPositive = change > 0;

        return (
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(change).toFixed(1)}%
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>No analytics data available</p>
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">School Analytics</h1>
                        <p className="text-muted-foreground mt-2">
                            Comprehensive insights into your school's performance and operations
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Last 7 days</SelectItem>
                                <SelectItem value="30">Last 30 days</SelectItem>
                                <SelectItem value="90">Last 90 days</SelectItem>
                                <SelectItem value="365">Last year</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={fetchAnalytics}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Students</p>
                                        <p className="text-3xl font-bold">{analyticsData.overview.totalStudents}</p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-full">
                                        <Users className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Teachers</p>
                                        <p className="text-3xl font-bold">{analyticsData.overview.totalTeachers}</p>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-full">
                                        <GraduationCap className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Attendance Rate</p>
                                        <p className="text-3xl font-bold">{analyticsData.overview.attendanceRate.toFixed(1)}%</p>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-full">
                                        <Activity className="h-6 w-6 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Performance Rate</p>
                                        <p className="text-3xl font-bold">{analyticsData.overview.performanceRate.toFixed(1)}%</p>
                                    </div>
                                    <div className="p-3 bg-orange-100 rounded-full">
                                        <TrendingUp className="h-6 w-6 text-orange-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Charts and Detailed Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Attendance Analytics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Attendance Overview
                            </CardTitle>
                            <CardDescription>
                                Daily attendance trends over the selected period
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">{analyticsData.attendance.presentCount}</p>
                                    <p className="text-sm text-muted-foreground">Present</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-red-600">{analyticsData.attendance.absentCount}</p>
                                    <p className="text-sm text-muted-foreground">Absent</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-yellow-600">{analyticsData.attendance.lateCount}</p>
                                    <p className="text-sm text-muted-foreground">Late</p>
                                </div>
                            </div>
                            <div className="h-64 bg- -50 rounded-lg flex items-center justify-center">
                                <p className="text-muted-foreground">Attendance chart would be rendered here</p>
                            </div>
                        </CardContent>
                    </Card>



                    {/* Performance Analytics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Academic Performance
                            </CardTitle>
                            <CardDescription>
                                Student performance distribution and exam statistics
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Overall Performance Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <p className="text-2xl font-bold text-blue-600">{analyticsData.performance.averagePerformance.toFixed(1)}%</p>
                                        <p className="text-sm text-muted-foreground">Average Performance</p>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <p className="text-2xl font-bold text-green-600">{analyticsData.performance.totalExams}</p>
                                        <p className="text-sm text-muted-foreground">Total Exams</p>
                                    </div>
                                </div>

                                {/* Performance Grade Distribution */}
                                <div>
                                    <h4 className="font-medium mb-3">Performance Grade Distribution</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                                            <div className="text-2xl font-bold text-green-600">{analyticsData.performance.gradeDistribution.A}</div>
                                            <div className="text-xs text-muted-foreground">90-100%</div>
                                            <div className="text-xs font-medium text-green-600">Excellent</div>
                                        </div>
                                        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="text-2xl font-bold text-blue-600">{analyticsData.performance.gradeDistribution.B}</div>
                                            <div className="text-xs text-muted-foreground">80-89%</div>
                                            <div className="text-xs font-medium text-blue-600">Good</div>
                                        </div>
                                        <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                            <div className="text-2xl font-bold text-yellow-600">{analyticsData.performance.gradeDistribution.C}</div>
                                            <div className="text-xs text-muted-foreground">70-79%</div>
                                            <div className="text-xs font-medium text-yellow-600">Average</div>
                                        </div>
                                        <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                                            <div className="text-2xl font-bold text-orange-600">{analyticsData.performance.gradeDistribution.D}</div>
                                            <div className="text-xs text-muted-foreground">60-69%</div>
                                            <div className="text-xs font-medium text-orange-600">Below Average</div>
                                        </div>
                                        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                                            <div className="text-2xl font-bold text-red-600">{analyticsData.performance.gradeDistribution.F}</div>
                                            <div className="text-xs text-muted-foreground">Below 60%</div>
                                            <div className="text-xs font-medium text-red-600">Needs Improvement</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Visualization */}
                                <div>
                                    <h4 className="font-medium mb-3">Performance Overview</h4>
                                    <div className="space-y-3">
                                        {/* Performance Bar */}
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium w-20">Overall:</span>
                                            <div className="flex-1 bg-gray-200 rounded-full h-3">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                                                    style={{ width: `${analyticsData.performance.averagePerformance}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold w-16">{analyticsData.performance.averagePerformance.toFixed(1)}%</span>
                                        </div>

                                        {/* Pass Rate */}
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium w-20">Pass Rate:</span>
                                            <div className="flex-1 bg-gray-200 rounded-full h-3">
                                                {(() => {
                                                    const passCount = analyticsData.performance.gradeDistribution.A +
                                                        analyticsData.performance.gradeDistribution.B +
                                                        analyticsData.performance.gradeDistribution.C +
                                                        analyticsData.performance.gradeDistribution.D;
                                                    const totalCount = passCount + analyticsData.performance.gradeDistribution.F;
                                                    const passRate = totalCount > 0 ? (passCount / totalCount) * 100 : 0;

                                                    return (
                                                        <>
                                                            <div
                                                                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                                                                style={{ width: `${passRate}%` }}
                                                            />
                                                            <span className="text-sm font-bold w-16 ml-4">{passRate.toFixed(1)}%</span>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Top Performing Subjects Preview */}
                                {analyticsData.performance.subjectPerformance.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-3">Top Performing Subjects</h4>
                                        <div className="space-y-2">
                                            {analyticsData.performance.subjectPerformance
                                                .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
                                                .slice(0, 3)
                                                .map((subject, index) => (
                                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                        <span className="font-medium">{subject.subject}</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-20 bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-blue-500 h-2 rounded-full"
                                                                    style={{ width: `${subject.percentage}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-bold w-12">{subject.percentage}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>


                    {/* Fee Collection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <IndianRupee className="h-5 w-5" />
                                Fee Collection
                            </CardTitle>
                            <CardDescription>
                                Financial overview and collection trends
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">₹{analyticsData.fees.totalCollected.toLocaleString()}</p>
                                    <p className="text-sm text-muted-foreground">Collected</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-yellow-600">₹{analyticsData.fees.totalPending.toLocaleString()}</p>
                                    <p className="text-sm text-muted-foreground">Pending</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-red-600">₹{analyticsData.fees.totalOverdue.toLocaleString()}</p>
                                    <p className="text-sm text-muted-foreground">Overdue</p>
                                </div>
                            </div>
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium">Collection Rate</span>
                                    <span className="text-sm font-bold">{analyticsData.fees.collectionRate}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full"
                                        style={{ width: `${analyticsData.fees.collectionRate}%` }}
                                    />
                                </div>
                            </div>
                            <div className="h-32 bg- -50 rounded-lg flex items-center justify-center">
                                <p className="text-muted-foreground">Monthly collection chart would be rendered here</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upcoming Events */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Upcoming Events
                            </CardTitle>
                            <CardDescription>
                                Exams and events scheduled for the near future
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">Upcoming Exams</h4>
                                    <div className="space-y-2">
                                        {analyticsData.upcomingExams.slice(0, 3).map(exam => (
                                            <div key={exam.id} className="flex items-center justify-between p-2 bg- -50 rounded">
                                                <div>
                                                    <p className="font-medium text-sm">{exam.title}</p>
                                                    <p className="text-xs text-muted-foreground">{exam.subject} - Class {exam.grade}</p>
                                                </div>
                                                <Badge variant="outline">
                                                    {new Date(exam.date).toLocaleDateString()}
                                                </Badge>

                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-2">Recent Events</h4>
                                    <div className="space-y-2">
                                        {analyticsData.recentEvents.slice(0, 3).map(event => (
                                            <div key={event.id} className="flex items-center justify-between p-2 bg- -50 rounded">
                                                <div>
                                                    <p className="font-medium text-sm">{event.title}</p>
                                                    <p className="text-xs text-muted-foreground">{event.description}</p>
                                                </div>
                                                <Badge variant="outline">
                                                    {new Date(event.startTime).toLocaleDateString()}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Subject Performance Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Subject-wise Performance
                        </CardTitle>
                        <CardDescription>
                            Detailed breakdown of performance across all subjects
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-200">
                                <thead>
                                    <tr className="bg- -50">
                                        <th className="border border-gray-200 px-4 py-2 text-left font-medium">Subject</th>
                                        <th className="border border-gray-200 px-4 py-2 text-left font-medium">Average Score</th>
                                        <th className="border border-gray-200 px-4 py-2 text-left font-medium">Total Students</th>
                                        <th className="border border-gray-200 px-4 py-2 text-left font-medium">Performance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analyticsData.performance.subjectPerformance.map((subject, index) => (
                                        <tr key={index} className="hover:bg-gray-400">
                                            <td className="border border-gray-200 px-4 py-2 font-medium">{subject.subject}</td>
                                            <td className="border border-gray-200 px-4 py-2">{subject.percentage}%</td>
                                            <td className="border border-gray-200 px-4 py-2">{subject.totalStudents}</td>
                                            <td className="border border-gray-200 px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${parseFloat(subject.percentage) >= 80 ? 'bg-green-500' :
                                                                parseFloat(subject.percentage) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}
                                                            style={{ width: `${subject.percentage}%` }}
                                                        />
                                                    </div>
                                                    <Badge variant={
                                                        parseFloat(subject.percentage) >= 80 ? 'default' :
                                                            parseFloat(subject.percentage) >= 60 ? 'secondary' : 'destructive'
                                                    }>
                                                        {parseFloat(subject.percentage) >= 80 ? 'Excellent' :
                                                            parseFloat(subject.percentage) >= 60 ? 'Good' : 'Needs Improvement'}
                                                    </Badge>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Enrollment Trends */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Enrollment Trends
                        </CardTitle>
                        <CardDescription>
                            Monthly enrollment patterns and demographics
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{analyticsData.enrollment.totalNewEnrollments}</p>
                                <p className="text-sm text-muted-foreground">New Enrollments</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">
                                    {analyticsData.enrollment.monthlyTrends.reduce((sum, trend) => sum + trend.male, 0)}
                                </p>
                                <p className="text-sm text-muted-foreground">Male Students</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-pink-600">
                                    {analyticsData.enrollment.monthlyTrends.reduce((sum, trend) => sum + trend.female, 0)}
                                </p>
                                <p className="text-sm text-muted-foreground">Female Students</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-200">
                                <thead>
                                    <tr className="bg- -50">
                                        <th className="border border-gray-200 px-4 py-2 text-left font-medium">Month</th>
                                        <th className="border border-gray-200 px-4 py-2 text-left font-medium">Male</th>
                                        <th className="border border-gray-200 px-4 py-2 text-left font-medium">Female</th>
                                        <th className="border border-gray-200 px-4 py-2 text-left font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analyticsData.enrollment.monthlyTrends.map((trend, index) => (
                                        <tr key={index} className="hover:bg-gray-400">
                                            <td className="border border-gray-200 px-4 py-2 font-medium">
                                                {new Date(trend.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2">{trend.male}</td>
                                            <td className="border border-gray-200 px-4 py-2">{trend.female}</td>
                                            <td className="border border-gray-200 px-4 py-2 font-medium">{trend.total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Footer */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Last updated: {new Date(analyticsData.generatedAt).toLocaleString()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Data period: Last {selectedPeriod} days
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => window.print()}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Print Report
                                </Button>
                                <Button variant="outline" onClick={fetchAnalytics}>
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Refresh Data
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}