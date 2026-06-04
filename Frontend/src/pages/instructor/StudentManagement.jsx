import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import courseService from "@/api/course";
import enrollmentService from "@/api/enrollment";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Mail, Loader2, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const StudentManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Fetch Instructor's Courses
  const { data: coursesData = {}, isLoading: isCoursesLoading } = useQuery({
    queryKey: ["instructor", "courses", user?.id],
    queryFn: () => courseService.getMyCourses(),
    enabled: !!user && user.role === "Instructor",
  });

  const courses = coursesData.data || [];

  // 2. Fetch all enrollments for these courses
  const { data: enrollments = [], isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ["instructor", "enrollments", courses.map(c => c.courseId)],
    queryFn: async () => {
      const results = await Promise.all(
        courses.map(async (course) => {
          const response = await enrollmentService.getByCourse(course.courseId);
          return response.data || [];
        })
      );
      return results.flat();
    },
    enabled: courses.length > 0,
  });

  const reissueMutation = useMutation({
    mutationFn: async ({ studentId, courseId }) => {
      const response = await api.post("/api/Certificate/instructor/generate", { studentId, courseId });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Certificate re-issued successfully");
      queryClient.invalidateQueries(["instructor", "enrollments"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to re-issue certificate");
    },
  });

  if (isCoursesLoading || isEnrollmentsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page__head">
        <div>
          <h1 className="page__title">Student Management</h1>
          <p className="page__subtitle">
            Track student progress across your courses.
          </p>
        </div>
        <div className="surface-glass flex items-center gap-2 border-primary/10 bg-primary/5 px-4 py-2">
          <Users className="w-5 h-5 text-primary" />
          <span className="font-bold text-primary">{enrollments.length} Total Students</span>
        </div>
      </div>

      <Card className="surface-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Enrolled Students
          </CardTitle>
          <CardDescription>Real-time overview of student performance and completion status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="data-list">
            <div className="data-list__head grid-cols-[1.3fr,1.2fr,0.8fr,0.7fr,0.9fr,1fr]">
              <span>Student</span>
              <span>Course</span>
              <span>Progress</span>
              <span>Status</span>
              <span>Enrollment Date</span>
              <span className="text-right">Actions</span>
            </div>
              {enrollments.length > 0 ? (
                enrollments.map((enrollment) => (
                  <div key={enrollment.enrollmentId} className="data-list__row grid-cols-[1.3fr,1.2fr,0.8fr,0.7fr,0.9fr,1fr]">
                    <div className="data-list__cell" data-label="Student">
                      <div className="space-y-0.5">
                        <p className="font-bold">{enrollment.studentName || "Anonymous User"}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {enrollment.studentEmail || enrollment.studentId}
                        </div>
                      </div>
                    </div>
                    <div className="data-list__cell max-w-[200px]" data-label="Course">
                      <Badge variant="outline" className="font-medium truncate block">
                        {enrollment.courseTitle}
                      </Badge>
                    </div>
                    <div className="data-list__cell" data-label="Progress">
                      <div className="w-32 space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                          <span>Status</span>
                        </div>
                        <Badge variant="outline">Enrolled</Badge>
                      </div>
                    </div>
                    <div className="data-list__cell" data-label="Status">
                      <Badge 
                        variant="secondary"
                        className="h-7 gap-1"
                      >
                        Active
                      </Badge>
                    </div>
                    <div className="data-list__cell text-muted-foreground" data-label="Enrollment Date">
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </div>
                    <div className="data-list__cell data-list__actions" data-label="Actions">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
                          onClick={() => reissueMutation.mutate({ 
                            studentId: enrollment.studentId, 
                            courseId: enrollment.courseId 
                          })}
                          disabled={reissueMutation.isPending}
                        >
                          {reissueMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                          Issue Certificate
                        </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state text-muted-foreground">
                    No students enrolled in your courses yet.
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentManagement;
