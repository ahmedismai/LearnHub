import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Sparkles,
} from "lucide-react";
import Exams from "./Exams";
import AIQuizDialog from "@/components/AIQuizDialog";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import enrollmentService from "@/api/enrollment";
import { Button } from "@/components/ui/button";

const SmartAssessments = () => {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["enrollments", "me"],
    queryFn: async () => {
      const response = await enrollmentService.getByStudent(user.id);

      return (
        response?.data?.$values || response?.data?.data || response?.data || []
      );
    },
    enabled: !!user,
  });
  const enrollments = Array.isArray(data) ? data : data?.data || [];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="page__head">
        <div>
          <div className="row mb-3 gap-2">
            <Badge variant="secondary" className="uppercase tracking-[0.12em]">
              Student Hub
            </Badge>
            <span className="row gap-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3 w-3 text-amber-500" /> AI Powered
            </span>
          </div>
          <h1 className="page__title flex items-center gap-3">
            <GraduationCap className="h-9 w-9 text-primary" />
            Assessments
          </h1>
          <p className="page__subtitle">
            Quizzes, exams, projects and practice materials across your enrolled courses.
          </p>
        </div>

        <div className="w-full lg:w-80">
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
            Practice for:
          </p>
          <div className="custom-scrollbar max-h-[150px] space-y-2 overflow-y-auto pr-2">
            {enrollments.map((e) => (
              <AIQuizDialog
                key={e.courseId}
                courseId={e.courseId}
                buttonText={e.courseTitle || `Course ${e.courseId}`}
              />
            ))}
            {enrollments.length === 0 && (
              <p className="rounded-xl border border-dashed bg-background/70 p-3 text-sm italic text-muted-foreground">
                No enrolled courses found
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="ptabs">
        <Button className="active" variant="ghost">
          Available
        </Button>
        <Button variant="ghost" disabled>
          In Progress
        </Button>
        <Button variant="ghost" disabled>
          Completed
        </Button>
      </div>

      <Exams isSubComponent={true} />
    </div>
  );
};

export default SmartAssessments;
