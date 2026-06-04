import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  DollarSign,
  Activity,
  TrendingUp,
  BarChart3,
  Calendar,
  Star,
} from "lucide-react";
import api from "@/api/axios";
import { Skeleton } from "@/components/ui/skeleton";
import { getFullUrl } from "@/lib/urlHelper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

const AdminOverview = () => {
  const { data: response, isLoading } = useQuery({
    queryKey: ["Administrator", "stats"],
    queryFn: async () => {
      const response = await api.get("/api/Dashboard/AdminDashboard");
      return response.data;
    },
  });

  const stats = response?.stats;

  if (isLoading)
    return (
      <div className="space-y-8">
        <div className="glass-panel p-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      sub: `${stats?.totalStudents || 0} Students, ${stats?.totalInstructors || 0} Instructors`,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Active Courses",
      value: stats?.totalCourses || 0,
      sub: `${stats?.totalEnrollments || 0} Total Enrollments`,
      icon: BookOpen,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      title: "Pending Courses",
      value: stats?.pendingCourses || 0,
      sub: "Awaiting approval",
      icon: Activity,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "Total Revenue",
      value: "N/A",
      sub: "Payment tracking disabled",
      icon: DollarSign,
      color: "text-success",
      bg: "bg-success/10",
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
          <h1 className="page__title">
            Platform Overview
          </h1>
          <p className="page__subtitle">
            Global statistics and platform health metrics
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-primary" />
          {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </div>
      </div>

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
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
          <Card className="surface-glass h-full overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-extrabold mt-1 font-outfit text-primary">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/40">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 text-success" />
                  {stat.sub}
                </p>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="surface-glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-outfit text-xl">
              <Users className="w-5 h-5 text-primary" />
              Recent Active Users
            </CardTitle>
            <CardDescription>
              Last student activity on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              className="space-y-3"
              variants={gridMotion}
              initial="hidden"
              animate="visible"
            >
              {response?.recentActiveUsers?.map((user) => (
                <motion.div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/40 bg-white/40 hover:bg-primary/5 transition-all duration-200"
                  variants={itemMotion}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarImage src={user.profileImage} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {user.fullName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{user.fullName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-0.5">Last Activity</p>
                    <Badge variant="secondary" className="text-[10px] font-bold py-0 h-5">
                      {new Date(user.lastActivity).toLocaleDateString()}
                    </Badge>
                  </div>
                </motion.div>
              ))}
              {!response?.recentActiveUsers?.length && (
                 <p className="text-sm text-muted-foreground italic text-center py-8">No recent activity.</p>
              )}
            </motion.div>
          </CardContent>
        </Card>

        <Card className="surface-glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-outfit text-xl">
              <Star className="w-5 h-5 text-primary" />
              Top Rated Courses
            </CardTitle>
            <CardDescription>
              Highest performing content by rating
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              className="space-y-3"
              variants={gridMotion}
              initial="hidden"
              animate="visible"
            >
               {response?.topCourses?.map((course) => (
                 <motion.div
                   key={course.courseId}
                   className="flex items-center gap-4 p-2 rounded-xl border border-white/40 bg-white/40 hover:bg-primary/5 transition-all duration-200"
                   variants={itemMotion}
                 >
                   <div className="relative group">
                     <img 
                       src={getFullUrl(course.courseImage)} 
                       alt={course.title}
                       className="w-14 h-14 rounded-lg object-cover shadow-sm transition-transform group-hover:scale-105"
                     />
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{course.title}</p>
                     <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="text-xs font-bold">{course.averageRating.toFixed(1)}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">• 124 reviews</span>
                     </div>
                   </div>
                   <div className="pr-2">
                      <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${(course.averageRating / 5) * 100}%` }}
                        />
                      </div>
                   </div>
                 </motion.div>
               ))}
               {!response?.topCourses?.length && (
                 <p className="text-sm text-muted-foreground italic text-center py-8">No top courses yet.</p>
               )}
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default AdminOverview;
