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
  ChartNoAxesCombined,
  CirclePlus,
  ClipboardCheck,
  ClipboardPenLine,
  Compass,
  Gauge,
  House,
  LibraryBig,
  ReceiptText,
  SlidersHorizontal,
  Tags,
  Trophy,
  UserCheck,
  UserCircle,
  UserRoundCog,
  UsersRound,
  GraduationCap,
  LogOut,
  BrainCircuit,
  Heart,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const DashboardSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const displayName = user?.fullName || user?.name || user?.username || "User";

  const getInitials = (name) => {
    return (name || "U")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const guestLinks = [
    { title: "Home", url: "/", icon: House },
    { title: "Browse Courses", url: "/browse-courses", icon: Compass },
  ];

  const adminLinks = [
    { title: "Overview", url: "/dashboard/reports", icon: Gauge },
    { title: "Users", url: "/dashboard/users", icon: UserRoundCog },
    { title: "Courses", url: "/dashboard/admin-courses", icon: LibraryBig },
    { title: "Exams", url: "/dashboard/admin-exams", icon: ClipboardPenLine },
    { title: "Student Results", url: "/dashboard/admin-student-results", icon: ChartNoAxesCombined },
    { title: "Categories", url: "/dashboard/categories", icon: Tags },
    { title: "Enrollments", url: "/dashboard/enrollments", icon: UserCheck },
    { title: "Payments", url: "/dashboard/payments", icon: ReceiptText },
  ];

  const instructorLinks = [
    { title: "Dashboard", url: "/dashboard", icon: Gauge },
    { title: "My Courses", url: "/dashboard/my-courses", icon: LibraryBig },
    {
      title: "Create Course",
      url: "/dashboard/create-course",
      icon: CirclePlus,
    },
    {
      title: "Create Exam",
      url: "/dashboard/create-exam",
      icon: ClipboardPenLine,
    },
    { title: "Manage Exams", url: "/dashboard/exams", icon: ClipboardCheck },
    { title: "Students", url: "/dashboard/students", icon: UsersRound },
    { title: "Student Results", url: "/dashboard/student-results", icon: ChartNoAxesCombined },
  ];

  const studentLinks = [
    { title: "Dashboard", url: "/dashboard", icon: Gauge },
    { title: "My Courses", url: "/dashboard/my-courses", icon: LibraryBig },
    { title: "Browse Courses", url: "/browse-courses", icon: Compass },
    {
      title: "Assessments",
      url: "/dashboard/smart-assessments",
      icon: BrainCircuit,
    },
    { title: "Grades", url: "/dashboard/grades", icon: ChartNoAxesCombined },
    { title: "Certificates", url: "/dashboard/certificates", icon: Trophy },
    { title: "Wishlist", url: "/dashboard/wishlist", icon: Heart },
    { title: "Cart", url: "/dashboard/cart", icon: ShoppingCart },
    { title: "My Orders", url: "/dashboard/my-orders", icon: ReceiptText },
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
    <Sidebar className="z-50 w-64 border-r border-white/10 bg-slate-950 text-white [&>[data-sidebar=sidebar]]:bg-slate-950 [&>[data-sidebar=sidebar]]:text-white">
      <SidebarHeader className="border-b border-white/10 p-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <GraduationCap size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            LearnHub
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="custom-scrollbar px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
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

                const active = isCustomActive(link.url);

                return (
                  <SidebarMenuItem key={link.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={link.url}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group",
                          active 
                            ? "bg-primary text-white shadow-md shadow-primary/20" 
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <Icon size={18} className={cn("transition-colors", active ? "text-white" : "text-slate-500 group-hover:text-white")} />
                        <span className="font-semibold text-sm tracking-wide">{link.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">
              Preferences
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/dashboard/profile"
                      className={({ isActive }) => 
                        cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group",
                          isActive 
                            ? "bg-white/10 text-white" 
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                        )
                      }
                    >
                      <UserCircle size={18} className="text-slate-500 group-hover:text-white transition-colors" />
                      <span className="font-semibold text-sm">My Profile</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/dashboard/settings"
                      className={({ isActive }) => 
                        cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group",
                          isActive 
                            ? "bg-white/10 text-white" 
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                        )
                      }
                    >
                      <SlidersHorizontal size={18} className="text-slate-500 group-hover:text-white transition-colors" />
                      <span className="font-semibold text-sm">Settings</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {user ? (
        <SidebarFooter className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 mb-4 px-2">
            <Avatar className="h-9 w-9 border border-white/10">
              <AvatarFallback className="bg-teal-500 text-white text-xs font-bold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs text-white truncate">
                {displayName}
              </p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                {user.role}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 h-9 px-3 rounded-lg transition-colors group"
            onClick={logout}
          >
            <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
            <span className="text-xs font-bold">Sign Out</span>
          </Button>
        </SidebarFooter>
      ) : (
        <SidebarFooter className="border-t border-white/10 p-4">
          <Button asChild className="w-full gap-2 gradient-primary border-none text-white h-10 shadow-lg shadow-teal-500/20">
            <Link to="/login">
              <LogOut size={18} className="rotate-180" />
              <span className="font-bold">Sign In</span>
            </Link>
          </Button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
};

export default DashboardSidebar;
