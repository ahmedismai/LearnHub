import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import api from "@/api/axios";
import { Loader2, Clock, GraduationCap, ShieldCheck } from "lucide-react";

const Exam = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);

  const isInstructor = user?.role === "Instructor";

  // Check if already submitted (only for students)
  const { data: existingResult, isLoading: isCheckingResult } = useQuery({
    queryKey: ["examResult", id, user?.id],
    queryFn: async () => {
      try {
        const res = await api.get(`/ExamResult/ByExam/${id}/me`);
        return res.data;
      } catch (e) {
        return null;
      }
    },
    enabled: !!id && !!user && user.role === "Student",
  });

  // Fetch Exam Details
  const { data: exam, isLoading } = useQuery({
    queryKey: ["exam", id],
    queryFn: async () => {
      const response = await api.get(`/Exam/${id}`);
      return response.data;
    },
  });

  useEffect(() => {
    if (exam && timeLeft === null) {
      const mins = parseInt(exam.duration) || 30;
      setTimeLeft(mins * 60);
    }
  }, [exam, timeLeft]);

  // Submit Exam Mutation
  const submitMutation = useMutation({
    mutationFn: async (examData) => {
      if (isInstructor) return { message: "Instructor preview - no data saved" };
      return api.post("/ExamResult/Submit", examData);
    },
    onSuccess: () => {
      toast({ title: isInstructor ? "Preview Mode: No data saved" : "Exam submitted successfully!" });
      navigate("/dashboard/quizzes", { replace: true });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error.response?.data?.message || "Something went wrong",
      });
    },
  });

  // Timer
  useEffect(() => {
    if (timeLeft === null || isInstructor) return;

    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      toast({
        title: "Time's up!",
        description: "Your exam is being submitted automatically.",
      });
      handleSubmit();
    }
  }, [timeLeft, isInstructor]);

  const handleAnswerChange = (questionId, answer) => {
    if (isInstructor) return setAnswers({ ...answers, [questionId]: answer });
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = () => {
    if (!exam || submitMutation.isPending) return;
    if (isInstructor) {
       toast({ title: "Preview Mode", description: "Instructors cannot submit exams." });
       navigate("/dashboard/quizzes");
       return;
    }
    const examData = {
      examId: id,
      answers: Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      })),
    };
    submitMutation.mutate(examData);
  };

  if (isLoading || isCheckingResult) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if already submitted
  if (existingResult && !isInstructor) {
    navigate("/dashboard/quizzes", { replace: true });
    return null;
  }

  if (!exam) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4 p-8 border rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold">Exam Not Found</h2>
        <Button onClick={() => navigate("/dashboard/quizzes")}>Back to Quizzes</Button>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in pb-20">
      {isInstructor && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-center gap-3">
           <ShieldCheck className="text-amber-500 w-6 h-6" />
           <div>
              <p className="font-bold text-amber-800 uppercase text-xs">Instructor Preview Mode</p>
              <p className="text-amber-700 text-sm">You are viewing this exam as a preview. No results will be saved.</p>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background/50 backdrop-blur-sm sticky top-0 z-10 py-4 border-b">
        <div>
           <Badge variant="outline" className="mb-2 uppercase tracking-wider text-[10px]">{exam.type || 'Final Exam'}</Badge>
           <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
        </div>
        {!isInstructor && (
          <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border-2 ${timeLeft < 300 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-primary/5 border-primary/20'}`}>
            <Clock className="w-5 h-5" />
            <span className="text-2xl font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {exam.questions?.map((question, index) => (
          <Card key={question._id} className="border-none shadow-md hover:shadow-lg transition-shadow overflow-hidden">
            <div className="h-2 bg-primary/10" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xl leading-relaxed flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary text-sm">
                  {index + 1}
                </span>
                {question.text}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <RadioGroup
                value={answers[question._id] || ""}
                onValueChange={(value) =>
                  handleAnswerChange(question._id, value)
                }
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                {question.options?.map((option, optIndex) => (
                  <Label
                    key={optIndex}
                    htmlFor={`${question._id}-${optIndex}`}
                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                       answers[question._id] === option 
                       ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                       : 'border-muted hover:border-primary/30 hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem
                      value={option}
                      id={`${question._id}-${optIndex}`}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[question._id] === option ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                       {answers[question._id] === option && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="font-medium">{option}</span>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center bg-background/80 backdrop-blur-md p-6 rounded-2xl border shadow-2xl sticky bottom-6">
        <div className="text-sm text-muted-foreground">
           {Object.keys(answers).length} of {exam.questions?.length} questions answered
        </div>
        <div className="flex gap-4">
           <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
           <Button
             onClick={handleSubmit}
             disabled={submitMutation.isPending}
             size="lg"
             className="px-10 font-bold shadow-xl shadow-primary/20"
           >
             {submitMutation.isPending ? (
               <>
                 <Loader2 className="w-4 h-4 animate-spin mr-2" />
                 Submitting...
               </>
             ) : (
               isInstructor ? "Exit Preview" : "Finish & Submit Exam"
             )}
           </Button>
        </div>
      </div>
    </div>
  );
};

export default Exam;


export default Exam;
