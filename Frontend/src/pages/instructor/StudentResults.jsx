import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import examService from "@/api/exam";
import courseService from "@/api/course";
import enrollmentService from "@/api/enrollment";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, FileText, ClipboardList, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const StudentResults = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const unwrapArray = (value) => {
    const data = value?.data?.data || value?.data || value;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  };

  const pickValue = (source, keys) => {
    for (const key of keys) {
      const value = source?.[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return null;
  };

  const getCourseId = (item) =>
    pickValue(item, ["courseId", "CourseId", "id", "Id"]) ||
    pickValue(item?.course, ["courseId", "CourseId", "id", "Id"]);

  const getCourseTitle = (item) =>
    pickValue(item, ["courseTitle", "CourseTitle", "title", "Title", "name"]) ||
    pickValue(item?.course, [
      "courseTitle",
      "CourseTitle",
      "title",
      "Title",
      "name",
    ]);

  const getStudentId = (item) =>
    pickValue(item, ["studentId", "StudentId", "userId", "UserId"]) ||
    pickValue(item?.student, ["studentId", "StudentId", "id", "Id", "userId"]);

  const getStudentName = (item) =>
    pickValue(item, [
      "studentName",
      "StudentName",
      "fullName",
      "FullName",
      "name",
    ]) ||
    pickValue(item?.student, [
      "studentName",
      "StudentName",
      "fullName",
      "FullName",
      "name",
    ]);

  const getExamId = (item) =>
    pickValue(item, ["examId", "ExamId", "examID", "ExamID"]) ||
    pickValue(item?.exam, ["examId", "ExamId", "id", "Id"]);

  const getResultId = (item) =>
    pickValue(item, [
      "examResultId",
      "ExamResultId",
      "examResultID",
      "ExamResultID",
      "resultId",
      "ResultId",
      "id",
      "Id",
    ]) ||
    pickValue(item?.examResult, ["examResultId", "ExamResultId", "id", "Id"]);

  const getExamTitle = (item) =>
    pickValue(item, ["examTitle", "ExamTitle", "title", "Title"]) ||
    pickValue(item?.exam, ["examTitle", "ExamTitle", "title", "Title"]);

  const getScore = (item) => {
    const score =
      pickValue(item, [
        "score",
        "Score",
        "percentage",
        "Percentage",
        "totalScore",
      ]) ??
      pickValue(item?.examResult, [
        "score",
        "Score",
        "percentage",
        "Percentage",
      ]);
    return score === null ? null : Number(score);
  };

  const getStartedAt = (item) =>
    pickValue(item, [
      "startedAt",
      "StartedAt",
      "submittedAt",
      "SubmittedAt",
      "createdAt",
    ]) ||
    pickValue(item?.examResult, [
      "startedAt",
      "StartedAt",
      "submittedAt",
      "SubmittedAt",
    ]);

  const buildResultRows = (course, enrollments, results) => {
    const courseId = getCourseId(course) || id;
    const courseTitle = getCourseTitle(course);

    const resultRows = results.map((result) => ({
      ...result,
      courseId: getCourseId(result) || courseId,
      courseTitle: getCourseTitle(result) || courseTitle,
      studentId: getStudentId(result),
      studentName: getStudentName(result),
      examId: getExamId(result),
      resultId: getResultId(result),
      examTitle: getExamTitle(result),
      score: getScore(result),
      startedAt: getStartedAt(result),
      hasResult: true,
    }));

    const resultStudentKeys = new Set(
      resultRows
        .map((result) =>
          String(result.studentId || result.studentName || "").toLowerCase(),
        )
        .filter(Boolean),
    );

    const enrollmentRows = enrollments
      .filter((enrollment) => {
        const key = String(
          getStudentId(enrollment) || getStudentName(enrollment) || "",
        ).toLowerCase();
        return key && !resultStudentKeys.has(key);
      })
      .map((enrollment) => ({
        courseId,
        courseTitle: getCourseTitle(enrollment) || courseTitle,
        studentId: getStudentId(enrollment),
        studentName: getStudentName(enrollment) || "Anonymous User",
        examTitle: "No exam submitted yet",
        score: null,
        hasResult: false,
      }));

    return [...resultRows, ...enrollmentRows];
  };

  const loadCourseRows = async (course) => {
    const courseId = getCourseId(course);
    if (!courseId) return [];

    const [enrollmentsResponse, examsResponse] = await Promise.all([
      enrollmentService.getByCourse(courseId).catch((error) => {
        console.warn("Could not load enrollments for course:", courseId, error);
        return [];
      }),
      examService.getByCourse(courseId).catch((error) => {
        console.warn("Could not load exams for course:", courseId, error);
        return [];
      }),
    ]);

    const exams = unwrapArray(examsResponse);
    const resultsByExam = await Promise.all(
      exams.map(async (exam) => {
        const examId = getExamId(exam) || exam.id || exam.Id;
        if (!examId) return [];

        try {
          const response = await examService.getResultsByExam(examId);
          return unwrapArray(response).map((result) => ({
            ...result,
            courseId,
            courseTitle: getCourseTitle(result) || getCourseTitle(course),
            examId: getExamId(result) || examId,
            examTitle: getExamTitle(result) || getExamTitle(exam),
          }));
        } catch (error) {
          console.warn("Could not load results for exam:", examId, error);
          return [];
        }
      }),
    );

    return buildResultRows(
      course,
      unwrapArray(enrollmentsResponse),
      resultsByExam.flat(),
    );
  };

  const {
    data: response = {},
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["instructor", "student-results", id || "all", user?.id],
    queryFn: async () => {
      if (id && id !== "undefined" && id !== "null") {
        const course = { courseId: id };
        const rows = await loadCourseRows(course);
        return { data: rows };
      }

      const coursesResponse = await courseService.getMyCourses();
      const courses = unwrapArray(coursesResponse);
      const courseRows = await Promise.all(courses.map(loadCourseRows));
      return { data: courseRows.flat() };
    },
    enabled: !!user,
    retry: false,
  });

  // Extract message from response data or axios error
  const apiMessage = error?.response?.data?.message || response?.message;

  const results = unwrapArray(response);

  const filteredResults = Array.isArray(results)
    ? results.filter((res) => {
        const matchesSearch =
          (getStudentName(res) || res.studentName || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (getExamTitle(res) || res.examTitle || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (getCourseTitle(res) || res.courseTitle || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        return matchesSearch;
      })
    : [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle actual API errors (like 400 Bad Request) that don't return the "No results" message
  if (isError && !apiMessage) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Error Loading Results</h2>
        <p className="text-muted-foreground">
          {error?.response?.data?.message ||
            error?.message ||
            "An unexpected error occurred while fetching results."}
        </p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="page__head">
        <div>
          <h1 className="page__title">Exam Results</h1>
          <p className="page__subtitle">
            View enrolled students, grades, and feedback for your courses
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students or exams..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="surface-glass overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-background/50 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Performance Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="data-list">
            <div className="data-list__head grid-cols-[1.2fr,1.2fr,1.2fr,0.6fr,0.8fr,0.9fr]">
              <span>Student</span>
              <span>Course</span>
              <span>Assessment</span>
              <span className="text-center">Score</span>
              <span className="text-center">Result</span>
              <span className="text-right">Actions</span>
            </div>
              {filteredResults.length > 0 ? (
                filteredResults.map((res, index) => {
                  const targetExamId = getExamId(res) || res.examId;
                  const targetResultId = getResultId(res) || res.resultId;
                  const feedbackTargetId = targetResultId || targetExamId;
                  const lookup = targetResultId ? "result" : "exam";
                  const scoreValue = getScore(res);
                  const hasResult =
                    res.hasResult !== false && scoreValue !== null;

                  return (
                    <div
                      key={
                        targetResultId ||
                        `${res.courseId}-${res.studentId}-${targetExamId}-${index}`
                      }
                      className="data-list__row grid-cols-[1.2fr,1.2fr,1.2fr,0.6fr,0.8fr,0.9fr]"
                    >
                      <div className="data-list__cell" data-label="Student">
                        <div className="font-bold text-foreground">
                          {getStudentName(res) || res.studentName || "N/A"}
                        </div>
                        {res.studentId && (
                          <div className="text-xs text-muted-foreground">
                            {res.studentId}
                          </div>
                        )}
                      </div>
                      <div className="data-list__cell font-medium" data-label="Course">
                        {getCourseTitle(res) || res.courseTitle || "Course"}
                      </div>
                      <div className="data-list__cell font-medium" data-label="Assessment">
                        {getExamTitle(res) || res.examTitle || "Final Exam"}
                      </div>
                      <div className="data-list__cell text-center" data-label="Score">
                        {hasResult ? (
                          <span className="font-bold text-lg">
                            {scoreValue}%
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="data-list__cell text-center" data-label="Result">
                        <Badge
                          variant={
                            !hasResult
                              ? "secondary"
                              : scoreValue >= 50
                                ? "success"
                                : "destructive"
                          }
                          className="shadow-sm"
                        >
                          {!hasResult
                            ? "NO SUBMISSION"
                            : scoreValue >= 50
                              ? "PASSED"
                              : "FAILED"}
                        </Badge>
                      </div>
                      <div className="data-list__cell data-list__actions" data-label="Actions">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1"
                          disabled={!feedbackTargetId}
                        >
                          <Link
                            to={
                              feedbackTargetId
                                ? `/dashboard/exam-result/${feedbackTargetId}?lookup=${lookup}`
                                : "#"
                            }
                            state={{ lookup, examId: targetExamId }}
                          >
                            <Eye className="w-3 h-3" /> Feedback
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <ClipboardList className="w-6 h-6 opacity-20" />
                      </div>
                      <p className="font-medium text-lg">
                        No Results Available
                      </p>
                      <p className="text-sm max-w-[280px] mx-auto">
                        {apiMessage ||
                          "No enrolled students or exam results were found for your courses yet."}
                      </p>
                    </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentResults;
