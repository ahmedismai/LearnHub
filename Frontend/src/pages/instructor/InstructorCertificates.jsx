import { useQuery } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Award, User, BookOpen, Calendar, ExternalLink } from "lucide-react";
import api from "@/api/axios";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const InstructorCertificates = () => {
  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["instructor", "certificates"],
    queryFn: async () => {
      const response = await api.get("/Certificate/instructor");
      return response.data;
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Student Certificates</h1>
        <p className="text-muted-foreground mt-1">
          Monitor achievements and certificates earned by students in your courses
        </p>
      </div>

      <Card>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.map((cert) => (
                <TableRow key={cert._id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 font-medium">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        {cert.studentId?.name || "Unknown"}
                      </div>
                      <span className="text-xs text-muted-foreground ml-5">
                        {cert.studentId?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{cert.courseId?.title || "Unknown Course"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {cert.issueDate ? format(new Date(cert.issueDate), "PPP") : "N/A"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {certificates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    No student certificates found for your courses yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorCertificates;
