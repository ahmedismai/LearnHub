import { useState, useEffect } from "react"; // ضفنا useEffect
import { useNavigate } from "react-router-dom";
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
import api from "@/api/axios";
import { levels } from "@/data/mockData"; // شيلنا categories من هنا

const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters." }),
  price: z.preprocess((val) => Number(val), z.number().positive()),
  categoryId: z.string().min(1, { message: "Please select a category." }), // غيرنا اسمها لـ categoryId
  level: z.string().min(1, { message: "Please select a level." }),
  thumbnail: z.any().optional(),
});

const CreateCourse = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [realCategories, setRealCategories] = useState([]); // لجلب البيانات الحقيقية

  // جلب الكاتيجوريز الحقيقية من الداتابيز
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        setRealCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      categoryId: "",
      level: "",
      thumbnail: null,
    },
  });

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(values).forEach((key) => {
        if (key === "thumbnail" && values[key]) {
          formData.append(key, values[key][0]);
        } else {
          formData.append(key, values[key]); // سيفضل الاسم categoryId كما هو في الـ Schema
        }
      });

      await api.post("/courses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast({ title: "Course Created Successfully!" });
      navigate("/dashboard/my-courses");
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Check validation errors.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Create New Course
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* ... الحقول السابقة (title, description, price) كما هي ... */}

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a real category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {realCategories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ... حقل Level و Thumbnail ... */}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Course"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default CreateCourse;
