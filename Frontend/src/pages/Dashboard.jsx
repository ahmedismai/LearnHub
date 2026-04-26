import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import {
  BookOpen,
  GraduationCap,
  Layout,
  TrendingUp,
  Clock,
  Sparkles,
  BrainCircuit,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { user } = useAuth();

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["enrollments", "me"],
    queryFn: async () => {
      const response = await api.get("/Enrollment/me");
      return response.data;
    },
    enabled: user?.role === "Student",
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard", "stats", "student"],
    queryFn: async () => {
      const response = await api.get("/Dashboard/StudentDashboard");
      return response.data;
    },
    enabled: !!user,
  });

  const statCards = [
    {
      title: "Enrolled Courses",
      value: stats?.totalEnrollments || 0,
      icon: BookOpen,
      color: "text-blue-500",
    },
    {
      title: "Average Progress",
      value: Math.round(stats?.averageProgress || 0) + "%",
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      title: "Completed Courses",
      value: stats?.completedCourses || 0,
      icon: GraduationCap,
      color: "text-purple-500",
    },
  ];

  const getProgressColor = (progress) => {
    if (progress > 80) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Welcome back, {user?.name || user?.username}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Student • Ready to continue your learning journey?
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/5 shadow-sm"
          >
            <Link to="/dashboard/quizzes" className="flex items-center gap-2 font-bold">
               <Sparkles className="w-4 h-4" /> AI Study Center
            </Link>
          </Button>
          <Button
            asChild
            variant="gradient"
            className="shadow-lg shadow-primary/20"
          >
            <Link to="/courses">Browse More Courses</Link>
          </Button>
        </div>
      </div>

      {/* AI Hub Highlight */}
      <Card className="bg-gradient-to-r from-primary/10 via-background to-primary/5 border-primary/20 shadow-lg overflow-hidden relative group">
        <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
           <BrainCircuit className="w-32 h-32 text-primary" />
        </div>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20">
               <Sparkles className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
               <h2 className="text-2xl font-black tracking-tight">AI Smart Practice Hub</h2>
               <p className="text-muted-foreground max-w-lg">
                  Boost your grades with our AI. Generate personalized quizzes and assignments based on your actual course videos and progress.
               </p>
            </div>
            <Button asChild size="lg" className="h-14 px-8 text-lg font-black group-hover:translate-x-1 transition-transform">
               <Link to="/dashboard/quizzes">
                 Launch AI Center <ArrowRight className="ml-2 w-5 h-5" />
               </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <Card
            key={i}
            className="hover:shadow-md transition-all duration-300 border-none shadow-sm"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                <div className="text-3xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" />
            Recently Accessed
          </h2>
          <Link
            to="/dashboard/my-courses"
            className="text-sm font-medium text-primary hover:underline"
          >
            View All My Courses
          </Link>
        </div>

        {enrollmentsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrollments.length > 0 ? (
              enrollments.slice(0, 4).map((enrollment) => (
                <Card
                  key={enrollment._id}
                  className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow group"
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">
                          {enrollment.courseId?.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {enrollment.courseId?.instructorId?.name}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Last accessed today
                          </span>
                        </div>
                      </div>
                      <Badge
                        className={`h-6 ${
                          enrollment.progress > 80 
                            ? "bg-green-500" 
                            : enrollment.progress >= 50 
                            ? "bg-yellow-500" 
                            : "bg-blue-500"
                        }`}
                      >
                        {enrollment.progress === 100 ? "Done" : "Active"}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground">
                        <span>Course Progress</span>
                        <span className="text-primary">
                          {enrollment.progress}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${getProgressColor(enrollment.progress)}`}
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                    </div>
                    <Button asChild className="w-full mt-6" variant="outline">
                      <Link
                        to={`/dashboard/courses/${enrollment.courseId?._id}`}
                      >
                        Continue Learning
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="md:col-span-2 border-2 border-dashed bg-transparent">
                <CardContent className="p-16 text-center space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground">
                      No active enrollments
                    </h3>
                    <p className="text-muted-foreground max-w-xs mx-auto">
                      Start your learning journey by exploring our wide range of
                      expert-led courses.
                    </p>
                  </div>
                  <Button asChild className="mt-4">
                    <Link to="/courses">Explore Courses</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
