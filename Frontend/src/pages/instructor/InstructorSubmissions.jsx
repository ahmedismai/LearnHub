import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import api from "@/api/axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, User, BookOpen, CheckCircle2, XCircle, FileText, Download, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";

const InstructorSubmissions = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [gradingId, setGradingId] = useState(null);
  const [gradeData, setGradeData] = useState({ score: 0, feedback: "" });

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["instructor", "submissions", id],
    queryFn: async () => {
      const endpoint = id 
        ? `/Assignment/submissions/${id}` 
        : "/Exam-Lifecycle/instructor/submissions";
      const response = await api.get(endpoint);
      return response.data;
    },
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ submissionId, data }) => {
      return await api.patch(`/Assignment/submissions/${submissionId}/grade`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["instructor", "submissions", id]);
      toast.success("Submission graded successfully");
      setGradingId(null);
      setGradeData({ score: 0, feedback: "" });
    },
    onError: () => toast.error("Failed to grade submission"),
  });

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );

  const isAssignment = !!id;

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-20 p-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">
          {isAssignment ? "Assignment Submissions" : "Student Submissions"}
        </h1>
        <p className="text-muted-foreground">
          {isAssignment ? "Review and grade student assignment work." : "Monitor performance in AI-generated and official exams."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-none shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="flex items-center gap-2">
              {isAssignment ? <FileText className="w-5 h-5 text-primary" /> : <BookOpen className="w-5 h-5 text-primary" />}
              {isAssignment ? "Student Work" : "Recent Exam Results"}
            </CardTitle>
            <CardDescription>
              {isAssignment ? "Review file submissions and assign grades." : "Track who passed and who is eligible for graduation."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Student</TableHead>
                  <TableHead>{isAssignment ? "Submission" : "Course & Exam"}</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.length > 0 ? (
                  submissions.map((sub) => (
                    <TableRow
                      key={sub._id}
                      className="hover:bg-muted/10 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {sub.studentId?.name?.[0]}
                          </div>
                          <div>
                            <p className="font-bold text-sm">
                              {sub.studentId?.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {sub.studentId?.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isAssignment ? (
                          <div className="flex flex-col gap-1">
                            <Button variant="link" className="p-0 h-auto text-primary text-xs justify-start" asChild>
                              <a href={sub.submittedFile} target="_blank" rel="noreferrer">
                                <Download className="w-3 h-3 mr-1" /> View Submission
                              </a>
                            </Button>
                            <span className="text-[10px] text-muted-foreground">
                              Submitted: {new Date(sub.date).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <>
                            <p className="font-semibold text-sm">
                              {sub.courseId?.title}
                            </p>
                            <p className="text-xs text-primary">
                              {sub.examId?.title}
                            </p>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        {gradingId === sub._id ? (
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number" 
                              className="w-16 h-8 text-xs" 
                              value={gradeData.score}
                              onChange={(e) => setGradeData({ ...gradeData, score: e.target.value })}
                            />
                            <span className="text-xs">/100</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span
                              className={`text-lg font-black ${(isAssignment ? (sub.score || 0) : sub.score) >= 70 ? "text-green-500" : "text-destructive"}`}
                            >
                              {sub.score || 0}%
                            </span>
                            {!isAssignment && (
                              <span className="text-[10px] text-muted-foreground">
                                {sub.correctCount} / {sub.totalQuestions} Correct
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {(isAssignment ? (sub.score || 0) : sub.score) >= 70 ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-200 gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Passed
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="gap-1 bg-destructive/10 text-destructive border-destructive/20"
                          >
                            <XCircle className="w-3 h-3" /> Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isAssignment && (
                          gradingId === sub._id ? (
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8"
                                onClick={() => setGradingId(null)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                size="sm" 
                                className="h-8"
                                onClick={() => gradeMutation.mutate({ submissionId: sub._id, data: gradeData })}
                                disabled={gradeMutation.isPending}
                              >
                                Save
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 gap-1"
                              onClick={() => {
                                setGradingId(sub._id);
                                setGradeData({ score: sub.score || 0, feedback: sub.feedback || "" });
                              }}
                            >
                              <Star className="w-3 h-3" /> Grade
                            </Button>
                          )
                        )}
                        {!isAssignment && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-40 text-center text-muted-foreground italic"
                    >
                      No submissions recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstructorSubmissions;
