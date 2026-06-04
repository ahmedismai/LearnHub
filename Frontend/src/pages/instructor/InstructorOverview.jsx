import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
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
  Sparkles,
  BrainCircuit,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { getFullUrl } from "@/lib/urlHelper";

const pageMotion = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeInOut" },
  },
};

const gridMotion = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, ease: "easeInOut" } },
};

const itemMotion = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeInOut" },
  },
};

const InstructorOverview = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["instructor", "stats"],
    queryFn: async () => {
      const response = await api.get("/api/Dashboard/InstructorDashboard");
      return response.data;
    },
  });

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-4 gap-6"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;

  const statCards = [
    {
      title: "Total Courses",
      value: stats?.myCoursesCount || 0,
      sub: `Manage your catalog`,
      icon: BookOpen,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Students",
      value: stats?.totalStudents || 0,
      sub: "Across all courses",
      icon: Users,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Exams Created",
      value: stats?.exams?.count || 0,
      sub: stats?.exams?.message || "No exams",
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "Average Rating",
      value: stats?.averageRating?.toFixed(1) || "0.0",
      sub: "Student feedback",
      icon: Award,
      color: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  return (
    <motion.div
      className="space-y-8"
      variants={pageMotion}
      initial="hidden"
      animate="visible"
    >
      <div className="page__head">
        <div>
          <h1 className="page__title">Instructor Dashboard</h1>
          <p className="page__subtitle">
            Manage your expertise and student engagement.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/5 h-11 px-6">
            <Link to="/dashboard/create-exam" className="flex items-center gap-2">
               <Sparkles className="w-4 h-4" /> AI Exam Creator
            </Link>
          </Button>
          <Button asChild className="gap-2 h-11 px-6 shadow-lg shadow-primary/20">
            <Link to="/dashboard/create-course">
              <PlusCircle className="w-5 h-5" />
              Create New Course
            </Link>
          </Button>
        </div>
      </div>

      {/* AI Instructor Highlight */}
      <motion.div
        variants={itemMotion}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
      <Card className="surface-glass group relative overflow-hidden border-primary/20 bg-primary/5">
        <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
           <Sparkles className="w-32 h-32 text-primary" />
        </div>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-xl shadow-primary/20">
               <BrainCircuit className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
               <h2 className="text-2xl font-black tracking-tight">AI Content Creation Tools</h2>
               <p className="text-muted-foreground max-w-xl">
                  Save time using our AI generators. Create comprehensive final exams or quickly generate quizzes inside your course content.
               </p>
            </div>
            <div className="flex flex-col gap-3">
               <Button asChild className="h-12 px-8 font-bold">
                  <Link to="/dashboard/create-exam">
                    Generate Final Exam <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
               </Button>
               <Button asChild variant="outline" className="h-12 px-8 font-bold border-primary text-primary">
                  <Link to="/dashboard/my-courses">
                    AI Quiz in Course <Sparkles className="ml-2 w-4 h-4" />
                  </Link>
               </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
        variants={gridMotion}
        initial="hidden"
        animate="visible"
      >
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            variants={itemMotion}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
          <Card className="surface-glass h-full overflow-hidden">
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
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="surface-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Recent Enrollments
            </CardTitle>
            <CardDescription>New students joining your courses</CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              className="space-y-4"
              variants={gridMotion}
              initial="hidden"
              animate="visible"
            >
              {stats?.recentEnrollments?.map((enrollment) => (
                <motion.div
                  key={enrollment.enrollmentId}
                  className="flex flex-col gap-3 rounded-xl border border-white/70 bg-white/60 p-3 transition-colors hover:bg-primary/5 sm:flex-row sm:items-center sm:justify-between"
                  variants={itemMotion}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={getFullUrl(enrollment.courseImage)} 
                      alt={enrollment.courseTitle}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold">{enrollment.studentName}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{enrollment.courseTitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Enrolled</p>
                    <p className="text-xs">{new Date(enrollment.enrolledAt).toLocaleDateString()}</p>
                  </div>
                </motion.div>
              ))}
              {!stats?.recentEnrollments?.length && (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground italic text-sm">
                   No recent enrollments yet.
                </div>
              )}
            </motion.div>
          </CardContent>
        </Card>

        <Card className="surface-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <Link to="/dashboard/exams">
                <FileText className="w-6 h-6 text-warning" />
                <span>Manage Exams</span>
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
    </motion.div>
  );
};

export default InstructorOverview;
