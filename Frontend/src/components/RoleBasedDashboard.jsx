import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";
import InstructorOverview from "@/pages/instructor/InstructorOverview";
import AdminOverview from "@/pages/admin/AdminOverview";

const RoleBasedDashboard = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "Administrator":
      return <AdminOverview />;
    case "Instructor":
      return <InstructorOverview />;
    case "Student":
    default:
      return <Dashboard />;
  }
};

export default RoleBasedDashboard;
