import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import examService from "@/api/exam";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Eye, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const pickValue = (source, keys) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const unwrapArray = (value) => {
  const data = value?.data?.data || value?.data || value;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const getExamId = (item) =>
  pickValue(item, ["examId", "ExamId", "examID", "ExamID"]) ||
  pickValue(item?.exam, ["examId", "ExamId", "examID", "ExamID", "id", "Id"]);

const getGradeId = (item) =>
  pickValue(item, ["gradeId", "GradeId", "gradeID", "GradeID"]);

const getResultId = (item) =>
  pickValue(item, [
    "examResultId",
    "ExamResultId",
    "examResultID",
    "ExamResultID",
    "resultId",
    "ResultId",
  ]) ||
  pickValue(item?.examResult, [
    "examResultId",
    "ExamResultId",
    "id",
    "Id",
  ]);

const getCourseId = (item) =>
  pickValue(item, ["courseId", "CourseId", "courseID", "CourseID"]) ||
  pickValue(item?.course, ["courseId", "CourseId", "id", "Id"]);

const getExamTitle = (item) =>
  pickValue(item, ["examTitle", "ExamTitle", "title", "Title"]) ||
  pickValue(item?.exam, ["examTitle", "ExamTitle", "title", "Title"]);

const getScore = (item) =>
  Number(
    pickValue(item, ["score", "Score", "percentage", "Percentage"]) ??
      pickValue(item?.examResult, ["score", "Score"]) ??
      0,
  );

const findMatchingResult = (submittedExam, results) => {
  const submittedTitle = normalizeText(getExamTitle(submittedExam));
  const submittedScore = getScore(submittedExam);

  return (
    results.find((result) => {
      const resultTitle = normalizeText(getExamTitle(result));
      return submittedTitle && resultTitle && submittedTitle === resultTitle;
    }) ||
    results.find((result) => {
      const resultTitle = normalizeText(getExamTitle(result));
      return (
        submittedTitle &&
        resultTitle &&
        (submittedTitle.includes(resultTitle) || resultTitle.includes(submittedTitle))
      );
    }) ||
    results.find((result) => getScore(result) === submittedScore) ||
    null
  );
};

const enrichSubmittedExams = async (dashboardData, studentId) => {
  const submittedExams = Array.isArray(dashboardData?.submittedExams)
    ? dashboardData.submittedExams
    : [];
  const availableExams = Array.isArray(dashboardData?.availableExams)
    ? dashboardData.availableExams
    : [];

  const knownExams = [...availableExams];
  const knownResults = [];
  const submittedMissingIds = submittedExams.some(
    (exam) => !getExamId(exam) && !getResultId(exam),
  );

  if (submittedMissingIds) {
    const courses = Array.isArray(dashboardData?.myCourses)
      ? dashboardData.myCourses
      : [];
    const coursePayloads = await Promise.all(
      courses.map(async (course) => {
        const courseId = course.courseId || course.id || course.course?.courseId;
        if (!courseId) return [];

        const payload = { exams: [], results: [] };

        try {
          const response = await examService.getByCourse(courseId);
          payload.exams = unwrapArray(response);
        } catch (error) {
          console.warn("Could not load exams for course:", courseId, error);
        }

        try {
          const response = await examService.getStudentResults(courseId, studentId);
          payload.results = unwrapArray(response);
        } catch (error) {
          console.warn("Could not load student results for course:", courseId, error);
        }

        return payload;
      }),
    );

    coursePayloads.forEach((payload) => {
      knownExams.push(...payload.exams);
      knownResults.push(...payload.results);
    });
  }

  const examsByTitle = new Map();
  knownExams.forEach((exam) => {
    const title = normalizeText(getExamTitle(exam));
    const examId = getExamId(exam) || exam.id || exam.Id;
    if (title && examId) examsByTitle.set(title, examId);
  });

  return {
    ...dashboardData,
    submittedExams: submittedExams.map((exam) => {
      const existingExamId = getExamId(exam);
      const existingResultId = getResultId(exam);
      if (existingExamId || existingResultId) return exam;

      const matchingResult = findMatchingResult(exam, knownResults);
      if (matchingResult) {
        return {
          ...exam,
          examId: getExamId(matchingResult),
          examResultId: getResultId(matchingResult),
        };
      }

      const matchedExamId = examsByTitle.get(normalizeText(getExamTitle(exam)));
      return matchedExamId ? { ...exam, examId: matchedExamId } : exam;
    }),
  };
};

const Grades = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    data: dashboardData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["student", "dashboard"],
    queryFn: async () => {
      const response = await api.get("/api/Dashboard/StudentDashboard");
      const data = response.data?.data || response.data;
      return enrichSubmittedExams(data, user?.id);
    },
    enabled: !!user,
  });

  const grades = dashboardData?.submittedExams || [];

  const overallGrade =
    grades.length > 0
      ? Math.round(
          grades.reduce((sum, g) => sum + (g.score || 0), 0) / grades.length,
        )
      : 0;

  const getGradeColor = (percentage) => {
    if (percentage >= 85) return "success";
    if (percentage >= 65) return "default";
    if (percentage >= 50) return "warning";
    return "destructive";
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 85) return "A";
    if (percentage >= 75) return "B";
    if (percentage >= 65) return "C";
    if (percentage >= 50) return "D";
    return "F";
  };

  const totalGradesCount = grades.length || 1;
  const countA = grades.filter((g) => (g.score || 0) >= 85).length;
  const countB = grades.filter(
    (g) => (g.score || 0) >= 75 && (g.score || 0) < 85,
  ).length;
  const countC = grades.filter(
    (g) => (g.score || 0) >= 65 && (g.score || 0) < 75,
  ).length;
  const countD = grades.filter(
    (g) => (g.score || 0) >= 50 && (g.score || 0) < 65,
  ).length;

  const distributionItems = [
    {
      label: "A (85-100%)",
      count: countA,
      percentage: Math.round((countA / totalGradesCount) * 100),
    },
    {
      label: "B (75-84%)",
      count: countB,
      percentage: Math.round((countB / totalGradesCount) * 100),
    },
    {
      label: "C (65-74%)",
      count: countC,
      percentage: Math.round((countC / totalGradesCount) * 100),
    },
    {
      label: "D (50-64%)",
      count: countD,
      percentage: Math.round((countD / totalGradesCount) * 100),
    },
  ];

  const openFeedback = ({ targetId, lookup, examId }) => {
    if (!targetId) {
      alert(
        "Feedback is not available because this result does not include an exam id or result id, and no matching exam was found by title.",
      );
      return;
    }

    navigate(`/dashboard/exam-result/${targetId}?lookup=${lookup}`, {
      state: { lookup, examId },
    });
  };

  return (
    <div className="animate-fade-in pb-12">
      <div className="page__head">
        <div>
          <h1 className="page__title">Grades</h1>
          <p className="page__subtitle">
            Every assessment, every course - your full transcript at a glance.
          </p>
        </div>
        <div className="row gap-2">
          <Button variant="outline">Export PDF</Button>
          <Button>Share Transcript</Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {isError && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <p className="text-destructive font-medium">
              Failed to load grades. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr,1.6fr]">
            <div className="gpa-card">
              <div className="relative text-[11px] font-extrabold uppercase tracking-[0.2em] opacity-80">
                Overall Grade
              </div>
              <div className="relative">
                <div className="gpa-card__num">
                  {getGradeLetter(overallGrade)}
                  <sub>{overallGrade}%</sub>
                </div>
                <div className="row gap-2 mt-3.5">
                  <Badge className="border border-white/25 bg-white/20 text-white">
                    {overallGrade}% average
                  </Badge>
                  <span className="text-sm opacity-85">
                    across {grades.length} result{grades.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>

            <Card className="trend-card">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Award className="h-5 w-5 text-primary" /> Grade Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4">
                  {distributionItems.map((item) => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="font-bold text-foreground">
                          {item.count} {item.count === 1 ? "exam" : "exams"} ({item.percentage}%)
                        </span>
                      </div>
                      <Progress value={item.percentage} className="h-2 rounded-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <h2 className="mb-3 mt-8 text-lg font-bold">All Assessments</h2>
          <div className="gtable">
            <div className="gtable__head">
              <span>Assessment</span>
              <span>Course</span>
              <span>Type</span>
              <span>Date</span>
              <span>Status</span>
              <span className="text-right">Score</span>
            </div>
                {grades.length > 0 ? (
                  grades.map((grade) => {
                    const gradeId = getGradeId(grade);
                    const resultId = getResultId(grade);
                    const examId = getExamId(grade);
                    const targetId = gradeId || resultId || examId;
                    const lookup = gradeId ? "grade" : resultId ? "result" : "exam";
                    const score = getScore(grade);

                    return (
                      <div
                        key={targetId || `${grade.examTitle}-${grade.startedAt}`}
                        className="gtable__row"
                        onClick={() => openFeedback({ targetId, lookup, examId })}
                      >
                        <span className="font-semibold text-foreground">
                          {grade.examTitle || "Assessment Report"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {grade.courseTitle || grade.courseName || "-"}
                        </span>
                        <span>
                          <Badge variant="secondary" className="text-[10px]">
                            Final Exam
                          </Badge>
                        </span>
                        <span className="text-sm font-semibold text-muted-foreground">
                          {grade.startedAt
                            ? new Date(grade.startedAt).toLocaleDateString()
                            : "N/A"}
                        </span>
                        <span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-2 rounded-lg"
                            onClick={() =>
                              openFeedback({ targetId, lookup, examId })
                            }
                          >
                            <Eye className="w-4 h-4" /> Feedback
                          </Button>
                        </span>
                        <span className="text-right">
                          <span className={`score-pill score-pill--${getGradeLetter(score)}`}>
                            {score}% - {getGradeLetter(score)}
                          </span>
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    No assessment results available yet.
                  </div>
                )}
          </div>
        </>
      )}
    </div>
  );
};

export default Grades;
