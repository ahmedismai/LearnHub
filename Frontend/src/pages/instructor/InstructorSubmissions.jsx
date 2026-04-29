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
import { Loader2, User, BookOpen, CheckCircle2, XCircle, FileText, Download, Star, CheckCircle, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";

const InstructorSubmissions = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [gradingId, setGradingId] = useState(null);
  const [gradeData, setGradeData] = useState({ score: 0, feedback: "", aiFeedback: "" });

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

  const { data: assignment } = useQuery({
    queryKey: ["assignment", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get(`/Assignment/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const [isAiGrading, setIsAiGrading] = useState(false);

  const handleSmartAiGrade = async (submissionId) => {
    setIsAiGrading(true);
    try {
      const response = await api.post("/AI-Assessment/evaluate-code", { submissionId });
      setGradeData({
        score: response.data.score,
        aiFeedback: response.data.feedback,
        feedback: "AI evaluated submission."
      });
      queryClient.invalidateQueries(["instructor", "submissions", id]);
      toast.success("AI Evaluation complete!");
    } catch (error) {
      toast.error("AI Evaluation failed.");
    } finally {
      setIsAiGrading(false);
    }
  };

  const gradeMutation = useMutation({
    mutationFn: async ({ submissionId, data, type }) => {
      const endpoint = type === "Exam" || type === "Quiz" 
        ? `/Exam-Lifecycle/review/${submissionId}`
        : `/Assignment/submissions/${submissionId}/grade`;
      return await api.patch(endpoint, { ...data, isReviewed: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["instructor", "submissions", id]);
      toast.success("Grade finalized and approved!");
      setGradingId(null);
      setGradeData({ score: 0, feedback: "", aiFeedback: "" });
    },
    onError: () => toast.error("Failed to finalize grade"),
  });

  const { data: allGrades = [] } = useQuery({
    queryKey: ["instructor", "all-grades-raw"],
    queryFn: async () => {
      const res = await api.get("/Grade/Instructor/AllGrades");
      return res.data;
    },
  });

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );

  const isAssignment = !!id;

  const getGradeForSubmission = (sub) => {
    return allGrades.find(g => 
      (g.assignmentId?._id === sub.contentId || g.assignmentId === sub.contentId) ||
      (g.examId?._id === sub.examId || g.examId === sub.examId) ||
      (g.quizId?._id === sub.contentId || g.quizId === sub.contentId)
    );
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-20 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            {isAssignment ? <FileText className="w-8 h-8 text-primary" /> : <BookOpen className="w-8 h-8 text-primary" />}
            {isAssignment ? assignment?.title || "Assignment Submissions" : "Student Submissions"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAssignment ? "Review and grade student assignment work." : "Monitor performance in AI-generated and official exams."}
          </p>
        </div>
        {assignment?.dueDate && (
          <Badge variant="outline" className="py-1.5 px-4 rounded-xl border-primary/20 bg-primary/5 text-primary font-bold">
            Due: {new Date(assignment.dueDate).toLocaleDateString()}
          </Badge>
        )}
      </div>

      {isAssignment && assignment?.description && (
        <Card className="border-primary/20 bg-primary/5 overflow-hidden">
           <CardHeader className="bg-primary/10 py-3">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                 <BrainCircuit className="w-4 h-4" />
                 Assignment Instructions
              </CardTitle>
           </CardHeader>
           <CardContent className="p-6">
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                 {assignment.description}
              </div>
           </CardContent>
        </Card>
      )}

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
                  <TableHead>Final Score</TableHead>
                  <TableHead>AI Insights</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.length > 0 ? (
                  submissions.map((sub) => {
                    const gradeRecord = getGradeForSubmission(sub);
                    const isBeingGraded = gradingId === sub._id;
                    
                    return (
                      <React.Fragment key={sub._id}>
                        <TableRow className="hover:bg-muted/10 transition-colors">
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
                            {isBeingGraded ? (
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="number" 
                                  className="w-20 h-9 font-bold" 
                                  value={gradeData.score}
                                  onChange={(e) => setGradeData({ ...gradeData, score: e.target.value })}
                                />
                                <span className="font-bold">/100</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={`text-xl font-black ${sub.score >= 70 ? "text-green-500" : "text-destructive"}`}>
                                  {sub.score || 0}%
                                </span>
                                {gradeRecord?.isReviewed && (
                                  <Badge variant="success" className="text-[10px] py-0">Approved</Badge>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                             <div className="max-w-[200px] truncate text-xs text-muted-foreground italic">
                                {gradeRecord?.aiFeedback || "No feedback generated"}
                             </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              variant={isBeingGraded ? "ghost" : "outline"} 
                              className="h-8 gap-1"
                              onClick={() => {
                                if (isBeingGraded) {
                                  setGradingId(null);
                                } else {
                                  setGradingId(sub._id);
                                  setGradeData({ 
                                    score: sub.score || 0, 
                                    feedback: sub.feedback || "",
                                    aiFeedback: gradeRecord?.aiFeedback || ""
                                  });
                                }
                              }}
                            >
                              {isBeingGraded ? "Cancel" : <><Star className="w-3 h-3" /> Review</>}
                            </Button>
                          </TableCell>
                        </TableRow>
                        
                        {isBeingGraded && (
                          <TableRow className="bg-primary/5 border-b-2 border-primary/20">
                             <TableCell colSpan={5} className="p-6">
                                <div className="space-y-4 max-w-4xl mx-auto bg-card p-6 rounded-2xl shadow-inner border border-primary/10">
                                   <div className="flex items-center gap-2 text-primary font-bold mb-2">
                                      <BrainCircuit className="w-5 h-5" />
                                      <h3>Refine AI Feedback & Finalize Grade</h3>
                                   </div>
                                   
                                   <div className="space-y-2">
                                      <label className="text-xs font-black uppercase text-muted-foreground">AI Generated Feedback (Editable)</label>
                                      <Textarea 
                                        className="min-h-[150px] text-sm leading-relaxed"
                                        value={gradeData.aiFeedback}
                                        onChange={(e) => setGradeData({ ...gradeData, aiFeedback: e.target.value })}
                                        placeholder="AI feedback will appear here. You can edit it to add your personal touch..."
                                      />
                                   </div>

                                   <div className="flex justify-end gap-3 pt-2">
                                      {isAssignment && (
                                        <Button 
                                          variant="outline"
                                          className="gap-2 border-primary/20 hover:bg-primary/5"
                                          onClick={() => handleSmartAiGrade(sub._id)}
                                          disabled={isAiGrading}
                                        >
                                          {isAiGrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4 text-primary" />}
                                          Smart AI Grade
                                        </Button>
                                      )}
                                      <Button 
                                        className="gap-2 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
                                        onClick={() => gradeMutation.mutate({ 
                                          submissionId: sub._id, 
                                          data: gradeData,
                                          type: sub.type
                                        })}
                                        disabled={gradeMutation.isPending}
                                      >
                                        <CheckCircle className="w-4 h-4" /> Approve & Finalize
                                      </Button>
                                   </div>
                                </div>
                             </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
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
