import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Clock,
  Play,
  Edit2,
  Trash2,
  CheckCircle2,
  PlusCircle,
  ClipboardList,
  MessageSquare,
  Star,
  GraduationCap,
  Loader2,
  ChevronRight,
  Globe,
  CalendarClock,
  BookOpen,
  Zap,
  Heart,
} from "lucide-react";

// Import shadcn/ui components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Import AI components and services
import { useAuth } from "@/contexts/AuthContext";
import courseService from "@/api/course";
import reviewService from "@/api/review";
import enrollmentService from "@/api/enrollment";
import examService from "@/api/exam";
import lessonProgressService from "@/api/lessonProgress";
import orderService from "@/api/order";
import lessonService from "@/api/lesson";
import sectionService from "@/api/section";
import AIQuizDialog from "@/components/AIQuizDialog";
import { getFullUrl } from "@/lib/urlHelper";

const CourseDetails = () => {
  const [activeLesson, setActiveLesson] = useState(null);
  const { id } = useParams();
  const hasCourseId = Boolean(id && id !== "undefined" && id !== "null");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Queries ---
  const { data: courseResponse, isLoading: isCourseLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: () => courseService.getById(id),
    enabled: hasCourseId,
  });

  const course = courseResponse?.data;
  const sections = course?.sections || [];

  const { data: reviewsResponse } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => reviewService.getAllByCourse(id),
    enabled: hasCourseId,
  });

  const reviews = reviewsResponse?.data || [];

  const { data: enrollmentsResponse } = useQuery({
    queryKey: ["enrollments", "me"],
    queryFn: () => enrollmentService.getByStudent(user?.id),
    enabled: !!user && (user.role === "Student" || user.role === "Administrator"),
  });

  const enrollments = enrollmentsResponse?.data || [];
  const currentEnrollment = enrollments.find(
    (e) => String(e.courseId) === String(id),
  );
  const isStudentEnrolled = !!currentEnrollment;
  const isInstructor =
    user?.role === "Instructor" && String(course?.instructorId) === String(user?.id);
  const isAdmin = user?.role === "Administrator";
  const hasAccess = isInstructor || isStudentEnrolled || isAdmin;

  const { data: progressResponse } = useQuery({
    queryKey: ["progress", currentEnrollment?.enrollmentId],
    queryFn: () =>
      lessonProgressService.getProgress(currentEnrollment.enrollmentId),
    enabled: !!currentEnrollment,
  });

  const progressData = progressResponse?.data;

  const { data: examsResponse } = useQuery({
    queryKey: ["course-exams", id],
    queryFn: () => examService.getByCourse(id),
    enabled: hasCourseId && hasAccess,
  });
  const courseExams = examsResponse?.data || [];

  // --- Mutations ---
  const addReviewMutation = useMutation({
    mutationFn: (newReview) => reviewService.create(newReview),
    onSuccess: () => {
      queryClient.invalidateQueries(["reviews", id]);
      toast({ title: "Review submitted successfully!" });
      setIsReviewing(false);
      setReview({ rating: 5, comment: "" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to submit review",
        description: error.response?.data?.message || "Something went wrong",
      });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (studentId) => reviewService.delete(id, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries(["reviews", id]);
      toast({ title: "Review deleted successfully!" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete review",
        description: error.response?.data?.message || "Something went wrong",
      });
    },
  });

  const addSectionMutation = useMutation({
    mutationFn: (sectionData) => sectionService.create(sectionData),
    onSuccess: () => {
      queryClient.invalidateQueries(["course", id]);
      toast({ title: "Section added successfully!" });
      setIsAddingSection(false);
      setNewSection({ title: "" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to add section",
        description: error.response?.data?.message || "Something went wrong",
      });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, title }) =>
      sectionService.update(sectionId, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries(["course", id]);
      toast({ title: "Section updated successfully!" });
      setIsAddingSection(false);
      setIsEditingSection(false);
      setSelectedSection(null);
      setNewSection({ title: "" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update section",
        description: error.response?.data?.message || "Something went wrong",
      });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId) => sectionService.delete(sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries(["course", id]);
      toast({ title: "Section deleted successfully!" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete section",
        description: error.response?.data?.message || "Something went wrong",
      });
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast({
          title: "Please login to continue",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      if (course.isFree) {
        return enrollmentService.create({
          courseId: id,
        });
      }

      return orderService.create({
        courseId: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["enrollments", "me"]);
      queryClient.invalidateQueries(["course", id]);
      queryClient.invalidateQueries(["my-orders"]);

      toast({
        title: course.isFree
          ? "Enrolled successfully! Enjoy your course."
          : "Order created successfully! Waiting for admin approval.",
      });

      if (course.isFree && sections[0]?.lessons[0]) {
        setActiveLesson(sections[0].lessons[0]);
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: course.isFree ? "Enrollment failed" : "Order creation failed",
        description: error.response?.data?.message || "Something went wrong",
      });
    },
  });

  const completeLessonMutation = useMutation({
    mutationFn: (lessonId) =>
      lessonProgressService.completeLesson({
        enrollmentId: currentEnrollment.enrollmentId,
        lessonId: lessonId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries([
        "progress",
        currentEnrollment?.enrollmentId,
      ]);
      queryClient.invalidateQueries(["student-dashboard"]);
      toast({ title: "Lesson marked as completed!" });
    },
    onError: (error) => {
      if (error.response?.data?.message !== "Lesson already completed") {
        toast({
          variant: "destructive",
          title: "Failed to update progress",
          description: error.response?.data?.message,
        });
      }
    },
  });

  // Validates lesson status against fetched remote list tracking completions
  const isLessonCompleted = (lessonId) => {
    const completed = progressData?.completedLessons;

    if (!completed) return false;

    // لو array
    if (Array.isArray(completed)) {
      return completed.includes(lessonId);
    }

    // لو string
    if (typeof completed === "string") {
      return completed.split(",").map(Number).includes(Number(lessonId));
    }

    if (typeof completed === "object" && Array.isArray(completed.lessons)) {
      return completed.lessons.includes(lessonId);
    }

    return false;
  };

  // --- State Variables ---
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [quickAddCount, setQuickAddCount] = useState(5);
  const [isReviewing, setIsReviewing] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: "" });

  const [isAddingContent, setIsAddingContent] = useState(false);
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newContent, setNewContent] = useState({
    title: "",
    lessonType: "Video",
    mediaFile: null,
    sectionId: "",
    duration: 10,
  });

  const [isAddingSection, setIsAddingSection] = useState(false);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [newSection, setNewSection] = useState({ title: "" });

  const lessonCount = sections.reduce(
    (acc, section) => acc + (section.lessons?.length || 0),
    0,
  );
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
        reviews.length
      : 0;
  const ratingDisplay = averageRating > 0 ? averageRating.toFixed(1) : "New";

  const handleSaveSection = async () => {
    if (!newSection.title) return;
    if (isEditingSection && selectedSection) {
      updateSectionMutation.mutate({
        sectionId: selectedSection.sectionId,
        title: newSection.title,
      });
    } else {
      addSectionMutation.mutate({
        courseId: id,
        title: newSection.title,
      });
    }
  };

  const openEditSection = (section) => {
    setSelectedSection(section);
    setNewSection({ title: section.title });
    setIsEditingSection(true);
    setIsAddingSection(true);
  };

  const handleAddContent = async () => {
    if (!newContent.title || !newContent.sectionId) return;
    setIsUploading(true);
    try {
      const targetSection = sections.find(
        (s) => String(s.sectionId || s.id) === String(newContent.sectionId),
      );
      const currentLessonsCount = targetSection?.lessons?.length || 0;
      const nextOrder = currentLessonsCount + 1;

      let finalOrder = nextOrder;
      if (isEditingLesson && selectedLesson) {
        finalOrder = selectedLesson.order || selectedLesson.Order || 1;
      }
      if (finalOrder < 1) finalOrder = 1;

      const formData = new FormData();
      formData.append("courseId", id);
      formData.append("sectionId", newContent.sectionId);
      formData.append("title", newContent.title.trim());

      if (newContent.mediaFile) {
        formData.append("file", newContent.mediaFile);
      }

      formData.append("lessonType", newContent.lessonType);
      formData.append("durationInMinutes", String(newContent.duration || 10));
      formData.append("order", String(finalOrder));

      if (isEditingLesson && selectedLesson) {
        await lessonService.update(selectedLesson.lessonId, formData);
        toast({ title: "Lesson updated successfully!" });
      } else {
        await lessonService.create(formData);
        toast({ title: "Lesson added successfully!" });
      }

      queryClient.invalidateQueries(["course", id]);
      setIsAddingContent(false);
      setIsEditingLesson(false);
      setSelectedLesson(null);
      setNewContent({
        title: "",
        lessonType: "Video",
        mediaFile: null,
        sectionId: "",
        duration: 10,
      });
    } catch (error) {
      console.error("Validation Error Details:", error.response?.data);
      toast({
        variant: "destructive",
        title: isEditingLesson
          ? "Failed to update lesson"
          : "Failed to add lesson",
        description:
          error.response?.data?.errors?.Order?.[0] ||
          error.response?.data?.title ||
          "Validation Error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Are you sure you want to delete this lesson?")) return;
    try {
      await lessonService.delete(lessonId);
      queryClient.invalidateQueries(["course", id]);
      toast({ title: "Lesson deleted successfully!" });
      if (activeLesson?.lessonId === lessonId) setActiveLesson(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to delete lesson" });
    }
  };

  const openEditLesson = (lesson) => {
    setSelectedLesson(lesson);
    setNewContent({
      title: lesson.title,
      lessonType: lesson.lessonType || "Video",
      mediaFile: null,
      sectionId: String(lesson.sectionId),
      duration: lesson.durationInMinutes || 10,
    });
    setIsEditingLesson(true);
    setIsAddingContent(true);
  };

  if (isCourseLoading || isUploading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="animate-spin inline mr-2" />
        Loading...
      </div>
    );
  }

  if (!course) {
    return <div className="p-8 text-center">Course not found.</div>;
  }

  return (
    <div className="animate-fade-in pb-12">
      <section className="cdetail-hero -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
        <div className="container-xl relative z-10">
          <div className="cdetail-hero__crumb">
            <Link to="/courses">Courses</Link>
            <ChevronRight size={12} />
            <span>{course.categoryName || "Course"}</span>
            <ChevronRight size={12} />
            <span className="text-white/90">{course.title}</span>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="accent">HOT</Badge>
            <Badge className="bg-white/15 text-white hover:bg-white/20">
              {course.categoryName || "General"}
            </Badge>
            <Badge className="bg-white/15 text-white hover:bg-white/20">
              {hasAccess ? "Enrolled Access" : "Lifetime Access"}
            </Badge>
          </div>
          <h1 className="m-0 max-w-[740px] font-outfit text-[clamp(32px,4.4vw,52px)] font-extrabold leading-tight tracking-tight text-white">
            {course.title}
          </h1>
          <p className="mb-6 mt-4 max-w-[660px] text-[17px] leading-relaxed text-white/80">
            {course.description ||
              "Master this course with structured lessons, practical exercises, and guided progress tracking."}
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-white/90">
            <div className="flex items-center gap-2">
              <span className="stars text-amber-400">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <Star
                    key={idx}
                    size={16}
                    fill={idx < Math.round(averageRating || 4) ? "currentColor" : "none"}
                  />
                ))}
              </span>
              <strong className="text-base">{ratingDisplay}</strong>
              <span className="text-white/55">({reviews.length} reviews)</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={16} />
              <span>
                Created by <strong>{course.instructorName || "LearnHub Instructor"}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen size={16} />
              <span>{lessonCount} lessons</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe size={16} />
              <span>English</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarClock size={16} />
              <span>Updated recently</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container-xl">
        <div className="cdetail-body">
          <div className="min-w-0">
            <div className="tabs">
              {[
                { id: "overview", label: "Overview" },
                { id: "curriculum", label: `Curriculum (${lessonCount})` },
                { id: "instructor", label: "Instructor" },
                { id: "reviews", label: `Reviews (${reviews.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={activeTab === tab.id ? "active" : ""}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div className="cdetail-card mb-8">
                <div className="aspect-video relative overflow-hidden rounded-2xl bg-slate-900 shadow-xl">
                  {hasAccess && activeLesson ? (
                    <video
                      key={activeLesson.lessonId}
                      src={getFullUrl(activeLesson.contentUrl)}
                      controls
                      className="h-full w-full"
                      autoPlay
                      onEnded={() =>
                        !isLessonCompleted(activeLesson.lessonId) &&
                        completeLessonMutation.mutate(activeLesson.lessonId)
                      }
                    />
                  ) : (
                    <div className="relative h-full w-full">
                      {course.imgPath ? (
                        <img
                          src={getFullUrl(course.imgPath)}
                          className="h-full w-full object-cover opacity-60"
                          alt="Course Preview"
                        />
                      ) : (
                        <div className="h-full w-full bg-slate-900" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Play className="h-16 w-16 text-white/80" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-8">
                  <h2 className="mb-4 text-[22px] font-extrabold tracking-tight">
                    About this course
                  </h2>
                  <p className="m-0 text-[15px] leading-relaxed text-foreground">
                    {course.description ||
                      "Follow the curriculum, complete each lesson, and track your progress through the dashboard."}
                  </p>
                </div>
              </div>
            )}

          {activeTab === "curriculum" && (
          <Card className="cdetail-card overflow-hidden p-0">
            {isStudentEnrolled && currentEnrollment && (
              <div className="p-6 bg-primary/5 border-b space-y-4">
                <div className="flex items-center justify-between gap-3 font-bold font-outfit text-primary">
                  <span className="text-lg">Your Progress</span>
                  <span className="text-xl">{currentEnrollment.progress}%</span>
                </div>
                <Progress value={currentEnrollment.progress} className="h-3 shadow-sm" />
              </div>
            )}
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="font-outfit text-xl">Course Content</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sections.length > 0 ? (
                sections.map((section) => (
                  <div
                    key={section.sectionId}
                    className="p-6 border-b last:border-0 group/section hover:bg-muted/5 transition-colors"
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-bold text-lg font-outfit text-foreground/90">{section.title}</h3>
                      {isInstructor && (
                        <div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/section:opacity-100">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-primary"
                            onClick={() => openEditSection(section)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              if (
                                confirm("Delete section and all its lessons?")
                              ) {
                                deleteSectionMutation.mutate(section.sectionId);
                              }
                            }}
                            disabled={deleteSectionMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {section.lessons?.map((lesson, idx) => {
                        const isCompleted = isLessonCompleted(lesson.lessonId);
                        const lessonType = lesson.lessonType?.toLowerCase();
                        const isActive =
                          activeLesson?.lessonId === lesson.lessonId;
                        const fileUrl =
                          lesson.contentUrl || lesson.pdfUrl || lesson.fileUrl;
                        const fullUrl = getFullUrl(fileUrl);

                        // Render PDF/Text using standard anchor element to avoid JS click handler blocking or missing events
                        if (lessonType === "pdf" || lessonType === "text") {
                          return (
                            <a
                              key={lesson.lessonId}
                              href={hasAccess && fileUrl ? fullUrl : "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                if (!hasAccess) {
                                  e.preventDefault();
                                  toast({
                                    variant: "destructive",
                                    title: "Access Denied",
                                    description:
                                      "You do not have access to this course content.",
                                  });
                                  return;
                                }
                                console.log(
                                  "Directly opening document via anchor link element:",
                                  fullUrl,
                                );
                              }}
                              className={`flex flex-col gap-3 rounded p-3 text-foreground no-underline transition-all sm:flex-row sm:items-center sm:justify-between ${
                                !hasAccess
                                  ? "opacity-60 cursor-not-allowed"
                                  : "hover:bg-accent/5 cursor-pointer"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all shadow-sm ${
                                    isCompleted
                                      ? "bg-green-500 text-white shadow-green-200"
                                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                  }`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-6 h-6" />
                                  ) : (
                                    idx + 1
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <p className="font-bold text-foreground/90 group-hover:text-primary transition-colors">
                                    {lesson.title}
                                  </p>
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0 h-4 bg-muted text-muted-foreground border-none"
                                  >
                                    {lesson.lessonType === "PDF"
                                      ? "PDF"
                                      : "Text"}
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {isInstructor && (
                                  <>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-primary"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openEditLesson(lesson);
                                      }}
                                    >
                                      <PlusCircle className="w-4 h-4 rotate-45" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-destructive"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDeleteLesson(lesson.lessonId);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                {isStudentEnrolled && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={
                                      isCompleted ||
                                      completeLessonMutation.isPending
                                    }
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      completeLessonMutation.mutate(
                                        lesson.lessonId,
                                      );
                                    }}
                                  >
                                    {isCompleted ? "Completed" : "Mark Done"}
                                  </Button>
                                )}
                              </div>
                            </a>
                          );
                        }

                        // Otherwise render standard interactive video div block
                        return (
                          <div
                            key={lesson.lessonId}
                            className={`flex cursor-pointer flex-col gap-3 rounded-xl p-4 transition-all group/lesson sm:flex-row sm:items-center sm:justify-between ${
                              isActive
                                ? "bg-primary/5 border-l-4 border-primary shadow-sm"
                                : "hover:bg-primary/5"
                            }`}
                            onClick={() => {
                              if (!hasAccess) {
                                toast({
                                  variant: "destructive",
                                  title: "Access Denied",
                                  description:
                                    "You do not have access to this course.",
                                });
                                return;
                              }
                              if (lessonType === "video") {
                                console.log(
                                  "Setting target active video content:",
                                  lesson,
                                );
                                setActiveLesson(lesson);
                              }
                            }}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all shadow-sm ${
                                  isCompleted
                                    ? "bg-green-500 text-white shadow-green-200"
                                    : "bg-muted text-muted-foreground group-hover/lesson:bg-primary/10 group-hover/lesson:text-primary"
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-6 h-6" />
                                ) : (
                                  idx + 1
                                )}
                              </div>
                              <div className="space-y-1">
                                <p className={`font-bold transition-colors ${isActive ? "text-primary" : "text-foreground/90 group-hover/lesson:text-primary"}`}>{lesson.title}</p>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0 h-4 bg-muted text-muted-foreground border-none"
                                >
                                  Video
                                </Badge>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              {isInstructor && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditLesson(lesson);
                                    }}
                                  >
                                    <PlusCircle className="w-4 h-4 rotate-45" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteLesson(lesson.lessonId);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {isStudentEnrolled && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={
                                    isCompleted ||
                                    completeLessonMutation.isPending
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    completeLessonMutation.mutate(
                                      lesson.lessonId,
                                    );
                                  }}
                                >
                                  {isCompleted ? "Completed" : "Mark Done"}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No content available for this course.
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Reviews Section */}
          {activeTab === "instructor" && (
            <div className="cdetail-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-extrabold text-primary">
                  {(course.instructorName || "L")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="m-0 font-outfit text-2xl font-extrabold tracking-tight">
                    {course.instructorName || "LearnHub Instructor"}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Course instructor
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
                      {ratingDisplay} rating
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {lessonCount} lessons
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
          <Card className="cdetail-card overflow-hidden p-0">
            <CardHeader className="flex flex-col gap-3 border-b bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 font-outfit text-xl">
                <MessageSquare className="w-5 h-5 text-primary" /> Student
                Reviews
              </CardTitle>
              {isStudentEnrolled && !isInstructor && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full font-bold px-4"
                  onClick={() => setIsReviewing(true)}
                >
                  Write a Review
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((r, i) => (
                    <div
                      key={i}
                      className="group flex gap-4 border-b pb-6 last:border-0 hover:bg-muted/5 transition-colors p-2 rounded-xl"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 border-2 border-primary/20">
                        {r.studentName?.[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-foreground font-outfit">{r.studentName}</h4>
                            <div className="flex items-center gap-1 my-1">
                              {[...Array(5)].map((_, idx) => (
                                <Star
                                  key={idx}
                                  className={`w-3.5 h-3.5 ${idx < r.rating ? "text-amber-500 fill-amber-500" : "text-muted"}`}
                                />
                              ))}
                            </div>
                          </div>
                          {(user?.id === r.studentId ||
                            user?.role === "Administrator") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 hover:bg-destructive/10"
                              onClick={() =>
                                deleteReviewMutation.mutate(r.studentId)
                              }
                              disabled={deleteReviewMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm italic text-muted-foreground mt-2 leading-relaxed">
                          "{r.comment}"
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8 font-medium italic">
                    No reviews yet. Be the first to review!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="enroll-card">
            <div
              className="enroll-card__preview"
              style={
                course.imgPath
                  ? {
                      backgroundImage: `linear-gradient(rgba(15,23,42,0.25), rgba(15,23,42,0.25)), url(${getFullUrl(course.imgPath)})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              <div className="enroll-card__preview-play">
                <Play size={26} fill="currentColor" />
              </div>
            </div>
            {!hasAccess ? (
              <>
                <div className="enroll-card__body border-b text-center">
                  <div>
                    <span className="text-4xl font-extrabold text-primary sm:text-5xl font-outfit tracking-tighter">
                      ${course.price}
                    </span>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mt-2">
                      Lifetime Access
                    </p>
                  </div>
                </div>
                <CardContent className="enroll-card__body">
                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full"
                    onClick={() => enrollMutation.mutate()}
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending
                      ? "Processing..."
                      : course.isFree
                        ? "Enroll Now"
                        : "Purchase Course"}
                  </Button>
                  <Button variant="outline" size="lg" className="mt-3 w-full">
                    <Heart className="h-4 w-4" /> Save for later
                  </Button>
                  <p className="text-center text-[10px] text-muted-foreground mt-4 px-4 leading-tight">
                    By enrolling, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </CardContent>
              </>
            ) : isInstructor || user?.role === "Administrator" ? (
              <CardContent className="p-8 space-y-6">
                <div className="text-center space-y-2">
                  <Badge className="bg-primary/10 text-primary border-none font-bold uppercase tracking-wider text-[10px] px-3">
                    Management Mode
                  </Badge>
                  <h3 className="text-2xl font-bold font-outfit">
                    {user?.role === "Administrator" ? "Admin Console" : "Instructor Hub"}
                  </h3>
                </div>
                
                <div className="space-y-3">
                  <AIQuizDialog
                    courseId={id}
                    mode="instructor"
                    buttonText="AI Content Assistant"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="w-full rounded-xl font-bold border-2"
                      onClick={() => setIsAddingSection(true)}
                    >
                      <PlusCircle className="w-4 h-4 mr-2" /> Section
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full rounded-xl font-bold border-2"
                      onClick={() => setIsAddingContent(true)}
                    >
                      <PlusCircle className="w-4 h-4 mr-2" /> Lesson
                    </Button>
                  </div>
                </div>

                <div className="pt-6 border-t space-y-3">
                  <Button variant="default" className="w-full rounded-xl py-6 font-bold shadow-lg shadow-primary/10" asChild>
                    <Link to={`/dashboard/create-exam?courseId=${id}`}>
                      <PlusCircle className="w-4 h-4 mr-2" /> Create Final Exam
                    </Link>
                  </Button>
                  {courseExams.length > 0 && (
                    <Button variant="secondary" className="w-full rounded-xl py-6 font-bold" asChild>
                      <Link to={`/dashboard/student-results/${id}`}>
                        <ClipboardList className="w-4 h-4 mr-2" /> Student Performance
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            ) : (
              <CardContent className="p-10 text-center space-y-6">
                <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-green-100">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold font-outfit">You're Enrolled!</h3>
                  <p className="text-sm text-muted-foreground font-medium">Continue your learning journey.</p>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full py-6 rounded-xl font-bold border-2 hover:bg-primary hover:text-white transition-all"
                  onClick={() => navigate("/dashboard/my-courses")}
                >
                  My Course Dashboard
                </Button>

                {progressData?.canTakeExam && courseExams.length > 0 && (
                  <div className="pt-8 border-t space-y-4">
                    <div className="flex items-center justify-center gap-2 text-primary font-bold uppercase tracking-widest text-[11px]">
                      <GraduationCap className="w-5 h-5" /> Course Ready for Exam
                    </div>
                    {courseExams.map((exam) => (
                      <Button
                        key={exam.examId}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-8 rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
                        asChild
                      >
                        <Link to={`/dashboard/exam/${exam.examId}?type=exam`}>
                          <Play className="w-4 h-4 mr-2 fill-current" /> Take Final Exam: {exam.title}
                        </Link>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </div>
        </div>
      </div>
      </section>

      {/* Add/Edit Section Dialog */}
      <Dialog
        open={isAddingSection}
        onOpenChange={(open) => {
          setIsAddingSection(open);
          if (!open) {
            setIsEditingSection(false);
            setSelectedSection(null);
            setNewSection({ title: "" });
          }
        }}
      >
        <DialogContent className="rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-outfit text-2xl">
              {isEditingSection ? "Edit Section" : "Add New Section"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="sectionTitle" className="font-bold text-sm ml-1 uppercase tracking-wider text-muted-foreground">Section Title</Label>
              <Input
                id="sectionTitle"
                value={newSection.title}
                onChange={(e) => setNewSection({ title: e.target.value })}
                placeholder="e.g., Introduction to React Hooks"
                className="rounded-xl border-2 py-6 focus-visible:ring-primary"
              />
            </div>
            <Button
              className="w-full py-6 font-bold rounded-xl shadow-lg shadow-primary/20"
              onClick={handleSaveSection}
              disabled={
                addSectionMutation.isPending || updateSectionMutation.isPending
              }
            >
              {isEditingSection ? "Update Section" : "Create Section"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Lesson Content Dialog */}
      <Dialog
        open={isAddingContent}
        onOpenChange={(open) => {
          setIsAddingContent(open);
          if (!open) {
            setIsEditingLesson(false);
            setSelectedLesson(null);
            setNewContent({
              title: "",
              lessonType: "Video",
              mediaFile: null,
              sectionId: "",
              duration: 10,
            });
          }
        }}
      >
        <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-outfit text-2xl">
              {isEditingLesson
                ? "Edit Lesson"
                : "Add New Lesson"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="lessonTitle" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Title</Label>
              <Input
                id="lessonTitle"
                value={newContent.title}
                onChange={(e) =>
                  setNewContent({ ...newContent, title: e.target.value })
                }
                placeholder="Enter lesson title"
                className="rounded-xl border-2 h-12 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sectionSelect" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Target Section</Label>
              <select
                id="sectionSelect"
                className="w-full h-12 px-4 border-2 rounded-xl bg-background font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={newContent.sectionId}
                onChange={(e) =>
                  setNewContent({ ...newContent, sectionId: e.target.value })
                }
              >
                <option value="">-- Choose Section --</option>
                {sections.map((s) => (
                  <option key={s.sectionId} value={s.sectionId}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contentType" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Material Type</Label>
              <select
                id="contentType"
                className="w-full h-12 px-4 border-2 rounded-xl bg-background font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={newContent.lessonType}
                onChange={(e) =>
                  setNewContent({ ...newContent, lessonType: e.target.value })
                }
              >
                <option value="Video">Video (MP4)</option>
                <option value="PDF">PDF Document</option>
                <option value="Text">Text Lesson</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileInput" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Source Asset</Label>
              <Input
                id="fileInput"
                type="file"
                className="rounded-xl border-2 h-auto py-2 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
                onChange={(e) =>
                  setNewContent({ ...newContent, mediaFile: e.target.files[0] })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMinutes" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">
                Estimated Duration (Minutes)
              </Label>
              <Input
                id="durationMinutes"
                type="number"
                value={newContent.duration}
                className="rounded-xl border-2 h-12 focus-visible:ring-primary"
                onChange={(e) =>
                  setNewContent({
                    ...newContent,
                    duration: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <Button className="w-full h-14 font-bold rounded-xl shadow-lg shadow-primary/20 mt-4" onClick={handleAddContent}>
              {isEditingLesson ? "Update Content" : "Upload & Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={isReviewing} onOpenChange={setIsReviewing}>
        <DialogContent className="rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-outfit text-2xl">Share Your Experience</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label htmlFor="reviewRating" className="font-bold text-sm ml-1">Overall Rating</Label>
              <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border-2 border-dashed border-muted">
                <Input
                  id="reviewRating"
                  type="number"
                  min="1"
                  max="5"
                  className="w-20 text-center font-bold text-lg rounded-xl border-2 h-12"
                  value={review.rating}
                  onChange={(e) =>
                    setReview({
                      ...review,
                      rating: parseInt(e.target.value) || 5,
                    })
                  }
                />
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-6 h-6 ${i < review.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/20"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviewComment" className="font-bold text-sm ml-1">Detailed Feedback</Label>
              <Textarea
                id="reviewComment"
                className="rounded-2xl border-2 min-h-[120px] focus-visible:ring-primary p-4"
                value={review.comment}
                onChange={(e) =>
                  setReview({ ...review, comment: e.target.value })
                }
                placeholder="What did you like or dislike about this course?"
              />
            </div>
            <Button
              className="w-full py-8 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
              onClick={() =>
                addReviewMutation.mutate({
        courseId: id,
                  studentId: user.id,
                  rating: review.rating,
                  comment: review.comment,
                })
              }
              disabled={addReviewMutation.isPending}
            >
              {addReviewMutation.isPending ? "Submitting..." : "Post Review"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseDetails;
