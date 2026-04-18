import { useAuth } from "@/contexts/AuthContext";
import Quizzes from "./Quizzes";
import InstructorQuizzes from "./instructor/InstructorQuizzes";

const RoleBasedQuizzes = () => {
  const { user } = useAuth();

  if (user?.role === "Instructor") {
    return <InstructorQuizzes />;
  }

  return <Quizzes />;
};

export default RoleBasedQuizzes;
