import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";

const Assignments = () => {
  const { user } = useAuth();

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
          const response = await api.get(`/assignments/course/${courseId}`);
          return response.data.map((a) => {
            const enrollment = enrollments.find(
              (e) => e.courseId?._id === courseId,
            );
            return { ...a, courseTitle: enrollment?.courseId?.title };
          });
        }),
      );
      return results.flat();
    },
    enabled: user?.role === "Student" && courseIds.length > 0,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Assignments</h1>
        <p className="text-muted-foreground mt-1">
          Track and submit your course work
        </p>
      </div>

      {(isEnrollmentsLoading || isAssignmentsLoading) && (
        <p className="text-muted-foreground">Loading assignments...</p>
      )}

      {isError && (
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load assignments.</p>
          </CardContent>
        </Card>
      )}

      {!isEnrollmentsLoading && !isAssignmentsLoading && !isError && (
        <div className="space-y-4">
          {assignments.length > 0 ? (
            assignments.map((assignment) => (
              <Card
                key={assignment._id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {assignment.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {assignment.courseTitle || "Course"} • Due:{" "}
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="muted">Assignment</Badge>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    {assignment.description}
                  </p>
                  <Button variant="outline" className="w-full" disabled>
                    Submit (Coming Soon)
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">
                  No Assignments Yet
                </h3>
                <p className="text-muted-foreground">
                  Enroll in a course to access assignments.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Assignments;
