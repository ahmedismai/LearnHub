import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, CheckCircle, Award, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const MyCourses = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // For students, show enrolled courses
  // For instructors, show their created courses
  const isStudent = user?.role === "Student";
  const isInstructor = user?.role === "Instructor";
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      if (isStudent) {
        const response = await api.get("/Enrollment/me");
        const enrollments = response.data.map((item) => ({
          id: item._id,
          progress: item.progress,
          status: item.completed ? "completed" : "active",
          courseId: item.courseId?._id || item.courseId,
          course: {
            id: item.courseId?._id,
            title: item.courseId?.title,
            thumbnail: item.courseId?.thumbnail,
            instructorName: item.courseId?.instructorId?.name || "Unknown",
          },
        }));
        setStudentEnrollments(enrollments);
      } else if (isInstructor) {
        const response = await api.get("/Course/mine");
        const courses = response.data.map((item) => ({
          id: item._id,
          title: item.title,
          thumbnail: item.thumbnail,
          category: item.categoryId,
          enrolledCount: item.enrolledCount || 0,
          price: item.price,
        }));
        setInstructorCourses(courses);
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
      toast({
        title: "Error",
        description: "Could not load your courses.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [isStudent, isInstructor]);

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/Course/${courseId}`);
      toast({
        title: "Success",
        description: "Course deleted successfully.",
      });
      fetchData();
    } catch (error) {
      console.error("Failed to delete course:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Could not delete course.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const enrolledCourses = studentEnrollments.filter((e) => e.course);

  const getProgressColor = (progress) => {
    if (progress > 80) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
          <p className="text-muted-foreground mt-1">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {enrolledCourses.map((enrollment) => (
            <Card
              key={enrollment.id}
              className="overflow-hidden hover:shadow-2xl transition-all duration-500 border-none bg-white group"
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={enrollment.course?.thumbnail}
                  alt={enrollment.course?.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
                <Badge
                  className={`absolute top-4 right-4 shadow-sm border-none backdrop-blur-sm ${
                    enrollment.status === "completed" 
                      ? "bg-green-500/90 text-white" 
                      : "bg-white/90 text-slate-900"
                  }`}
                >
                  {enrollment.status === "completed" ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </>
                  ) : (
                    "In Progress"
                  )}
                </Badge>
              </div>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                  {enrollment.course?.title}
                </h3>
                <p className="text-sm font-medium text-slate-500 mb-6 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                   {enrollment.course?.instructorName}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                    <span>Progress</span>
                    <span className="text-primary">{enrollment.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out rounded-full ${getProgressColor(enrollment.progress)}`}
                      style={{ width: `${enrollment.progress}%` }}
                    />
                  </div>
                </div>

                <Button
                  className={`w-full mt-6 rounded-full py-6 font-bold transition-all ${
                    enrollment.status === "completed" 
                      ? "hover:bg-primary hover:text-white" 
                      : "shadow-glow hover:shadow-none"
                  }`}
                  variant={
                    enrollment.status === "completed" ? "outline" : "default"
                  }
                  asChild
                >
                  <Link
                    to={`/dashboard/courses/${enrollment.courseId}`}
                    className="flex items-center justify-center gap-2"
                  >
                    <Play className={`w-4 h-4 ${enrollment.status !== "completed" ? "fill-current" : ""}`} />
                    {enrollment.status === "completed"
                      ? "Review Course"
                      : "Continue Learning"}
                  </Link>
                </Button>

                {enrollment.status === "completed" && (
                  <Button
                    className="w-full mt-3 rounded-full py-6 font-bold bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-100 border-none text-white"
                    asChild
                  >
                    <Link
                      to="/dashboard/certificates"
                      className="flex items-center justify-center gap-2"
                    >
                      <Award className="w-4 h-4" />
                      Claim Certificate
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          {enrolledCourses.length === 0 && (
            <div className="col-span-full text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">
                You haven't enrolled in any courses yet
              </p>
              <Button asChild>
                <Link to="/courses">Browse Courses</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {isInstructor && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instructorCourses.map((course) => (
            <Card
              key={course.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-40 object-cover"
                />

                <Badge className="absolute top-3 right-3" variant="secondary">
                  {course.category?.name || "General"}
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

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link to={`/dashboard/edit-course/${course.id}`}>Edit</Link>
                  </Button>

                  <Button variant="ghost" className="flex-1" asChild>
                    <Link to={`/dashboard/courses/${course.id}`}>View</Link>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteCourse(course.id)}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
