import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  BookOpen,
  Users,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const InstructorAssignments = () => {
  const { user } = useAuth();

  // 1. Fetch Instructor's Courses
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ["instructor", "courses", user?.id],
    queryFn: async () => {
      const response = await api.get("/Course/mine");
      return response.data;
    },
    enabled: !!user && user.role === "Instructor",
  });

  // 2. Fetch assignments for these courses
  const { data: assignments = [], isLoading: isAssignmentsLoading } = useQuery({
    queryKey: ["instructor", "assignments", courses.map((c) => c._id)],
    queryFn: async () => {
      const results = await Promise.all(
        courses.map(async (course) => {
          const response = await api.get(`/Assignment/course/${course._id}`);
          return response.data.map((a) => ({
            ...a,
            courseTitle: course.title,
          }));
        }),
      );
      return results.flat();
    },
    enabled: courses.length > 0,
  });

  if (isCoursesLoading || isAssignmentsLoading)
    return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Course Assignments
          </h1>
          <p className="text-muted-foreground mt-1">
            Review student submissions and manage tasks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {assignments.length > 0 ? (
          assignments.map((assignment) => (
            <Card
              key={assignment._id}
              className="overflow-hidden border-none shadow-md"
            >
              <CardHeader className="bg-muted/20 pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase font-bold"
                    >
                      {assignment.courseTitle}
                    </Badge>
                    <CardTitle className="text-xl">
                      {assignment.title}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Calendar className="w-3 h-3" />
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                      Total Students
                    </p>
                    <p className="text-2xl font-bold">--</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                      Submissions
                    </p>
                    <p className="text-2xl font-bold text-primary">View</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                      Status
                    </p>
                    <Badge className="bg-success/10 text-success border-success/20">
                      Active
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Link to={`/dashboard/edit-course/${assignment.courseId}`}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Edit Assignment
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1">
                    <Link to={`/dashboard/review-submissions/${assignment._id}`}>
                      Review Submissions
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-16 text-center">
              <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium">
                No assignments created yet
              </h3>
              <p className="text-muted-foreground text-sm">
                Add assignments to your courses to start tracking student work.
              </p>
              <Button asChild className="mt-6" variant="outline">
                <Link to="/dashboard/my-courses">Go to My Courses</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InstructorAssignments;
