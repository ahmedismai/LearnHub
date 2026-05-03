import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  FileText,
  Award,
  BarChart3,
  Settings,
  LogOut,
  PlusCircle,
  ClipboardList,
  CreditCard,
  Layers,
  BrainCircuit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const DashboardSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getInitials = (name) => {
    return (name || "U")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const guestLinks = [
    { title: "Home", url: "/", icon: LayoutDashboard },
    { title: "Browse Courses", url: "/browse-courses", icon: GraduationCap },
  ];

  const adminLinks = [
    { title: "Overview", url: "/dashboard/reports", icon: LayoutDashboard },
    { title: "Users", url: "/dashboard/users", icon: Users },
    { title: "Courses", url: "/dashboard/admin-courses", icon: BookOpen },
    { title: "Categories", url: "/dashboard/categories", icon: Layers },
    { title: "Payments", url: "/dashboard/payments", icon: CreditCard },
    { title: "Certificates", url: "/dashboard/admin-certificates", icon: Award },
  ];

  const instructorLinks = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "My Courses", url: "/dashboard/my-courses", icon: BookOpen },
    {
      title: "Create Course",
      url: "/dashboard/create-course",
      icon: PlusCircle,
    },
    {
      title: "Create Exam",
      url: "/dashboard/create-exam",
      icon: GraduationCap,
    },
    {
      title: "Assignments",
      url: "/dashboard/assignments",
      icon: ClipboardList,
    },
    { title: "Quizzes", url: "/dashboard/quizzes", icon: FileText },
    { title: "Exams", url: "/dashboard/exams", icon: GraduationCap },
    { title: "Students", url: "/dashboard/students", icon: Users },
    { title: "Student Results", url: "/dashboard/student-results", icon: BarChart3 },
    { title: "Certificates", url: "/dashboard/instructor-certificates", icon: Award },
  ];

  const studentLinks = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "My Courses", url: "/dashboard/my-courses", icon: BookOpen },
    { title: "Browse Courses", url: "/browse-courses", icon: GraduationCap },
    {
      title: "Smart Assessments",
      url: "/dashboard/quizzes",
      icon: BrainCircuit,
    },
    { title: "Grades", url: "/dashboard/grades", icon: BarChart3 },
    { title: "Certificates", url: "/dashboard/certificates", icon: Award },
  ];

  const getLinks = () => {
    if (!user) return guestLinks;
    switch (user.role) {
      case "Administrator":
        return adminLinks;
      case "Instructor":
        return instructorLinks;
      case "Student":
        return studentLinks;
      default:
        return guestLinks;
    }
  };

  const links = getLinks();

  return (
    <Sidebar className="w-64 bg-[#0f172a] border-r border-slate-800 z-50 [&>[data-sidebar=sidebar]]:bg-[#0f172a] fixed h-full">
      <SidebarHeader className="p-4 border-b border-slate-800 bg-[#0f172a]">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">
            LearnHub
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 bg-[#0f172a]">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((link) => {
                const Icon = link.icon;
                const isCustomActive = (url) => {
                  if (url === "/browse-courses" && (location.pathname === "/browse-courses" || location.pathname.startsWith("/courses/"))) {
                    return true;
                  }
                  if (url === "/dashboard/my-courses" && location.pathname.startsWith("/dashboard/courses/")) {
                    return true;
                  }
                  if (url === "/dashboard" && location.pathname === "/dashboard") {
                    return true;
                  }
                  return location.pathname === url;
                };

                return (
                  <SidebarMenuItem key={link.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={link.url}
                        className={({ isActive }) => 
                          cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all duration-300",
                            (isActive || isCustomActive(link.url)) && "bg-teal-600 text-white shadow-lg shadow-teal-900/20"
                          )
                        }
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium tracking-wide">{link.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Account
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/dashboard/profile"
                      className={({ isActive }) => 
                        cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors",
                          isActive && "bg-primary text-white hover:bg-primary/90 shadow-sm"
                        )
                      }
                    >
                      <Users className="w-5 h-5" />
                      <span className="font-medium">My Profile</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/dashboard/settings"
                      className={({ isActive }) => 
                        cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors",
                          isActive && "bg-primary text-white hover:bg-primary/90 shadow-sm"
                        )
                      }
                    >
                      <Settings className="w-5 h-5" />
                      <span className="font-medium">Settings</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {user ? (
        <SidebarFooter className="p-4 border-t border-slate-800 bg-[#0f172a]">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-white font-semibold">
                {getInitials(user.name || user.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-white truncate">
                {user.name || user.username}
              </p>
              <p className="text-xs text-slate-400 capitalize">
                {user.role}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </SidebarFooter>
      ) : (
        <SidebarFooter className="p-4 border-t border-slate-800 bg-[#0f172a]">
          <Button asChild className="w-full gap-2">
            <Link to="/login">
              <LogOut className="w-4 h-4 rotate-180" />
              Sign In
            </Link>
          </Button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
};

export default DashboardSidebar;
