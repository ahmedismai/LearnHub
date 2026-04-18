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
import { Trash2, Shield, UserCog, Mail, Calendar } from "lucide-react";
import api from "@/api/axios";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const AdminUsers = () => {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const response = await api.get("/admin/users");
      return response.data;
    },
  });

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage platform users and their roles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Active Users
          </CardTitle>
          <CardDescription>
            A total of {users.length} users registered on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {u.name?.[0] || u.username?.[0] || "U"}
                      </div>
                      {u.name || u.username}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      {u.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        u.role === "Administrator"
                          ? "destructive"
                          : u.role === "Instructor"
                            ? "warning"
                            : "secondary"
                      }
                      className="capitalize"
                    >
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
                          className="h-8 gap-1"
                        >
                          <UserCog className="w-3 h-3" /> Prom. Instructor
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
                          className="h-8 gap-1"
                        >
                          <UserCog className="w-3 h-3" /> Dem. Student
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (
                            confirm("Are you sure you want to delete this user?")
                          ) {
                            deleteUserMutation.mutate(u._id);
                          }
                        }}
                        disabled={deleteUserMutation.isPending}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
