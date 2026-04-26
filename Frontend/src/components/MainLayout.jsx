import { Outlet, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/DashboardSidebar";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const MainLayout = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50">
        <DashboardSidebar />
        <SidebarInset className="flex-1 bg-slate-50 transition-all duration-300">
          <header className="h-16 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-2" />
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Welcome to LearnHub
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-foreground">
                    {user?.name || user?.username || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user?.role || "Guest"}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" asChild size="sm">
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to="/register">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
