import { useAuth } from "@/contexts/AuthContext";
import Assignments from "./Assignments";
import InstructorAssignments from "./instructor/InstructorAssignments";

const RoleBasedAssignments = () => {
  const { user } = useAuth();

  if (user?.role === "Instructor") {
    return <InstructorAssignments />;
  }

  return <Assignments />;
};

export default RoleBasedAssignments;
