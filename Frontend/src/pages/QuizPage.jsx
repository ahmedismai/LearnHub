import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import { Loader2, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

const QuizPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "quiz"; // 'quiz' or 'exam'
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  // 1. Fetch Quiz/Exam Data
  const { data: quizData, isLoading, isError } = useQuery({
    queryKey: ["assessment", type, id],
    queryFn: async () => {
      if (type === "exam") {
        const response = await api.get(`/Exam/${id}`); // Assuming /Exam/{id} returns exam details including questions
        return response.data;
      } else {
        const response = await api.get(`/Quiz/${id}`); // Assuming /Quiz/{id} returns quiz details including questions
        return response.data;
      }
    },
    retry: 1,

  // 2. Set initial timer
  useEffect(() => {
    if (quizData?.duration) {
      const mins = parseInt(quizData.duration) || 30;
      setTimeLeft(mins * 60);
    }
  }, [quizData]);

  // 3. Submit Mutation
  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      const endpoint = type === "exam" ? "/ExamResult/Submit" : `/Quiz/${id}/submit`;
      return api.post(endpoint, payload);
    },
    onSuccess: () => {
      toast.success(`${type === "exam" ? "Exam" : "Quiz"} submitted successfully!`);
      setIsFinished(true);
      queryClient.invalidateQueries(["enrollments", "me"]);
      navigate(type === "exam" ? "/dashboard/exams" : "/dashboard/quizzes");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Submission failed");
    },
  });

  // 4. Timer Logic
  useEffect(() => {
    if (timeLeft === null || isFinished) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  // 5. Prevent Refresh
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isFinished && timeLeft > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isFinished, timeLeft]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (isFinished || submitMutation.isPending) return;

    const payload = {
      answers: Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      })),
    };

    if (type === "exam") {
      payload.examId = id;
    } else { // type === "quiz"
      payload.quizId = id;
    }

    submitMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Preparing your assessment...</p>
      </div>
    );
  }

  if (isError || !quizData) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center space-y-6">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Assessment Unavailable</h2>
          <p className="text-muted-foreground">We couldn't load the questions for this {type}. Please try again later.</p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
      </div>
    );
  }

  const questions = quizData.questions || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b py-4 px-6 flex justify-between items-center rounded-b-2xl shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
             <CheckCircle2 className="w-6 h-6 text-primary" />
           </div>
           <div>
             <h1 className="text-xl font-bold line-clamp-1">{quizData.title}</h1>
             <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{questions.length} Questions • {type}</p>
           </div>
        </div>
        <div className={`flex items-center gap-3 px-5 py-2 rounded-full border-2 ${timeLeft < 60 ? "bg-destructive/10 border-destructive text-destructive animate-pulse" : "bg-primary/5 border-primary/20 text-primary"}`}>
          <Clock className="w-5 h-5" />
          <span className="text-2xl font-mono font-black">
            {Math.floor((timeLeft || 0) / 60)}:{(timeLeft || 0 % 60).toString().padStart(2, "0")}
          </span>
        </div>
      </header>

      <div className="px-4 space-y-8">
        {questions.map((q, idx) => (
          <Card key={q._id || idx} className="border-none shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="bg-muted/30 border-b border-border/50">
               <div className="flex gap-4">
                 <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                   {idx + 1}
                 </span>
                 <p className="text-lg font-semibold leading-relaxed pt-0.5">{q.text || q.question}</p>
               </div>
            </CardHeader>
            <CardContent className="p-8">
              <RadioGroup
                value={answers[q._id] || ""}
                onValueChange={(val) => handleAnswerChange(q._id, val)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {q.options?.map((opt, optIdx) => (
                  <div 
                    key={optIdx} 
                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${answers[q._id] === opt ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20" : "hover:bg-muted/50 border-transparent bg-muted/20"}`}
                    onClick={() => handleAnswerChange(q._id, opt)}
                  >
                    <RadioGroupItem value={opt} id={`q-${idx}-o-${optIdx}`} />
                    <Label 
                      htmlFor={`q-${idx}-o-${optIdx}`}
                      className="flex-1 cursor-pointer text-base font-medium"
                    >
                      {opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t p-6 shadow-2xl z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-4">
           <div className="hidden sm:block">
             <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-primary transition-all duration-300" 
                     style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }} 
                   />
                </div>
                <span className="text-xs font-bold text-primary">{Math.round((Object.keys(answers).length / questions.length) * 100)}%</span>
             </div>
             <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Completion Progress</p>
           </div>
           
           <div className="flex gap-4 w-full sm:w-auto">
             <Button variant="ghost" onClick={() => navigate(-1)} className="flex-1 sm:flex-initial">Quit</Button>
             <Button 
               onClick={handleSubmit} 
               disabled={submitMutation.isPending || isFinished}
               className="flex-1 sm:flex-initial min-w-[160px] h-12 text-lg font-bold shadow-xl shadow-primary/30"
             >
               {submitMutation.isPending ? "Processing..." : "Finish Assessment"}
             </Button>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default QuizPage;
