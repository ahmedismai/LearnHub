import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Award, Calendar, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Certificates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    data: certificates = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["certificates", "me"],
    queryFn: async () => {
      const response = await api.get("/certificates");
      return response.data;
    },
    enabled: user?.role === "Student",
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments", "me"],
    queryFn: async () => {
      const response = await api.get("/enrollments/me");
      return response.data;
    },
    enabled: user?.role === "Student",
  });

  const eligibleEnrollments = useMemo(() => {
    return enrollments.filter((e) => e.completed && e.courseId?._id);
  }, [enrollments]);

  const handleGenerate = async (courseId) => {
    setIsGenerating(true);
    try {
      await api.post("/certificates", { courseId });
      await queryClient.invalidateQueries({ queryKey: ["certificates", "me"] });
      toast({
        title: "Certificate generated",
        description: "Your certificate is now available.",
      });
    } catch (error) {
      toast({
        title: "Unable to generate certificate",
        description:
          error.response?.data?.message ||
          "Please ensure you've completed all lessons and quizzes.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (courseId) => {
    try {
      await api.get(`/certificates/download/${courseId}`);
      toast({
        title: "Certificate ready",
        description: "Certificate details loaded (PDF download can be added next).",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: error.response?.data?.message || "Certificate not available.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Certificates</h1>
        <p className="text-muted-foreground mt-1">
          Download and share your achievements
        </p>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading certificates...</p>}

      {isError && (
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load certificates.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <Card
              key={cert._id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-40 gradient-hero flex items-center justify-center">
                <Award className="w-20 h-20 text-primary-foreground/80" />
              </div>
              <CardContent className="p-6">
                <Badge variant="success" className="mb-3">
                  Verified Certificate
                </Badge>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {cert.courseId?.title || "Course"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  Awarded to {user?.name || "Student"}
                </p>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Issued on {new Date(cert.issuedAt || cert.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="gradient"
                    className="flex-1"
                    onClick={() => handleDownload(cert.courseId?._id)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              No Certificates Yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Complete a course to earn your first certificate
            </p>
            {eligibleEnrollments.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  You have completed courses. Generate your certificate:
                </p>
                <div className="flex flex-col gap-2 max-w-md mx-auto">
                  {eligibleEnrollments.slice(0, 3).map((e) => (
                    <Button
                      key={e._id}
                      variant="gradient"
                      onClick={() => handleGenerate(e.courseId._id)}
                      disabled={isGenerating}
                    >
                      Generate: {e.courseId.title}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <Button asChild>
                <a href="/dashboard/my-courses">View My Courses</a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Certificates;
