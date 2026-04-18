import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  TrendingUp,
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
    enabled: !!id,
  });

  const sections = course?.sections || [];

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments", "me"],
    queryFn: async () => {
      const response = await api.get("/Enrollment/me");
      return response.data;
    },
    enabled: !!user && user?.role === "Student",
  });

  // Permission Logic - تعديل ليكون أكثر مرونة مع الـ IDs
  const isInstructor =
    user?.role === "Instructor" &&
    (course?.instructorId?._id === user?.id ||
      course?.instructorId === user?.id);

  const isStudentEnrolled = enrollments.some(
    (e) => (e.courseId?._id || e.courseId) === id,
  );
  const currentEnrollment = enrollments.find(
    (e) => (e.courseId?._id || e.courseId) === id,
  );
  const hasAccess = isInstructor || isStudentEnrolled;

  // Mark Lesson as Complete Mutation
  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId) => {
      return api.patch(`/Enrollment/${currentEnrollment._id}/complete-lesson`, { lessonId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["enrollments", "me"]);
      toast({ title: "Lesson marked as complete!" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update progress",
        description: error.response?.data?.message || "Something went wrong",
      });
    },
  });

  const isLessonCompleted = (lessonId) => {
    return currentEnrollment?.completedLessons?.includes(lessonId);
  };

  const calculateProgress = () => {
    if (!currentEnrollment) return 0;
    return currentEnrollment.progress || 0;
  };

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
      queryClient.invalidateQueries(["course", id]); // تحديث بيانات الكورس بالكامل
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

      await api.post(`/Lesson/course/${id}`, {
        title: newLesson.title,
        description:
          newLesson.description || `Introduction to ${newLesson.title}`,
        type: "Lesson",
        videoUrl: cloudData.secure_url,
        sectionId: newLesson.sectionId || undefined,
      });

      toast({
        title: "Success",
        description: "Lesson added to course successfully!",
      });

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
      <div className="p-8 text-center text-lg font-medium flex items-center justify-center gap-2">
        <Loader2 className="animate-spin" /> Loading course details...
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
                <span className="font-medium">
                  {course.instructorId?.name || "Instructor"}
                </span>
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
            ) : (
              <div className="relative w-full h-full">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover opacity-60"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900" />
                )}
                {!hasAccess ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Play className="w-16 h-16 text-white/80" />
                  </div>
                ) : (
                  !activeLesson && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white space-y-4">
                      <Play className="w-16 h-16 text-white/80" />
                      <p className="text-lg font-medium">
                        Select a lesson to start learning
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <Card className="border-none shadow-md overflow-hidden">
            {isStudentEnrolled && (
              <div className="p-6 bg-primary/5 border-b space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-primary flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Your Progress
                  </h3>
                  <span className="font-bold text-primary">{calculateProgress()}%</span>
                </div>
                <div className="h-3 w-full bg-primary/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500" 
                    style={{ width: `${calculateProgress()}%` }}
                  />
                </div>
              </div>
            )}
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Course Content
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {sections.map((section) => (
                  <div key={section._id} className="p-5">
                    <h3 className="font-bold text-lg mb-3">{section.title}</h3>
                    <div className="space-y-2">
                      {course.contents
                        ?.filter((content) => {
                          const sId =
                            content.sectionId?._id || content.sectionId;
                          return sId === section._id;
                        })
                        .map((content, index) => (
                          <div
                            key={content._id || index}
                            className={`flex items-center justify-between p-3 cursor-pointer transition-all rounded group ${
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
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  isLessonCompleted(content._id)
                                    ? "bg-green-500 text-white"
                                    : activeLesson?._id === content._id
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-accent/20 text-muted-foreground"
                                }`}
                              >
                                {isLessonCompleted(content._id) ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                              </div>
                              <div>
                                <p
                                  className={`font-semibold ${activeLesson?._id === content._id ? "text-primary" : ""}`}
                                >
                                  {content.title}
                                </p>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] uppercase h-5"
                                >
                                  {content.contentType}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {isStudentEnrolled && content.contentType === "Lesson" && (
                                <Button
                                  size="sm"
                                  variant={isLessonCompleted(content._id) ? "ghost" : "outline"}
                                  className={`opacity-0 group-hover:opacity-100 transition-opacity ${isLessonCompleted(content._id) ? "text-green-600" : ""}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isLessonCompleted(content._id)) {
                                      completeLessonMutation.mutate(content._id);
                                    }
                                  }}
                                  disabled={isLessonCompleted(content._id) || completeLessonMutation.isPending}
                                >
                                  {isLessonCompleted(content._id) ? "Completed" : "Mark Done"}
                                </Button>
                              )}
                              {content.contentType === "Lesson" ? (
                                <Play
                                  className={`w-5 h-5 ${activeLesson?._id === content._id ? "text-primary animate-pulse" : "text-muted-foreground/40"}`}
                                />
                              ) : content.contentType === "Quiz" ? (
                                <Button size="sm" variant="outline" asChild onClick={(e) => e.stopPropagation()}>
                                  <Link to={`/dashboard/exam/${content._id}`}>Take Quiz</Link>
                                </Button>
                              ) : (
                                <FileText className="w-5 h-5 text-muted-foreground/40" />
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-2 border-primary/10 shadow-xl overflow-hidden">
            {isInstructor ? (
              <CardContent className="p-8 space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <Badge className="bg-primary/10 text-primary">
                      Instructor View
                    </Badge>
                    <h3 className="text-xl font-bold">Course Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your lessons and sections here.
                    </p>
                  </div>
                </div>

                <Dialog
                  open={isAddingContent}
                  onOpenChange={setIsAddingContent}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full py-6 flex items-center gap-2 border-dashed border-2 border-primary/50"
                    >
                      <PlusCircle className="w-5 h-5 text-primary" /> Add Quick
                      Lesson
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
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
                        <Label htmlFor="section">Section</Label>
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
                          <option value="">Select Section</option>
                          {sections.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.title}
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
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                            Uploading...
                          </>
                        ) : (
                          "Add Lesson"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={isAddingSection}
                  onOpenChange={setIsAddingSection}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full py-4 flex items-center gap-2 border-dashed border-2 border-green-500/50"
                    >
                      <PlusCircle className="w-5 h-5 text-green-500" /> Add
                      Section
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Section</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Label htmlFor="s-title">Title</Label>
                      <Input
                        id="s-title"
                        value={newSection.title}
                        onChange={(e) =>
                          setNewSection({
                            ...newSection,
                            title: e.target.value,
                          })
                        }
                      />
                      <Label htmlFor="s-desc">Description</Label>
                      <Input
                        id="s-desc"
                        value={newSection.description}
                        onChange={(e) =>
                          setNewSection({
                            ...newSection,
                            description: e.target.value,
                          })
                        }
                      />
                      <Button
                        className="w-full"
                        onClick={handleAddSection}
                        disabled={createSectionMutation.isPending}
                      >
                        {createSectionMutation.isPending
                          ? "Creating..."
                          : "Add Section"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  className="w-full py-6 text-lg font-bold"
                  onClick={() => navigate(`/dashboard/edit-course/${id}`)}
                >
                  Edit Full Course
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
                      <ShieldCheck className="w-5 h-5 text-green-500" />{" "}
                      <span>Full lifetime access</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <BookOpen className="w-5 h-5 text-primary" />{" "}
                      <span>{course.contents?.length || 0} Lessons</span>
                    </div>
                  </div>
                  <Button
                    className="w-full py-6 text-lg font-bold"
                    onClick={() => enrollMutation.mutate()}
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending ? "Processing..." : "Enroll Now"}
                  </Button>
                </CardContent>
              </>
            ) : (
              <CardContent className="p-8 space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold">You're Enrolled!</h3>
                  <p className="text-sm text-muted-foreground">
                    Start learning from the list on the left.
                  </p>
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
