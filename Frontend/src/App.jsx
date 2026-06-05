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
import Grades from "./pages/Grades";
import Exams from "./pages/Exams";
import ConfirmEmail from "./pages/ConfirmEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import QuizPage from "./pages/QuizPage";
import Chatbot from "./components/Chatbot";
import Profile from "./pages/Profile";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminEnrollments from "./pages/admin/AdminEnrollments";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminExams from "./pages/admin/AdminExams";
import AdminStudentResults from "./pages/admin/AdminStudentResults";
import MyOrders from "./pages/MyOrders";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Certificates from "./pages/Certificates";
import Settings from "./pages/Settings";
import StudentManagement from "./pages/instructor/StudentManagement";
import InstructorSubmissions from "./pages/instructor/InstructorSubmissions";
import StudentResults from "./pages/instructor/StudentResults"; // New import
import ExamFeedback from "./pages/ExamFeedback"; // New import
import RoleBasedDashboard from "./components/RoleBasedDashboard";
import SmartAssessments from "./pages/SmartAssessments";
import ConfirmReset from "./pages/confirmResetPassword";
import OAuthCallback from "./pages/OAuthCallback";

const queryClient = new QueryClient();

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-shell-bg flex h-screen w-full items-center justify-center">
        <div className="surface-glass p-6">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary/20 border-b-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!user.emailConfirmed) {
    return <Navigate to="/confirm-email" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

const PublicRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-shell-bg flex h-screen w-full items-center justify-center">
        <div className="surface-glass p-6">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary/20 border-b-primary"></div>
        </div>
      </div>
    );
  }

  if (user && !user.emailConfirmed) {
    return <Navigate to="/confirm-email" replace />;
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
            <Route path="/" element={<Index />} />

            <Route element={<MainLayout />}>
              <Route path="/browse-courses" element={<BrowseCourses />} />
              <Route path="/courses" element={<BrowseCourses />} />
              <Route path="/courses/:id" element={<CourseDetails />} />
            </Route>

            <Route path="/confirm-email" element={<ConfirmEmail />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />

            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/confirm-reset" element={<ConfirmReset />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/payment/:courseId" element={<Payment />} />

              {/* Dashboard Routes */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<RoleBasedDashboard />} />
                <Route path="my-courses" element={<MyCourses />} />
                <Route path="courses/:id" element={<CourseDetails />} />
                <Route path="grades" element={<Grades />} />
                <Route
                  path="smart-assessments"
                  element={<SmartAssessments />}
                />
                <Route path="exams" element={<Exams />} />
                <Route path="exam/:id" element={<QuizPage />} />

                <Route path="exam-result/:id" element={<ExamFeedback />} />
                <Route path="cart" element={<Cart />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="my-orders" element={<MyOrders />} />
                <Route path="certificates" element={<Certificates />} />

                <Route element={<ProtectedRoute allowedRoles={["Instructor", "Administrator"]} />}>
                  <Route path="create-course" element={<CreateCourse />} />
                  <Route path="edit-course/:id" element={<CreateCourse />} />
                  <Route path="create-exam" element={<CreateExam />} />
                  <Route path="edit-exam/:id" element={<CreateExam />} />
                  <Route path="students" element={<StudentManagement />} />
                  <Route path="student-results" element={<StudentResults />} />
                  <Route path="student-results/:id" element={<StudentResults />} />
                  <Route
                    path="review-submissions"
                    element={<InstructorSubmissions />}
                  />
                  <Route
                    path="review-submissions/:id"
                    element={<InstructorSubmissions />}
                  />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={["Administrator"]} />}>
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="admin-courses" element={<AdminCourses />} />
                  <Route path="reports" element={<AdminOverview />} />
                  <Route path="admin" element={<AdminOverview />} />
                  <Route path="payments" element={<AdminPayments />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="enrollments" element={<AdminEnrollments />} />
                  <Route path="admin-exams" element={<AdminExams />} />
                  <Route
                    path="admin-student-results"
                    element={<AdminStudentResults />}
                  />
                </Route>

                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          <Chatbot />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
