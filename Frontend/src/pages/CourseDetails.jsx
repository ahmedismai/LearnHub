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
  MessageSquare,
  Sparkles,
  BrainCircuit,
  Lightbulb, // Added for AI generation modal
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter, // Added for modal actions
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AIQuizDialog from "@/components/AIQuizDialog";

const CourseDetails = () => {
  const [activeLesson, setActiveLesson] = useState(null);
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // AI Generation State for Quick Add Content (existing)
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState([]);
  const [isAiGenerating, setIsAiGenerating] = useState(false); // Used for quick add
  const [quickAddCount, setQuickAddCount] = useState(5);

  // New AI Assessment Generation State
  const [isAIGenerationModalOpen, setIsAIGenerationModalOpen] = useState(false);
  const [aiAssessmentType, setAiAssessmentType] = useState("Quiz");
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [isAIGeneratingAssessment, setIsAIGeneratingAssessment] = useState(false); // For dedicated AI button

  // Review State
  const [isReviewing, setIsReviewing] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: "" });

  // Fetch Reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const response = await api.get(`/Review/course/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Submit Review Mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      return api.post("/Review", { courseId: id, ...reviewData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["reviews", id]);
      setIsReviewing(false);
      setReview({ rating: 5, comment: "" });
      toast({ title: "Review submitted successfully!" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to submit review",
        description: error.response?.data?.message || "Something went wrong",
      });
    },
  });

  const handleReviewSubmit = () => {
    if (!review.comment.trim()) return;
    submitReviewMutation.mutate(review);
  };

  // AI Assessment Generation Mutation (for the new dedicated button)
  const generateAIAssessmentMutation = useMutation({
    mutationFn: async ({ type, count }) => {
      return api.post("/AI-Assessment/generate", {
        courseId: id,
        type,
        count,
      });
    },
    onMutate: () => {
      setIsAIGeneratingAssessment(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["course", id]); // Refresh course content
      setIsAIGenerationModalOpen(false);
      setAiQuestionCount(5); // Reset to default
      toast({
        title: "AI Assessment Generated! ✨",
        description: "Your new assessment has been added to the course.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "AI Generation Failed",
        description: error.response?.data?.message || "Something went wrong during AI generation.",
      });
    },
    onSettled: () => {
      setIsAIGeneratingAssessment(false);
    },
  });

  const handleGenerateAssessment = () => {
    if (aiQuestionCount <= 0) {
      return toast({
        variant: "destructive",
        title: "Invalid Count",
        description: "Question count must be a positive number.",
      });
    }
    generateAIAssessmentMutation.mutate({
      type: aiAssessmentType,
      count: aiQuestionCount,
    });
  };

  // State for Quick Add Content
  const [isAddingContent, setIsAddingContent] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [contentType, setContentType] = useState("Lesson");
  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    videoFile: null,
    sectionId: "",
    duration: 10,
    dueDate: "",
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

  // Permission Logic
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

  // AI Generate Handler
  const handleAIGenerate = async () => {
    if (!id || (contentType !== "Quiz" && contentType !== "Assignment")) return;
    setIsAiGenerating(true);
    try {
      const response = await api.post("/AI-Assessment/generate", {
        courseId: id,
        type: contentType,
        count: quickAddCount,
      });

      const { assessment } = response.data;

      if (contentType === "Quiz") {
        setNewContent({
          ...newContent,
          title: assessment.title || `Quick Quiz`,
          description: "AI-Generated Quiz based on lessons.",
        });
        setAiGeneratedQuestions(assessment.questions);
      } else if (contentType === "Assignment") {
        const firstTask = assessment.tasks?.[0];
        setNewContent({
          ...newContent,
          title: assessment.title || `Assignment`,
          description: firstTask ? `${firstTask.description}\n\nSuccess Criteria: ${firstTask.criteria}` : "AI-Generated Assignment.",
        });
      }

      toast({
        title: "AI Generation Success! ✨",
        description: `Generated details for your ${contentType} with ${quickAddCount} items. You can now save it.`,
      });
    } catch (error) {
      console.error("AI Gen Error:", error);
      toast({
        variant: "destructive",
        title: "AI Failed",
        description: "Could not generate content. Try manual entry.",
      });
    } finally {
      setIsAiGenerating(false);
    }
  };

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
      queryClient.invalidateQueries(["course", id]);
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

  // Handler for Quick Add Content
  const handleAddContent = async () => {
    if (!newContent.title) {
      return toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please provide a title.",
      });
    }

    if (contentType === "Lesson" && !newContent.videoFile) {
        return toast({
          variant: "destructive",
          title: "Video Required",
          description: "Please select a video file for the lesson.",
        });
    }

    if (contentType === "Assignment" && !newContent.dueDate) {
        return toast({
          variant: "destructive",
          title: "Due Date Required",
          description: "Please select a due date for the assignment.",
        });
    }

    setIsUploading(true);
    try {
      let videoUrl = "";
      if (contentType === "Lesson" && newContent.videoFile) {
        const formData = new FormData();
        formData.append("file", newContent.videoFile);
        formData.append("upload_preset", "ml_default");
        formData.append("folder", "learnhub_courses");

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/duevc5acm/video/upload`,
          { method: "POST", body: formData },
        );

        if (!cloudRes.ok) throw new Error("Cloudinary upload failed");
        const cloudData = await cloudRes.json();
        videoUrl = cloudData.secure_url;
      }

      const contentPayload = {
        title: newContent.title,
        description: newContent.description || "No description provided.",
        type: contentType,
        sectionId: newContent.sectionId || undefined,
      };

      if (contentType === "Lesson") {
        contentPayload.videoUrl = videoUrl;
      } else if (contentType === "Quiz") {
        contentPayload.duration = newContent.duration;
        // Include AI Generated questions if they exist
        if (aiGeneratedQuestions.length > 0) {
           contentPayload.questions = aiGeneratedQuestions;
        }
      } else if (contentType === "Assignment") {
        contentPayload.dueDate = newContent.dueDate;
      }

      await api.post(`/Course/${id}/contents`, contentPayload);

      toast({
        title: "Success",
        description: `${contentType} added successfully!`,
      });

      setIsAddingContent(false);
      setAiGeneratedQuestions([]);
      setNewContent({
        title: "",
        description: "",
        videoFile: null,
        sectionId: "",
        duration: 10,
        dueDate: "",
      });
      queryClient.invalidateQueries(["course", id]);
    } catch (error) {
      console.error("Add Content Error:", error);
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description: error.response?.data?.message || "Could not save content.",
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
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-medium">
                  {course.instructorId?.name || "Instructor"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5" />
                <span>{course.contents?.length || 0} items</span>
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
                onEnded={() => {
                  if (!isLessonCompleted(activeLesson._id)) {
                    completeLessonMutation.mutate(activeLesson._id);
                  }
                }}
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
                    className={`h-full transition-all duration-500 ${
                      calculateProgress() > 80 
                        ? "bg-green-500" 
                        : calculateProgress() >= 50 
                        ? "bg-yellow-500" 
                        : "bg-blue-500"
                    }`} 
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
                                  <Link to={`/dashboard/exam/${content._id}`}>
                                    {isInstructor ? "Preview Quiz" : "Take Quiz"}
                                  </Link>
                                </Button>
                              ) : (
                                <div className="flex items-center gap-3">
                                   <FileText className="w-5 h-5 text-muted-foreground/40" />
                                   <Button size="sm" variant="outline" asChild onClick={(e) => e.stopPropagation()}>
                                      <Link to={isInstructor ? "/dashboard/assignments" : "/dashboard/assignments"}>
                                        {isInstructor ? "View Assignments" : "Submit"}
                                      </Link>
                                    </Button>
                                </div>
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

          <Card className="border-none shadow-md">
            <CardHeader className="border-b flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Student Reviews
              </CardTitle>
              {isStudentEnrolled && (
                <Dialog open={isReviewing} onOpenChange={setIsReviewing}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Write a Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Share your experience</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Rating (1-5)</Label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setReview({ ...review, rating: star })}
                              className={`text-2xl ${review.rating >= star ? "text-yellow-500" : "text-muted"}`}
                            >
                              <Star className={review.rating >= star ? "fill-yellow-500" : ""} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comment">Your Feedback</Label>
                        <Textarea
                          id="comment"
                          placeholder="What did you think of this course?"
                          value={review.comment}
                          onChange={(e) => setReview({ ...review, comment: e.target.value })}
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleReviewSubmit}
                        disabled={submitReviewMutation.isPending || !review.comment.trim()}
                      >
                        {submitReviewMutation.isPending ? "Submitting..." : "Post Review"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((r) => (
                    <div key={r._id} className="flex gap-4 border-b last:border-0 pb-6 last:pb-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                        {r.studentId?.name?.[0] || "U"}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold">{r.studentId?.name || "User"}</h4>
                          <div className="flex text-yellow-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < r.rating ? "fill-yellow-500" : "text-muted"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm italic">
                          "{r.comment}"
                        </p>
                        <p className="text-[10px] text-muted-foreground pt-1">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No reviews yet. Be the first to review!</p>
                  </div>
                )}
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
                  </div>
                </div>

                <div className="space-y-4">
                  <AIQuizDialog 
                    courseId={id} 
                    mode="instructor" 
                    buttonText="AI Smart Generator" 
                  />
                  
                  {/* Existing Add Content Dialog */}
                  <Dialog
                    open={isAddingContent}
                  onOpenChange={(open) => {
                    setIsAddingContent(open);
                    if (!open) {
                      setAiGeneratedQuestions([]);
                      setNewContent({ title: "", description: "", videoFile: null, sectionId: "", duration: 10, dueDate: "" });
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full py-6 flex items-center gap-2 border-dashed border-2 border-primary/50 hover:bg-primary/5"
                    >
                      <PlusCircle className="w-5 h-5 text-primary" /> Add Content
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <div className="flex justify-between items-center">
                         <DialogTitle>Add New Content</DialogTitle>
                         {(contentType === "Quiz" || contentType === "Assignment") && (
                           <div className="flex items-center gap-2">
                             <Input 
                                type="number"
                                min="1"
                                max="15"
                                value={quickAddCount}
                                onChange={(e) => setQuickAddCount(parseInt(e.target.value) || 1)}
                                className="w-16 h-8 text-center text-xs border-primary/30"
                             />
                             <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={handleAIGenerate}
                              disabled={isAiGenerating}
                              className="text-xs border-primary text-primary"
                             >
                                {isAiGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                AI Smart Fill
                             </Button>
                           </div>
                         )}
                      </div>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Content Type</Label>
                        <select
                          className="w-full p-2 border rounded"
                          value={contentType}
                          onChange={(e) => {
                            setContentType(e.target.value);
                            setAiGeneratedQuestions([]);
                          }}
                        >
                          <option value="Lesson">Lesson (Video)</option>
                          <option value="Quiz">Quiz</option>
                          <option value="Assignment">Assignment</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={newContent.title}
                          onChange={(e) =>
                            setNewContent({
                              ...newContent,
                              title: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="desc">Description</Label>
                        <Textarea
                          id="desc"
                          value={newContent.description}
                          onChange={(e) =>
                            setNewContent({
                              ...newContent,
                              description: e.target.value,
                            })
                          }
                          className="min-h-[100px]"
                        />
                      </div>

                      {contentType === "Lesson" && (
                        <div className="space-y-2">
                          <Label htmlFor="video">Video File</Label>
                          <Input
                            id="video"
                            type="file"
                            accept="video/*"
                            onChange={(e) =>
                              setNewContent({
                                ...newContent,
                                videoFile: e.target.files[0],
                              })
                            }
                          />
                        </div>
                      )}

                      {contentType === "Quiz" && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            {aiGeneratedQuestions.length > 0 && (
                              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                {aiGeneratedQuestions.length} AI Questions Ready
                              </Badge>
                            )}
                          </div>
                          <Input
                            id="duration"
                            type="number"
                            value={newContent.duration}
                            onChange={(e) =>
                              setNewContent({
                                ...newContent,
                                duration: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                      )}

                      {contentType === "Assignment" && (
                        <div className="space-y-2">
                          <Label htmlFor="dueDate">Due Date</Label>
                          <Input
                            id="dueDate"
                            type="date"
                            value={newContent.dueDate}
                            onChange={(e) =>
                              setNewContent({
                                ...newContent,
                                dueDate: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="section">Section</Label>
                        <select
                          id="section"
                          value={newContent.sectionId}
                          onChange={(e) =>
                            setNewContent({
                              ...newContent,
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
                        className="w-full py-6 text-lg font-bold"
                        onClick={handleAddContent}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                            Processing...
                          </>
                        ) : (
                          `Save ${contentType}`
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Existing Add Section Dialog */}
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
                </div>
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
                      <span>{course.contents?.length || 0} items</span>
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
                <AIQuizDialog courseId={id} mode="student" />
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
