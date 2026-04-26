import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Loader2 } from "lucide-react";

const DashboardLayout = () => {
  const { user, isLoading, isAuthenticated } = useAuth();

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
      <div className="min-h-screen flex w-full bg-slate-50">
        <DashboardSidebar />
        <SidebarInset className="flex-1 bg-slate-50 transition-all duration-300">
          <header className="h-16 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-2" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-foreground">
                  {user?.name || user?.username || "User"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role || "Guest"}
                </p>
              </div>
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

export default DashboardLayout;
