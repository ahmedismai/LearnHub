import express from "express";
import { Exam } from "../models/Exam.js";
import { Submission } from "../models/Submission.js";
import { Grade } from "../models/Grade.js";
import { Enrollment } from "../models/Enrollment.js";
import { updateEnrollmentProgress } from "../utils/progress.js";
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
  const studentId = req.user.id; 

  console.log('User Answers:', selectedAnswers);

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
    // SPECIFIC CHECK: Change from general check to specific one
    const existingGrade = await Grade.findOne({ studentId, examId });
    if (existingGrade) {
      return res.status(403).json({ message: "Assessment already completed" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    let correctCount = 0;
    const questions = exam.questions || [];

    if (questions.length === 0) {
      return res.status(400).json({ message: "This exam has no questions." });
    }

    const gradedAnswers = questions.map((q, idx) => {
      const qId = q._id ? q._id.toString() : idx.toString();
      // Try to find by ID or fallback to the same index
      const studentAns = selectedAnswers.find(a => String(a.questionId) === qId) || selectedAnswers[idx];
      
      const studentAnswer = studentAns?.answer;
      
      // Match logic: use requested comparison
      const isCorrect = !!(studentAnswer && q.correctAnswer && 
                        String(q.correctAnswer).trim() === String(studentAnswer).trim());
      
      if (isCorrect) {
        correctCount++;
      }

      console.log(`[EXAM-MATCH] Q#${idx+1}: DB="${q.correctAnswer}" VS Student="${studentAnswer}" | Result=${isCorrect}`);

      return {
        questionId: qId,
        selectedOption: studentAnswer || "No Answer",
        isCorrect
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);
    console.log(`[EXAM-SCORE]: Calculated score for student ${studentId}: ${score} (Correct: ${correctCount}/${questions.length})`);
    
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
    const grade = await updateGrade({
      studentId,
      courseId: exam.courseId,
      examId: exam._id,
      type: "Exam",
      score,
      maxScore: 100,
    });

    // Update Enrollment's completedExams
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId: exam.courseId,
    });

    if (enrollment) {
      const completedExams = new Set(
        (enrollment.completedExams || []).map((id) => String(id)),
      );
      completedExams.add(String(exam._id));
      enrollment.completedExams = Array.from(completedExams);
      await updateEnrollmentProgress(enrollment);
    }

    // Run graduation check logic
    await checkGraduationStatus(studentId, exam.courseId);

    res.status(201).json({
      success: true,
      score,
      correctCount,
      totalQuestions: questions.length,
      passed: score >= 70,
      gradeId: grade?._id,
      message: "Exam submitted successfully"
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

/**
 * @route PATCH /api/Exam-Lifecycle/review/:submissionId
 * @desc Instructor review and finalize score/feedback
 */
router.patch("/review/:submissionId", protect, authorize(ROLES.INSTRUCTOR), async (req, res) => {
  try {
    const { score, aiFeedback } = req.body;
    const submission = await Submission.findById(req.params.submissionId);
    
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    submission.score = score;
    submission.status = "Graded";
    await submission.save();

    const gradeData = {
      studentId: submission.studentId,
      courseId: submission.courseId,
      type: submission.type,
      score,
      maxScore: 100,
      aiFeedback,
      isReviewed: true,
    };

    if (submission.type === "Quiz") gradeData.quizId = submission.contentId;
    else if (submission.type === "Exam") gradeData.examId = submission.examId;
    else if (submission.type === "Assignment") gradeData.assignmentId = submission.contentId;

    await updateGrade(gradeData);

    res.json({ message: "Review finalized successfully" });
  } catch (error) {
    res.status(500).json({ message: "Review failed", error: error.message });
  }
});

export default router;
