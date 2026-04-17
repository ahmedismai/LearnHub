import { useState, useEffect } from "react";
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
import { levels } from "@/data/mockData";

const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters." }),
  price: z.preprocess(
    (val) => Number(val),
    z.number().positive({ message: "Price must be positive." }),
  ),
  categoryId: z.string().min(1, { message: "Please select a category." }),
  level: z.string().min(1, { message: "Please select a level." }),
  thumbnail: z.any().optional(),
});

const CreateCourse = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [realCategories, setRealCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        setRealCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast({
          title: "Warning",
          description: "Could not load categories from server.",
          variant: "destructive",
        });
      }
    };
    fetchCategories();
  }, [toast]);

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

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default");

    const cloudName = "duevc5acm";

    const resourceType = file.type.startsWith("video") ? "video" : "image";

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Upload failed");
      }

      const data = await response.json();
      return data.secure_url;
    } catch (err) {
      console.error("Cloudinary Error:", err);
      throw err;
    }
  };

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      let thumbnailUrl = "";

      if (values.thumbnail && values.thumbnail[0]) {
        toast({
          title: "Uploading image...",
          description: "Please wait while we process the thumbnail.",
        });
        thumbnailUrl = await uploadToCloudinary(values.thumbnail[0]);
      }

      const payload = {
        title: values.title,
        description: values.description,
        price: values.price,
        categoryId: values.categoryId,
        level: values.level,
        thumbnail: thumbnailUrl,
      };

      await api.post("/courses", payload);

      toast({
        title: "Success!",
        description: "Course created successfully and is now live.",
      });
      navigate("/dashboard/my-courses");
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Creation Failed",
        description:
          error.response?.data?.error ||
          error.message ||
          "Please check all fields and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Create New Course
        </h1>
        <p className="text-muted-foreground mt-1">
          Fill in the details to publish your course.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 bg-card p-6 rounded-lg border"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Master React.js from Scratch"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What will students learn?"
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {levels
                        .filter((l) => l !== "All")
                        .map((lvl) => {
                          const formattedLevel =
                            lvl.charAt(0).toUpperCase() +
                            lvl.slice(1).toLowerCase();
                          return (
                            <SelectItem key={lvl} value={formattedLevel}>
                              {formattedLevel}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnail"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Thumbnail Image</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onChange(e.target.files)}
                      {...fieldProps}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full md:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Publish Course"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default CreateCourse;
