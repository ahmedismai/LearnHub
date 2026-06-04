import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import {
  CalendarClock,
  ClipboardCheck,
  LibraryBig,
  MessageSquareText,
  Trophy,
  Zap,
  Check,
  Bell,
  Play,
  ArrowRight,
  ChevronRight,
  Loader2,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { getFullUrl } from "@/lib/urlHelper";

const FALLBACK_MY_COURSES = [
  {
    courseId: 1,
    title: "React from Zero to Hero",
    categoryName: "Web Development",
    instructorName: "Mohamed Kamal",
    progress: 72,
    gradient: "linear-gradient(135deg, #99e4dd 0%, #14b8a6 100%)",
  },
  {
    courseId: 2,
    title: "Machine Learning Fundamentals",
    categoryName: "AI & Data",
    instructorName: "Dr. Lina Khaled",
    progress: 38,
    gradient: "linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)",
  },
  {
    courseId: 3,
    title: "Python for Absolute Beginners",
    categoryName: "Programming",
    instructorName: "Ahmed Ismail",
    progress: 91,
    gradient: "linear-gradient(135deg, #ccf2ee 0%, #0f766e 100%)",
  },
];

const FALLBACK_AVAILABLE_EXAMS = [
  { examId: 1, title: "React Hooks - Final Quiz", courseTitle: "REACT FROM ZERO TO HERO" },
  { examId: 2, title: "Linear Regression Project", courseTitle: "ML FUNDAMENTALS" },
  { examId: 3, title: "CSS Grid Practical", courseTitle: "WEB FUNDAMENTALS", expired: true },
];

const FALLBACK_SUBMITTED_EXAMS = [
  { examId: 11, examTitle: "JavaScript Fundamentals Exam", score: 92, startedAt: new Date().toISOString() },
  { examId: 12, examTitle: "Git & GitHub Quiz", score: 88, startedAt: new Date().toISOString() },
  { examId: 13, examTitle: "TypeScript Basics", score: 95, startedAt: new Date().toISOString() },
];

const pageMotion = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" } },
};

const WeeklyGoalCard = ({ completed = 0 }) => {
  const days = [
    { d: "MON", done: completed >= 1 },
    { d: "TUE", done: completed >= 2 },
    { d: "WED", done: completed >= 3 },
    { d: "THU", done: completed >= 4, today: true },
    { d: "FRI", done: completed >= 5 },
    { d: "SAT", done: false },
    { d: "SUN", done: false },
  ];

  return (
    <div className="ring-card col gap-4 relative">
      <div className="row relative justify-between">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] opacity-80">
            Weekly Goal
          </div>
          <div className="row mt-1.5 items-baseline gap-1.5">
            <span className="font-outfit text-4xl font-extrabold leading-none tracking-tight">
              {completed}
            </span>
            <span className="text-base font-semibold opacity-85">/ 5 days</span>
          </div>
        </div>
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
          <Zap className="h-6 w-6" fill="currentColor" />
          <span className="absolute -bottom-1 -right-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
            {completed}d
          </span>
        </div>
      </div>
      <div className="weekstrip relative">
        {days.map((day) => (
          <div key={day.d} className="weekstrip__day">
            <span>{day.d}</span>
            <div
              className={`weekstrip__dot ${day.done ? "weekstrip__dot--done" : ""} ${
                day.today ? "weekstrip__dot--today" : ""
              }`}
            >
              {day.done && <Check size={14} />}
            </div>
          </div>
        ))}
      </div>
      <div className="relative flex items-center gap-2 text-[13px] leading-6 opacity-95">
        <Zap className="h-3.5 w-3.5 shrink-0 text-amber-400" fill="currentColor" />
        <span>
          Finish {Math.max(0, 5 - completed)} more day
          {Math.max(0, 5 - completed) === 1 ? "" : "s"} this week to hit your goal.
        </span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: async () => {
      const response = await api.get("/api/Dashboard/StudentDashboard");
      return response.data?.data || response.data;
    },
    enabled: !!user,
  });

  const hasDashboardData = Boolean(dashboardData);
  const stats = dashboardData?.stats || { totalCourses: 12, totalExams: 48 };
  const rawMyCourses = dashboardData?.myCourses || [];
  const myCoursesFromApi = rawMyCourses.map((c) => ({
    ...c,
    progress: c.progress?.progressPercentage || 0,
  }));
  const myCourses = hasDashboardData && myCoursesFromApi.length > 0 ? myCoursesFromApi : FALLBACK_MY_COURSES;
  const availableExams =
    hasDashboardData && (dashboardData?.availableExams || []).length > 0
      ? dashboardData.availableExams
      : FALLBACK_AVAILABLE_EXAMS;
  const submittedExams =
    hasDashboardData && (dashboardData?.submittedExams || []).length > 0
      ? dashboardData.submittedExams
      : FALLBACK_SUBMITTED_EXAMS;

  const weeklyCompleted = Math.min(
    5,
    myCourses.filter((course) => Number(course.progress || 0) > 0).length,
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div variants={pageMotion} initial="hidden" animate="visible">
      {/* Page head */}
      <div className="page__head">
        <div>
          <h1 className="page__title">
            Welcome back,{" "}
            <span style={{ color: "var(--teal-700)" }}>
              {user?.fullName || "Student"}
            </span>
          </h1>
          <p className="page__subtitle">
            You've got <strong style={{ color: "var(--fg-1)" }}>3 lessons</strong> to finish this week. Pick up where you left off.
          </p>
        </div>
        <div className="row gap-2">
          <Button variant="gradient" asChild>
            <Link to="/courses">
              <Compass size={16} /> Explore Courses
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        <div className="stat">
          <div className="stat__head">
            <div className="stat__icon stat__icon--teal">
              <LibraryBig size={20} />
            </div>
          </div>
          <div className="stat__val">{stats.totalCourses}</div>
          <div className="stat__label">Active courses</div>
        </div>

        <div className="stat">
          <div className="stat__head">
            <div className="stat__icon stat__icon--green">
              <ClipboardCheck size={20} />
            </div>
          </div>
          <div className="stat__val">{stats.totalExams}</div>
          <div className="stat__label">Lessons this month</div>
        </div>

        <div className="stat">
          <div className="stat__head">
            <div className="stat__icon stat__icon--amber">
              <Zap size={20} />
            </div>
          </div>
          <div className="stat__val">21</div>
          <div className="stat__label">Day streak</div>
        </div>

        <div className="stat">
          <div className="stat__head">
            <div className="stat__icon stat__icon--violet">
              <Trophy size={20} />
            </div>
          </div>
          <div className="stat__val">4</div>
          <div className="stat__label">Certificates earned</div>
        </div>
      </div>

      {/* Main 2-col layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2.1fr) minmax(0, 1fr)",
          gap: 32,
        }}
        className="dash-cols"
      >
        {/* Left — course rows */}
        <div className="col gap-6">
          <section className="col gap-4">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2
                className="row gap-2"
                style={{ fontSize: 18, fontWeight: 700, margin: 0 }}
              >
                <Play size={20} style={{ color: "var(--teal-700)" }} />
                Current Courses
              </h2>
              <Link
                to="/dashboard/my-courses"
                style={{
                  fontSize: 13,
                  color: "var(--teal-700)",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                See all{" "}
                <ChevronRight size={12} style={{ verticalAlign: "-2px" }} />
              </Link>
            </div>

            {myCourses.length > 0 ? (
              <div className="col gap-3">
                {myCourses.slice(0, 3).map((course) => (
                  <Link
                    key={course.courseId}
                    to={`/courses/${course.courseId}`}
                    className="crow"
                  >
                    <div
                      className="crow__thumb"
                      style={{ background: course.gradient || "var(--slate-200)" }}
                    >
                      {course.image && (
                        <img
                          src={getFullUrl(course.image)}
                          alt={course.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      )}
                      <div className="crow__thumb-play">
                        <span>
                          <Play size={14} fill="currentColor" />
                        </span>
                      </div>
                    </div>
                    <div className="crow__body">
                      <div
                        className="row"
                        style={{
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 12,
                        }}
                      >
                        <div>
                          <div
                            className="overline"
                            style={{ color: "var(--teal-700)" }}
                          >
                            {course.categoryName}
                          </div>
                          <h3 className="crow__title" style={{ marginTop: 4 }}>
                            {course.title}
                          </h3>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--fg-3)",
                            flexShrink: 0,
                            background: "var(--slate-100)",
                            padding: "3px 8px",
                            borderRadius: 9999,
                          }}
                        >
                          {course.progress}%
                        </span>
                      </div>
                      <div className="crow__meta">
                        <span>By {course.instructorName}</span>
                      </div>
                      <div className="crow__bar">
                        <div style={{ width: `${course.progress}%` }} />
                      </div>
                      <div
                        className="row"
                        style={{
                          justifyContent: "space-between",
                          fontSize: 11,
                          color: "var(--fg-3)",
                          fontWeight: 600,
                        }}
                      >
                        <span>{course.progress}% complete</span>
                        <span
                          className="row gap-1"
                          style={{ color: "var(--teal-700)", fontWeight: 700 }}
                        >
                          Continue <ArrowRight size={11} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div
                style={{
                  border: "2px dashed hsl(var(--border))",
                  borderRadius: 16,
                  padding: "48px 24px",
                  textAlign: "center",
                  background: "#fff",
                }}
              >
                <LibraryBig
                  size={48}
                  style={{
                    margin: "0 auto 16px",
                    color: "var(--fg-3)",
                    display: "block",
                  }}
                />
                <p
                  style={{
                    color: "var(--fg-2)",
                    fontWeight: 500,
                    margin: "0 0 16px",
                  }}
                >
                  You haven't enrolled in any courses yet.
                </p>
                <Button asChild variant="outline">
                  <Link to="/courses">Explore Courses</Link>
                </Button>
              </div>
            )}
          </section>

          <section className="col gap-4">
            <h2
              className="row gap-2"
              style={{ fontSize: 18, fontWeight: 700, margin: 0 }}
            >
              <Bell size={20} style={{ color: "var(--teal-700)" }} />
              Recent Activity
            </h2>
            <div className="side-card">
              {submittedExams.length > 0 ? (
                submittedExams.slice(0, 4).map((result) => (
                  <div
                    key={`${result.examTitle}-${result.startedAt}`}
                    className="side-card__row"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {(result.examTitle || "A").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 text-sm leading-5 text-foreground">
                      Completed <strong>{result.examTitle || "assessment"}</strong>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                      {result.startedAt
                        ? new Date(result.startedAt).toLocaleDateString()
                        : "Recent"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="side-card__row justify-center text-sm text-muted-foreground">
                  Your activity will appear here as you learn.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right — assessments + results */}
        <div className="col gap-5">
          <WeeklyGoalCard completed={weeklyCompleted} />

          {/* Available Assessments */}
          <div className="side-card">
            <div className="side-card__head side-card__head--teal">
              <CalendarClock size={18} />
              Available Assessments
            </div>
            {availableExams.length > 0 ? (
              availableExams.map((exam) => {
                const isSubmitted = submittedExams.some(
                  (s) => (s.examId || s.id) === (exam.examId || exam.id),
                );
                const isExpired =
                  exam.expired || (exam.endDate && new Date() > new Date(exam.endDate));
                return (
                  <div
                    key={exam.examId}
                    className="side-card__row"
                    style={{ alignItems: "flex-start" }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          lineHeight: 1.3,
                          marginBottom: 4,
                        }}
                      >
                        {exam.title}
                      </div>
                      <div className="overline">{exam.courseTitle}</div>
                    </div>
                    {isSubmitted || isExpired ? (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: 9999,
                          background: isSubmitted
                            ? "var(--slate-100)"
                            : "hsl(0 84% 60% / .1)",
                          color: isSubmitted
                            ? "var(--fg-2)"
                            : "hsl(var(--destructive))",
                          flexShrink: 0,
                        }}
                      >
                        {isSubmitted ? "DONE" : "EXPIRED"}
                      </span>
                    ) : (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full"
                        style={{ flexShrink: 0 }}
                      >
                        <Link to={`/dashboard/exam/${exam.examId}`}>Start</Link>
                      </Button>
                    )}
                  </div>
                );
              })
            ) : (
              <div
                className="side-card__row"
                style={{
                  justifyContent: "center",
                  color: "var(--fg-3)",
                  fontSize: 13,
                }}
              >
                No upcoming exams.
              </div>
            )}
          </div>

          {/* Recent Results */}
          <div className="side-card">
            <div className="side-card__head side-card__head--green">
              <Trophy size={18} />
              Recent Results
            </div>
            {submittedExams.length > 0 ? (
              submittedExams.map((result) => {
                const recentResultId = result.examResultId || result.resultId;
                const examId =
                  result.examId ||
                  result.examID ||
                  result.exam?.examId ||
                  result.exam?.id ||
                  result.id;
                const targetId = examId || recentResultId;
                const lookup = examId ? "exam" : "result";
                const score = result.score ?? result.examResult?.score ?? 0;

                return (
                  <div
                    key={
                      targetId || `${result.examTitle}-${result.startedAt}`
                    }
                    className="side-card__row"
                  >
                    <div
                      style={{ flex: 1, fontSize: 13, fontWeight: 600, minWidth: 0 }}
                    >
                      <div style={{ marginBottom: 4 }}>{result.examTitle}</div>
                      <Link
                        to={
                          targetId
                            ? `/dashboard/exam-result/${targetId}`
                            : "/dashboard/exams"
                        }
                        state={{ lookup, examId }}
                        style={{
                          fontSize: 11,
                          color: "var(--teal-700)",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          textDecoration: "none",
                        }}
                      >
                        <MessageSquareText size={12} /> View Feedback
                      </Link>
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color:
                          score >= 90
                            ? "hsl(var(--success))"
                            : score >= 75
                              ? "var(--amber-600)"
                              : "hsl(var(--destructive))",
                        fontFamily: "var(--font-display)",
                        flexShrink: 0,
                      }}
                    >
                      {score}%
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                className="side-card__row"
                style={{
                  justifyContent: "center",
                  color: "var(--fg-3)",
                  fontSize: 13,
                }}
              >
                Complete your first exam to see results.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
