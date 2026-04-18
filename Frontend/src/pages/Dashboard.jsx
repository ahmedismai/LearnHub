import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import { BookOpen, GraduationCap, Layout, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { user } = useAuth();

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments", "me"],
    queryFn: async () => {
      const response = await api.get("/Enrollment/me");
      return response.data;
    },
    enabled: user?.role === "Student",
  });

  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ["dashboard", "stats", user?.role],
    queryFn: async () => {
      const endpoint = user?.role === "Instructor" ? "/Dashboard/InstructorDashboard" : "/Dashboard/StudentDashboard";
      const response = await api.get(endpoint);
      return response.data;
    },
    enabled: !!user,
  });

  const stats = user?.role === "Instructor" ? [
    {
      title: "Total Courses",
      value: dashboardStats?.totalCourses || 0,
      icon: BookOpen,
      color: "text-blue-500",
    },
    {
      title: "Total Students",
      value: dashboardStats?.totalEnrollments || 0,
      icon: Users,
      color: "text-green-500",
    },
    {
      title: "Pending Approval",
      value: dashboardStats?.pendingCourses || 0,
      icon: Clock,
      color: "text-warning",
    },
  ] : [
    {
      title: "Enrolled Courses",
      value: dashboardStats?.totalEnrollments || 0,
      icon: BookOpen,
      color: "text-blue-500",
    },
    {
      title: "Average Progress",
      value: Math.round(dashboardStats?.averageProgress || 0) + "%",
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      title: "Completed Courses",
      value: dashboardStats?.completedCourses || 0,
      icon: GraduationCap,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.name || user?.username}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {user?.role} • ID:{" "}
          {user?.studentId || user?.instructorId || user?.adminId || user?.id}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Layout className="w-5 h-5" />
          My Recent Progress
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrollments.length > 0 ? (
              enrollments.map((enrollment) => (
                <Card key={enrollment._id || enrollment.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">
                          {enrollment.courseId?.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {enrollment.courseId?.instructorId?.name}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {enrollment.progress}%
                      </span>
                    </div>
                    <Progress value={enrollment.progress} className="h-2" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="md:col-span-2">
                <CardContent className="p-12 text-center text-muted-foreground">
                  You haven't enrolled in any courses yet.
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
