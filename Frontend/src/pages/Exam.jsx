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
import { Loader2, Clock, GraduationCap } from "lucide-react";

const Exam = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);

  // Check if already submitted
  const { data: existingResult, isLoading: isCheckingResult } = useQuery({
    queryKey: ["examResult", id, user?.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/ExamResult/StudentResults/${id}`); // This might need a specific endpoint to check by examId
        // The endpoint /StudentResults/:courseId exists, let's see if we can use another one
        // or just rely on the error or empty array from a new endpoint.
        // Actually, let's add an endpoint to check result by examId.
        const res = await api.get(`/ExamResult/ByExam/${id}/me`);
        return res.data;
      } catch (e) {
        return null;
      }
    },
    enabled: !!id && !!user,
  });

  // Fetch Exam Details
  const { data: exam, isLoading } = useQuery({
    queryKey: ["exam", id],
    queryFn: async () => {
      const response = await api.get(`/Exam/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      if (!timeLeft && data.duration) {
        const mins = parseInt(data.duration);
        if (!isNaN(mins)) {
          setTimeLeft(mins * 60);
        } else {
          setTimeLeft(3600); // Default 1 hour
        }
      }
    },
  });

  useEffect(() => {
    if (exam && !timeLeft) {
      const mins = parseInt(exam.duration) || 30;
      setTimeLeft(mins * 60);
    }
  }, [exam]);

  // Submit Exam Mutation
  const submitMutation = useMutation({
    mutationFn: async (examData) => {
      return api.post("/ExamResult/Submit", examData);
    },
    onSuccess: () => {
      toast({ title: "Exam submitted successfully!" });
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
    if (timeLeft === null) return;

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
  }, [timeLeft]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = () => {
    if (!exam || submitMutation.isPending) return;
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
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (existingResult) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4 p-8 border rounded-2xl shadow-xl bg-background">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
           <GraduationCap className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold">Exam Already Submitted</h2>
        <p className="text-muted-foreground">You have already completed this exam. You cannot take it multiple times.</p>
        <Button onClick={() => navigate("/dashboard/quizzes")} className="w-full">
          Back to Quizzes
        </Button>
      </div>
    );
  }

  if (!exam) {
    return <div>Exam not found</div>;
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{exam.title}</h1>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <span className="text-lg font-mono">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="space-y-6">
        {exam.questions?.map((question, index) => (
          <Card key={question._id}>
            <CardHeader>
              <CardTitle className="text-lg">
                {index + 1}. {question.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[question._id] || ""}
                onValueChange={(value) =>
                  handleAnswerChange(question._id, value)
                }
              >
                {question.options?.map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={option}
                      id={`${question._id}-${optIndex}`}
                    />
                    <Label htmlFor={`${question._id}-${optIndex}`}>
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end mt-6">
        <Button
          onClick={handleSubmit}
          disabled={submitMutation.isPending}
          size="lg"
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            "Submit Exam"
          )}
        </Button>
      </div>
    </div>
  );
};

export default Exam;
