import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import examService from "@/api/exam";
import {
  GraduationCap,
  Timer,
  BookOpen,
  Play,
  Trash2,
  Search,
  Edit3,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const unwrapArray = (value) => {
  const data = value?.data?.data || value?.data || value;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const Exams = ({ isSubComponent = false }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isInstructor = user?.role === "Instructor";
  const isAdmin = user?.role === "Administrator";

  const [searchTerm, setSearchTerm] = useState("");

  const { data: fetchedExams = [], isLoading } = useQuery({
    queryKey: ["exams", user?.role, user?.id],

    queryFn: async () => {
      try {
        // ================= STUDENT =================
        if (user?.role === "Student") {
          const response = await api.get("/api/Dashboard/StudentDashboard");
          const dashboardData = response.data?.data || response.data;

          const availableExams = Array.isArray(dashboardData?.availableExams)
            ? dashboardData.availableExams
            : [];
          
          const submittedExams = Array.isArray(dashboardData?.submittedExams)
            ? dashboardData.submittedExams
            : [];

          const submittedExamIds = new Set(
            submittedExams.map((s) => s.examId || s.id)
          );

          return availableExams.map((exam) => {
            const examId = exam.examId || exam.id;
            const now = new Date();
            const endDate = exam.endDate ? new Date(exam.endDate) : null;
            const isExpired = endDate ? now > endDate : false;
            const isSubmitted = submittedExamIds.has(examId);

            return {
              ...exam,
              examId,
              isExpired,
              isSubmitted,
            };
          });
        }

        // ================= INSTRUCTOR =================
        if (user?.role === "Instructor") {
          const coursesResponse = await api.get("/api/Course/MyCourses");

          const courses = Array.isArray(coursesResponse.data?.data)
            ? coursesResponse.data.data
            : Array.isArray(coursesResponse.data)
              ? coursesResponse.data
              : [];

          const examsPromises = courses.map(async (course) => {
            try {
              const exams = await examService.getByCourse(
                course.courseId || course.id || course._id,
              );
              const courseExams = unwrapArray(exams);

              return courseExams.map((exam) => ({
                ...exam,
                examId: exam.examId || exam.id,
                courseTitle: course.title,
                courseId: course.courseId || course._id,
              }));
            } catch (err) {
              console.error(err);
              return [];
            }
          });

          const allExams = await Promise.all(examsPromises);

          return allExams.flat();
        }

        // ================= ADMIN =================
        const response = await examService.getAll();

        const exams = unwrapArray(response);

        return exams.map((exam) => ({
          ...exam,
          examId: exam.examId || exam.id,
        }));
      } catch (error) {
        console.error("Fetch Exams Error:", error);

        return [];
      }
    },

    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: examService.delete,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["exams"],
      });

      toast({
        title: "Exam deleted successfully",
      });
    },

    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.response?.data?.message || "Could not delete exam",
        variant: "destructive",
      });
    },
  });

  const exams = fetchedExams.filter(
    (exam) =>
      exam.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(exam.examId).includes(searchTerm) ||
      exam.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading)
    return (
      <div className="grid grid-cols-1 gap-4 p-2 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );

  return (
    <div
      className={`space-y-6 animate-fade-in ${
        !isSubComponent ? "max-w-7xl mx-auto p-6" : ""
      }`}
    >
      {(isInstructor || isAdmin) && !isSubComponent && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-center gap-3 mb-6">
          <GraduationCap className="text-amber-500 w-6 h-6" />

          <div>
            <p className="font-bold text-amber-800 uppercase text-xs">
              Management View
            </p>

            <p className="text-amber-700 text-sm">You are viewing all exams.</p>
          </div>
        </div>
      )}

      {!isSubComponent && (
        <div className="page__head">
          <div>
            <h1 className="page__title">
              Final Exams
            </h1>

            <p className="page__subtitle">
              {isInstructor
                ? "Monitor and preview your exams"
                : "Complete your assessments"}
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

            <Input
              placeholder="Search exams..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="col gap-4">
        {exams.length > 0 ? (
          exams.map((exam) => {
            const isLocked =
              user?.role === "Student" && (exam.isSubmitted || exam.isExpired);
            const statusClass = exam.isSubmitted
              ? "due-pill--done"
              : exam.isExpired
                ? "due-pill--late"
                : "due-pill--ok";

            return (
              <div key={exam.examId} className="asmt-card">
                <div className="asmt-card__icon asmt-card__icon--exam">
                  <GraduationCap className="h-6 w-6" />
                </div>

                <div className="asmt-card__body">
                  <div className="row mb-2 flex-wrap gap-2">
                    <Badge variant="secondary" className="uppercase tracking-[0.08em]">
                      Final Exam
                    </Badge>
                    <Badge variant="outline">ID: {exam.examId}</Badge>
                    <span className={`due-pill ${statusClass}`}>
                      {exam.isSubmitted
                        ? "Completed"
                        : exam.isExpired
                          ? "Expired"
                          : "Available"}
                    </span>
                  </div>

                  <h3 className="m-0 text-[17px] font-bold leading-snug">
                    {exam.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {exam.description || "Course Final Assessment"}
                  </p>

                  <div className="asmt-card__meta">
                    <span>
                      <Timer className="h-3.5 w-3.5" />
                      <strong>{exam.durationInMinutes || exam.duration || 0}</strong> min
                    </span>
                    <span>
                      <Calendar className="h-3.5 w-3.5" />
                      {exam.examDate
                        ? new Date(exam.examDate).toLocaleDateString()
                        : "N/A"}
                    </span>
                    <span>
                      <BookOpen className="h-3.5 w-3.5" />
                      <strong>{exam.courseTitle || `Course ID: ${exam.courseId}`}</strong>
                    </span>
                  </div>
                </div>

                <div className="col min-w-[140px] gap-2">
                  {isLocked ? (
                    <Button className="w-full" variant="secondary" disabled>
                      {exam.isSubmitted ? "Completed" : "Exam Expired"}
                    </Button>
                  ) : (
                    <Button asChild className="w-full">
                      <Link
                        to={`/dashboard/exam/${exam.examId}?type=exam`}
                        state={{
                          previewMode: isInstructor || isAdmin,
                        }}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        {isInstructor ? "Preview" : "Start Exam"}
                      </Link>
                    </Button>
                  )}

                  {(isInstructor || isAdmin) && (
                    <div className="row gap-2">
                      <Button
                        asChild
                        variant="outline"
                        className="h-10 flex-1 p-0"
                        aria-label="Edit exam"
                      >
                        <Link to={`/dashboard/edit-exam/${exam.examId}`}>
                          <Edit3 className="h-4 w-4" />
                        </Link>
                      </Button>

                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-10 flex-1"
                        onClick={() => {
                          if (window.confirm("Delete this exam?")) {
                            deleteMutation.mutate(exam.examId);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        aria-label="Delete exam"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">
              <GraduationCap className="h-8 w-8" />
            </div>

            <h3 className="mb-2 mt-5 text-xl font-bold">No Exams Found</h3>

            <p className="text-muted-foreground">No exams available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Exams;
