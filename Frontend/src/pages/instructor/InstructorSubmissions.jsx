import React from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Loader2, User, BookOpen, CheckCircle2, XCircle } from "lucide-react";

const InstructorSubmissions = () => {
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["instructor", "submissions"],
    queryFn: async () => {
      const response = await api.get("/Exam-Lifecycle/instructor/submissions");
      return response.data;
    },
  });

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-black tracking-tight">
          Student Submissions
        </h1>
        <p className="text-muted-foreground">
          Monitor performance in AI-generated and official exams.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-none shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Recent Exam Results
            </CardTitle>
            <CardDescription>
              Track who passed and who is eligible for graduation.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Student</TableHead>
                  <TableHead>Course & Exam</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
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
                        <p className="font-semibold text-sm">
                          {sub.courseId?.title}
                        </p>
                        <p className="text-xs text-primary">
                          {sub.examId?.title}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span
                            className={`text-lg font-black ${sub.score >= 70 ? "text-green-500" : "text-destructive"}`}
                          >
                            {sub.score}%
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {sub.correctCount} / {sub.totalQuestions} Correct
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {sub.score >= 70 ? (
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
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleDateString()}
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
