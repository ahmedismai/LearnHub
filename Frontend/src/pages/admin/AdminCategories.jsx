import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Layers, Search, Filter } from "lucide-react";
import api from "@/api/axios";
import categoryService from "@/api/category";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getFullUrl } from "@/lib/urlHelper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", image: null });
  const [searchTerm, setSearchTerm] = useState("");

  const { data: response, isLoading } = useQuery({
    queryKey: ["Administrator", "categories"],
    queryFn: () => categoryService.getAll(),
  });

  const categories = response?.data || [];
  
  const filteredCategories = categories.filter(cat => 
    cat.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoryMutation = useMutation({
    mutationFn: async (data) => {
      const fd = new FormData();
      fd.append("CategoryName", data.name);
      fd.append("Description", data.description);
      if (data.image) fd.append("ImgURL", data.image);

      if (editingCategory) {
        return await categoryService.update(editingCategory.categoryId, fd);
      }
      return await categoryService.create(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["Administrator", "categories"]);
      toast.success(`Category ${editingCategory ? "updated" : "created"}!`);
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: "", description: "", image: null });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => categoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["Administrator", "categories"]);
      toast.success("Category deleted");
    },
    onError: (error) => toast.error(error.response?.data?.message || "Error"),
  });

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page__head">
        <div>
          <h1 className="page__title">Categories</h1>
          <p className="page__subtitle">
            Organize and manage how courses are classified.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search categories..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingCategory(null);
                setFormData({ name: "", description: "", image: null });
              }} className="shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> New Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-outfit text-2xl">
                  {editingCategory ? "Edit" : "Create"} Category
                </DialogTitle>
                <CardDescription>
                  Enter the details for the category below.
                </CardDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Category Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Design, Business"
                    className="h-11 border-border/60 focus:border-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
                  <Textarea
                    id="desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Briefly describe what this category covers"
                    className="min-h-[100px] border-border/60 focus:border-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Category Image</Label>
                  <div className="flex items-center gap-4">
                     {editingCategory?.imgPath && !formData.image && (
                       <Avatar className="h-12 w-12 rounded-lg">
                         <AvatarImage src={getFullUrl(editingCategory.imgPath, "Category")} />
                         <AvatarFallback><Layers /></AvatarFallback>
                       </Avatar>
                     )}
                     <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        className="h-10 cursor-pointer text-xs"
                        onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                      />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  className="w-full h-11 shadow-accent-glow"
                  onClick={() => categoryMutation.mutate(formData)}
                  disabled={categoryMutation.isPending}
                >
                  {categoryMutation.isPending ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="surface-glass overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-background/50 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="font-outfit text-xl">Platform Categories</CardTitle>
                <CardDescription>Manage your curriculum structure</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-white/80 px-3 py-1.5 rounded-full border border-border/40">
              <span className="text-primary">{filteredCategories.length}</span> Categories Total
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="data-list">
            <div className="data-list__head grid-cols-[90px,1fr,1.5fr,1fr]">
              <span>Icon</span>
              <span>Name</span>
              <span>Description</span>
              <span className="text-right">Actions</span>
            </div>
              {filteredCategories.map((cat) => (
                <div key={cat.categoryId} className="data-list__row grid-cols-[90px,1fr,1.5fr,1fr] group">
                  <div className="data-list__cell" data-label="Icon">
                    <Avatar className="h-12 w-12 rounded-xl border border-border/40 shadow-sm overflow-hidden transition-transform group-hover:scale-105">
                      <AvatarImage 
                        src={getFullUrl(cat.imgPath, "Category")} 
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/5 text-primary">
                        <Layers className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="data-list__cell font-bold text-foreground font-outfit text-base" data-label="Name">
                    {cat.categoryName}
                  </div>
                  <div className="data-list__cell text-muted-foreground max-w-md" data-label="Description">
                    <p className="line-clamp-2 text-sm">{cat.description || "No description provided."}</p>
                  </div>
                  <div className="data-list__cell data-list__actions" data-label="Actions">
                    <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingCategory(cat);
                          setFormData({ name: cat.categoryName, description: cat.description || "", image: null });
                          setIsModalOpen(true);
                        }}
                        className="h-9 w-9 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Delete this category?")) deleteMutation.mutate(cat.categoryId);
                        }}
                        className="h-9 w-9 p-0 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredCategories.length === 0 && (
                <div className="empty-state">
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-full bg-muted p-4 text-muted-foreground">
                        <Layers className="w-10 h-10" />
                      </div>
                      <p className="text-muted-foreground font-medium italic">No categories matching your search.</p>
                      <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>Clear Search</Button>
                    </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCategories;
