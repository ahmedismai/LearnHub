import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import {
  BookOpen,
  Clock,
  FileText,
  Play,
  ShieldCheck,
  Star,
  Users,
  CheckCircle2,
  PlusCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const CourseDetails = () => {
  const [activeLesson, setActiveLesson] = useState(null);
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for Quick Add Content
  const [isAddingContent, setIsAddingContent] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    videoFile: null,
    sectionId: "",
  });

  // State for Add Section
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSection, setNewSection] = useState({
    title: "",
    description: "",
  });

  // Fetch Course Details
  const { data: course, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => {
      const response = await api.get(`/Course/${id}`);
      return response.data;
    },
  });

  // Fetch Sections
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ["sections", id],
    queryFn: async () => {
      const response = await api.get(`/Section/course/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Permission Logic
  const isInstructor =
    user?.role === "Instructor" && course?.instructorId?._id === user?.id;
  const isStudentEnrolled = enrollments.some((e) => e.courseId?._id === id);
  const hasAccess = isInstructor || isStudentEnrolled;

  // Enrollment Mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      return api.post("/Enrollment", { courseId: id, paymentMethod: "Visa" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["enrollments", "me"]);
      toast({ title: "Enrolled successfully!" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Enrollment failed",
        description: error.response?.data?.message || "Something went wrong",
      });
    },
  });

  // Create Section Mutation
  const createSectionMutation = useMutation({
    mutationFn: async (sectionData) => {
      return api.post("/Section", { courseId: id, ...sectionData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["sections", id]);
      setIsAddingSection(false);
      setNewSection({ title: "", description: "" });
      toast({ title: "Section created successfully!" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create section",
        description: error.response?.data?.message || "Something went wrong",
      });
    },
  });

  // Handler for Quick Add Lesson
  const handleAddContent = async () => {
    if (!newLesson.title || !newLesson.videoFile) {
      return toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please provide both a title and a video file.",
      });
    }

    setIsUploading(true);
    try {
      // 1. Upload video to Cloudinary

      const formData = new FormData();
      formData.append("file", newLesson.videoFile);
      formData.append("upload_preset", "ml_default");
      formData.append("folder", "learnhub_courses");

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/duevc5acm/video/upload`,
        { method: "POST", body: formData },
      );

      if (!cloudRes.ok) throw new Error("Cloudinary upload failed");
      const cloudData = await cloudRes.json();

      // 2. Save lesson to Backend API
      await api.post(`/Lesson/course/${id}`, {
        title: newLesson.title,
        description:
          newLesson.description || `Introduction to ${newLesson.title}`,
        type: "Lesson",
        videoUrl: cloudData.secure_url,
        sectionId: newLesson.sectionId || undefined, // Optional
      });

      toast({
        title: "Success",
        description: "Lesson added to course successfully!",
      });

      // 3. Reset state and refresh UI
      setIsAddingContent(false);
      setNewLesson({
        title: "",
        description: "",
        videoFile: null,
        sectionId: "",
      });
      queryClient.invalidateQueries(["course", id]);
    } catch (error) {
      console.error("Add Content Error:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description:
          error.response?.data?.message || "Could not save the lesson.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handler for Add Section
  const handleAddSection = () => {
    if (!newSection.title || !newSection.description) {
      return toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please provide both title and description.",
      });
    }
    createSectionMutation.mutate(newSection);
  };

  if (isLoading)
    return (
      <div className="p-8 text-center text-lg font-medium">
        Loading course details...
      </div>
    );
  if (!course)
    return (
      <div className="p-8 text-center text-lg font-medium">
        Course not found
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Course Header & Player */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <Badge variant="secondary" className="px-3 py-1">
              {course.categoryId?.name || "General"}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              {course.title}
            </h1>
            <p className="text-xl text-muted-foreground">
              {course.description}
            </p>

            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-medium">{course.instructorId?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">4.8 (120 reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5" />
                <span>{course.contents?.length || 0} modules</span>
              </div>
            </div>
          </div>

          {/* Video Player Section */}
          <div className="aspect-video relative rounded-2xl overflow-hidden bg-black border shadow-sm border-primary/20">
            {hasAccess && activeLesson?.videoUrl ? (
              <video
                key={activeLesson.videoUrl}
                src={activeLesson.videoUrl}
                controls
                className="w-full h-full"
                autoPlay
                poster={course.thumbnail}
              />
            ) : course.thumbnail ? (
              <div className="relative w-full h-full">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover opacity-60"
                />
                {!hasAccess && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Play className="w-16 h-16 text-white/80" />
                  </div>
                )}
                {hasAccess && !activeLesson && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white space-y-4">
                    <Play className="w-16 h-16 text-white/80" />
                    <p className="text-lg font-medium">
                      Select a lesson to start learning
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-16 h-16 text-muted-foreground/20" />
              </div>
            )}
          </div>

          {/* Course Content List */}
          <Card className="border-none shadow-md">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Course Content
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {course.contents?.map((content, index) => (
                  <div
                    key={content._id || content.id}
                    className={`flex items-center justify-between p-5 cursor-pointer transition-all ${
                      activeLesson?.id === content.id ||
                      activeLesson?._id === content._id
                        ? "bg-primary/5 border-l-4 border-primary"
                        : "hover:bg-accent/5 border-l-4 border-transparent"
                    }`}
                    onClick={() =>
                      hasAccess &&
                      content.contentType === "Lesson" &&
                      setActiveLesson(content)
                    }
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          activeLesson?.id === content.id ||
                          activeLesson?._id === content._id
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent/20 text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p
                          className={`font-semibold ${
                            activeLesson?.id === content.id ||
                            activeLesson?._id === content._id
                              ? "text-primary"
                              : ""
                          }`}
                        >
                          {content.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase h-5"
                          >
                            {content.contentType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {content.contentType === "Lesson" ? (
                      <Play
                        className={`w-5 h-5 ${
                          activeLesson?.id === content.id ||
                          activeLesson?._id === content._id
                            ? "text-primary animate-pulse"
                            : "text-muted-foreground/40"
                        }`}
                      />
                    ) : (
                      <FileText className="w-5 h-5 text-muted-foreground/40" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Instructor/Student Controls */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-2 border-primary/10 shadow-xl overflow-hidden">
            {isInstructor ? (
              <CardContent className="p-8 space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-primary/20">
                      Instructor View
                    </Badge>
                    <h3 className="text-xl font-bold text-foreground">
                      Course Management
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      You are the instructor. You can quickly add content or
                      manage the full course settings.
                    </p>
                  </div>
                </div>

                {/* Quick Add Content Dialog */}
                <Dialog
                  open={isAddingContent}
                  onOpenChange={setIsAddingContent}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full py-6 flex items-center gap-2 border-dashed border-2 border-primary/50 hover:bg-primary/5 transition-colors"
                    >
                      <PlusCircle className="w-5 h-5 text-primary" />
                      Add Quick Lesson
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Lesson</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Lesson Title</Label>
                        <Input
                          id="title"
                          value={newLesson.title}
                          onChange={(e) =>
                            setNewLesson({
                              ...newLesson,
                              title: e.target.value,
                            })
                          }
                          placeholder="e.g. 01 - Getting Started"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="video">Video Lesson</Label>
                        <Input
                          id="video"
                          type="file"
                          accept="video/*"
                          onChange={(e) =>
                            setNewLesson({
                              ...newLesson,
                              videoFile: e.target.files[0],
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="section">Section (Optional)</Label>
                        <select
                          id="section"
                          value={newLesson.sectionId}
                          onChange={(e) =>
                            setNewLesson({
                              ...newLesson,
                              sectionId: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded"
                        >
                          <option value="">Default Section</option>
                          {sections.map((section) => (
                            <option key={section._id} value={section._id}>
                              {section.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleAddContent}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading Video...
                          </>
                        ) : (
                          "Add Lesson"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Add Section Dialog */}
                <Dialog
                  open={isAddingSection}
                  onOpenChange={setIsAddingSection}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full py-4 flex items-center gap-2 border-dashed border-2 border-green-500/50 hover:bg-green-500/5 transition-colors"
                    >
                      <PlusCircle className="w-5 h-5 text-green-500" />
                      Add Section
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Section</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="section-title">Section Title</Label>
                        <Input
                          id="section-title"
                          value={newSection.title}
                          onChange={(e) =>
                            setNewSection({
                              ...newSection,
                              title: e.target.value,
                            })
                          }
                          placeholder="e.g. Introduction"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="section-description">Description</Label>
                        <Input
                          id="section-description"
                          value={newSection.description}
                          onChange={(e) =>
                            setNewSection({
                              ...newSection,
                              description: e.target.value,
                            })
                          }
                          placeholder="Brief description of the section"
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleAddSection}
                        disabled={createSectionMutation.isPending}
                      >
                        {createSectionMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Add Section"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  className="w-full py-6 text-lg font-bold shadow-lg"
                  onClick={() => navigate(`/dashboard/edit-course/${id}`)}
                >
                  Edit Full Course
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/dashboard/my-courses")}
                >
                  Back to Dashboard
                </Button>
              </CardContent>
            ) : !isStudentEnrolled ? (
              <>
                <div className="bg-primary/5 p-8 text-center border-b">
                  <span className="text-4xl font-bold text-primary">
                    ${course.price}
                  </span>
                </div>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                      <span>Full lifetime access</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <span>
                        {course.contents?.length || 0} Lessons & Resources
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full py-6 text-lg font-bold shadow-lg"
                    size="lg"
                    onClick={() => enrollMutation.mutate()}
                    disabled={enrollMutation.isLoading}
                  >
                    {enrollMutation.isLoading ? "Processing..." : "Enroll Now"}
                  </Button>
                </CardContent>
              </>
            ) : (
              <CardContent className="p-8 space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground">
                      You're Enrolled!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Pick a lesson from the list on the left to start watching.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      Overall Progress
                    </span>
                    <span className="font-bold text-primary">0%</span>
                  </div>
                  <div className="w-full bg-accent h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[0%]" />
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/dashboard/my-courses")}
                >
                  Back to My Courses
                </Button>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
