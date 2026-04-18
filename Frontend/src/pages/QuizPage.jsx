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
import { Loader2, Clock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const QuizPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  // Fetch Quiz Details
  const { data: quiz, isLoading, isError } = useQuery({
    queryKey: ["quiz", id],
    queryFn: async () => {
      // Using /Exam/Details as requested by existing backend structure
      const response = await api.get(`/Exam/Details/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Set initial timer when quiz is loaded
  useEffect(() => {
    if (quiz?.duration) {
      setTimeLeft(quiz.duration * 60); // duration in minutes
    }
  }, [quiz]);

  // Submit Mutation
  const submitMutation = useMutation({
    mutationFn: async (quizData) => {
      return api.post("/ExamResult/Submit", quizData);
    },
    onSuccess: () => {
      toast({ title: "Quiz submitted successfully!" });
      setIsFinished(true);
      queryClient.invalidateQueries(["enrollments", "me"]);
      navigate("/dashboard/quizzes");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error.response?.data?.message || "Something went wrong",
      });
    },
  });

  // Prevent refresh during active quiz
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

  // Timer logic
  useEffect(() => {
    if (timeLeft === null || isFinished) return;

    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (isFinished || submitMutation.isPending) return;

    const quizData = {
      examId: id,
      answers: Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      })),
    };
    submitMutation.mutate(quizData);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading quiz questions...</p>
      </div>
    );
  }

  if (isError || !quiz) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load the quiz. Please try again later or contact support.
        </AlertDescription>
        <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </Alert>
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b py-4 px-6 flex justify-between items-center rounded-b-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold line-clamp-1">{quiz.title}</h1>
          <p className="text-sm text-muted-foreground">{quiz.questions?.length || 0} Questions</p>
        </div>
        <div className={`flex items-center gap-3 px-4 py-2 rounded-full border ${timeLeft < 60 ? "bg-destructive/10 border-destructive text-destructive animate-pulse" : "bg-primary/10 border-primary text-primary"}`}>
          <Clock className="w-5 h-5" />
          <span className="text-xl font-mono font-bold">{formatTime(timeLeft || 0)}</span>
        </div>
      </header>

      <div className="px-4 space-y-6">
        {quiz.questions?.map((question, index) => (
          <Card key={question._id || index} className="overflow-hidden border-2 hover:border-primary/20 transition-colors">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                  {index + 1}
                </span>
                <span className="pt-1">{question.text || question.question}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <RadioGroup
                value={answers[question._id] || ""}
                onValueChange={(val) => handleAnswerChange(question._id, val)}
                className="space-y-3"
              >
                {question.options?.map((option, optIndex) => (
                  <div 
                    key={optIndex} 
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${answers[question._id] === option ? "bg-primary/5 border-primary shadow-sm" : "hover:bg-accent border-transparent"}`}
                  >
                    <RadioGroupItem value={option} id={`q-${index}-opt-${optIndex}`} />
                    <Label 
                      htmlFor={`q-${index}-opt-${optIndex}`}
                      className="flex-1 cursor-pointer text-base font-medium"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg z-20">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-4">
          <p className="text-sm text-muted-foreground hidden sm:block">
            {Object.keys(answers).length} of {quiz.questions?.length} answered
          </p>
          <div className="flex gap-4 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={() => {
                if (confirm("Are you sure you want to leave? Your progress will not be saved.")) {
                  setIsFinished(true);
                  navigate(-1);
                }
              }}
              className="flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitMutation.isPending || isFinished}
              className="flex-1 sm:flex-initial min-w-[120px]"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Quiz"
              )}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default QuizPage;
