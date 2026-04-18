import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  BookOpen,
  DollarSign,
  Activity,
  TrendingUp,
  BarChart3,
  Calendar,
} from "lucide-react";
import api from "@/api/axios";
import { Skeleton } from "@/components/ui/skeleton";

const AdminOverview = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const response = await api.get("/admin/stats");
      return response.data;
    },
  });

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-4 gap-6"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers,
      sub: `${stats?.totalStudents} Students, ${stats?.totalInstructors} Instructors`,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Active Courses",
      value: stats?.totalCourses,
      sub: `${stats?.totalEnrollments} Total Enrollments`,
      icon: BookOpen,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      title: "Total Revenue",
      value: `$${stats?.totalRevenue?.toLocaleString()}`,
      sub: "From successful payments",
      icon: DollarSign,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "System Health",
      value: stats?.systemHealth?.status,
      sub: `Uptime: ${Math.floor(stats?.systemHealth?.uptime / 3600)}h`,
      icon: Activity,
      color: "text-warning",
      bg: "bg-warning/10",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Platform Overview</h1>
        <p className="text-muted-foreground mt-1">Global statistics and platform health metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-none shadow-md overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-success" />
                {stat.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              System Performance
            </CardTitle>
            <CardDescription>Real-time server and memory metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 border rounded-xl bg-muted/30">
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                 <span className="font-medium text-muted-foreground text-sm uppercase tracking-wider">Server Uptime</span>
               </div>
               <span className="font-mono font-bold">
                 {Math.floor(stats?.systemHealth?.uptime / 3600)}h{" "}
                 {Math.floor((stats?.systemHealth?.uptime % 3600) / 60)}m
               </span>
            </div>
            <div className="flex justify-between items-center p-4 border rounded-xl bg-muted/30">
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-blue-500" />
                 <span className="font-medium text-muted-foreground text-sm uppercase tracking-wider">Memory Usage</span>
               </div>
               <span className="font-mono font-bold">
                 {Math.round(stats?.systemHealth?.memoryUsage?.rss / 1024 / 1024)} MB
               </span>
            </div>
            <div className="flex justify-between items-center p-4 border rounded-xl bg-muted/30">
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-warning" />
                 <span className="font-medium text-muted-foreground text-sm uppercase tracking-wider">Active Threads</span>
               </div>
               <span className="font-mono font-bold">
                 {stats?.systemHealth?.activeThreads || 4}
               </span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Recent Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { label: "New Instructors", val: stats?.totalInstructors, desc: "Subject experts onboarded" },
              { label: "Course Listings", val: stats?.totalCourses, desc: "Quality educational content" },
              { label: "Total Students", val: stats?.totalStudents, desc: "Active learners on platform" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div>
                  <p className="font-bold text-foreground group-hover:text-primary transition-colors">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Badge variant="secondary" className="text-sm px-3 py-1 font-bold">
                  {item.val}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
