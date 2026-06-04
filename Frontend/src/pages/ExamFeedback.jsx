import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useParams,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import examService from "@/api/exam";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  BookOpen,
  CheckCircle,
  XCircle,
  FileText,
  Trophy,
  ArrowLeft,
  Calendar,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ExamFeedback = () => {
  const { id: resultId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const lookupMode = location.state?.lookup || searchParams.get("lookup");

  const unwrapResponse = (value) => value?.data?.data || value?.data || value;

  const normalizeResults = (value) => {
    const data = unwrapResponse(value);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.examResults)) return data.examResults;
    return data ? [data] : [];
  };

  const findCurrentStudentResult = (results) => {
    if (!Array.isArray(results) || results.length === 0) return null;

    const currentUserId = user?.id || user?.userId || user?.studentId;
    if (!currentUserId) return results[0];

    return (
      results.find((result) => {
        const studentId =
          result.studentId ||
          result.userId ||
          result.examResult?.studentId ||
          result.student?.id ||
          result.student?.studentId;

        return String(studentId) === String(currentUserId);
      }) || results[0]
    );
  };

  const getResultId = (result) =>
    result?.examResultId ||
    result?.resultId ||
    result?.examResultID ||
    result?.examResult?.examResultId ||
    result?.examResult?.id ||
    result?.id;

  const {
    data: details,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["exam-result-by-id", resultId, lookupMode, user?.id],
    queryFn: async () => {
      if (!resultId || resultId === "undefined" || resultId === "null")
        return null;

      if (lookupMode === "exam") {
        const results = await examService.getResultsByExam(resultId);
        const studentResult = findCurrentStudentResult(normalizeResults(results));
        const studentResultId = getResultId(studentResult);

        if (studentResultId) {
          return examService.getResultById(studentResultId);
        }

        return studentResult;
      }

      try {
        const res = await examService.getResultById(resultId);
        return res; // هنرجع الـ response بالكامل والـ Extraction هيحصل تحت بأمان
      } catch (err) {
        console.warn("Falling back to exam results by examId:", err);
        const results = await examService.getResultsByExam(resultId);
        const studentResult = findCurrentStudentResult(normalizeResults(results));
        const studentResultId = getResultId(studentResult);

        if (studentResultId) {
          return examService.getResultById(studentResultId);
        }

        return studentResult;
      }
    },
    enabled: !!resultId && resultId !== "undefined" && resultId !== "null",
  });

  // 🚀 اطبخ الـ Console ده عشان تفتح الـ Inspect وتشوف الداتا جاية إزاي لو لسه مظهرتش

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">
          Retrieving your exam insights...
        </p>
      </div>
    );
  }

  if (isError || !details) {
    return (
      <div className="fb-card mx-auto mt-12 max-w-2xl space-y-6 p-8 text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
          <XCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Feedback Report Unreachable</h2>
          <p className="text-muted-foreground">
            We couldn't retrieve your submission details for this exam.
          </p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  // 🛠️ محاولة استخراج الـ Object الداخلي اللي جواه الداتا الفعالة بأي شكل كان
  const targetData = unwrapResponse(details) || {};

  // استخراج الإسكور والعنوان والبيانات الأساسية
  const rawScore =
    targetData.score ??
    targetData.examResult?.score ??
    targetData.percentage ??
    targetData.totalScore;
  const studentName =
    targetData.studentName || targetData.examResult?.studentName || "Student";
  const examTitle =
    targetData.examTitle || targetData.examResult?.examTitle || "Assessment";
  const startedAt = targetData.startedAt || targetData.examResult?.startedAt;

  // 🚀 الحل القاتل: استخراج المصفوفة أياً كان مكانها أو مسماها
  const answers =
    targetData.studentAnswers ||
    targetData.examResult?.studentAnswers ||
    targetData.answers ||
    targetData.examResult?.answers ||
    targetData.answerDetails ||
    targetData.examResult?.answerDetails ||
    [];

  // حساب عدد الإجابات الصحيحة والدرجات ديناميكياً
  const correctAnswersCount = answers.filter(
    (a) => a.isCorrect === true || a.isCorrect === "true",
  ).length;

  const totalEarned = answers.reduce(
    (acc, curr) => acc + Number(curr.earnedScore ?? curr.score ?? 0),
    0,
  );
  const totalPossible = answers.reduce(
    (acc, curr) => acc + Number(curr.questionMark ?? curr.mark ?? curr.points ?? 0),
    0,
  );
  const score =
    rawScore !== undefined && rawScore !== null
      ? Number(rawScore)
      : totalPossible > 0
        ? Math.round((totalEarned / totalPossible) * 100)
        : 0;
  const isPassed = score >= 50;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20 animate-fade-in">
      <div className="row justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="gap-2 hover:bg-primary/5 -ml-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Grades
        </Button>
        <Badge variant="outline" className="font-mono">
          Result ID: {resultId}
        </Badge>
      </div>

      <header className="space-y-6">
        <div className="page__head">
          <div>
            <h1 className="page__title flex items-center gap-3">
              <FileText className="h-9 w-9 text-primary" />
              Exam Performance
            </h1>
            <p className="page__subtitle">{examTitle}</p>
          </div>

          <div className="min-w-[200px] text-center">
            <div className={`score-pill score-pill--${isPassed ? "A" : "F"} text-lg`}>
              {score}%
            </div>
            <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {isPassed ? "Passed" : "Failed"}
            </div>
          </div>
        </div>

        <div className="grid-3">
          <div className="stat">
            <div className="stat__head">
              <div className="stat__icon stat__icon--teal">
                <User className="h-5 w-5" />
              </div>
            </div>
            <div className="stat__val truncate text-2xl">{studentName}</div>
            <div className="stat__label">Student</div>
          </div>
          <div className="stat">
            <div className="stat__head">
              <div className="stat__icon stat__icon--green">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="stat__val text-2xl">
              {startedAt ? new Date(startedAt).toLocaleDateString() : "N/A"}
            </div>
            <div className="stat__label">Date Taken</div>
          </div>
          <div className="stat">
            <div className="stat__head">
              <div className="stat__icon stat__icon--amber">
                <Clock className="h-5 w-5" />
              </div>
              <Trophy className={`h-5 w-5 ${isPassed ? "text-amber-500" : "text-muted-foreground"}`} />
            </div>
            <div className="stat__val text-2xl">
              {totalEarned} / {totalPossible}
            </div>
            <div className="stat__label">Marks</div>
          </div>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b pb-4">
          <BookOpen className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Review Answers</h2>
          <div className="ml-auto text-sm font-medium text-muted-foreground">
            {correctAnswersCount} / {answers.length} Correct
          </div>
        </div>

        <div className="space-y-6">
          {answers.length > 0 ? (
            answers.map((ans, idx) => {
              const isCorrect =
                ans.isCorrect === true || ans.isCorrect === "true";

              return (
                <div
                  key={idx}
                  className={`fb-card overflow-hidden transition-all ${isCorrect ? "border-green-500/20" : "border-destructive/20"}`}
                >
                  <div className="fb-card__head">
                    <div className="flex gap-4">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${isCorrect ? "bg-green-500 text-white" : "bg-destructive text-white"}`}
                      >
                        {idx + 1}
                      </span>
                      <div className="space-y-1 flex-1">
                        <p className="font-bold text-lg leading-tight pt-0.5">
                          {ans.questionText || "Question"}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">
                          Points: {ans.earnedScore ?? 0} /{" "}
                          {ans.questionMark ?? 0}
                        </p>
                      </div>
                      {isCorrect ? (
                        <div className="p-1.5 rounded-full bg-green-500/10 text-green-600">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-full bg-destructive/10 text-destructive">
                          <XCircle className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="fb-card__body ml-0 md:ml-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div
                        className={`p-4 rounded-xl border-2 flex flex-col gap-1 transition-all ${isCorrect ? "border-green-500/20 bg-background" : "border-destructive/20 bg-background shadow-sm"}`}
                      >
                        <p className="text-[10px] uppercase font-black text-muted-foreground">
                          Your Answer
                        </p>
                        <p
                          className={`font-bold text-sm flex items-center gap-2 ${isCorrect ? "text-green-600" : "text-destructive"}`}
                        >
                          {!isCorrect && <XCircle className="w-4 h-4" />}
                          {ans.selectedOptionText || "No answer provided"}
                        </p>
                      </div>

                      {!isCorrect && (
                        <div className="p-4 rounded-xl border-2 border-blue-500/20 bg-blue-500/5 flex flex-col gap-1 transition-all">
                          <p className="text-[10px] uppercase font-black text-blue-600/70">
                            Correct Answer
                          </p>
                          <p className="font-bold text-sm text-blue-700 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            {ans.correctOptionText || "N/A"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-muted/20 border rounded-xl">
              <p className="text-muted-foreground font-medium">
                Detailed answer mapping is not available for this session.
              </p>
            </div>
          )}
        </div>
      </section>

      <footer className="pt-10 flex justify-center">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          className="h-12 px-8 rounded-xl font-bold shadow-md hover:bg-primary/5"
        >
          Return to Grades
        </Button>
      </footer>
    </div>
  );
};

export default ExamFeedback;
