import express from "express";
import { Content, Quiz } from "../models/Content.js";
import { Question } from "../models/Question.js";
import { Enrollment } from "../models/Enrollment.js";
import { Grade } from "../models/Grade.js";
import { updateEnrollmentProgress } from "../utils/progress.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

// Get quizzes for a course
router.get("/course/:courseId", protect, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ courseId: req.params.courseId, contentType: 'Quiz' });
    res.json(quizzes);
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
      if (!quiz || quiz.contentType !== 'Quiz') {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const questions = await Question.find({ quizId: quiz._id });
      let score = 0;
      const maxScore = questions.length;

      questions.forEach((q) => {
        const studentAnswer = answers.find(a => String(a.questionId) === String(q._id))?.answer;
        if (studentAnswer === q.correctAnswer) {
          score += 1;
        }
      });

      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

      const grade = await Grade.findOneAndUpdate(
        { studentId: req.user.id, quizId: quiz._id },
        {
          studentId: req.user.id,
          courseId: quiz.courseId,
          quizId: quiz._id,
          score,
          maxScore,
          percentage,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const enrollment = await Enrollment.findOne({
        studentId: req.user.id,
        courseId: quiz.courseId,
      });

      if (enrollment) {
        const completedQuizzes = new Set((enrollment.completedQuizzes || []).map(id => String(id)));
        completedQuizzes.add(String(quiz._id));
        enrollment.completedQuizzes = Array.from(completedQuizzes);
        await updateEnrollmentProgress(enrollment);
      }

      res.status(201).json({ message: "Quiz submitted successfully", grade });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

export default router;