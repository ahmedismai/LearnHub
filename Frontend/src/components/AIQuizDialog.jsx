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

const AIQuizDialog = ({ courseId, buttonText }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("Quiz");
  const { toast } = useToast();
  const navigate = useNavigate();

  const generateAIQuiz = async () => {
    setLoading(true);
    try {
      const response = await api.post("/AI-Assessment/generate", {
        courseId,
        type: type,
        count: type === "Assignment" ? 3 : 5,
      });

      const { assessment, studentLevel } = response.data;
      
      toast({
        title: `Smart ${type} Generated!`,
        description: `Level: ${studentLevel}. Content based on ${buttonText || 'lessons'}.`,
      });

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
                    <p className="font-bold">Practice Quiz</p>
                    <p className="text-xs text-muted-foreground">Quick test on core concepts</p>
                  </div>
                </Label>
              </div>

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

              <div className={`flex items-center space-x-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${type === "Assignment" ? "bg-primary/5 border-primary" : "border-muted"}`} onClick={() => setType("Assignment")}>
                <RadioGroupItem value="Assignment" id="assignment" />
                <Label htmlFor="assignment" className="flex flex-1 items-center gap-2 cursor-pointer">
                  <FileText className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-bold">Practice Assignment</p>
                    <p className="text-xs text-muted-foreground">Hands-on tasks & projects</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            We'll analyze your current grades and video lesson descriptions to create a personalized {type.toLowerCase()} just for you.
          </p>

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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIQuizDialog;
