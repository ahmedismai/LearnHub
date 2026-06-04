import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Shield, UserCog, Mail, Calendar, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import accountService from "@/api/account";
import roleService from "@/api/role";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [newRoleName, setNewRoleName] = useState("");

  const { data: response, isLoading: isUsersLoading } = useQuery({
    queryKey: ["Administrator", "users"],
    queryFn: () => accountService.getAllUsers(),
  });

  const { data: rolesResponse, isLoading: isRolesLoading } = useQuery({
    queryKey: ["Administrator", "roles"],
    queryFn: roleService.getAll,
  });

  const users = response?.data || [];
  const roles = rolesResponse?.data || (Array.isArray(rolesResponse) ? rolesResponse : []);

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role, currentRoles = [] }) => {
      await Promise.all(
        currentRoles
          .filter((currentRole) => currentRole !== role)
          .map((currentRole) => roleService.unassignRole(userId, currentRole)),
      );

      if (currentRoles.includes(role)) {
        return { success: true };
      }

      return await roleService.assignRole(userId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["Administrator", "users"]);
      toast.success("User role updated successfully");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update user role"),
  });

  const createRoleMutation = useMutation({
    mutationFn: roleService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(["Administrator", "roles"]);
      toast.success("Role created successfully");
      setNewRoleName("");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to create role"),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: roleService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(["Administrator", "roles"]);
      queryClient.invalidateQueries(["Administrator", "users"]);
      toast.success("Role deleted successfully");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to delete role"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => accountService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(["Administrator", "users"]);
      toast.success("User deleted successfully");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to delete user"),
  });

  if (isUsersLoading || isRolesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="page__head">
        <div>
          <h1 className="page__title">Admin Control Center</h1>
          <p className="page__subtitle">
            Manage platform users, roles, and permissions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="surface-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user roles and platform access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="data-list">
                <div className="data-list__head grid-cols-[1.1fr,1.4fr,0.8fr,1fr]">
                  <span>User</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span className="text-right">Actions</span>
                </div>
                  {users.map((u) => (
                    <div key={u.userId} className="data-list__row grid-cols-[1.1fr,1.4fr,0.8fr,1fr]">
                      <div className="data-list__cell font-medium" data-label="User">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {u.fullName?.[0] || "U"}
                          </div>
                          {u.fullName}
                        </div>
                      </div>
                      <div className="data-list__cell" data-label="Email">
                        <div className="flex items-center gap-2 text-xs">
                          <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[120px]">{u.email}</span>
                          {u.emailConfirmed ? (
                            <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-green-500 text-green-600 bg-green-500/5 shrink-0">Confirmed</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-amber-500 text-amber-600 bg-amber-500/5 shrink-0">Pending</Badge>
                          )}
                        </div>
                      </div>
                      <div className="data-list__cell" data-label="Role">
                        <Badge
                          variant={
                            u.roles?.includes("Administrator")
                              ? "destructive"
                              : u.roles?.includes("Instructor")
                                ? "warning"
                                : "secondary"
                          }
                          className="capitalize text-[10px]"
                        >
                          {u.roles?.join(", ") || "Student"}
                        </Badge>
                      </div>
                      <div className="data-list__cell data-list__actions" data-label="Actions">
                        <div className="flex w-full justify-end gap-2">
                          <Select
                            defaultValue={u.roles?.[0] || "Student"}
                            onValueChange={(newRole) =>
                              updateRoleMutation.mutate({
                                userId: u.userId,
                                role: newRole,
                                currentRoles: u.roles || [],
                              })
                            }
                            disabled={updateRoleMutation.isPending}
                          >
                            <SelectTrigger className="w-[100px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map(r => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (
                                confirm("Are you sure you want to delete this user?")
                              ) {
                                deleteUserMutation.mutate(u.userId);
                              }
                            }}
                            disabled={deleteUserMutation.isPending}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="surface-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="w-5 h-5 text-primary" />
                Role Management
              </CardTitle>
              <CardDescription>Create and delete platform roles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Role name..."
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="h-9"
                />
                <Button
                  size="sm"
                  onClick={() => createRoleMutation.mutate(newRoleName)}
                  disabled={createRoleMutation.isPending || !newRoleName}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>

              <div className="space-y-2">
                {roles.map((r) => (
                  <div key={r} className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
                    <span className="text-sm font-medium">{r}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => {
                        if (confirm(`Delete role "${r}"?`)) {
                          deleteRoleMutation.mutate(r);
                        }
                      }}
                      disabled={deleteRoleMutation.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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

export default AdminUsers;
