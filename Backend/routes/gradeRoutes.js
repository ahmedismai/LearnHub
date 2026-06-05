import express from "express";
import { Grade } from "../models/Grade.js";
import { Course } from "../models/Course.js";
import { Exam } from "../models/Exam.js";
import { ExamResult } from "../models/ExamResult.js";
import { Submission } from "../models/Submission.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

const getAssessmentTitle = (grade) => {
  const assessment = grade.examId || grade.quizId || grade.assignmentId;
  return assessment?.title || `${grade.type} Assessment`;
};

const mapExamAnswers = (exam, answerRecords = []) => {
  const answersByQuestionId = new Map(
    answerRecords.map((answer) => [String(answer.questionId), answer]),
  );

  return (exam?.questions || []).map((question) => {
    const selected = answersByQuestionId.get(String(question._id));
    const selectedAnswer = selected?.answer || selected?.selectedOption || "";

    return {
      questionId: String(question._id),
      questionText: question.text,
      selectedOptionText: selectedAnswer || "No answer provided",
      correctOptionText: question.correctAnswer,
      isCorrect:
        selectedAnswer &&
        String(selectedAnswer).trim() === String(question.correctAnswer).trim(),
      earnedScore:
        selectedAnswer &&
        String(selectedAnswer).trim() === String(question.correctAnswer).trim()
          ? 1
          : 0,
      questionMark: 1,
    };
  });
};

router.get(
  "/Instructor/AllGrades",
  protect,
  authorize(ROLES.INSTRUCTOR),
  async (req, res) => {
    try {
      const courses = await Course.find({ instructorId: req.user.id });
      const courseIds = courses.map((c) => c._id);
      const grades = await Grade.find({ courseId: { $in: courseIds } })
        .populate("studentId", "name email")
        .populate("courseId", "title")
        .populate("quizId", "title")
        .populate("examId", "title")
        .populate("assignmentId", "title")
        .sort({ createdAt: -1 });

      res.json(grades);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  "/me",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const grades = await Grade.find({ studentId: req.user.id })
        .populate("courseId", "title")
        .populate("quizId", "title")
        .populate("assignmentId", "title")
        .populate("examId", "title")
        .sort({ createdAt: -1 });

      res.json(grades);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/:id/feedback", protect, async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate("studentId", "name email")
      .populate("courseId", "title instructorId")
      .populate("quizId", "title")
      .populate("assignmentId", "title")
      .populate("examId", "title")
      .lean();

    if (!grade) {
      return res.status(404).json({ message: "Grade not found" });
    }

    const isOwner = String(grade.studentId?._id || grade.studentId) === String(req.user.id);
    const isCourseInstructor =
      String(grade.courseId?.instructorId || "") === String(req.user.id);
    const isAdmin = req.user.role === ROLES.ADMINISTRATOR;

    if (!isOwner && !isCourseInstructor && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to view this feedback" });
    }

    const [submission, exam, examResult] = await Promise.all([
      Submission.findOne({
        studentId: grade.studentId?._id || grade.studentId,
        courseId: grade.courseId?._id || grade.courseId,
        type: grade.type,
        ...(grade.examId ? { examId: grade.examId?._id || grade.examId } : {}),
        ...(grade.quizId ? { contentId: grade.quizId?._id || grade.quizId } : {}),
        ...(grade.assignmentId
          ? { contentId: grade.assignmentId?._id || grade.assignmentId }
          : {}),
      })
        .sort({ createdAt: -1 })
        .lean(),
      grade.examId ? Exam.findById(grade.examId?._id || grade.examId).lean() : null,
      grade.examId
        ? ExamResult.findOne({
            studentId: grade.studentId?._id || grade.studentId,
            examId: grade.examId?._id || grade.examId,
          })
            .sort({ createdAt: -1 })
            .lean()
        : null,
    ]);

    const answerSource = examResult?.answers?.length
      ? examResult.answers
      : submission?.answers || [];
    const answers = exam ? mapExamAnswers(exam, answerSource) : answerSource;
    const percentage = Math.round(grade.percentage ?? 0);

    res.json({
      gradeId: String(grade._id),
      examResultId: examResult ? String(examResult._id) : null,
      type: grade.type,
      studentId: String(grade.studentId?._id || grade.studentId),
      studentName: grade.studentId?.name || "Student",
      courseId: String(grade.courseId?._id || grade.courseId),
      courseTitle: grade.courseId?.title || "Course",
      examId: grade.examId ? String(grade.examId?._id || grade.examId) : null,
      examTitle: getAssessmentTitle(grade),
      score: percentage,
      percentage,
      rawScore: grade.score,
      maxScore: grade.maxScore,
      aiFeedback: grade.aiFeedback || submission?.feedback || "",
      isReviewed: Boolean(grade.isReviewed),
      startedAt: grade.createdAt,
      answers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
