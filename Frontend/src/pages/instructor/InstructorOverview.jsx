import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Users,
  Clock,
  TrendingUp,
  PlusCircle,
  FileText,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const InstructorOverview = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["instructor", "stats"],
    queryFn: async () => {
      const response = await api.get("/Dashboard/InstructorDashboard");
      return response.data;
    },
  });

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-4 gap-6"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;

  const statCards = [
    {
      title: "Total Courses",
      value: stats?.totalCourses || 0,
      sub: `${stats?.approvedCourses || 0} Published`,
      icon: BookOpen,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Students",
      value: stats?.totalEnrollments || 0,
      sub: "Across all courses",
      icon: Users,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Pending Approval",
      value: stats?.pendingCourses || 0,
      sub: "Awaiting admin review",
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "Average Rating",
      value: "4.8",
      sub: "Student feedback",
      icon: Award,
      color: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Instructor Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your expertise and student engagement</p>
        </div>
        <Button asChild className="gap-2 h-11 px-6 shadow-lg shadow-primary/20">
          <Link to="/dashboard/create-course">
            <PlusCircle className="w-5 h-5" />
            Create New Course
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-none shadow-md overflow-hidden hover:-translate-y-1 transition-all duration-300">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Engagement Overview
            </CardTitle>
            <CardDescription>How your students are interacting with your content</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-xl m-6 mt-0">
             <div className="text-center space-y-2">
               <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto" />
               <p className="text-muted-foreground text-sm font-medium">Performance charts will appear here as you get more enrollments</p>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="outline" asChild className="h-24 flex-col gap-2">
              <Link to="/dashboard/my-courses">
                <BookOpen className="w-6 h-6 text-blue-500" />
                <span>My Course List</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-24 flex-col gap-2">
              <Link to="/dashboard/students">
                <Users className="w-6 h-6 text-green-500" />
                <span>Student Roster</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-24 flex-col gap-2">
              <Link to="/dashboard/quizzes">
                <FileText className="w-6 h-6 text-warning" />
                <span>Manage Quizzes</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-24 flex-col gap-2">
              <Link to="/dashboard/profile">
                <Award className="w-6 h-6 text-accent" />
                <span>Public Bio</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstructorOverview;
