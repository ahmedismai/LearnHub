import express from "express";
import { Exam } from "../models/Exam.js";
import { Submission } from "../models/Submission.js";
import { protect, authorize } from "../middleware/auth.js";
import { checkGraduationStatus } from "../utils/graduationEngine.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

/**
 * @route POST /api/Exam-Lifecycle/submit
 * @desc Submit exam answers, calculate score, and check graduation
 */
router.post("/submit", protect, async (req, res) => {
  const { examId, selectedAnswers } = req.body; // Array of { questionId, answer }
  const studentId = req.user._id;

  try {
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    let correctCount = 0;
    const questions = exam.questions;

    const gradedAnswers = questions.map((q) => {
      const studentAns = selectedAnswers.find(a => a.questionId === q._id.toString());
      const isCorrect = studentAns?.answer === q.correctAnswer;
      if (isCorrect) correctCount++;

      return {
        questionId: q._id,
        selectedOption: studentAns?.answer || "No Answer",
        isCorrect
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);
    
    const submission = new Submission({
      examId,
      courseId: exam.courseId,
      studentId,
      type: "Exam",
      answers: gradedAnswers,
      totalQuestions: questions.length,
      correctCount,
      score,
      status: "Graded"
    });

    await submission.save();

    // Run graduation check logic
    await checkGraduationStatus(studentId, exam.courseId);

    res.status(201).json({
      success: true,
      score,
      correctCount,
      totalQuestions: questions.length,
      passed: score >= 70
    });

  } catch (error) {
    console.error("[SUBMIT-EXAM-ERROR]:", error);
    res.status(500).json({ message: "Submission failed", error: error.message });
  }
});

/**
 * @route GET /api/Exam-Lifecycle/instructor/submissions
 * @desc Get all exam submissions for instructor's courses
 */
router.get("/instructor/submissions", protect, authorize(ROLES.INSTRUCTOR), async (req, res) => {
  try {
    const submissions = await Submission.find({ type: "Exam" })
      .populate("studentId", "name email")
      .populate("examId", "title")
      .populate("courseId", "title")
      .sort({ createdAt: -1 });

    // Filter only submissions for this instructor's exams (optional additional security)
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Fetch failed", error: error.message });
  }
});

export default router;
