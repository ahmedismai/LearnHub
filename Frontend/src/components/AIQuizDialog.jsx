import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Sparkles, 
  BrainCircuit, 
  FileText, 
  ListChecks, 
  GraduationCap 
} from "lucide-react";
import api from "@/api/axios";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const AIQuizDialog = ({ courseId, buttonText, mode = "student" }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("Quiz");
  const [count, setCount] = useState(5);
  const [generatedAssessment, setGeneratedAssessment] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const generateAIQuiz = async () => {
    setLoading(true);
    setGeneratedAssessment(null);
    try {
      const response = await api.post("/AI-Assessment/generate", {
        courseId,
        type: type,
        count: parseInt(count) || 5,
      });

      const { assessment, studentLevel } = response.data;
      setGeneratedAssessment(assessment);
      
      toast({
        title: `Smart ${type} Generated!`,
        description: mode === "instructor" 
          ? "Preview your content below before adding to course." 
          : `Level: ${studentLevel}. Content based on lessons.`,
      });

      if (mode === "student") {
        if (type === "Assignment") {
           navigate("/dashboard/assignments", { 
            state: { 
              aiAssignment: assessment,
              isAiGenerated: true 
            } 
          });
        } else {
          navigate("/dashboard/exam/ai-practice", { 
            state: { 
              quizData: assessment,
              isAiGenerated: true,
              assessmentType: type
            } 
          });
        }
        setOpen(false);
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate AI content at this time.",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveToCourse = async () => {
    if (!generatedAssessment) return;
    setLoading(true);
    try {
      let formattedDescription = `AI-Generated ${type} for this course.`;
      
      if (type === "Assignment") {
        formattedDescription = `### ${generatedAssessment.title}\n\n**Instructions:**\n` + 
          generatedAssessment.tasks.map((t, i) => `${i+1}. ${t.description}\n   - *Success Criteria:* ${t.criteria}`).join('\n\n');
      }

      const payload = {
        type: type, // "Quiz" or "Assignment"
        title: generatedAssessment.title,
        description: formattedDescription,
        ...(type === "Quiz" && { 
          questions: generatedAssessment.questions,
          duration: "20m"
        }),
        ...(type === "Assignment" && {
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 1 week
        })
      };

      await api.post(`/Course/${courseId}/contents`, payload);
      
      toast({
        title: "Success!",
        description: `${type} has been added to your course content.`,
      });
      setOpen(false);
      setGeneratedAssessment(null);
      // Optional: reload page or invalidate queries
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to Save",
        description: error.response?.data?.message || "Could not add content to course.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 border-primary/20 hover:border-primary w-full py-5 px-4 justify-start text-left bg-background/50 backdrop-blur-sm overflow-hidden group">
          <Sparkles className="w-4 h-4 text-primary shrink-0 group-hover:animate-pulse" />
          <span className="truncate font-semibold text-sm">{buttonText || 'AI Smart Study'}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
               <BrainCircuit className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">AI-Powered Study Tool</DialogTitle>
          </div>
          <div className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded inline-block">
             COURSE: {buttonText || 'Selected Course'}
          </div>
        </DialogHeader>
        <div className="py-6 space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-bold">Select Assessment Type</Label>
            <RadioGroup value={type} onValueChange={setType} className="grid grid-cols-1 gap-3">
              <div className={`flex items-center space-x-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${type === "Quiz" ? "bg-primary/5 border-primary" : "border-muted"}`} onClick={() => setType("Quiz")}>
                <RadioGroupItem value="Quiz" id="quiz" />
                <Label htmlFor="quiz" className="flex flex-1 items-center gap-2 cursor-pointer">
                  <ListChecks className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-bold">{mode === "instructor" ? "Official Quiz" : "Practice Quiz"}</p>
                    <p className="text-xs text-muted-foreground">
                      {mode === "instructor" ? "Add an AI-powered quiz to your lessons" : "Quick test on core concepts"}
                    </p>
                  </div>
                </Label>
              </div>

              {mode === "student" && (
                <div className={`flex items-center space-x-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${type === "Exam" ? "bg-primary/5 border-primary" : "border-muted"}`} onClick={() => setType("Exam")}>
                  <RadioGroupItem value="Exam" id="exam" />
                  <Label htmlFor="exam" className="flex flex-1 items-center gap-2 cursor-pointer">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-bold">Practice Exam</p>
                      <p className="text-xs text-muted-foreground">Comprehensive final check</p>
                    </div>
                  </Label>
                </div>
              )}

              <div className={`flex items-center space-x-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${type === "Assignment" ? "bg-primary/5 border-primary" : "border-muted"}`} onClick={() => setType("Assignment")}>
                <RadioGroupItem value="Assignment" id="assignment" />
                <Label htmlFor="assignment" className="flex flex-1 items-center gap-2 cursor-pointer">
                  <FileText className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-bold">{mode === "instructor" ? "Official Assignment" : "Practice Assignment"}</p>
                    <p className="text-xs text-muted-foreground">
                      {mode === "instructor" ? "Add hands-on tasks to your course" : "Hands-on tasks & projects"}
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="count" className="text-sm font-bold">Number of Questions</Label>
            <Input 
              id="count"
              type="number" 
              min="1" 
              max="20" 
              value={count} 
              onChange={(e) => setCount(e.target.value)}
              className="rounded-xl border-muted"
            />
          </div>

          <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            We'll analyze your current grades and video lesson descriptions to create a personalized {type.toLowerCase()} just for you.
          </p>

          {generatedAssessment && mode === "instructor" && (
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3">
              <p className="text-sm font-bold flex items-center gap-2">
                 <Sparkles className="w-4 h-4 text-primary" />
                 Preview: {generatedAssessment.title}
              </p>
              <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto space-y-1">
                 {type === "Quiz" || type === "Exam" ? (
                   generatedAssessment.questions?.map((q, i) => (
                     <div key={i} className="border-b border-primary/10 pb-1">
                        Q{i+1}: {q.text || q.question}
                     </div>
                   ))
                 ) : (
                   generatedAssessment.tasks?.map((t, i) => (
                    <div key={i} className="border-b border-primary/10 pb-1">
                       Task {i+1}: {t.description}
                    </div>
                  ))
                 )}
              </div>
              <Button 
                onClick={saveToCourse} 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : `Add this ${type} to Course`}
              </Button>
            </div>
          )}

          {(!generatedAssessment || mode === "student") && (
            <Button 
              onClick={generateAIQuiz} 
              disabled={loading}
              className="w-full h-12 text-lg font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating {type}...
                </>
              ) : (
                `Generate Smart ${type}`
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIQuizDialog;
