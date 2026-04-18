import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Assignments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentAssignment, setCurrentAssignment] = useState(null);

  const { data: enrollments = [], isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ["enrollments", "me"],
    queryFn: async () => {
      const response = await api.get("/Enrollment/me");
      return response.data;
    },
    enabled: user?.role === "Student",
  });

  const courseIds = useMemo(() => {
    return enrollments.map((e) => e.courseId?._id).filter(Boolean);
  }, [enrollments]);

  const {
    data: assignments = [],
    isLoading: isAssignmentsLoading,
    isError,
  } = useQuery({
    queryKey: ["assignments", "byCourses", courseIds],
    queryFn: async () => {
      const results = await Promise.all(
        courseIds.map(async (courseId) => {
          const response = await api.get(`/Assignment/course/${courseId}`);
          return response.data.map((a) => {
            const enrollment = enrollments.find(
              (e) => e.courseId?._id === courseId,
            );
            return {
              ...a,
              courseTitle: enrollment?.courseId?.title,
              isCompleted: enrollment?.completedAssignments?.some(
                (id) => id === a._id,
              ),
            };
          });
        }),
      );
      return results.flat();
    },
    enabled: user?.role === "Student" && courseIds.length > 0,
  });

  const submitMutation = useMutation({
    mutationFn: async ({ assignmentId, file }) => {
      const formData = new FormData();
      formData.append("file", file);
      return await api.post(`/Assignment/${assignmentId}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["assignments"]);
      queryClient.invalidateQueries(["enrollments", "me"]);
      toast.success("Assignment submitted successfully!");
      setIsSubmitting(false);
      setSelectedFile(null);
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Assignments</h1>
        <p className="text-muted-foreground mt-1">
          Track and submit your course work
        </p>
      </div>

      {(isEnrollmentsLoading || isAssignmentsLoading) && (
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

      {!isEnrollmentsLoading && !isAssignmentsLoading && !isError && (
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
                  <Badge
                    variant={assignment.isCompleted ? "success" : "secondary"}
                    className="h-6"
                  >
                    {assignment.isCompleted ? "Completed" : "Pending"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {assignment.description}
                  </p>

                  <div className="flex items-center justify-between text-sm py-2 px-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Due Date:</span>
                    </div>
                    <span className="font-semibold">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  </div>

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
                        variant={
                          assignment.isCompleted ? "outline" : "gradient"
                        }
                        className="w-full h-11 text-base font-semibold"
                        onClick={() => setCurrentAssignment(assignment)}
                      >
                        {assignment.isCompleted ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            Resubmit Assignment
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 mr-2" />
                            Submit Assignment
                          </>
                        )}
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
                            Accepted formats: PDF, ZIP, JPG, PNG (Max 10MB)
                          </p>
                        </div>

                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-primary" />
                            Important Note
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Ensure your work is complete before submitting. You
                            can resubmit anytime before the deadline.
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
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Enroll in a course to access and submit assignments. When they
                  appear, they'll show up right here.
                </p>
                <Button variant="outline" className="mt-8" asChild>
                  <a href="/courses">Browse Courses</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Assignments;
