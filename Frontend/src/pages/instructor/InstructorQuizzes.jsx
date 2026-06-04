import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import courseService from "@/api/course";
import examService from "@/api/exam";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  BookOpen,
  PlusCircle,
  ExternalLink,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const InstructorQuizzes = () => {
  const { user } = useAuth();

  // 1. Fetch Instructor's Courses
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ["instructor", "courses", user?.id],
    queryFn: async () => {
      const response = await courseService.getMyCourses();
      return response.data || response || [];
    },
    enabled: !!user && user.role === "Instructor",
  });

  // 2. Fetch quizzes for these courses
  const { data: quizzes = [], isLoading: isQuizzesLoading } = useQuery({
    queryKey: ["instructor", "quizzes", courses.map((c) => c.courseId || c.id)],
    queryFn: async () => {
      const results = await Promise.all(
        courses.map(async (course) => {
          const courseId = course.courseId || course.id;
          const response = await examService.getByCourse(courseId);
          const exams = response.data || response || [];
          return exams.map((q) => ({
            ...q,
            _id: q.examId,
            courseId,
            courseTitle: course.title,
          }));
        }),
      );
      return results.flat();
    },
    enabled: courses.length > 0,
  });

  if (isCoursesLoading || isQuizzesLoading)
    return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page__head">
        <div>
          <h1 className="page__title">Course Quizzes</h1>
          <p className="page__subtitle">
            Manage interactive assessments and check student scores
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quizzes.length > 0 ? (
          quizzes.map((quiz) => (
            <Card
              key={quiz._id}
              className="surface-glass overflow-hidden"
            >
              <CardHeader className="bg-muted/20 pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase font-bold"
                    >
                      {quiz.courseTitle}
                    </Badge>
                    <CardTitle className="text-xl">{quiz.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                    <Timer className="w-3 h-3" />
                    {quiz.duration || 10}m
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
                  {quiz.description || "No description provided."}
                </p>

                <div className="flex gap-3">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Link to={`/dashboard/edit-exam/${quiz.examId || quiz._id}`}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Edit Quiz
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1">
                    <Link to={`/dashboard/student-results/${quiz.examId || quiz._id}`}>
                      View Results
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="empty-state col-span-full">
            <CardContent>
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No quizzes created yet</h3>
              <p className="text-muted-foreground text-sm">
                Add quizzes to your course contents to engage your students.
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

export default InstructorQuizzes;
