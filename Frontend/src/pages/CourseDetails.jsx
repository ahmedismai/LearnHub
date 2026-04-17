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
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

const CourseDetails = () => {
  const [activeLesson, setActiveLesson] = useState(null);
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => {
      const response = await api.get(`/courses/${id}`);
      return response.data;
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments", "me"],
    queryFn: async () => {
      const response = await api.get("/enrollments/me");
      return response.data;
    },
    enabled: !!user,
  });

  const isEnrolled = enrollments.some((e) => e.courseId?._id === id);

  const enrollMutation = useMutation({
    mutationFn: async () => {
      return api.post("/enrollments", { courseId: id, paymentMethod: "Visa" });
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

  if (isLoading)
    return <div className="p-8 text-center text-lg">Loading course details...</div>;
  if (!course) return <div className="p-8 text-center text-lg">Course not found</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Course Info & Player */}
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
            {isEnrolled && activeLesson?.videoUrl ? (
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
                {!isEnrolled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                         <Play className="w-16 h-16 text-white/80" />
                    </div>
                )}
                {isEnrolled && !activeLesson && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white space-y-4">
                         <Play className="w-16 h-16 text-white/80" />
                         <p className="text-lg font-medium">Select a lesson to start learning</p>
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
                      activeLesson?.id === content.id || activeLesson?._id === content._id
                        ? "bg-primary/5 border-l-4 border-primary"
                        : "hover:bg-accent/5 border-l-4 border-transparent"
                    }`}
                    onClick={() =>
                      isEnrolled &&
                      content.contentType === "Lesson" &&
                      setActiveLesson(content)
                    }
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        activeLesson?.id === content.id || activeLesson?._id === content._id
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent/20 text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className={`font-semibold ${
                            (activeLesson?.id === content.id || activeLesson?._id === content._id) ? "text-primary" : ""
                        }`}>
                            {content.title}
                        </p>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] uppercase h-5">
                                {content.contentType}
                            </Badge>
                        </div>
                      </div>
                    </div>
                    {content.contentType === "Lesson" ? (
                      <Play className={`w-5 h-5 ${
                        (activeLesson?.id === content.id || activeLesson?._id === content._id) ? "text-primary animate-pulse" : "text-muted-foreground/40"
                      }`} />
                    ) : (
                      <FileText className="w-5 h-5 text-muted-foreground/40" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Enrollment / Access Info */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-2 border-primary/10 shadow-xl overflow-hidden">
            {!isEnrolled ? (
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
                      <span>{course.contents?.length || 0} Lessons & Resources</span>
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
                    <h3 className="text-xl font-bold text-foreground">You're Enrolled!</h3>
                    <p className="text-sm text-muted-foreground">
                      You have full access to this course. Pick a lesson from the list to start watching.
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Overall Progress</span>
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