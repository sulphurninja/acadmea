"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    FileText,
    Download,
    Calendar,
    Users,
    GraduationCap,
    BookOpen,
    TrendingUp,
    Filter,
    Search,
    Eye,
    Mail,
    IndianRupee,
    ClipboardList,
    Activity,
    Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface ReportData {
    title: string;
    totalStudents?: number;
    averagePercentage?: number;
    averageAttendance?: number;
    totalCollected?: number;
    totalPending?: number;
    totalOverdue?: number;
    data: any[];
    generatedAt: string;
}

export default function AdminReportsPage() {
    const { toast } = useToast();
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedReportType, setSelectedReportType] = useState('student-performance');
    const [selectedGrade, setSelectedGrade] = useState('all');
    const [selectedClass, setSelectedClass] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [grades, setGrades] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);

    useEffect(() => {
        fetchGradesAndClasses();
    }, []);

    const fetchGradesAndClasses = async () => {
        try {
            const [gradesRes, classesRes] = await Promise.all([
                fetch('/api/admin/grades'),
                fetch('/api/admin/classes')
            ]);

            const gradesData = await gradesRes.json();
            const classesData = await classesRes.json();

            // Fix: Extract grades array from the response object
            setGrades(gradesData.grades || []);
            setClasses(classesData.classes || classesData || []);
        } catch (error) {
            console.error('Error fetching grades and classes:', error);
            setGrades([]);
            setClasses([]);
        }
    };

    const generateReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                type: selectedReportType,
                ...(selectedGrade !== 'all' && { gradeId: selectedGrade }),
                ...(selectedClass !== 'all' && { classId: selectedClass }),
                ...(dateRange.start && { startDate: dateRange.start }),
                ...(dateRange.end && { endDate: dateRange.end })
            });

            const response = await fetch(`/api/admin/reports?${params}`);
            const data = await response.json();

            if (response.ok) {
                setReportData(data);
                toast({
                    title: "Success",
                    description: "Report generated successfully",
                });
            } else {
                throw new Error(data.error || 'Failed to generate report');
            }
        } catch (error) {
            console.error('Error generating report:', error);
            toast({
                title: "Error",
                description: "Failed to generate report",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const exportReport = (format: 'csv' | 'pdf') => {
        if (!reportData) return;

        // Convert data to CSV
        if (format === 'csv') {
            const csvContent = convertToCSV(reportData.data);
            downloadFile(csvContent, `${selectedReportType}-report.csv`, 'text/csv');
        }

        toast({
            title: "Success",
            description: `Report exported as ${format.toUpperCase()}`,
        });
    };

    const convertToCSV = (data: any[]) => {
        if (!data.length) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
        ];

        return csvRows.join('\n');
    };

    const downloadFile = (content: string, filename: string, contentType: string) => {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const renderReportTable = () => {
        if (!reportData || !reportData.data.length) return null;

        const data = reportData.data;
        const headers = Object.keys(data[0]);

        return (
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-50">
                            {headers.map(header => (
                                <th key={header} className="border border-gray-300 px-4 py-2 text-left font-medium">
                                    {header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                {headers.map(header => (
                                    <td key={header} className="border border-gray-300 px-4 py-2">
                                        {typeof row[header] === 'object' && row[header] !== null
                                            ? JSON.stringify(row[header])
                                            : row[header]?.toString() || '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Reports</h1>
                        <p className="text-muted-foreground mt-2">
                            Generate comprehensive reports for academic and administrative insights
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Report Generator
                        </CardTitle>
                        <CardDescription>
                            Configure and generate detailed reports for your school
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Report Type */}
                            <div>
                                <Label htmlFor="report-type">Report Type</Label>
                                <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select report type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="student-performance">Student Performance</SelectItem>
                                        <SelectItem value="attendance">Attendance Report</SelectItem>
                                        <SelectItem value="fee-collection">Fee Collection</SelectItem>
                                        {/* <SelectItem value="teacher-performance">Teacher Performance</SelectItem> */}
                                        <SelectItem value="exam-results">Exam Results</SelectItem>
                                        {/* <SelectItem value="enrollment">Enrollment Report</SelectItem> */}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Grade Filter */}
                            <div>
                                <Label htmlFor="grade">Grade</Label>
                                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select grade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Grades</SelectItem>
                                        {grades?.map(grade => (
                                            <SelectItem key={grade._id} value={grade._id.toString()}>
                                                Class {grade.level}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Class Filter */}
                            <div>
                                <Label htmlFor="class">Section</Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sections</SelectItem>
                                        {classes.map(cls => (
                                            <SelectItem key={cls._id} value={cls._id.toString()}>
                                                {cls.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date Range */}
                            <div className="space-y-2">
                                <Label>Date Range</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="text-sm"
                                    />
                                    <Input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={generateReport} disabled={loading} className="flex items-center gap-2">
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-4 w-4" />
                                        Generate Report
                                    </>
                                )}
                            </Button>

                            {reportData && (
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => exportReport('csv')}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Export CSV
                                    </Button>
                                    <Button variant="outline" onClick={() => exportReport('pdf')}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Export PDF
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Report Results */}
                {reportData && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{reportData.title}</span>
                                <Badge variant="outline">
                                    Generated: {new Date(reportData.generatedAt).toLocaleDateString()}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Summary Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                {reportData.totalStudents && (
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-blue-500" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Total Students</p>
                                                    <p className="text-2xl font-bold">{reportData.totalStudents}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {reportData.averagePercentage && (
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-green-500" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Average Performance</p>
                                                    <p className="text-2xl font-bold">{reportData.averagePercentage}%</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {reportData.averageAttendance && (
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-purple-500" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Average Attendance</p>
                                                    <p className="text-2xl font-bold">{reportData.averageAttendance}%</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {reportData.totalCollected && (
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2">
                                                <IndianRupee className="h-4 w-4 text-yellow-500" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Total Collected</p>
                                                    <p className="text-2xl font-bold">₹{reportData.totalCollected.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Report Table */}
                            {renderReportTable()}
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}