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
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import Payment from "./pages/Payment";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import MyCourses from "./pages/MyCourses";
import CreateCourse from "./pages/CreateCourse";
import Certificates from "./pages/Certificates";
import Grades from "./pages/Grades";
import Assignments from "./pages/Assignments";
import Quizzes from "./pages/Quizzes";
import ConfirmEmail from "./pages/ConfirmEmail";
import NotFound from "./pages/NotFound";
import Exam from "./pages/Exam";

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

  return user ? <Outlet /> : <Navigate to="/login" replace />;
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
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseDetails />} />
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
                <Route index element={<Dashboard />} />
                <Route path="my-courses" element={<MyCourses />} />
                <Route path="courses/:id" element={<CourseDetails />} />
                <Route path="edit-course/:id" element={<CreateCourse />} />
                <Route path="certificates" element={<Certificates />} />
                <Route path="grades" element={<Grades />} />
                <Route path="assignments" element={<Assignments />} />
                <Route path="quizzes" element={<Quizzes />} />
                <Route path="exam/:id" element={<Exam />} />
                <Route path="students" element={<Dashboard />} />
                <Route path="users" element={<AdminDashboard />} />
                <Route path="courses" element={<AdminDashboard />} />
                <Route path="reports" element={<AdminDashboard />} />
                <Route path="payments" element={<AdminDashboard />} />
                <Route path="create-course" element={<CreateCourse />} />
                <Route path="settings" element={<AdminDashboard />} />
              </Route>
            </Route>

            {/* صفحة 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
