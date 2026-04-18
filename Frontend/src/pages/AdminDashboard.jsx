import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  BookOpen,
  BarChart3,
  CheckCircle2,
  XCircle,
  Shield,
  Activity,
  TrendingUp,
  DollarSign,
  Trash2,
  Loader2,
} from "lucide-react";
import api from "@/api/axios";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const response = await api.get("/admin/stats");
      return response.data;
    },
  });

  // Fetch Users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const response = await api.get("/admin/users");
      return response.data;
    },
  });

  // Fetch Courses (all courses for approval)
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: async () => {
      const response = await api.get("/Course/list");
      return response.data;
    },
  });

  // Mutations
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      return await api.patch(`/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "users"]);
      toast.success("User role updated successfully");
    },
    onError: () => toast.error("Failed to update user role"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      return await api.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "users"]);
      toast.success("User deleted successfully");
    },
    onError: () => toast.error("Failed to delete user"),
  });

  const updateCourseStatusMutation = useMutation({
    mutationFn: async ({ courseId, status }) => {
      return await api.patch(`/Course/${courseId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "courses"]);
      toast.success("Course status updated");
    },
    onError: () => toast.error("Failed to update course status"),
  });

  const isLoading = statsLoading || usersLoading || coursesLoading;

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Admin Control Panel
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage users, courses, and platform health
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-3 w-full lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Users
                    </p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-3xl font-bold mt-1">
                        {stats?.totalUsers}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Courses
                    </p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-3xl font-bold mt-1">
                        {stats?.totalCourses}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-accent/10 rounded-xl">
                    <BookOpen className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Revenue
                    </p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-24 mt-1" />
                    ) : (
                      <p className="text-3xl font-bold mt-1">
                        ${stats?.totalRevenue || 0}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-success/10 rounded-xl">
                    <DollarSign className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      System Health
                    </p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-24 mt-1" />
                    ) : (
                      <p className="text-lg font-bold mt-1 text-success">
                        {stats?.systemHealth?.status}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-warning/10 rounded-xl">
                    <Activity className="w-6 h-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
              <CardDescription>
                Real-time platform-wide analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <span className="font-medium text-muted-foreground">
                      Server Uptime
                    </span>
                    <span className="font-mono">
                      {Math.floor(stats?.systemHealth?.uptime / 3600)}h{" "}
                      {Math.floor((stats?.systemHealth?.uptime % 3600) / 60)}m
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <span className="font-medium text-muted-foreground">
                      Memory Usage
                    </span>
                    <span className="font-mono">
                      {Math.round(
                        stats?.systemHealth?.memoryUsage?.rss / 1024 / 1024,
                      )}{" "}
                      MB
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Display all users and apply role-based access control
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u._id}>
                        <TableCell className="font-medium">
                          {u.username}
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              u.role === "Administrator"
                                ? "destructive"
                                : u.role === "Instructor"
                                  ? "warning"
                                  : "secondary"
                            }
                          >
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {u.role !== "Administrator" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateRoleMutation.mutate({
                                    userId: u._id,
                                    role: "Administrator",
                                  })
                                }
                              >
                                Make Admin
                              </Button>
                            )}
                            {u.role === "Student" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateRoleMutation.mutate({
                                    userId: u._id,
                                    role: "Instructor",
                                  })
                                }
                              >
                                Make Instructor
                              </Button>
                            )}
                            {u.role === "Instructor" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateRoleMutation.mutate({
                                    userId: u._id,
                                    role: "Student",
                                  })
                                }
                              >
                                Make Student
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this user?")) {
                                  deleteUserMutation.mutate(u._id);
                                }
                              }}
                              disabled={deleteUserMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Course Approvals</CardTitle>
              <CardDescription>
                Approve or reject courses and update course status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={course.thumbnail}
                              className="w-10 h-7 rounded object-cover"
                              alt=""
                            />
                            <span className="font-medium">{course.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {course.instructorId?.username || course.instructorId?.name || "Unknown"}
                        </TableCell>
                        <TableCell>${course.price}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              course.status === "Approved"
                                ? "success"
                                : course.status === "Rejected"
                                  ? "destructive"
                                  : "warning"
                            }
                          >
                            {course.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {course.status !== "Approved" && (
                              <Button
                                size="sm"
                                variant="success"
                                className="gap-1"
                                onClick={() =>
                                  updateCourseStatusMutation.mutate({
                                    courseId: course._id,
                                    status: "Approved",
                                  })
                                }
                              >
                                <CheckCircle2 className="w-4 h-4" /> Approve
                              </Button>
                            )}
                            {course.status !== "Rejected" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="gap-1"
                                onClick={() =>
                                  updateCourseStatusMutation.mutate({
                                    courseId: course._id,
                                    status: "Rejected",
                                  })
                                }
                              >
                                <XCircle className="w-4 h-4" /> Reject
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
