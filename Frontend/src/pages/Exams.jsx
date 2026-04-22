import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import { GraduationCap, Timer, BookOpen, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Exams = ({ isSubComponent = false }) => {
  const { user } = useAuth();
  const isInstructor = user?.role === "Instructor";

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["exams", user?.role],
    queryFn: async () => {
      const response = await api.get("/Exam");
      return response.data;
    },
    enabled: !!user,
  });

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>;

  return (
    <div className={`space-y-6 animate-fade-in ${!isSubComponent ? 'max-w-7xl mx-auto p-6' : ''}`}>
      {isInstructor && !isSubComponent && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-center gap-3 mb-6">
           <GraduationCap className="text-amber-500 w-6 h-6" />
           <div>
              <p className="font-bold text-amber-800 uppercase text-xs">Instructor View</p>
              <p className="text-amber-700 text-sm">You are viewing all exams you've created. Click enter to preview as a student.</p>
           </div>
        </div>
      )}
      {!isSubComponent && (
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Final Exams</h1>
          <p className="text-muted-foreground mt-1">
            {isInstructor ? "Monitor and preview your course assessments" : "Complete your courses by taking the final assessments"}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exams.length > 0 ? (
          exams.map((exam) => (
            <Card key={exam._id} className="overflow-hidden border-2 hover:border-primary/20 transition-all group">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2">
                    <Badge variant="gradient" className="uppercase text-[10px] font-bold tracking-widest">Final Exam</Badge>
                    {isInstructor && exam.status === "Draft" && (
                      <Badge variant="outline" className="uppercase text-[10px] font-bold tracking-widest text-amber-600 border-amber-200 bg-amber-50">Draft</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Timer className="w-3.5 h-3.5" />
                    {exam.duration}
                  </div>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{exam.title}</CardTitle>
                <CardDescription className="line-clamp-2 mt-2">{exam.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-4 space-y-4">
                <div className="flex items-center gap-2 text-sm">
                   <div className="p-1.5 rounded-md bg-primary/10">
                     <BookOpen className="w-4 h-4 text-primary" />
                   </div>
                   <span className="font-medium text-foreground">{exam.courseId?.title}</span>
                </div>
                
                <div className="pt-2">
                   <Button asChild className="w-full h-11 text-base font-bold shadow-lg shadow-primary/20">
                     <Link to={`/dashboard/exam/${exam._id}?type=exam`}>
                       <Play className="w-4 h-4 mr-2 fill-current" />
                       {isInstructor ? "Preview Exam" : "Enter Examination Hall"}
                     </Link>
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full border-dashed">
            <CardContent className="p-16 text-center">
               <GraduationCap className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
               <h3 className="text-xl font-bold">No Exams Found</h3>
               <p className="text-muted-foreground max-w-sm mx-auto">
                 {isInstructor 
                   ? "You haven't created any exams yet. Go to Create Exam to get started." 
                   : "When your instructors publish final exams for your enrolled courses, they will appear here."}
               </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Exams;
