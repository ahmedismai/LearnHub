import React from 'react';
import { useQuery } from "@tanstack/react-query";
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
import { Loader2, Search, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const StudentResults = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["instructor", "student-results"],
    queryFn: async () => {
      const response = await api.get("/ExamResult/Instructor/AllResults");
      return response.data;
    },
  });

  const filteredResults = results.filter((result) => 
    result.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.courseId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.examId?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold tracking-tight">Student Results</h1>
          <p className="text-muted-foreground mt-1">Monitor student performance across all your courses</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students, courses..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="bg-primary/5 border-b pb-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Examination Reports</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-bold">Student</TableHead>
                <TableHead className="font-bold">Course</TableHead>
                <TableHead className="font-bold">Exam</TableHead>
                <TableHead className="font-bold text-center">Score</TableHead>
                <TableHead className="font-bold text-center">Percentage</TableHead>
                <TableHead className="font-bold text-center">Date</TableHead>
                <TableHead className="font-bold text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.length > 0 ? (
                filteredResults.map((result) => (
                  <TableRow key={result._id} className="hover:bg-primary/5 transition-colors">
                    <TableCell>
                      <div className="font-medium">{result.studentId?.name || "N/A"}</div>
                      <div className="text-xs text-muted-foreground">{result.studentId?.email}</div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {result.courseId?.title || "N/A"}
                    </TableCell>
                    <TableCell>{result.examId?.title || "N/A"}</TableCell>
                    <TableCell className="text-center font-semibold">
                      {result.score} / {result.totalMarks}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-sm font-bold ${result.percentage >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                          {result.percentage.toFixed(1)}%
                        </span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${result.percentage >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${result.percentage}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {new Date(result.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={result.percentage >= 50 ? "success" : "destructive"}>
                        {result.percentage >= 50 ? "Passed" : "Failed"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                       <GraduationCap className="w-10 h-10 opacity-20" />
                       <p>No exam results found.</p>
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
