import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import examService from "@/api/exam";
import { ClipboardList, Play } from "lucide-react";
import { Link } from "react-router-dom";

const Quizzes = ({ isSubComponent = false }) => {
  const { user } = useAuth();
  const isInstructor = user?.role === "Instructor";

  const {
    data: quizzes = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["quizzes", user?.role],
    queryFn: async () => {
      const response = await examService.getAll();
      return response.data || response || [];
    },
    enabled: !!user,
  });

  return (
    <div
      className={`space-y-6 animate-fade-in ${!isSubComponent ? "max-w-7xl mx-auto p-6" : ""}`}
    >
      {isInstructor && !isSubComponent && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-center gap-3 mb-6">
          <ClipboardList className="text-amber-500 w-6 h-6" />
          <div>
            <p className="font-bold text-amber-800 uppercase text-xs">
              Instructor View
            </p>
            <p className="text-amber-700 text-sm">
              You are viewing all quizzes in your courses. Click to preview.
            </p>
          </div>
        </div>
      )}
      {!isSubComponent && (
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quizzes</h1>
          <p className="text-muted-foreground mt-1">
            {isInstructor
              ? "Monitor and preview your course quizzes"
              : "Practice and test your knowledge"}
          </p>
        </div>
      )}

      {isLoading && <p className="text-muted-foreground">Loading quizzes...</p>}

      {isError && (
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load quizzes.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (
        <>
          {quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((quiz) => (
                <Card
                  key={quiz.examId || quiz._id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Course: {quiz.courseName || quiz.courseId?.title}
                        </p>
                      </div>
                    </div>
                    <Badge variant="muted">Quiz</Badge>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <Button variant="gradient" className="w-full" asChild>
                      <Link to={`/dashboard/exam/${quiz.examId || quiz._id}`}>
                        <Play className="w-4 h-4 mr-2" />
                        {isInstructor ? "Preview Quiz" : "Start Quiz"}
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
                  No Quizzes Found
                </h3>
                <p className="text-muted-foreground">
                  {isInstructor
                    ? "You haven't created any quizzes for your courses yet."
                    : "Enroll in a course to access quizzes."}
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
