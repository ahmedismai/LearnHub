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
import { Loader2, Clock } from "lucide-react";

const Exam = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds

  // Fetch Exam Details
  const { data: exam, isLoading } = useQuery({
    queryKey: ["exam", id],
    queryFn: async () => {
      const response = await api.get(`/Exam/${id}`);
      return response.data;
    },
  });

  // Submit Exam Mutation
  const submitMutation = useMutation({
    mutationFn: async (examData) => {
      return api.post("/ExamResult/Submit", examData);
    },
    onSuccess: () => {
      toast({ title: "Exam submitted successfully!" });
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

  // Timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      handleSubmit();
    }
  }, [timeLeft]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = () => {
    if (!exam) return;
    const examData = {
      examId: id,
      answers: Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      })),
    };
    submitMutation.mutate(examData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
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
