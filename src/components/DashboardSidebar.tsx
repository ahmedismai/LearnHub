import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
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
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const DashboardSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const adminLinks = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Users', url: '/dashboard/users', icon: Users },
    { title: 'Courses', url: '/dashboard/courses', icon: BookOpen },
    { title: 'Reports', url: '/dashboard/reports', icon: BarChart3 },
    { title: 'Payments', url: '/dashboard/payments', icon: CreditCard },
  ];

  const instructorLinks = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'My Courses', url: '/dashboard/my-courses', icon: BookOpen },
    { title: 'Create Course', url: '/dashboard/create-course', icon: PlusCircle },
    { title: 'Assignments', url: '/dashboard/assignments', icon: ClipboardList },
    { title: 'Quizzes', url: '/dashboard/quizzes', icon: FileText },
    { title: 'Students', url: '/dashboard/students', icon: Users },
  ];

  const studentLinks = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'My Courses', url: '/dashboard/my-courses', icon: BookOpen },
    { title: 'Browse Courses', url: '/courses', icon: GraduationCap },
    { title: 'Assignments', url: '/dashboard/assignments', icon: ClipboardList },
    { title: 'Quizzes', url: '/dashboard/quizzes', icon: FileText },
    { title: 'Grades', url: '/dashboard/grades', icon: BarChart3 },
    { title: 'Certificates', url: '/dashboard/certificates', icon: Award },
  ];

  const getLinks = () => {
    switch (user.role) {
      case 'admin':
        return adminLinks;
      case 'instructor':
        return instructorLinks;
      case 'student':
        return studentLinks;
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-sidebar-foreground">LearnHub</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((link) => (
                <SidebarMenuItem key={link.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={link.url}
                      end={link.url === '/dashboard'}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <link.icon className="w-5 h-5" />
                      <span className="font-medium">{link.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/dashboard/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Settings</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-sidebar-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={logout}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
