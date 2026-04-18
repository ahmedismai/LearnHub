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
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";
import api from "@/api/axios";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const response = await api.get("/Category");
      return response.data;
    },
  });

  const categoryMutation = useMutation({
    mutationFn: async (data) => {
      if (editingCategory) {
        return await api.patch(`/Category/${editingCategory._id}`, data);
      }
      return await api.post("/Category", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "categories"]);
      toast.success(`Category ${editingCategory ? "updated" : "created"}!`);
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: "", description: "" });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/Category/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "categories"]);
      toast.success("Category deleted");
    },
  });

  if (isLoading) return <Skeleton className="h-60 w-full" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground mt-1">Organize courses by topic</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCategory(null);
              setFormData({ name: "", description: "" });
            }}>
              <Plus className="w-4 h-4 mr-2" /> New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit" : "Create"} Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Category Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Design, Business"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Briefly describe what this category covers"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => categoryMutation.mutate(formData)}
                disabled={categoryMutation.isPending}
              >
                {categoryMutation.isPending ? "Saving..." : "Save Category"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Platform Categories
          </CardTitle>
          <CardDescription>Manage how students browse content</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat._id}>
                  <TableCell className="font-bold">{cat.name}</TableCell>
                  <TableCell className="text-muted-foreground line-clamp-1">{cat.description}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCategory(cat);
                          setFormData({ name: cat.name, description: cat.description });
                          setIsModalOpen(true);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm("Delete this category?")) deleteMutation.mutate(cat._id);
                        }}
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

export default AdminCategories;
