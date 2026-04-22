import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import api from "@/api/axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, GraduationCap, FileText, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const StudentResults = () => {
  const { id } = useParams();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ["instructor", "all-grades", id],
    queryFn: async () => {
      const response = await api.get("/Grade/Instructor/AllGrades");
      return response.data;
    },
  });

  const filteredGrades = grades.filter((grade) => {
    const matchesSearch = 
      grade.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.courseId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (grade.quizId?.title || grade.examId?.title || grade.assignmentId?.title || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    if (id) {
      const matchesId = 
        grade.quizId?._id === id || 
        grade.examId?._id === id || 
        grade.assignmentId?._id === id;
      return matchesSearch && matchesId;
    }
    
    return matchesSearch;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Exam': return <GraduationCap className="w-4 h-4 text-purple-500" />;
      case 'Quiz': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'Assignment': return <ClipboardList className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gradebook</h1>
          <p className="text-muted-foreground mt-1">View all student scores for quizzes, exams, and assignments</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students, courses..."
            className="pl-9 bg-background shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-xl overflow-hidden bg-background">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Performance Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b">
                <TableHead className="font-bold py-4">Student</TableHead>
                <TableHead className="font-bold py-4">Course</TableHead>
                <TableHead className="font-bold py-4">Assessment</TableHead>
                <TableHead className="font-bold py-4 text-center">Type</TableHead>
                <TableHead className="font-bold py-4 text-center">Score</TableHead>
                <TableHead className="font-bold py-4 text-center">Result</TableHead>
                <TableHead className="font-bold py-4 text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGrades.length > 0 ? (
                filteredGrades.map((grade) => (
                  <TableRow key={grade._id} className="hover:bg-primary/5 transition-colors border-b last:border-0">
                    <TableCell className="py-4">
                      <div className="font-bold text-foreground">{grade.studentId?.name || "N/A"}</div>
                      <div className="text-xs text-muted-foreground">{grade.studentId?.email}</div>
                    </TableCell>
                    <TableCell className="py-4 max-w-[180px] truncate">
                      {grade.courseId?.title || "N/A"}
                    </TableCell>
                    <TableCell className="py-4 font-medium">
                      {grade.quizId?.title || grade.examId?.title || grade.assignmentId?.title || "N/A"}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex justify-center">
                        <Badge variant="outline" className="flex items-center gap-1.5 px-2 py-0.5">
                          {getTypeIcon(grade.type)}
                          {grade.type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold">{grade.score} / {grade.maxScore}</span>
                        <span className={`text-[10px] px-1.5 rounded-full ${grade.percentage >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           {grade.percentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                       <Badge variant={grade.percentage >= 50 ? "success" : "destructive"} className="shadow-sm">
                          {grade.percentage >= 50 ? "PASSED" : "FAILED"}
                       </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-right text-sm text-muted-foreground">
                      {new Date(grade.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-60 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                       <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Search className="w-6 h-6 opacity-20" />
                       </div>
                       <p className="font-medium">No performance records found.</p>
                       <p className="text-xs max-w-[200px] mx-auto opacity-70">Try adjusting your search or wait for students to complete assessments.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentResults;
