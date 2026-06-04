import { Outlet, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
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
  const displayName = user?.fullName || user?.name || user?.username || "User";

  return (
    <SidebarProvider>
      <div className="page-shell-bg min-h-screen flex w-full">
        <DashboardSidebar />
        <SidebarInset className="flex-1 bg-transparent transition-all duration-300 ease-in-out">
          <header className="sticky top-0 z-40 mx-3 mt-3 flex h-16 items-center justify-between glass-panel px-4 shadow-lg sm:mx-4 sm:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-2 text-muted-foreground" />
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm font-semibold text-muted-foreground/80">
                  Welcome to LearnHub
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-foreground">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-wider">
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
          <motion.main
            className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Outlet />
          </motion.main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
