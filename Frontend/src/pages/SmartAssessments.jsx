import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, ListChecks, GraduationCap, FileText } from "lucide-react";
import Quizzes from "./Quizzes";
import Exams from "./Exams";
import Assignments from "./Assignments";
import AIQuizDialog from "@/components/AIQuizDialog";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";

const SmartAssessments = () => {
  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments", "me"],
    queryFn: async () => {
      const response = await api.get("/Enrollment/me");
      return response.data;
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-gradient-to-br from-primary/10 via-background to-background p-8 rounded-[2rem] border border-primary/10 shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
             <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-3">Student Hub</Badge>
             <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground uppercase tracking-widest">
               <Sparkles className="w-3 h-3 text-yellow-500" /> AI Powered
             </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <BrainCircuit className="w-10 h-10 text-primary" />
            Smart Assessment Center
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Everything you need to master your courses. Take required exams or generate AI-powered practice materials tailored to your performance.
          </p>
        </div>
        
        <div className="w-full lg:w-72 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Generate Practice for:</p>
          <div className="max-h-[150px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {enrollments.map((e) => (
              <AIQuizDialog 
                key={e.courseId?._id} 
                courseId={e.courseId?._id} 
                buttonText={e.courseId?.title}
              />
            ))}
            {enrollments.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No courses found</p>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="quizzes" className="w-full space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <TabsList className="bg-muted/50 p-1.5 rounded-2xl h-auto grid grid-cols-3 w-full md:w-[500px] border shadow-inner">
            <TabsTrigger value="quizzes" className="rounded-xl py-3 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <ListChecks className="w-4 h-4 mr-2" />
              Quizzes
            </TabsTrigger>
            <TabsTrigger value="exams" className="rounded-xl py-3 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <GraduationCap className="w-4 h-4 mr-2" />
              Exams
            </TabsTrigger>
            <TabsTrigger value="assignments" className="rounded-xl py-3 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <FileText className="w-4 h-4 mr-2" />
              Assignments
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="bg-card/30 rounded-[2rem] border p-1">
          <TabsContent value="quizzes" className="mt-0 focus-visible:outline-none">
            <Quizzes isSubComponent={true} />
          </TabsContent>

          <TabsContent value="exams" className="mt-0 focus-visible:outline-none">
            <Exams isSubComponent={true} />
          </TabsContent>

          <TabsContent value="assignments" className="mt-0 focus-visible:outline-none">
            <Assignments isSubComponent={true} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

import { Sparkles } from "lucide-react";

export default SmartAssessments;
