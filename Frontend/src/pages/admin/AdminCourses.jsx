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
import { CheckCircle2, XCircle, Trash2, Plus, Eye, BookOpen, Layers, Search, Filter } from "lucide-react";
import courseService from "@/api/course";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { getFullUrl } from "@/lib/urlHelper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

const AdminCourses = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
  const [pageNumber, setPageNumber] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const pageSize = 10;

  const {
    data: pendingResponse,
    isLoading: isPendingLoading,
    isError: isPendingError,
    error: pendingError,
  } = useQuery({
    queryKey: ["admin", "courses", "pending"],
    queryFn: () => courseService.getPending(),
    retry: false,
  });

  const { data: allResponse, isLoading: isAllLoading } = useQuery({
    queryKey: ["admin", "courses", "all", pageNumber],
    queryFn: () => courseService.getAll({ pageNumber, pageSize }),
  });

  const pendingCourses =
    pendingResponse?.data?.data ||
    pendingResponse?.data ||
    (Array.isArray(pendingResponse) ? pendingResponse : []);
  
  const allData = allResponse?.data || allResponse || {};
  const allCourses = allData.data || (Array.isArray(allData) ? allData : []);
  const totalPages = allData.totalPages || 1;

  const updateCourseStatusMutation = useMutation({
    mutationFn: async ({ courseId, status }) => {
      return await courseService.approve(courseId, {
        isApproved: status === "Approved",
        rejectionReason:
          status === "Approved"
            ? ""
            : "Course content does not meet guidelines",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "courses"]);
      toast.success("Course status updated successfully");
    },
    onError: () => toast.error("Failed to update course status"),
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (courseId) => courseService.delete(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "courses"]);
      toast.success("Course deleted successfully");
    },
    onError: () => toast.error("Failed to delete course"),
  });

  const isNoPendingError =
    isPendingError && pendingError.response?.status === 400;

  if (isPendingLoading || isAllLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const CourseTable = ({ courses, isPendingView }) => {
    const filtered = courses.filter(c => 
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.instructorName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="data-list">
        <div className="data-list__head grid-cols-[1.7fr,1fr,0.6fr,0.8fr,1fr]">
          <span>Course Info</span>
          <span>Instructor</span>
          <span>Price</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
          {filtered.map((course) => (
            <div key={course.courseId || course.id} className="data-list__row grid-cols-[1.7fr,1fr,0.6fr,0.8fr,1fr] group">
              <div className="data-list__cell" data-label="Course Info">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-16 rounded-lg border border-border/40 shadow-sm overflow-hidden flex-shrink-0">
                    <AvatarImage 
                      src={getFullUrl(course.imagePath || course.imgPath)} 
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/5 text-primary rounded-none">
                      <BookOpen className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex flex-col">
                    <span className="font-bold text-foreground font-outfit text-base truncate max-w-[250px] group-hover:text-primary transition-colors">
                      {course.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
                      {course.categoryName || "Uncategorized"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="data-list__cell" data-label="Instructor">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {course.instructorName?.[0] || "I"}
                  </div>
                  <span className="text-sm font-medium">{course.instructorName || "Unknown"}</span>
                </div>
              </div>
              <div className="data-list__cell" data-label="Price">
                <span className="font-bold text-primary font-outfit">${course.price}</span>
              </div>
              <div className="data-list__cell" data-label="Status">
                <Badge 
                  variant={course.isApproved ? "success" : "warning"}
                  className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-tight"
                >
                  {course.isApproved ? "Approved" : "Pending"}
                </Badge>
              </div>
              <div className="data-list__cell data-list__actions" data-label="Actions">
                <div className="flex justify-end gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  {isPendingView ? (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-green-100 hover:text-green-700 transition-colors"
                        onClick={() =>
                          updateCourseStatusMutation.mutate({
                            courseId: course.courseId || course.id,
                            status: "Approved",
                          })
                        }
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors"
                        onClick={() =>
                          updateCourseStatusMutation.mutate({
                            courseId: course.courseId || course.id,
                            status: "Rejected",
                          })
                        }
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-9 w-9 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() =>
                        navigate(
                          `/dashboard/courses/${course.courseId || course.id}`,
                        )
                      }
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this course?")) {
                        deleteCourseMutation.mutate(course.courseId || course.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
                 <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-slate-50 text-slate-300">
                      <BookOpen className="w-10 h-10" />
                    </div>
                    <p className="text-muted-foreground font-medium italic">No courses found matching your criteria.</p>
                 </div>
            </div>
          )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page__head">
        <div>
          <h1 className="page__title">Course Management</h1>
          <p className="page__subtitle">
            Review, curate, and maintain the platform's educational catalog
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search catalog..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => navigate("/dashboard/create-course")} className="shadow-accent-glow">
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="pending"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <div className="ptabs mb-4 max-w-md">
          <TabsList className="grid h-10 w-full grid-cols-2 bg-transparent">
            <TabsTrigger 
              value="pending" 
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              Approval Queue
              {pendingCourses.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-none py-0 px-1.5 h-4 text-[10px]">
                  {pendingCourses.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="all" 
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              Platform Catalog
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <Card className="surface-glass overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-background/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10 text-warning">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="font-outfit text-xl font-bold">Pending Review</CardTitle>
                  <CardDescription>Courses awaiting administrative clearance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isNoPendingError ? (
                <div className="empty-state">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="font-medium italic">Great! All courses have been reviewed.</p>
                </div>
              ) : (
                <CourseTable courses={pendingCourses} isPendingView={true} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <Card className="surface-glass overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-background/50 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="font-outfit text-xl font-bold">Catalog Browser</CardTitle>
                    <CardDescription>Complete listing of all published content</CardDescription>
                  </div>
                </div>
                <div className="text-xs font-bold text-muted-foreground px-3 py-1.5 rounded-full border border-border/40 bg-white shadow-sm">
                  Total <span className="text-primary">{allData.totalItems || allCourses.length}</span> Courses
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <CourseTable courses={allCourses} isPendingView={false} />
              
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-6 bg-slate-50/30 border-t border-border/40">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber(prev => prev - 1)}
                    className="h-9 px-4 rounded-lg"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1.5 mx-4">
                    {[...Array(totalPages)].map((_, i) => (
                      <Button
                        key={i + 1}
                        variant={pageNumber === i + 1 ? "primary" : "ghost"}
                        className={`w-9 h-9 p-0 rounded-lg transition-all duration-200 ${
                          pageNumber === i + 1 ? "shadow-md scale-105" : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                        }`}
                        onClick={() => setPageNumber(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    disabled={pageNumber >= totalPages}
                    onClick={() => setPageNumber(prev => prev + 1)}
                    className="h-9 px-4 rounded-lg"
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCourses;
