import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Award,
  ChevronRight,
  Play,
  FileText,
  GraduationCap,
} from 'lucide-react';
import { mockCourses, mockEnrollments, mockAssignments, mockCertificates, mockGrades } from '@/data/mockData';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return null;

  // Admin Dashboard
  if (user.role === 'admin') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your learning platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold text-foreground mt-1">1,234</p>
                  <p className="text-sm text-success flex items-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4" /> +12% this month
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-7 h-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{mockCourses.length}</p>
                  <p className="text-sm text-success flex items-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4" /> +3 new courses
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold text-foreground mt-1">$45,678</p>
                  <p className="text-sm text-success flex items-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4" /> +18% this month
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Enrollments</p>
                  <p className="text-3xl font-bold text-foreground mt-1">892</p>
                  <p className="text-sm text-success flex items-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4" /> +25% this month
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Enrollments</CardTitle>
              <CardDescription>Latest student enrollments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCourses.slice(0, 4).map((course, index) => (
                  <div key={course.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{course.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {course.enrolledCount} students enrolled
                      </p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                  <Link to="/dashboard/users">
                    <Users className="w-6 h-6" />
                    <span>Manage Users</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                  <Link to="/dashboard/courses">
                    <BookOpen className="w-6 h-6" />
                    <span>Manage Courses</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                  <Link to="/dashboard/reports">
                    <TrendingUp className="w-6 h-6" />
                    <span>View Reports</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                  <Link to="/dashboard/payments">
                    <DollarSign className="w-6 h-6" />
                    <span>View Payments</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Instructor Dashboard
  if (user.role === 'instructor') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Instructor Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user.name.split(' ')[0]}!</p>
          </div>
          <Button asChild>
            <Link to="/dashboard/create-course">
              <BookOpen className="w-4 h-4 mr-2" />
              Create Course
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">My Courses</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{mockCourses.length}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {mockCourses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0)}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <Users className="w-7 h-7 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                  <p className="text-3xl font-bold text-foreground mt-1">$12,340</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Rating</p>
                  <p className="text-3xl font-bold text-foreground mt-1">4.8</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center">
                  <Award className="w-7 h-7 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Courses</CardTitle>
                <CardDescription>Your published courses</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/my-courses">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCourses.slice(0, 3).map((course) => (
                  <div key={course.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-16 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{course.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {course.enrolledCount} students • ${course.price}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>Assignments awaiting grading</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAssignments.slice(0, 3).map((assignment) => (
                  <div key={assignment.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{assignment.title}</p>
                      <p className="text-sm text-muted-foreground">3 submissions pending</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Student Dashboard
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome back, {user.name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground mt-1">Continue your learning journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Enrolled Courses</p>
                <p className="text-3xl font-bold text-foreground mt-1">{mockEnrollments.length}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {mockEnrollments.filter((e) => e.status === 'completed').length}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
                <Award className="w-7 h-7 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Certificates</p>
                <p className="text-3xl font-bold text-foreground mt-1">{mockCertificates.length}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Award className="w-7 h-7 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Grade</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {Math.round(
                    mockGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / mockGrades.length
                  )}
                  %
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Continue Learning</CardTitle>
                <CardDescription>Pick up where you left off</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/my-courses">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockEnrollments
                  .filter((e) => e.status === 'active')
                  .map((enrollment) => {
                    const course = mockCourses.find((c) => c.id === enrollment.courseId);
                    if (!course) return null;
                    return (
                      <div
                        key={enrollment.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-20 h-14 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{course.title}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress value={enrollment.progress} className="h-2 flex-1" />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {enrollment.progress}%
                            </span>
                          </div>
                        </div>
                        <Button variant="gradient" size="sm">
                          <Play className="w-4 h-4 mr-1" />
                          Continue
                        </Button>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockAssignments.slice(0, 3).map((assignment) => (
                  <div key={assignment.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{assignment.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockGrades.map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {grade.quizId ? 'Quiz' : 'Assignment'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(grade.gradedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        (grade.percentage || 0) >= 80
                          ? 'success'
                          : (grade.percentage || 0) >= 60
                          ? 'warning'
                          : 'destructive'
                      }
                    >
                      {grade.score}/{grade.maxScore}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
