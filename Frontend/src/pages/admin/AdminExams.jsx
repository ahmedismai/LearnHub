import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Eye, Edit3, Calendar, Clock } from "lucide-react";
import examService from "@/api/exam";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const AdminExams = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: examsResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "exams"],
    queryFn: () => examService.getAll(),
  });

  const exams = Array.isArray(examsResponse?.data)
    ? examsResponse.data
    : Array.isArray(examsResponse)
    ? examsResponse
    : [];

  const deleteExamMutation = useMutation({
    mutationFn: (examId) => examService.delete(examId),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "exams"]);
      toast.success("Exam deleted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete exam");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="page__head">
        <div>
          <h1 className="page__title">Exam Management</h1>
          <p className="page__subtitle">
            View, edit, and manage all exams across the platform
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/create-exam")}>
          <Plus className="w-4 h-4 mr-2" />
          Create Exam
        </Button>
      </div>

      <Card className="surface-glass">
        <CardHeader>
          <CardTitle>All Exams</CardTitle>
          <CardDescription>
            A comprehensive list of all exams created by instructors
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="data-list">
            <div className="data-list__head grid-cols-[1.4fr,1.2fr,0.9fr,0.8fr,0.6fr,1fr]">
              <span>Exam Title</span>
              <span>Course</span>
              <span>Date</span>
              <span>Duration</span>
              <span>Marks</span>
              <span className="text-right">Actions</span>
            </div>
              {exams.map((exam) => (
                <div
                  key={exam.examId || exam.id}
                  className="data-list__row grid-cols-[1.4fr,1.2fr,0.9fr,0.8fr,0.6fr,1fr]"
                >
                  <div className="data-list__cell font-medium" data-label="Exam Title">
                    {exam.title}
                  </div>
                  <div className="data-list__cell" data-label="Course">
                    {exam.courseTitle || `ID: ${exam.courseId}`}
                  </div>
                  <div className="data-list__cell" data-label="Date">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {exam.examDate ? new Date(exam.examDate).toLocaleDateString() : "N/A"}
                    </div>
                  </div>
                  <div className="data-list__cell" data-label="Duration">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {exam.durationInMinutes || exam.duration || 0} mins
                    </div>
                  </div>
                  <div className="data-list__cell" data-label="Marks">{exam.totalMarks || 0}</div>
                  <div className="data-list__cell data-list__actions" data-label="Actions">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() =>
                        navigate(`/dashboard/exam/${exam.examId || exam.id}?type=exam`, {
                            state: { previewMode: true }
                        })
                      }
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() =>
                        navigate(`/dashboard/edit-exam/${exam.examId || exam.id}`)
                      }
                    >
                      <Edit3 className="w-4 h-4 text-amber-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive h-8 w-8 p-0"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this exam?")) {
                          deleteExamMutation.mutate(exam.examId || exam.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {exams.length === 0 && (
                <div className="empty-state text-muted-foreground italic">
                    No exams found.
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminExams;
