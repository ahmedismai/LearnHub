import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Award, Calendar, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Certificates = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    data: certificates = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["certificates", "me"],
    queryFn: async () => {
      const response = await api.get("/Certificate");
      return response.data;
    },
    enabled: !!user,
  });

  const handleDownload = (certificateUrl) => {
    if (!certificateUrl) {
      toast({
        title: "Download not available",
        description: "The certificate file is still being processed.",
        variant: "destructive",
      });
      return;
    }
    window.open(certificateUrl, "_blank");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Certificates</h1>
        <p className="text-muted-foreground mt-1">
          Your achievements are automatically generated and stored here
        </p>
      </div>

      {isLoading && (
        <p className="text-muted-foreground">Loading your certificates...</p>
      )}

      {isError && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6">
            <p className="text-destructive font-medium">Failed to load certificates. Please try again later.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <Card
              key={cert._id}
              className="overflow-hidden hover:shadow-lg transition-all border-2 hover:border-primary/20"
            >
              <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Award className="w-20 h-20 text-primary/40" />
              </div>
              <CardContent className="p-6">
                <Badge variant="success" className="mb-3">
                  Verified & Official
                </Badge>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {cert.courseId?.title || "Course Certificate"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  Awarded to {user?.name || "Learner"}
                </p>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Issued on{" "}
                    {new Date(
                      cert.issueDate || cert.createdAt,
                    ).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="gradient"
                    className="flex-1"
                    onClick={() => handleDownload(cert.certificateUrl)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => window.open(cert.certificateUrl, "_blank")}
                    title="View Online"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !isLoading && (
        <Card className="border-dashed">
          <CardContent className="p-16 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              No Certificates Yet
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Complete all lessons, quizzes, and assignments, and pass the final exam with at least 70% to receive your certificate automatically.
            </p>
            <Button asChild variant="outline">
              <a href="/dashboard/my-courses">Keep Learning</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Certificates;
