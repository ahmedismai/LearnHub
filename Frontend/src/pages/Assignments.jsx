import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Play,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  BrainCircuit,
  Sparkles,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ExpandableDescription = ({ text, limit = 100, className = "" }) => {
// ... (rest of ExpandableDescription is same)
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const shouldTruncate = text.length > limit;
  const displayedText = isExpanded ? text : text.slice(0, limit);

  return (
    <div className="space-y-1">
      <p className={`text-sm leading-relaxed ${className}`}>
        {displayedText}
        {!isExpanded && shouldTruncate && "..."}
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 text-xs font-bold text-primary hover:underline transition-all inline-flex items-center"
          >
            {isExpanded ? "Show Less" : "Read More"}
          </button>
        )}
      </p>
    </div>
  );
};

const Assignments = ({ isSubComponent = false }) => {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  const isInstructor = user?.role === "Instructor";
  const aiAssignment = location.state?.aiAssignment;

  const {
    data: assignments = [],
    isLoading: isAssignmentsLoading,
    isError,
  } = useQuery({
    queryKey: ["assignments", user?.role],
    queryFn: async () => {
      const response = await api.get("/Assignment");
      const allAssignments = response.data;

      // For students, we only want assignments from courses they are enrolled in
      const enrollmentsRes = await api.get("/Enrollment/me");
      const enrollments = enrollmentsRes.data;
      const enrolledCourseIds = enrollments.map(e => (e.courseId?._id || e.courseId).toString());

      if (isInstructor) {
        return allAssignments.map(a => ({ ...a, courseTitle: a.courseId?.title }));
      }

      return allAssignments
        .filter(a => enrolledCourseIds.includes((a.courseId?._id || a.courseId).toString()))
        .map((a) => {
          const enrollment = enrollments.find(
            (e) => (e.courseId?._id || e.courseId).toString() === (a.courseId?._id || a.courseId).toString(),
          );
          return {
            ...a,
            courseTitle: a.courseId?.title,
            isCompleted: enrollment?.completedAssignments?.some(
              (id) => id.toString() === a._id.toString(),
            ),
          };
        });
    },
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async ({ assignmentId, file }) => {
      if (isInstructor) return { message: "Instructor preview" };
      const formData = new FormData();
      formData.append("file", file);
      return await api.post(`/Assignment/${assignmentId}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: (data) => {
      if (isInstructor) return;
      queryClient.invalidateQueries(["assignments"]);
      queryClient.invalidateQueries(["enrollments", "me"]);
      queryClient.invalidateQueries(["grades", "me"]);
      
      toast.success("Assignment submitted successfully!");
      setIsSubmitting(false);
      setSelectedFile(null);
      
      if (data.evaluation) {
        setEvaluationResult(data.evaluation);
        setShowResultDialog(true);
      }
      
      setCurrentAssignment(null);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to submit assignment",
      );
    },
  });

  const handleSubmit = () => {
    if (!selectedFile || !currentAssignment) return;
    submitMutation.mutate({
      assignmentId: currentAssignment._id,
      file: selectedFile,
    });
  };

  return (
    <div className={`space-y-6 animate-fade-in ${!isSubComponent ? 'max-w-7xl mx-auto' : ''} pb-10`}>
      {isInstructor && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-center gap-3 mb-6">
           <ShieldCheck className="text-amber-500 w-6 h-6" />
           <div>
              <p className="font-bold text-amber-800 uppercase text-xs">Instructor Preview Mode</p>
              <p className="text-amber-700 text-sm">You are viewing assignments in preview mode. Submission is disabled.</p>
           </div>
        </div>
      )}
      {!isSubComponent && (
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assignments</h1>
          <p className="text-muted-foreground mt-1">
            {isInstructor ? "Preview how students see their course work" : "Track and submit your course work"}
          </p>
        </div>
      )}

      {/* AI Practice Section */}
      {aiAssignment && (
        <Card className="border-primary/30 bg-primary/5 overflow-hidden">
           <CardHeader className="bg-primary/10 pb-4">
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                      <BrainCircuit className="w-6 h-6" />
                   </div>
                   <div>
                     <CardTitle className="text-2xl font-black tracking-tight">{aiAssignment.title}</CardTitle>
                     <CardDescription className="text-primary font-bold">AI Smart Practice Assignment</CardDescription>
                   </div>
                </div>
                <Badge className="bg-primary text-primary-foreground"><Sparkles className="w-3 h-3 mr-1" /> Personalized</Badge>
             </div>
           </CardHeader>
           <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 gap-6">
                {aiAssignment.tasks?.map((task, idx) => (
                  <div key={idx} className="p-6 rounded-2xl bg-background border-2 border-primary/10 shadow-sm space-y-4">
                     <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black text-sm">{idx + 1}</span>
                        <h4 className="text-lg font-bold">The Task</h4>
                     </div>
                     <ExpandableDescription 
                        text={task.description} 
                        limit={100} 
                        className="text-foreground" 
                     />
                     <div className="pt-4 border-t border-dashed">
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Success Criteria:</p>
                        <ExpandableDescription 
                          text={task.criteria} 
                          limit={80} 
                          className="italic text-muted-foreground" 
                        />
                     </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center pt-4">
                 <Button variant="outline" onClick={() => window.print()} className="h-12 px-8">
                    <FileText className="w-4 h-4 mr-2" />
                    Save Tasks as PDF
                 </Button>
              </div>
           </CardContent>
        </Card>
      )}

      {isAssignmentsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="h-48 animate-pulse bg-muted" />
          ))}
        </div>
      )}

      {isError && (
        <Card className="border-destructive">
          <CardContent className="p-6 flex items-center gap-3 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <p>Failed to load assignments. Please try again later.</p>
          </CardContent>
        </Card>
      )}

      {!isAssignmentsLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.length > 0 ? (
            assignments.map((assignment) => (
              <Card
                key={assignment._id}
                className={`overflow-hidden hover:shadow-lg transition-all border-2 ${assignment.isCompleted ? "border-success/20" : "hover:border-primary/20"}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${assignment.isCompleted ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}
                    >
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">
                        {assignment.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {assignment.courseTitle}
                      </p>
                    </div>
                  </div>
                  {!isInstructor && (
                    <Badge
                      variant={assignment.isCompleted ? "success" : "secondary"}
                      className="h-6"
                    >
                      {assignment.isCompleted ? "Completed" : "Pending"}
                    </Badge>
                  )}
                  {isInstructor && (
                    <Badge variant="outline" className="h-6">Preview Only</Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <ExpandableDescription 
                    text={assignment.description} 
                    limit={100} 
                    className="text-muted-foreground min-h-[2.5rem]" 
                  />

                  <div className="flex items-center justify-between text-sm py-2 px-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Due Date:</span>
                    </div>
                    <span className="font-semibold">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  </div>

                  {isInstructor ? (
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 text-center">
                       <p className="text-sm font-bold text-primary">Student Submission Area</p>
                       <p className="text-xs text-muted-foreground mt-1">This area is disabled in preview mode.</p>
                    </div>
                  ) : (
                    <>
                      {assignment.isCompleted ? (
                        <Link to="/dashboard/grades" className="w-full">
                          <Button variant="outline" className="w-full h-11 text-base font-semibold border-primary/20 text-primary hover:bg-primary/5">
                            <Sparkles className="w-4 h-4 mr-2" />
                            View AI Results
                          </Button>
                        </Link>
                      ) : (
                        <Dialog
                          open={
                            isSubmitting && currentAssignment?._id === assignment._id
                          }
                          onOpenChange={(open) => {
                            setIsSubmitting(open);
                            if (!open) {
                              setCurrentAssignment(null);
                              setSelectedFile(null);
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="gradient"
                              className="w-full h-11 text-base font-semibold"
                              onClick={() => setCurrentAssignment(assignment)}
                            >
                              <Upload className="w-5 h-5 mr-2" />
                              Submit Assignment
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Submit: {assignment.title}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                              <div className="space-y-2">
                                <Label
                                  htmlFor="file"
                                  className="text-base font-semibold"
                                >
                                  Choose File
                                </Label>
                                <div className="flex items-center gap-3">
                                  <Input
                                    id="file"
                                    type="file"
                                    onChange={(e) =>
                                      setSelectedFile(e.target.files[0])
                                    }
                                    className="cursor-pointer"
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Accepted formats: PDF, ZIP, HTML, DOCX, JPG, PNG (Max 10MB)
                                </p>
                              </div>

                              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                                <p className="text-sm font-medium flex items-center gap-2 text-primary">
                                  <Sparkles className="w-4 h-4" />
                                  Smart AI Review Enabled
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  After uploading, our AI Tutor will instantly evaluate your work and provide a preliminary score and feedback.
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-end gap-3">
                              <Button
                                variant="ghost"
                                onClick={() => setIsSubmitting(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleSubmit}
                                disabled={!selectedFile || submitMutation.isPending}
                                className="min-w-[120px]"
                              >
                                {submitMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                  </>
                                ) : (
                                  "Upload Work"
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full border-dashed">
              <CardContent className="p-16 text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  No Assignments Yet
                </h3>
                <p className="text-muted-foreground max-sm mx-auto">
                  {isInstructor ? "You haven't created any assignments for this course yet." : "Enroll in a course to access and submit assignments. When they appear, they'll show up right here."}
                </p>
                {!isInstructor && (
                  <Button variant="outline" className="mt-8" asChild>
                    <a href="/courses">Browse Courses</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gradient-to-br from-primary/10 via-background to-background p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary animate-bounce">
                <Trophy className="w-10 h-10" />
              </div>
              
              <div className="space-y-2">
                <DialogTitle className="text-3xl font-black tracking-tight">Assignment Submitted!</DialogTitle>
                <DialogDescription className="text-base">
                  Your work has been received and evaluated by your AI Tutor.
                </DialogDescription>
              </div>

              <div className="w-full grid grid-cols-1 gap-4 pt-4">
                <div className="p-6 bg-muted/50 rounded-2xl border-2 border-primary/10 shadow-inner">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">AI Preliminary Score</p>
                  <p className={`text-5xl font-black ${evaluationResult?.score >= 70 ? "text-green-500" : "text-amber-500"}`}>
                    {evaluationResult?.score}%
                  </p>
                  <Badge variant={evaluationResult?.score >= 70 ? "success" : "warning"} className="mt-2">
                    {evaluationResult?.score >= 70 ? "Great Job!" : "Needs Review"}
                  </Badge>
                </div>

                <div className="p-6 bg-background rounded-2xl border shadow-sm text-left space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-5 h-5" />
                    <h4 className="font-bold">AI Tutor Feedback</h4>
                  </div>
                  <div className="text-sm leading-relaxed text-muted-foreground max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {evaluationResult?.feedback}
                  </div>
                </div>
              </div>

              <div className="w-full pt-4 flex flex-col gap-3">
                <Button onClick={() => setShowResultDialog(false)} className="w-full h-12 font-bold text-lg rounded-xl shadow-lg shadow-primary/20">
                  Got it, thanks!
                </Button>
                <Link to="/dashboard/grades" className="w-full">
                  <Button variant="outline" className="w-full h-12 font-bold rounded-xl">
                    View in Gradebook
                  </Button>
                </Link>
              </div>
              
              <p className="text-[10px] text-muted-foreground italic">
                * This is an automated evaluation. Your instructor will provide the final grade after review.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assignments;
