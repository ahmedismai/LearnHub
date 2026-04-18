import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, BookOpen, User, DollarSign } from "lucide-react";
import api from "@/api/axios";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const AdminCourses = () => {
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: async () => {
      const response = await api.get("/Course/list");
      return response.data;
    },
  });

  const updateCourseStatusMutation = useMutation({
    mutationFn: async ({ courseId, status }) => {
      return await api.patch(`/Course/${courseId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "courses"]);
      toast.success("Course status updated successfully");
    },
    onError: () => toast.error("Failed to update course status"),
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Course Approvals</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve new course submissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Submitted Courses
          </CardTitle>
          <CardDescription>
            {courses.filter((c) => c.status === "Pending").length} courses pending review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={course.thumbnail}
                        className="w-12 h-8 rounded object-cover border"
                        alt=""
                      />
                      <div>
                        <span className="font-bold block line-clamp-1">
                          {course.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {course.categoryId?.name || "General"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-muted-foreground" />
                      {course.instructorId?.name || course.instructorId?.username || "Unknown"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center font-bold text-primary">
                      <DollarSign className="w-3 h-3" />
                      {course.price}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        course.status === "Approved"
                          ? "success"
                          : course.status === "Rejected"
                            ? "destructive"
                            : "warning"
                      }
                    >
                      {course.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {course.status !== "Approved" && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() =>
                            updateCourseStatusMutation.mutate({
                              courseId: course._id,
                              status: "Approved",
                            })
                          }
                          className="h-8 gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </Button>
                      )}
                      {course.status !== "Rejected" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            updateCourseStatusMutation.mutate({
                              courseId: course._id,
                              status: "Rejected",
                            })
                          }
                          className="h-8 gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCourses;
