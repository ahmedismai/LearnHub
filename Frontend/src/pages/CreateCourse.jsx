import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import courseService from "@/api/course";
import accountService from "@/api/account";
import categoryService from "@/api/category";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ✅ UPDATED SCHEMA (added instructorId for Admin)
const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters." }),
  price: z.preprocess(
    (val) => Number(val),
    z.number().min(0, { message: "Price must be 0 or more." }),
  ),
  categoryId: z.string().min(1, { message: "Please select a category." }),

  // 🔥 NEW FIELD
  instructorId: z.string().optional(),

  thumbnail: z.any().optional(),
});

const CreateCourse = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [realCategories, setRealCategories] = useState([]);
  const [instructors, setInstructors] = useState([]); // 🔥 NEW
  const [isDataLoading, setIsDataLoading] = useState(isEditMode);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      categoryId: "",
      instructorId: "", // 🔥 NEW
      thumbnail: null,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await categoryService.getList();
        setRealCategories(catRes.data || []);

        // 🔥 GET INSTRUCTORS ONLY FOR ADMIN
        if (user?.role === "Administrator") {
          const usersRes = await accountService.getAllUsers();
          const allUsers = usersRes.data || [];
          const instructorList = allUsers.filter((u) =>
            u.roles?.includes("Instructor"),
          );
          setInstructors(instructorList);
        }

        if (isEditMode) {
          const courseRes = await courseService.getById(id);
          const course = courseRes.data;

          form.reset({
            title: course.title,
            description: course.description,
            price: course.price,
            categoryId: String(course.categoryId),
            instructorId: String(course.instructorId || ""), // 🔥 NEW
            thumbnail: null,
          });
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Could not load data.",
          variant: "destructive",
        });
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode, form, toast, user]);

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("price", values.price);
      formData.append("categoryId", values.categoryId);
      formData.append("level", "Beginner");

      // 🔥 ADMIN MUST SEND INSTRUCTOR ID
      if (user?.role === "Administrator" && values.instructorId) {
        formData.append("instructorId", values.instructorId);
      }

      if (values.thumbnail && values.thumbnail instanceof File) {
        formData.append("thumbnail", values.thumbnail);
      }

      if (isEditMode) {
        await courseService.update(id, formData);
        toast({
          title: "Success!",
          description: "Course updated successfully.",
        });
      } else {
        const res = await courseService.create(formData);
        const currentCourseId = res.data?.courseId || res.data?.id || res.data?._id;

        toast({
          title: "Success!",
          description: "Course created!",
        });

        navigate(`/dashboard/courses/${currentCourseId}`);
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to save course.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDataLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in pb-12">
      <div className="page__head">
        <div>
          <h1 className="page__title flex items-center gap-3">
            <BookOpen className="h-9 w-9 text-primary" />
            {isEditMode ? "Edit Course" : "Create Course"}
          </h1>
          <p className="page__subtitle">
            Configure the course details, ownership, pricing, and catalog image.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="surface-glass">
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
          {/* TITLE */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* DESCRIPTION */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea className="min-h-[140px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* PRICE + CATEGORY */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {realCategories.map((cat) => (
                        <SelectItem
                          key={cat.categoryId}
                          value={String(cat.categoryId)}
                        >
                          {cat.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 🔥 ADMIN ONLY INSTRUCTOR SELECT */}
          {user?.role === "Administrator" && (
            <FormField
              control={form.control}
              name="instructorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select instructor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {instructors.map((ins) => (
                        <SelectItem key={ins.userId} value={String(ins.userId)}>
                          {ins.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* THUMBNAIL */}
          <FormField
            control={form.control}
            name="thumbnail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thumbnail</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    onChange={(e) => field.onChange(e.target.files?.[0])}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
            </CardContent>
          </Card>

          {/* SUBMIT */}
          <Button type="submit" className="h-12 w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
            {isEditMode ? "Update Course" : "Create Course"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default CreateCourse;
