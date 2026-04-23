import express from "express";
import { Content, Quiz } from "../models/Content.js";
import { Question } from "../models/Question.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { Grade } from "../models/Grade.js";
import { Submission } from "../models/Submission.js";
import { updateEnrollmentProgress } from "../utils/progress.js";
import { updateGrade } from "../utils/gradeUpdater.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

// Get all quizzes based on role
router.get("/", protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === ROLES.INSTRUCTOR) {
      const courses = await Course.find({ instructorId: req.user.id });
      const courseIds = courses.map((c) => c._id);
      query = { courseId: { $in: courseIds } };
    } else if (req.user.role === ROLES.STUDENT) {
      const enrollments = await Enrollment.find({ studentId: req.user.id });
      const courseIds = enrollments.map((e) => e.courseId);
      query = { courseId: { $in: courseIds } };
    } else if (req.user.role === ROLES.ADMINISTRATOR) {
      query = {};
    }

    const quizzes = await Quiz.find({
      ...query,
      contentType: "Quiz",
    }).populate("courseId", "title");
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all quizzes for an instructor or admin
router.get("/Instructor/AllQuizzes", protect, authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR), async (req, res) => {
  try {
    let query = {};
    if (req.user.role === ROLES.INSTRUCTOR) {
      const courses = await Course.find({ instructorId: req.user.id });
      const courseIds = courses.map(c => c._id);
      query = { courseId: { $in: courseIds } };
    }
    
    const quizzes = await Quiz.find({
      ...query,
      contentType: "Quiz",
    }).populate("courseId", "title");
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get quizzes for a course
router.get("/course/:courseId", protect, async (req, res) => {
  try {
    const quizzes = await Quiz.find({
      courseId: req.params.courseId,
      contentType: "Quiz",
    });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get quiz details by ID
router.get("/:quizId", protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz || quiz.contentType !== "Quiz") {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const questions = await Question.find({ quizId: quiz._id }).select(
      "-correctAnswer",
    );

    res.json({ ...quiz.toObject(), questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit quiz answers
router.post(
  "/:quizId/submit",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const { answers = [] } = req.body; // Array of { questionId, answer }
      const quiz = await Quiz.findById(req.params.quizId);
      if (!quiz || quiz.contentType !== "Quiz") {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const questions = await Question.find({ quizId: quiz._id });
      let score = 0;
      const maxScore = questions.length;

      questions.forEach((q) => {
        const studentAnswer = answers.find(
          (a) => String(a.questionId) === String(q._id),
        )?.answer;
        if (studentAnswer === q.correctAnswer) {
          score += 1;
        }
      });

      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

      // Create Submission record for history and AI feedback
      const gradedAnswers = questions.map((q) => {
        const studentAns = answers.find(a => String(a.questionId) === String(q._id));
        return {
          questionId: q._id,
          selectedOption: studentAns?.answer || "No Answer",
          isCorrect: studentAns?.answer === q.correctAnswer
        };
      });

      const submission = new Submission({
        contentId: quiz._id,
        courseId: quiz.courseId,
        studentId: req.user.id,
        type: "Quiz",
        answers: gradedAnswers,
        score: percentage,
        totalQuestions: maxScore,
        correctCount: score,
        status: "Graded"
      });
      await submission.save();

      const grade = await updateGrade({
        studentId: req.user.id,
        courseId: quiz.courseId,
        quizId: quiz._id,
        type: "Quiz",
        score,
        maxScore,
      });

      const enrollment = await Enrollment.findOne({
        studentId: req.user.id,
        courseId: quiz.courseId,
      });

      if (enrollment) {
        const completedQuizzes = new Set(
          (enrollment.completedQuizzes || []).map((id) => String(id)),
        );
        completedQuizzes.add(String(quiz._id));
        enrollment.completedQuizzes = Array.from(completedQuizzes);
        await updateEnrollmentProgress(enrollment);
      }

      res.status(201).json({ message: "Quiz submitted successfully", grade });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
);

export default router;
