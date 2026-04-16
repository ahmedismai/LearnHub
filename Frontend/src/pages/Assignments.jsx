import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { mockAssignments, mockCourses } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";

// Backend assignments API isn't implemented yet.
// This page keeps the existing UI and shows loading/error placeholders,
// while falling back to the current mock data.
const Assignments = () => {
  const { user } = useAuth();

  const {
    data: assignments = mockAssignments,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      throw new Error("Assignments API not implemented");
    },
    enabled: !!user,
  });

  const enriched = assignments.map((a) => ({
    ...a,
    course: mockCourses.find((c) => c.id === a.courseId),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Assignments</h1>
        <p className="text-muted-foreground mt-1">
          Track and submit your course work
        </p>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading assignments...</p>}

      {isError && (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Assignments API is not available yet — showing demo data.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {enriched.map((assignment) => (
          <Card
            key={assignment.id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {assignment.course?.title || "Course"} • Due:{" "}
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
                Submit (coming soon)
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Assignments;

