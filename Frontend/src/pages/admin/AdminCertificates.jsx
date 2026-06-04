import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Trash2, User, BookOpen, Calendar, ExternalLink, Search, Download } from "lucide-react";
import api from "@/api/axios";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const AdminCertificates = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["admin", "certificates"],
    queryFn: async () => {
      const response = await api.get("/api/Certificate/all");
      return response.data;
    },
  });

  const filteredCertificates = certificates.filter(cert => 
    cert.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.courseId?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteCertificateMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/api/Certificate/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "certificates"]);
      toast.success("Certificate deleted successfully");
    },
    onError: () => toast.error("Failed to delete certificate"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page__head">
        <div>
          <h1 className="page__title">Certificates Management</h1>
          <p className="page__subtitle">
            Monitor and manage all academic credentials issued to students
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by student or course..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card className="surface-glass overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-background/50 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="font-outfit text-xl">Issued Certificates</CardTitle>
                <CardDescription>Verified academic records</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="font-bold">
              {filteredCertificates.length} Total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="data-list">
            <div className="data-list__head grid-cols-[1.3fr,1.4fr,0.9fr,1fr]">
              <span>Student</span>
              <span>Course</span>
              <span>Issue Date</span>
              <span className="text-right">Actions</span>
            </div>
              {filteredCertificates.map((cert) => (
                <div key={cert._id} className="data-list__row grid-cols-[1.3fr,1.4fr,0.9fr,1fr] group">
                  <div className="data-list__cell" data-label="Student">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-white shadow-sm">
                        <AvatarImage src={cert.studentId?.profileImage} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {cert.studentId?.name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{cert.studentId?.name || "Unknown"}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {cert.studentId?.email}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="data-list__cell" data-label="Course">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-accent/10 text-accent">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium text-sm text-foreground line-clamp-1">{cert.courseId?.title || "Unknown Course"}</span>
                    </div>
                  </div>
                  <div className="data-list__cell" data-label="Issue Date">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                      <Calendar className="w-3.5 h-3.5 text-primary/60" />
                      {cert.issueDate ? format(new Date(cert.issueDate), "MMM dd, yyyy") : "N/A"}
                    </div>
                  </div>
                  <div className="data-list__cell data-list__actions" data-label="Actions">
                    <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      {cert.certificateUrl && (
                        <Button
                          size="sm"
                          variant="secondary"
                          asChild
                          className="h-9 gap-2 rounded-lg"
                        >
                          <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3.5 h-3.5" /> View
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this certificate?")) {
                            deleteCertificateMutation.mutate(cert._id);
                          }
                        }}
                        className="h-9 w-9 p-0 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredCertificates.length === 0 && (
                <div className="empty-state">
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-full bg-muted p-4 text-muted-foreground">
                        <Award className="w-10 h-10" />
                      </div>
                      <p className="text-muted-foreground font-medium italic">No certificates found matching your search.</p>
                      <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>Clear Search</Button>
                    </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCertificates;
