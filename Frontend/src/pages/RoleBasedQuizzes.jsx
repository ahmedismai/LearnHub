import { useAuth } from "@/contexts/AuthContext";
import SmartAssessments from "./SmartAssessments";
import InstructorQuizzes from "./instructor/InstructorQuizzes";

const RoleBasedQuizzes = () => {
  const { user } = useAuth();

  if (user?.role === "Instructor") {
    return <InstructorQuizzes />;
  }

  return <SmartAssessments />;
};

export default RoleBasedQuizzes;
