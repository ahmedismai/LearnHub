import { useState, useEffect } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";

import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertTriangle, Trophy } from "lucide-react";
import { toast } from "sonner";

import examService from "@/api/exam";
import { unwrapResponse } from "@/lib/response";

const QuizPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const type = searchParams.get("type") || "exam";

  const { user } = useAuth();

  const aiData = location.state?.quizData;
  const previewMode = location.state?.previewMode;
  const isEditMode = location.state?.mode === "edit";

  // ✅ FIX: فصلنا role عن preview
  const isInstructor = user?.role === "Instructor";
  const isAdmin = user?.role === "Administrator";

  const isAiPractice = id === "ai-practice";

  const isPreview = previewMode || isEditMode || isInstructor || isAdmin;

  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [submittedResult, setSubmittedResult] = useState(null);

  const pickValue = (source, keys) => {
    for (const key of keys) {
      const value = source?.[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return null;
  };

  const getSubmitResultId = (response, body) => {
    const explicitId = getResultId(body) || getResultId(response);
    if (explicitId) return explicitId;

    const rawData = response?.data;
    return typeof rawData === "number" || typeof rawData === "string"
      ? rawData
      : null;
  };

  const getScoreFromMessage = (message) => {
    const match = String(message || "").match(/scored\s+(\d+(?:\.\d+)?)%/i);
    return match ? Number(match[1]) : null;
  };

  const getResultId = (value) =>
    pickValue(value, [
      "examResultId",
      "ExamResultId",
      "examResultID",
      "ExamResultID",
      "resultId",
      "ResultId",
      "id",
      "Id",
    ]) ||
    pickValue(value?.examResult, ["examResultId", "ExamResultId", "id", "Id"]);

  const getScore = (value) => {
    const rawScore =
      pickValue(value, ["score", "Score", "percentage", "Percentage", "totalScore"]) ??
      pickValue(value?.examResult, ["score", "Score", "percentage", "Percentage"]);

    if (rawScore !== null) return Number(rawScore);

    const messageScore = getScoreFromMessage(value?.message);
    if (messageScore !== null) return messageScore;

    const answers = value?.studentAnswers || value?.answers || value?.answerDetails || [];
    const earned = answers.reduce(
      (sum, answer) => sum + Number(answer.earnedScore ?? answer.score ?? 0),
      0,
    );
    const total = answers.reduce(
      (sum, answer) => sum + Number(answer.questionMark ?? answer.mark ?? answer.points ?? 0),
      0,
    );

    return total > 0 ? Math.round((earned / total) * 100) : 0;
  };

  // ================= FETCH =================
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["exam", id, type],

    queryFn: async () => {
      if (isAiPractice && aiData) return aiData;

      // ✅ Preview → تفاصيل فقط
      if (isPreview) {
        return await examService.getDetails(id);
      }

      try {
        // Student start exam
        const res = await examService.startExam(id);
        if (!isPreview) {
          setStartTime(new Date().toISOString());
        }
        return res;
      } catch (err) {
        console.error("Start Exam Error:", err);
        throw err; // Re-throw to be caught by useQuery
      }
    },

    enabled: !!id,
    retry: false, // Don't retry on failure to start exam
  });

  const quizData = unwrapResponse(data);
  const questions = quizData?.questions || [];

  // ================= TIMER =================
  useEffect(() => {
    if (!quizData || isPreview) return;

    const mins = quizData.durationInMinutes || 15;
    setTimeLeft(mins * 60);
  }, [quizData, isPreview]);

  useEffect(() => {
    if (!timeLeft || isFinished || isPreview) return;

    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const t = setInterval(() => {
      setTimeLeft((p) => p - 1);
    }, 1000);

    return () => clearInterval(t);
  // The timer intentionally advances only on time changes; adding submit handlers here
  // recreates the interval on answer changes and causes timer jitter.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isFinished, isPreview]);

  // ================= SUBMIT =================
  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      if (isPreview) return;
      return examService.submitResult(payload);
    },

    onSuccess: (res) => {
      if (isPreview) {
        toast.info("Preview Mode");
        navigate(-1);
        return;
      }

      const body = unwrapResponse(res);
      const resultId = getSubmitResultId(res, body);
      const finalScore =
        getScore(res) ||
        getScore(body) ||
        getScoreFromMessage(res?.message) ||
        0;

      toast.success(res?.message || "Exam submitted successfully!");
      setIsFinished(true);
      setScore(finalScore);
      setSubmittedResult({
        id: resultId,
        examId: id,
        lookup: resultId ? "result" : "exam",
      });
      setShowResults(true);
    },

    onError: (err) => {
      const msg = err.response?.data?.message || "Submission failed";
      toast.error(msg);
    },
  });

  const handleAnswerChange = (qId, optionId) => {
    if (isFinished) return;

    setAnswers((prev) => ({
      ...prev,
      [qId]: optionId,
    }));
  };

  const handleSubmit = () => {
    if (isFinished || submitMutation.isPending) return;

    if (isPreview) {
      toast.info("Preview Mode Only");
      navigate(-1);
      return;
    }

    const payload = {
      examId: id,
      startedAt: startTime || new Date().toISOString(),
      answers: questions
        .filter((q) => answers[q.questionId])
        .map((q) => ({
          questionId: q.questionId,
          answer: answers[q.questionId],
        })),
    };

    submitMutation.mutate(payload);
  };

  // ================= LOADING =================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  // ================= ERROR =================
  if (isError) {
    const errorMessage = error.response?.data?.message || "No Exam Found";
    return (
      <div className="text-center mt-12 px-4">
        <AlertTriangle className="mx-auto w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Exam Access Restricted</h2>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          {errorMessage}
        </p>
        <Button onClick={() => navigate(-1)} className="mt-6">
          Go Back
        </Button>
      </div>
    );
  }

  if (!questions.length && !isAiPractice) {
    return (
      <div className="text-center mt-12 px-4">
        <AlertTriangle className="mx-auto w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-foreground">No Questions Found</h2>
        <p className="text-muted-foreground mt-2">
          This exam doesn't seem to have any questions.
        </p>
        <Button onClick={() => navigate(-1)} className="mt-6">
          Go Back
        </Button>
      </div>
    );
  }

  // ================= RESULTS =================
  if (showResults) {
    const feedbackTargetId = submittedResult?.id || submittedResult?.examId || id;
    const lookup = submittedResult?.lookup || (submittedResult?.id ? "result" : "exam");

    return (
      <div className="min-h-[420px] flex items-center justify-center px-4">
        <Card className="surface-glass w-full max-w-md text-center">
          <CardContent className="p-8 space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Trophy className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {score >= 50 ? "Exam Submitted" : "Exam Completed"}
              </h2>
              <p className="text-muted-foreground mt-1">
                Your score is ready.
              </p>
            </div>
            <p className={`text-6xl font-black ${score >= 50 ? "text-green-500" : "text-destructive"}`}>
              {score}%
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1"
                onClick={() =>
                  navigate(`/dashboard/exam-result/${feedbackTargetId}?lookup=${lookup}`, {
                    replace: true,
                    state: { lookup, examId: id },
                  })
                }
              >
                View Feedback
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/dashboard/exams", { replace: true })}
              >
                Back to Exams
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ================= UI =================
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      {/* HEADER */}
      <div className="page__head">
        <div>
          <h1 className="page__title">{quizData?.title}</h1>
          <p className="page__subtitle">
            Answer each question carefully before submitting your assessment.
          </p>
        </div>

        {timeLeft !== null && !isPreview && (
          <div className="score-pill score-pill--B text-lg">
            {Math.floor(timeLeft / 60)}:
            {(timeLeft % 60).toString().padStart(2, "0")}
          </div>
        )}
      </div>

      {/* QUESTIONS */}
      {questions.map((q, idx) => (
        <Card key={q.questionId} className="surface-glass">
          <CardHeader>
            <p className="font-semibold">
              {idx + 1}. {q.questionText}
            </p>
          </CardHeader>

          <CardContent>
            <RadioGroup
              onValueChange={(val) => handleAnswerChange(q.questionId, val)}
            >
              {q.options?.map((opt) => (
                <div
                  key={opt.answerOptionId}
                  className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-muted/50"
                >
                  <RadioGroupItem
                    value={String(opt.answerOptionId)}
                    id={`${opt.answerOptionId}`}
                  />
                  <Label htmlFor={`${opt.answerOptionId}`}>
                    {opt.optionText}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      ))}

      {/* FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border/60 bg-background/85 p-4 backdrop-blur-xl">
        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={submitMutation.isPending}
        >
          {isPreview
            ? "Exit Preview"
            : submitMutation.isPending
              ? "Submitting..."
              : "Submit"}
        </Button>
      </div>
    </div>
  );
};

export default QuizPage;
