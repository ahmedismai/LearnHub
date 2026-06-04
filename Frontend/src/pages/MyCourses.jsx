import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import enrollmentService from "@/api/enrollment";
import courseService from "@/api/course";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle, Award, Trash2, Loader2, BookOpen } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getFullUrl } from "@/lib/urlHelper";

const unwrapList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  return [];
};

const MyCourses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isStudent = user?.role === "Student";
  const isInstructor = user?.role === "Instructor";

  // Fetch student dashboard data
  const { data: studentDashboard, isLoading: isStudentLoading } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: async () => {
      const response = await api.get("/api/Dashboard/StudentDashboard");
      return response.data;
    },
    enabled: isStudent,
  });

  // Fetch student enrollments to get enrollmentIds (which are missing in dashboard)
  const { data: enrollmentsResponse, isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ["enrollments", "me"],
    queryFn: () => enrollmentService.getByStudent(user.id),
    enabled: isStudent,
  });
  const enrollments = unwrapList(enrollmentsResponse);

  // Fetch instructor courses
  const { data: instructorCoursesData, isLoading: isInstructorLoading } = useQuery({
    queryKey: ["instructor-courses"],
    queryFn: () => courseService.getMyCourses(),
    enabled: isInstructor,
  });

  // Unenroll Mutation
  const unenrollMutation = useMutation({
    mutationFn: enrollmentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(["student-dashboard"]);
      queryClient.invalidateQueries(["enrollments", "me"]);
      toast({ title: "Unenrolled successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to unenroll",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return;
    }

    try {
      await courseService.delete(courseId);
      toast({
        title: "Success",
        description: "Course deleted successfully.",
      });
      queryClient.invalidateQueries(["instructor-courses"]);
    } catch (error) {
      console.error("Failed to delete course:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Could not delete course.",
        variant: "destructive",
      });
    }
  };

  const getProgressColor = (progress) => {
    if (progress > 80) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-blue-500";
  };

  if (isStudentLoading || isInstructorLoading || isEnrollmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const dashboardCourses = studentDashboard?.data?.myCourses || studentDashboard?.myCourses || [];
  const studentCoursesSource = dashboardCourses.length > 0 ? dashboardCourses : enrollments;

  const studentCourses = studentCoursesSource.map((item) => {
    const courseId =
      item.courseId || item.course?.courseId || item.course?.id || item.id;
    const enrollment = enrollments.find((e) => {
      const enrollmentCourseId =
        e.courseId || e.course?.courseId || e.course?.id || e.id;
      return String(enrollmentCourseId) === String(courseId);
    });
    const progress =
      item.progress?.progressPercentage ??
      item.progressPercentage ??
      item.progress ??
      enrollment?.progress ??
      enrollment?.progressPercentage ??
      0;

    return {
      id: courseId,
      enrollmentId: item.enrollmentId || enrollment?.enrollmentId || enrollment?.id,
      progress,
      status: progress >= 100 ? "completed" : "active",
      courseId,
      title: item.title || item.courseTitle || item.course?.title || "Untitled Course",
      thumbnail: item.image || item.imgPath || item.course?.image || item.course?.imgPath,
      instructorName:
        item.instructorName ||
        item.course?.instructorName ||
        enrollment?.instructorName ||
        enrollment?.course?.instructorName ||
        "Unknown",
      enrolledAt: item.enrolledAt || item.enrollmentDate || enrollment?.enrolledAt || enrollment?.enrollmentDate,
    };
  });

  const instructorCourses = (instructorCoursesData?.data || []).map((item) => ({
    id: item.courseId,
    title: item.title,
    thumbnail: item.imgPath,
    categoryName: item.categoryName,
    price: item.price,
    enrolledCount: item.enrolledCount || 0
  }));

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="page__head">
        <div>
          <h1 className="page__title">
            {isStudent ? "My Learning Journey" : "Manage My Courses"}
          </h1>
          <p className="page__subtitle">
            {isStudent 
              ? "Continue your learning journey" 
              : "Manage your course catalog"}
          </p>
        </div>
        {isInstructor && (
          <Button asChild>
            <Link to="/dashboard/create-course">Create New Course</Link>
          </Button>
        )}
      </div>

      {isStudent && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {studentCourses.map((course) => (
            <Card key={course.courseId} className="group overflow-hidden">
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={getFullUrl(course.thumbnail)}
                  alt={course.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
                <Badge
                  className={`absolute top-4 right-4 shadow-sm border-none backdrop-blur-sm ${
                    course.status === "completed" 
                      ? "bg-green-500/90 text-white" 
                      : "bg-white/90 text-slate-900"
                  }`}
                >
                  {course.status === "completed" ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </>
                  ) : (
                    "In Progress"
                  )}
                </Badge>
                {course.enrollmentId && (
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute bottom-4 right-4 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to unenroll from this course? Your progress will be lost.")) {
                        unenrollMutation.mutate(course.enrollmentId);
                      }
                    }}
                    disabled={unenrollMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <CardContent className="p-6">
                <h3 className="mb-2 line-clamp-1 text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                  {course.title}
                </h3>
                <p className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                   <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                   {course.instructorName}
                </p>
                {course.enrolledAt && (
                  <p className="mb-4 text-xs text-muted-foreground">
                    Enrolled: {new Date(course.enrolledAt).toLocaleDateString()}
                  </p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Progress</span>
                    <span className="text-primary">{course.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out rounded-full ${getProgressColor(course.progress)}`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                <Button
                  className={`mt-6 w-full py-6 font-bold transition-all ${
                    course.status === "completed" 
                      ? "hover:bg-primary hover:text-white" 
                      : "shadow-glow hover:shadow-none"
                  }`}
                  variant={
                    course.status === "completed" ? "outline" : "default"
                  }
                  asChild
                >
                  <Link
                    to={`/dashboard/courses/${course.courseId}`}
                    className="flex items-center justify-center gap-2"
                  >
                    <Play className={`w-4 h-4 ${course.status !== "completed" ? "fill-current" : ""}`} />
                    {course.status === "completed"
                      ? "Review Course"
                      : "Continue Learning"}
                  </Link>
                </Button>

                {/* Removed Claim Certificate button - Backend not implemented */}
              </CardContent>
            </Card>
          ))}
          {studentCourses.length === 0 && (
            <div className="empty-state col-span-full">
               <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
               </div>
               <div>
                  <h3 className="text-xl font-bold">No courses yet</h3>
                  <p className="text-muted-foreground">Start your learning journey today!</p>
               </div>
               <Button asChild>
                  <Link to="/courses">Browse Catalog</Link>
               </Button>
            </div>
          )}
        </div>
      )}

      {isInstructor && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {instructorCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden transition-shadow hover:shadow-lg">
              <div className="relative">
                <img
                  src={getFullUrl(course.thumbnail)}
                  alt={course.title}
                  className="w-full h-40 object-cover"
                />
                <Badge className="absolute top-3 right-3" variant="secondary">
                  {course.categoryName || "General"}
                </Badge>
              </div>
              <CardContent className="p-5">
                <h3 className="font-bold text-foreground mb-2 line-clamp-2 h-12">
                  {course.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span>{course.enrolledCount} students</span>
                  <span>${course.price}</span>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                  <Button variant="outline" className="h-9 flex-1" asChild>
                    <Link to={`/dashboard/create-course?edit=${course.id}`}>Edit</Link>
                  </Button>
                  <Button variant="outline" className="h-9 flex-1" asChild>
                    <Link to={`/dashboard/student-results/${course.id}`}>Results</Link>
                  </Button>
                  <Button variant="ghost" className="h-9 flex-1" asChild>
                    <Link to={`/dashboard/courses/${course.id}`}>View</Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteCourse(course.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {instructorCourses.length === 0 && (
            <div className="empty-state col-span-full">
               <p className="text-muted-foreground mb-4">You haven't created any courses yet.</p>
               <Button asChild>
                  <Link to="/dashboard/create-course">Create Your First Course</Link>
               </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
