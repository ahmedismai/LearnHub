import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, User, BookOpen, Calendar, ExternalLink, Trash2 } from "lucide-react";
import api from "@/api/axios";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";

const InstructorCertificates = () => {
  const queryClient = useQueryClient();

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["instructor", "certificates"],
    queryFn: async () => {
      const response = await api.get("/api/Certificate/instructor");
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/Certificate/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["instructor", "certificates"]);
      toast.success("Certificate deleted successfully");
    },
    onError: (error) => {
      console.error("Delete Error:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Failed to delete certificate");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page__head">
        <div>
          <h1 className="page__title">Student Certificates</h1>
          <p className="page__subtitle">
            Monitor achievements and certificates earned by students in your courses.
          </p>
        </div>
      </div>

      <Card className="surface-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Earned Certificates
          </CardTitle>
          <CardDescription>
            {certificates.length} students have completed your courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="data-list">
            <div className="data-list__head grid-cols-[1.3fr,1.4fr,0.9fr,1fr]">
              <span>Student</span>
              <span>Course</span>
              <span>Issue Date</span>
              <span className="text-right">Actions</span>
            </div>
              {certificates.map((cert) => (
                <div key={cert._id} className="data-list__row grid-cols-[1.3fr,1.4fr,0.9fr,1fr]">
                  <div className="data-list__cell" data-label="Student">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 font-medium">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        {cert.studentId?.name || "Unknown"}
                      </div>
                      <span className="text-xs text-muted-foreground ml-5">
                        {cert.studentId?.email}
                      </span>
                    </div>
                  </div>
                  <div className="data-list__cell" data-label="Course">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{cert.courseId?.title || "Unknown Course"}</span>
                    </div>
                  </div>
                  <div className="data-list__cell" data-label="Issue Date">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {cert.issueDate ? format(new Date(cert.issueDate), "PPP") : "N/A"}
                    </div>
                  </div>
                  <div className="data-list__cell data-list__actions" data-label="Actions">
                    <div className="flex justify-end gap-2">
                      {cert.certificateUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="h-8 gap-1"
                        >
                          <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3.5 h-3.5" /> View
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this certificate? This action cannot be undone.")) {
                            deleteMutation.mutate(cert._id);
                          }
                        }}
                        className="h-8 gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {certificates.length === 0 && (
                <div className="empty-state text-muted-foreground">
                    No student certificates found for your courses yet.
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorCertificates;
