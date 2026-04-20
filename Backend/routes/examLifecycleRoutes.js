import express from "express";
import { Exam } from "../models/Exam.js";
import { Submission } from "../models/Submission.js";
import { protect, authorize } from "../middleware/auth.js";
import { checkGraduationStatus } from "../utils/graduationEngine.js";
import { updateGrade } from "../utils/gradeUpdater.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

/**
 * @route POST /api/Exam-Lifecycle/submit
 * @desc Submit exam answers, calculate score, and check graduation
 */
router.post("/submit", protect, async (req, res) => {
  const { examId, selectedAnswers } = req.body; // Array of { questionId, answer }
  const studentId = req.user.id; // Corrected from req.user._id

  if (!examId || !Array.isArray(selectedAnswers)) {
    return res.status(400).json({ message: "Invalid submission format. examId and selectedAnswers are required." });
  }

  // Handle AI Practice sessions that aren't stored in the DB
  if (examId === "ai-practice") {
    return res.status(200).json({
      success: true,
      message: "AI Practice completed (not saved to history)",
      score: 0, // Frontend handles calculation for AI Practice
      isAiPractice: true
    });
  }

  try {
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    let correctCount = 0;
    const questions = exam.questions || [];

    if (questions.length === 0) {
      return res.status(400).json({ message: "This exam has no questions." });
    }

    const gradedAnswers = questions.map((q, idx) => {
      const qId = q._id ? q._id.toString() : idx.toString();
      const studentAns = selectedAnswers.find(a => a.questionId === qId);
      const isCorrect = studentAns?.answer === q.correctAnswer;
      if (isCorrect) correctCount++;

      return {
        questionId: qId,
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

    // Save/Update Grade record
    await updateGrade({
      studentId,
      courseId: exam.courseId,
      examId: exam._id,
      type: "Exam",
      score,
      maxScore: 100,
    });

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
