import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BrowseCourses from "./pages/BrowseCourses";
import CourseDetails from "./pages/CourseDetails";
import Payment from "./pages/Payment";
import DashboardLayout from "./components/DashboardLayout";
import MainLayout from "./components/MainLayout";
import MyCourses from "./pages/MyCourses";
import CreateCourse from "./pages/CreateCourse";
import CreateExam from "./pages/CreateExam";
import Certificates from "./pages/Certificates";
import Grades from "./pages/Grades";
import Exams from "./pages/Exams";
import ConfirmEmail from "./pages/ConfirmEmail";
import NotFound from "./pages/NotFound";
import QuizPage from "./pages/QuizPage";
import Chatbot from "./components/Chatbot";
import Profile from "./pages/Profile";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCertificates from "./pages/admin/AdminCertificates";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminPayments from "./pages/admin/AdminPayments";
import Settings from "./pages/Settings";
import StudentManagement from "./pages/instructor/StudentManagement";
import InstructorSubmissions from "./pages/instructor/InstructorSubmissions";
import InstructorCertificates from "./pages/instructor/InstructorCertificates";
import StudentResults from "./pages/instructor/StudentResults"; // New import
import RoleBasedDashboard from "./components/RoleBasedDashboard";
import RoleBasedAssignments from "./pages/RoleBasedAssignments";
import RoleBasedQuizzes from "./pages/RoleBasedQuizzes";
import SmartAssessments from "./pages/SmartAssessments";

const queryClient = new QueryClient();

// 1. تعديل الـ ProtectedRoute
const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.emailConfirmed) {
    return <Navigate to="/confirm-email" replace />;
  }

  return <Outlet />;
};

const PublicRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return !user ? <Outlet /> : <Navigate to="/" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* --- الصفحات المتاحة للجميع (Public) --- */}
            <Route path="/" element={<Index />} />
            
            <Route element={<MainLayout />}>
              <Route path="/browse-courses" element={<BrowseCourses />} />
              <Route path="/courses" element={<BrowseCourses />} />
              <Route path="/courses/:id" element={<CourseDetails />} />
            </Route>

            <Route path="/confirm-email" element={<ConfirmEmail />} />

            {/* --- صفحات تفتح فقط إذا لم تكن مسجل دخول (Public Only) --- */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* --- الصفحات المحمية (Protected - Require Login) --- */}
            <Route element={<ProtectedRoute />}>
              <Route path="/payment/:courseId" element={<Payment />} />

              {/* Dashboard Routes */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<RoleBasedDashboard />} />
                <Route path="my-courses" element={<MyCourses />} />
                <Route path="create-course" element={<CreateCourse />} />
                <Route path="courses/:id" element={<CourseDetails />} />
                <Route path="edit-course/:id" element={<CreateCourse />} />
                <Route path="certificates" element={<Certificates />} />
                <Route path="grades" element={<Grades />} />
                <Route path="assignments" element={<RoleBasedAssignments />} />
                <Route path="quizzes" element={<RoleBasedQuizzes />} />
                <Route path="exams" element={<Exams />} />
                <Route path="exam/:id" element={<QuizPage />} />
                <Route path="students" element={<StudentManagement />} />
                <Route path="student-results" element={<StudentResults />} />
                <Route path="student-results/:id" element={<StudentResults />} />
                <Route path="instructor-certificates" element={<InstructorCertificates />} />
                <Route path="review-submissions" element={<InstructorSubmissions />} />
                <Route path="review-submissions/:id" element={<InstructorSubmissions />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="admin-courses" element={<AdminCourses />} />
                <Route path="admin-certificates" element={<AdminCertificates />} />
                <Route path="reports" element={<AdminOverview />} />
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="create-exam" element={<CreateExam />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Route>

            {/* صفحة 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Chatbot />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
