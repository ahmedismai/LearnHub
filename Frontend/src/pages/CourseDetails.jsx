import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import { BookOpen, Clock, FileText, Play, ShieldCheck, Star, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CourseDetails = () => {
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

  if (isLoading) return <div className="p-8 text-center">Loading course details...</div>;
  if (!course) return <div className="p-8 text-center">Course not found</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Course Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <Badge variant="secondary" className="px-3 py-1">
              {course.categoryId?.name || "General"}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              {course.title}
            </h1>
            <p className="text-xl text-muted-foreground">{course.description}</p>
            
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

          <div className="aspect-video relative rounded-2xl overflow-hidden bg-accent/10 border shadow-sm">
            {course.thumbnail ? (
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-16 h-16 text-muted-foreground/20" />
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {course.contents?.map((content, index) => (
                  <div key={content.id} className="flex items-center justify-between p-4 hover:bg-accent/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{content.title}</p>
                        <p className="text-xs text-muted-foreground uppercase">{content.contentType}</p>
                      </div>
                    </div>
                    {content.contentType === 'Lesson' ? <Play className="w-4 h-4 text-muted-foreground" /> : <FileText className="w-4 h-4 text-muted-foreground" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Enrollment Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-2 border-primary/10 shadow-xl overflow-hidden">
            <div className="bg-primary/5 p-8 text-center border-b">
              <span className="text-4xl font-bold text-primary">${course.price}</span>
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  <span>Full lifetime access</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span>{course.contents?.length || 0} Contents</span>
                </div>
              </div>

              {isEnrolled ? (
                <Button className="w-full" size="lg" onClick={() => navigate("/dashboard")}>
                  Go to Dashboard
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={() => enrollMutation.mutate()}
                  disabled={enrollMutation.isLoading}
                >
                  {enrollMutation.isLoading ? "Enrolling..." : "Enroll Now"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;