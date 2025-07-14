"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  FileText,
  Calendar,
  BookOpen,
  Award,
  AlertTriangle,
  TrendingUp,
  Download,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

type Subject = {
  id: number;
  name: string;
};

type ExamResult = {
  id: number;
  title: string;
  description: string;
  examDate: string;
  subject: {
    id: number;
    name: string;
  };
  grade: {
    id: number;
    level: number;
    name: string;
  };
  maxMarks: number;
  obtainedMarks: number | null;
  percentage: number | null;
  letterGrade: string | null;
  isAbsent: boolean;
  remarks: string;
  examType: string;
  status: string;
};

export default function StudentResults() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedExamTypeFilter, setSelectedExamTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState("all");

  // Performance stats
  const [stats, setStats] = useState({
    totalExams: 0,
    passedExams: 0,
    averagePercentage: 0,
    highestPercentage: 0
  });

  useEffect(() => {
    fetchSubjects();
    fetchResults();
  }, []);

  useEffect(() => {
    filterResults();
  }, [results, searchTerm, selectedSubjectFilter, selectedExamTypeFilter, activeTab]);

  useEffect(() => {
    if (filteredResults.length > 0) {
      calculateStats(filteredResults);
    }
  }, [filteredResults]);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/student/subjects');
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }
      const data = await response.json();
      setSubjects(data.subjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast({
        title: "Error",
        description: "Failed to load subjects",
        variant: "destructive",
      });
    }
  };

  const fetchResults = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/student/results');
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }

      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast({
        title: "Error",
        description: "Failed to load results",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterResults = () => {
    let filtered = [...results];

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(result =>
        result.title.toLowerCase().includes(searchLower) ||
        result.description?.toLowerCase().includes(searchLower) ||
        result.subject.name.toLowerCase().includes(searchLower)
      );
    }

    // Filter by subject
    if (selectedSubjectFilter !== 'all') {
      filtered = filtered.filter(result =>
        result.subject.id === parseInt(selectedSubjectFilter)
      );
    }

    // Filter by exam type
    if (selectedExamTypeFilter !== 'all') {
      filtered = filtered.filter(result =>
        result.examType === selectedExamTypeFilter
      );
    }

    // Filter by tab
    if (activeTab === "passed") {
      filtered = filtered.filter(result =>
        result.letterGrade !== 'F' && result.letterGrade !== null && !result.isAbsent
      );
    } else if (activeTab === "failed") {
      filtered = filtered.filter(result =>
        result.letterGrade === 'F' || result.isAbsent
      );
    }

    setFilteredResults(filtered);
  };

  const calculateStats = (results: ExamResult[]) => {
    const gradedResults = results.filter(r => r.percentage !== null && !r.isAbsent);

    if (gradedResults.length === 0) {
      setStats({
        totalExams: results.length,
        passedExams: 0,
        averagePercentage: 0,
        highestPercentage: 0
      });
      return;
    }

    const passedResults = gradedResults.filter(r => r.letterGrade !== 'F');
    const percentages = gradedResults.map(r => r.percentage as number);
    const averagePercentage = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const highestPercentage = Math.max(...percentages);

    setStats({
      totalExams: results.length,
      passedExams: passedResults.length,
      averagePercentage,
      highestPercentage
    });
  };

  const getPerformanceColor = (grade: string | null) => {
    if (!grade) return '';

    switch(grade) {
      case 'A+':
      case 'A':
        return 'text-green-600';
      case 'B+':
      case 'B':
        return 'text-blue-600';
      case 'C+':
      case 'C':
        return 'text-yellow-600';
      case 'D':
        return 'text-orange-600';
      case 'F':
        return 'text-red-600';
      default:
        return '';
    }
  };

  const getExamTypeBadge = (type: string) => {
    switch (type) {
      case "UNIT_TEST":
        return { label: "Unit Test", variant: "secondary" };
      case "MIDTERM":
        return { label: "Midterm", variant: "primary" };
      case "FINAL":
        return { label: "Final", variant: "default" };
      case "QUIZ":
        return { label: "Quiz", variant: "outline" };
      case "ASSIGNMENT":
        return { label: "Assignment", variant: "secondary" };
      default:
        return { label: type, variant: "outline" };
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Academic Results</h1>
        <p className="text-muted-foreground">View your exam performance and academic records</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Exams Taken</p>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats.totalExams}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Passing Rate</p>
              <Award className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">
              {stats.totalExams ? Math.round((stats.passedExams / stats.totalExams) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
             {/* // ... continuing the code */}
              <p className="text-sm font-medium text-muted-foreground">Average Score</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats.averagePercentage.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Highest Score</p>
              <Award className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats.highestPercentage.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter results by subject and exam type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search exams..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject-filter">Subject</Label>
              <Select
                value={selectedSubjectFilter}
                onValueChange={setSelectedSubjectFilter}
              >
                <SelectTrigger id="subject-filter">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam-type-filter">Exam Type</Label>
              <Select
                value={selectedExamTypeFilter}
                onValueChange={setSelectedExamTypeFilter}
              >
                <SelectTrigger id="exam-type-filter">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="UNIT_TEST">Unit Test</SelectItem>
                  <SelectItem value="MIDTERM">Midterm</SelectItem>
                  <SelectItem value="FINAL">Final</SelectItem>
                  <SelectItem value="QUIZ">Quiz</SelectItem>
                  <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Results</TabsTrigger>
          <TabsTrigger value="passed">Passed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Exam Results</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10">Loading results...</div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-10">
              <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No results found</p>
              {(searchTerm || selectedSubjectFilter !== 'all' || selectedExamTypeFilter !== 'all' || activeTab !== 'all') && (
                <p className="text-xs text-muted-foreground mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Marks</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => {
                  const typeBadge = getExamTypeBadge(result.examType);
                  const examDate = new Date(result.examDate);

                  return (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                          {result.subject.name}
                        </div>
                      </TableCell>
                      <TableCell>{format(examDate, 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={typeBadge.variant as any} className="capitalize">
                          {typeBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {result.isAbsent ? (
                          <span className="text-red-500">Absent</span>
                        ) : result.obtainedMarks === null ? (
                          <span className="text-muted-foreground">Not graded</span>
                        ) : (
                          <span>
                            {result.obtainedMarks}/{result.maxMarks}
                            <span className="text-muted-foreground text-xs ml-1">
                              ({result.percentage?.toFixed(1)}%)
                            </span>
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={getPerformanceColor(result.letterGrade)}>
                          {result.isAbsent ? '-' : (result.letterGrade || 'N/A')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {result.isAbsent ? (
                          <Badge variant="destructive">Absent</Badge>
                        ) : result.obtainedMarks === null ? (
                          <Badge variant="outline">Pending</Badge>
                        ) : result.letterGrade === 'F' ? (
                          <Badge variant="destructive">Failed</Badge>
                        ) : (
                          <Badge variant="success">Passed</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!isLoading && filteredResults.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">Subject Performance</p>
                  </div>
                  {subjects.map(subject => {
                    const subjectResults = filteredResults.filter(
                      r => r.subject.id === subject.id && r.percentage !== null && !r.isAbsent
                    );

                    if (subjectResults.length === 0) return null;

                    const avgPercentage = subjectResults.reduce(
                      (sum, r) => sum + (r.percentage || 0), 0
                    ) / subjectResults.length;

                    return (
                      <div key={subject.id} className="mb-3">
                        <div className="flex justify-between mb-1">
                          <p className="text-xs text-muted-foreground">{subject.name}</p>
                          <p className="text-xs font-medium">{avgPercentage.toFixed(1)}%</p>
                        </div>
                        <Progress value={avgPercentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">Exam Type Performance</p>
                  </div>
                  {['UNIT_TEST', 'MIDTERM', 'FINAL', 'QUIZ', 'ASSIGNMENT'].map(type => {
                    const typeResults = filteredResults.filter(
                      r => r.examType === type && r.percentage !== null && !r.isAbsent
                    );

                    if (typeResults.length === 0) return null;

                    const avgPercentage = typeResults.reduce(
                      (sum, r) => sum + (r.percentage || 0), 0
                    ) / typeResults.length;

                    const typeBadge = getExamTypeBadge(type);

                    return (
                      <div key={type} className="mb-3">
                        <div className="flex justify-between mb-1">
                          <p className="text-xs text-muted-foreground">{typeBadge.label}</p>
                          <p className="text-xs font-medium">{avgPercentage.toFixed(1)}%</p>
                        </div>
                        <Progress value={avgPercentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
