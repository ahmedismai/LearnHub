import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import Payment from "./pages/Payment";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import MyCourses from "./pages/MyCourses";
import Certificates from "./pages/Certificates";
import Grades from "./pages/Grades";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseDetails />} />
            <Route path="/payment/:courseId" element={<Payment />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="my-courses" element={<MyCourses />} />
              <Route path="certificates" element={<Certificates />} />
              <Route path="grades" element={<Grades />} />
              <Route path="assignments" element={<Dashboard />} />
              <Route path="quizzes" element={<Dashboard />} />
              <Route path="students" element={<Dashboard />} />
              <Route path="users" element={<Dashboard />} />
              <Route path="courses" element={<MyCourses />} />
              <Route path="reports" element={<Dashboard />} />
              <Route path="payments" element={<Dashboard />} />
              <Route path="create-course" element={<Dashboard />} />
              <Route path="settings" element={<Dashboard />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
