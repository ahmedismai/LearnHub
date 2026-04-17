import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Plus, Trash2, Video, Image as ImageIcon, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// تحديث الـ Schema ليشمل الدروس
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
  contents: z
    .array(
      z.object({
        title: z.string().min(1, "Lesson title is required"),
        contentType: z.string().default("Lesson"),
        videoUrl: z.string().optional(),
        id: z.string().optional(),
        _id: z.string().optional(),
      }),
    )
    .optional(),
});

const CreateCourse = () => {
  const { id } = useParams(); // الحصول على الـ ID لو موجود (وضع التعديل)
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [realCategories, setRealCategories] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(isEditMode);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      categoryId: "",
      level: "",
      thumbnail: null,
      contents: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contents",
  });

  // 1. جلب التصنيفات + جلب بيانات الكورس لو في وضع التعديل
  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await api.get("/categories");
        setRealCategories(catRes.data);

        if (isEditMode) {
          const courseRes = await api.get(`/courses/${id}`);
          const course = courseRes.data;

          form.reset({
            title: course.title,
            description: course.description,
            price: course.price,
            categoryId: course.categoryId?._id || course.categoryId,
            level: course.level,
            contents: course.contents || [],
            thumbnail: null, // التمبنيلي يفضل مرفوع كما هو إلا لو المستخدم غيره
          });
        }
      } catch (error) {
        console.error("Fetch error:", error);
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
  }, [id, isEditMode, form, toast]);

  // 2. دالة الرفع لـ Cloudinary (تدعم الصور والفيديو)
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default");
    const resourceType = file.type.startsWith("video") ? "video" : "image";

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/duevc5acm/${resourceType}/upload`,
      { method: "POST", body: formData },
    );
    const data = await response.json();
    return data.secure_url;
  };

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      // رفع الـ Thumbnail لو تم اختياره
      let thumbnailUrl = form.getValues("thumbnailUrl") || "";
      if (values.thumbnail?.[0]) {
        thumbnailUrl = await uploadToCloudinary(values.thumbnail[0]);
      }

      const payload = {
        ...values,
        thumbnail: thumbnailUrl || "",
      };

      if (isEditMode) {
        await api.put(`/courses/${id}`, payload);
        toast({
          title: "Updated!",
          description: "Course updated successfully.",
        });
      } else {
        await api.post("/courses", payload);
        toast({
          title: "Created!",
          description: "Course published successfully.",
        });
      }
      navigate("/dashboard/my-courses");
    } catch (error) {
      toast({
        title: "Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDataLoading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? "Edit Course" : "Create New Course"}
          </h1>
          <p className="text-muted-foreground">
            Manage your course details and content.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6">
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
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
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
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {levels
                            .filter((l) => l !== "All")
                            .map((lvl) => (
                              <SelectItem key={lvl} value={lvl}>
                                {lvl}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field: { onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Thumbnail Image</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onChange(e.target.files)}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* قسم إضافة الدروس */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Video className="w-6 h-6" /> Course Content
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ title: "", contentType: "Lesson", videoUrl: "" })
                }
              >
                <Plus className="w-4 h-4 mr-2" /> Add Lesson
              </Button>
            </div>

            {fields.map((field, index) => (
              <Card key={field.id} className="bg-muted/30">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-4">
                      <FormField
                        control={form.control}
                        name={`contents.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lesson {index + 1} Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Lesson Title" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={async (e) => {
                            if (e.target.files?.[0]) {
                              toast({
                                title: "Uploading video...",
                                description: "Please wait.",
                              });
                              const url = await uploadToCloudinary(
                                e.target.files[0],
                              );
                              form.setValue(`contents.${index}.videoUrl`, url);
                              toast({ title: "Video Uploaded!" });
                            }
                          }}
                        />
                        {form.watch(`contents.${index}.videoUrl`) && (
                          <Badge variant="secondary">Video Ready</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            type="submit"
            className="w-full py-6 text-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
            {isEditMode ? "Update Course" : "Publish Course"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default CreateCourse;
