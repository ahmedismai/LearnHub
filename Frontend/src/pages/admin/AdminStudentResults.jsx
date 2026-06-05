import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Eye, FileText, Search, Users } from "lucide-react";
import accountService from "@/api/account";
import gradeService from "@/api/grade";

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

const getUserId = (item) =>
  pickValue(item, ["userId", "UserId", "studentId", "StudentId", "id", "Id"]);

const getStudentId = (item) =>
  pickValue(item, ["studentId", "StudentId", "userId", "UserId"]) ||
  pickValue(item?.student, ["studentId", "StudentId", "userId", "UserId", "id", "Id"]);

const getStudentName = (item) =>
  pickValue(item, ["studentName", "StudentName", "fullName", "FullName", "name"]) ||
  pickValue(item?.student, ["studentName", "StudentName", "fullName", "FullName", "name"]);

const getExamId = (item) =>
  pickValue(item, ["examId", "ExamId", "examID", "ExamID", "id", "Id"]) ||
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

const getGradeId = (item) =>
  pickValue(item, ["gradeId", "GradeId", "gradeID", "GradeID"]);

const getExamTitle = (item) =>
  pickValue(item, ["examTitle", "ExamTitle", "title", "Title"]) ||
  pickValue(item?.exam, ["examTitle", "ExamTitle", "title", "Title"]);

const getCourseTitle = (item) =>
  pickValue(item, ["courseTitle", "CourseTitle"]) ||
  pickValue(item?.course, ["courseTitle", "CourseTitle", "title", "Title"]);

const getScore = (item) => {
  const score =
    pickValue(item, ["score", "Score", "percentage", "Percentage", "totalScore"]) ??
    pickValue(item?.examResult, ["score", "Score", "percentage", "Percentage"]);
  return score === null ? null : Number(score);
};

const AdminStudentResults = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data = { rows: [], students: [] },
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "student-results-all"],
    queryFn: async () => {
      const [usersResponse, gradesResponse] = await Promise.all([
        accountService.getAllUsers(),
        gradeService.getAdminGrades(),
      ]);

      const users = unwrapArray(usersResponse);
      const students = users.filter((user) => {
        const roles = Array.isArray(user.roles) ? user.roles : [];
        return roles.length === 0 || roles.includes("Student");
      });

      const grades = unwrapArray(gradesResponse);
      const resultRows = grades.map((result) => ({
        gradeId: getGradeId(result),
        studentId: getStudentId(result),
        studentName: getStudentName(result) || "Student",
        email: result.email,
        examId: getExamId(result),
        resultId: getResultId(result),
        examTitle: getExamTitle(result) || "Assessment",
        courseTitle: getCourseTitle(result) || "Course",
        score: getScore(result),
        hasResult: true,
      }));

      const studentIdsWithResults = new Set(
        resultRows.map((row) => String(row.studentId || "").toLowerCase()).filter(Boolean),
      );

      const studentsWithoutResults = students
        .filter((student) => {
          const studentId = String(getUserId(student) || "").toLowerCase();
          return studentId && !studentIdsWithResults.has(studentId);
        })
        .map((student) => ({
          studentId: getUserId(student),
          studentName: student.fullName || student.name || "Student",
          email: student.email,
          examTitle: "No grades yet",
          courseTitle: "-",
          score: null,
          hasResult: false,
        }));

      return {
        rows: [...resultRows, ...studentsWithoutResults],
        students,
      };
    },
    retry: false,
  });

  const rows = useMemo(() => data.rows || [], [data.rows]);
  const submittedRows = useMemo(
    () => rows.filter((row) => row.hasResult),
    [rows],
  );
  const averageScore =
    submittedRows.length > 0
      ? Math.round(
          submittedRows.reduce((sum, row) => sum + Number(row.score || 0), 0) /
            submittedRows.length,
        )
      : 0;

  const filteredRows = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((row) =>
      [
        row.studentName,
        row.studentId,
        row.email,
        row.courseTitle,
        row.examTitle,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [rows, searchTerm]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-12 text-center space-y-4">
        <FileText className="w-12 h-12 mx-auto text-destructive" />
        <h1 className="text-2xl font-bold">Failed to Load Student Results</h1>
        <p className="text-muted-foreground">
          {error?.response?.data?.message || error?.message || "Please try again later."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in pb-12">
      <div className="page__head">
        <div>
          <h1 className="page__title">Student Results</h1>
          <p className="page__subtitle">
            Platform-wide exam grades for all students
          </p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search student, course, or exam..."
            className="pl-10 h-11"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="surface-glass">
          <CardContent className="p-5 flex items-center gap-4">
            <Users className="w-9 h-9 text-primary" />
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">
                Students
              </p>
              <p className="text-2xl font-black">{data.students.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-glass">
          <CardContent className="p-5 flex items-center gap-4">
            <FileText className="w-9 h-9 text-primary" />
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">
                Submitted Results
              </p>
              <p className="text-2xl font-black">{submittedRows.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-glass">
          <CardContent className="p-5 flex items-center gap-4">
            <BarChart3 className="w-9 h-9 text-primary" />
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">
                Average Score
              </p>
              <p className="text-2xl font-black">{averageScore}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="surface-glass overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-background/50">
          <CardTitle>All Student Grades</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="data-list">
            <div className="data-list__head grid-cols-[1.2fr,1.2fr,1.2fr,0.6fr,0.8fr,0.9fr]">
              <span>Student</span>
              <span>Course</span>
              <span>Exam</span>
              <span className="text-center">Score</span>
              <span className="text-center">Status</span>
              <span className="text-right">Feedback</span>
            </div>
              {filteredRows.length > 0 ? (
                filteredRows.map((row, index) => {
                  const targetId = row.gradeId || row.resultId || row.examId;
                  const lookup = row.gradeId ? "grade" : row.resultId ? "result" : "exam";
                  return (
                    <div
                      key={row.gradeId || row.resultId || `${row.studentId}-${row.examId}-${index}`}
                      className="data-list__row grid-cols-[1.2fr,1.2fr,1.2fr,0.6fr,0.8fr,0.9fr]"
                    >
                      <div className="data-list__cell" data-label="Student">
                        <div className="font-bold">
                          {row.studentName || "Student"}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {row.email || row.studentId || "N/A"}
                        </div>
                      </div>
                      <div className="data-list__cell font-medium" data-label="Course">
                        {row.courseTitle}
                      </div>
                      <div className="data-list__cell" data-label="Exam">{row.examTitle}</div>
                      <div className="data-list__cell text-center" data-label="Score">
                        {row.hasResult ? (
                          <span className="text-lg font-black">
                            {row.score ?? 0}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </div>
                      <div className="data-list__cell text-center" data-label="Status">
                        <Badge
                          variant={
                            !row.hasResult
                              ? "secondary"
                              : Number(row.score || 0) >= 50
                                ? "success"
                                : "destructive"
                          }
                        >
                          {!row.hasResult
                            ? "NO GRADES"
                            : Number(row.score || 0) >= 50
                              ? "PASSED"
                              : "FAILED"}
                        </Badge>
                      </div>
                      <div className="data-list__cell data-list__actions" data-label="Feedback">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          disabled={!targetId}
                          className="h-8 gap-1"
                        >
                          <Link
                            to={
                              targetId
                                ? `/dashboard/exam-result/${targetId}?lookup=${lookup}`
                                : "#"
                            }
                            state={{ lookup, examId: row.examId }}
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state text-muted-foreground">
                    No student results match your search.
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStudentResults;
