import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import { ClipboardList, Play } from "lucide-react";
import { Link } from "react-router-dom";

const Quizzes = () => {
  const { user } = useAuth();

  const {
    data: enrollments = [],
    isLoading: isEnrollmentsLoading,
    isError: isEnrollmentsError,
  } = useQuery({
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
    data: quizzesByCourse = [],
    isLoading: isQuizzesLoading,
    isError: isQuizzesError,
  } = useQuery({
    queryKey: ["quizzes", "byCourses", courseIds],
    queryFn: async () => {
      const results = await Promise.all(
        courseIds.map(async (courseId) => {
          const response = await api.get(`/quizzes/course/${courseId}`);
          return response.data.map((quiz) => ({ ...quiz, courseId }));
        }),
      );
      return results.flat();
    },
    enabled: user?.role === "Student" && courseIds.length > 0,
  });

  const quizzes = quizzesByCourse;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Quizzes</h1>
        <p className="text-muted-foreground mt-1">
          Practice and test your knowledge
        </p>
      </div>

      {(isEnrollmentsLoading || isQuizzesLoading) && (
        <p className="text-muted-foreground">Loading quizzes...</p>
      )}

      {(isEnrollmentsError || isQuizzesError) && (
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load quizzes.</p>
          </CardContent>
        </Card>
      )}

      {!isEnrollmentsLoading &&
        !isQuizzesLoading &&
        !isEnrollmentsError &&
        !isQuizzesError && (
          <>
            {quizzes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quizzes.map((quiz) => (
                  <Card
                    key={quiz._id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                          <ClipboardList className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {quiz.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {quiz.questions?.length || 0} questions
                          </p>
                        </div>
                      </div>
                      <Badge variant="muted">Quiz</Badge>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <Button variant="gradient" className="w-full" asChild>
                        <Link to={`/dashboard/exam/${quiz._id}`}>
                          <Play className="w-4 h-4 mr-2" />
                          Start Quiz
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    No Quizzes Yet
                  </h3>
                  <p className="text-muted-foreground">
                    Enroll in a course to access quizzes.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
    </div>
  );
};

export default Quizzes;
