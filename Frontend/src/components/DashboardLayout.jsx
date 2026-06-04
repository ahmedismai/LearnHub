import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Loader2 } from "lucide-react";

const DashboardLayout = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const displayName = user?.fullName || user?.name || user?.username || "User";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="page-shell-bg min-h-screen flex w-full">
        <DashboardSidebar />
        <SidebarInset className="flex-1 bg-transparent transition-all duration-300 ease-in-out">
          <header className="sticky top-0 z-40 mx-3 mt-3 flex h-16 items-center justify-between glass-panel px-4 shadow-lg sm:mx-4 sm:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-2" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-foreground">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role || "Guest"}
                </p>
              </div>
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

export default DashboardLayout;
